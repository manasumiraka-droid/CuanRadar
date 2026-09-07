-- BUILD 5.1 follow-up: serialize concurrent initialization/update per rate-limit key.
-- The UPSERT remains the source of truth; the transaction lock prevents transient
-- contention errors when several Edge Function instances hit a new key at once.

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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_key_hash || ':' || p_action, 0)
  );

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
