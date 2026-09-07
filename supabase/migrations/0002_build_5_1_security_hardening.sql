-- CuanRadar — BUILD 5.1 security hardening
-- Additive migration: tighten RLS, make quota/rate/budget consumption atomic,
-- and keep privileged counters writable only through controlled server paths.

-- ---------- Harden user-owned tables ----------
drop policy if exists "scan history pemilik" on public.scan_history;
drop policy if exists "scan credits pemilik" on public.scan_credits;

create policy "scan history baca pemilik"
  on public.scan_history for select
  using (auth.uid() = user_id);

create policy "scan credits baca pemilik"
  on public.scan_credits for select
  using (auth.uid() = user_id);

-- Existing installs may contain unexpected plan values. Normalize before adding
-- the allowlist constraint; entitlement changes remain service-role only.
update public.scan_credits
set plan = 'free'
where plan not in ('free', 'pro', 'pro_plus');

alter table public.scan_credits
  add constraint scan_credits_plan_allowed
  check (plan in ('free', 'pro', 'pro_plus'));

alter table public.scan_credits
  add constraint scan_credits_usage_nonnegative
  check (quick_used_today >= 0 and deep_used_today >= 0);

-- Community submissions must be attributed to the authenticated submitter.
drop policy if exists "payout insert terautentikasi" on public.payout_reports;
drop policy if exists "community insert terautentikasi" on public.community_reports;

create policy "payout insert pemilik"
  on public.payout_reports for insert
  with check (auth.uid() = user_id);

create policy "community insert pemilik"
  on public.community_reports for insert
  with check (auth.uid() = user_id);

-- Public beta does not expose raw reporter UUIDs or evidence references. BUILD 6
-- must publish moderated rows through a deliberately shaped view/RPC instead.
drop policy if exists "payout baca publik" on public.payout_reports;
drop policy if exists "community baca publik" on public.community_reports;

-- ---------- Atomic authenticated-user quota ----------
create or replace function public.consume_scan_quota(p_scan_type public.scan_type)
returns table (
  allowed boolean,
  plan text,
  quick_used_today integer,
  deep_used_today integer,
  quick_remaining integer,
  deep_remaining integer,
  usage_date date
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan text;
  v_quick_used integer;
  v_deep_used integer;
  v_usage_date date;
  v_quick_limit integer;
  v_deep_limit integer;
  v_allowed boolean;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into public.scan_credits (
    user_id, plan, quick_used_today, deep_used_today, usage_date, updated_at
  ) values (
    v_user_id, 'free', 0, 0, current_date, clock_timestamp()
  )
  on conflict (user_id) do nothing;

  select sc.plan, sc.quick_used_today, sc.deep_used_today, sc.usage_date
    into v_plan, v_quick_used, v_deep_used, v_usage_date
  from public.scan_credits sc
  where sc.user_id = v_user_id
  for update;

  if not found then
    raise exception 'quota row unavailable';
  end if;

  if v_usage_date <> current_date then
    v_quick_used := 0;
    v_deep_used := 0;
    v_usage_date := current_date;
  end if;

  v_quick_limit := case v_plan
    when 'pro' then 7
    when 'pro_plus' then 15
    else 3
  end;
  v_deep_limit := case v_plan
    when 'pro' then 3
    when 'pro_plus' then 8
    else 1
  end;

  v_allowed := case p_scan_type
    when 'quick' then v_quick_used < v_quick_limit
    when 'deep' then v_deep_used < v_deep_limit
    else false
  end;

  if v_allowed then
    if p_scan_type = 'quick' then
      v_quick_used := v_quick_used + 1;
    else
      v_deep_used := v_deep_used + 1;
    end if;
  end if;

  update public.scan_credits sc
  set quick_used_today = v_quick_used,
      deep_used_today = v_deep_used,
      usage_date = v_usage_date,
      updated_at = clock_timestamp()
  where sc.user_id = v_user_id;

  return query select
    v_allowed,
    v_plan,
    v_quick_used,
    v_deep_used,
    greatest(0, v_quick_limit - v_quick_used),
    greatest(0, v_deep_limit - v_deep_used),
    v_usage_date;
end;
$$;

revoke all on function public.consume_scan_quota(public.scan_type) from public, anon;
grant execute on function public.consume_scan_quota(public.scan_type) to authenticated;

-- Used only by the trusted Edge Function when a global budget reservation blocks
-- a scan before any external provider is called.
create or replace function public.refund_scan_quota(
  p_user_id uuid,
  p_scan_type public.scan_type
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.scan_credits sc
  set quick_used_today = case
        when p_scan_type = 'quick' then greatest(0, sc.quick_used_today - 1)
        else sc.quick_used_today
      end,
      deep_used_today = case
        when p_scan_type = 'deep' then greatest(0, sc.deep_used_today - 1)
        else sc.deep_used_today
      end,
      updated_at = clock_timestamp()
  where sc.user_id = p_user_id
    and sc.usage_date = current_date;
end;
$$;

revoke all on function public.refund_scan_quota(uuid, public.scan_type) from public, anon, authenticated;
grant execute on function public.refund_scan_quota(uuid, public.scan_type) to service_role;

-- ---------- Atomic rate limiting ----------
create table public.api_rate_limits (
  key_hash text not null,
  action text not null,
  window_started_at timestamptz not null default clock_timestamp(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (key_hash, action)
);

alter table public.api_rate_limits enable row level security;

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  if length(p_key_hash) < 16
     or p_action not in ('scan')
     or p_limit < 1
     or p_limit > 1000
     or p_window_seconds < 1
     or p_window_seconds > 86400 then
    raise exception 'invalid rate-limit parameters';
  end if;

  insert into public.api_rate_limits (
    key_hash, action, window_started_at, request_count, updated_at
  ) values (
    p_key_hash, p_action, v_now, 1, v_now
  )
  on conflict (key_hash, action) do update
  set request_count = case
        when public.api_rate_limits.window_started_at
             <= v_now - make_interval(secs => p_window_seconds)
          then 1
        else public.api_rate_limits.request_count + 1
      end,
      window_started_at = case
        when public.api_rate_limits.window_started_at
             <= v_now - make_interval(secs => p_window_seconds)
          then v_now
        else public.api_rate_limits.window_started_at
      end,
      updated_at = v_now
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;

-- ---------- Conservative daily provider budget reservation ----------
create table public.provider_budget_daily (
  usage_date date primary key default current_date,
  reserved_usd numeric(12,6) not null default 0 check (reserved_usd >= 0),
  search_requests integer not null default 0 check (search_requests >= 0),
  ai_requests integer not null default 0 check (ai_requests >= 0),
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.provider_budget_daily enable row level security;

create or replace function public.reserve_provider_budget(
  p_reserved_usd numeric,
  p_search_requests integer,
  p_ai_requests integer,
  p_daily_limit_usd numeric
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_total numeric(12,6);
begin
  if p_reserved_usd < 0
     or p_search_requests < 0
     or p_ai_requests < 0
     or p_daily_limit_usd <= 0 then
    raise exception 'invalid budget parameters';
  end if;

  if p_reserved_usd > p_daily_limit_usd then
    return false;
  end if;

  insert into public.provider_budget_daily (
    usage_date, reserved_usd, search_requests, ai_requests, updated_at
  ) values (
    current_date, p_reserved_usd, p_search_requests, p_ai_requests, clock_timestamp()
  )
  on conflict (usage_date) do update
  set reserved_usd = public.provider_budget_daily.reserved_usd + excluded.reserved_usd,
      search_requests = public.provider_budget_daily.search_requests + excluded.search_requests,
      ai_requests = public.provider_budget_daily.ai_requests + excluded.ai_requests,
      updated_at = clock_timestamp()
  where public.provider_budget_daily.reserved_usd + excluded.reserved_usd <= p_daily_limit_usd
  returning reserved_usd into v_total;

  return v_total is not null;
end;
$$;

revoke all on function public.reserve_provider_budget(numeric, integer, integer, numeric) from public, anon, authenticated;
grant execute on function public.reserve_provider_budget(numeric, integer, integer, numeric) to service_role;

-- ---------- Scan audit metadata and idempotency ----------
alter table public.scan_history
  add column request_id uuid,
  add column idempotency_key text,
  add column search_requests integer not null default 0,
  add column ai_requests integer not null default 0,
  add column input_tokens integer not null default 0,
  add column output_tokens integer not null default 0,
  add column search_provider text,
  add column ai_model text;

create unique index scan_history_user_idempotency_idx
  on public.scan_history(user_id, idempotency_key)
  where user_id is not null and idempotency_key is not null;

alter table public.review_queue_items
  add column created_by uuid references auth.users(id) on delete set null;
