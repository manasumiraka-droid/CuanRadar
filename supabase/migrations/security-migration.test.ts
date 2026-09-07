import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const migrationPath = fileURLToPath(new URL('./0002_build_5_1_security_hardening.sql', import.meta.url))
const sql = readFileSync(migrationPath, 'utf8').toLowerCase()
const concurrencyMigrationPath = fileURLToPath(new URL('./0003_build_5_1_rate_limit_concurrency.sql', import.meta.url))
const concurrencySql = readFileSync(concurrencyMigrationPath, 'utf8').toLowerCase()

describe('BUILD 5.1 migration security contract', () => {
  it('replaces broad owner policies with select-only access', () => {
    expect(sql).toContain('drop policy if exists "scan history pemilik"')
    expect(sql).toContain('on public.scan_history for select')
    expect(sql).toContain('on public.scan_credits for select')
    expect(sql).not.toMatch(/on public\.scan_(history|credits) for all/)
    expect(sql).toContain('drop policy if exists "payout baca publik"')
    expect(sql).toContain('drop policy if exists "community baca publik"')
  })

  it('keeps sensitive functions away from browser roles', () => {
    expect(sql).toContain('revoke all on function public.consume_api_rate_limit')
    expect(sql).toContain('revoke all on function public.reserve_provider_budget')
    expect(sql).toContain('grant execute on function public.consume_scan_quota(public.scan_type) to authenticated')
    expect(sql).toContain('grant execute on function public.reserve_provider_budget(numeric, integer, integer, numeric) to service_role')
  })

  it('adds idempotency and audit metadata', () => {
    expect(sql).toContain('create unique index scan_history_user_idempotency_idx')
    expect(sql).toContain('add column search_requests integer')
    expect(sql).toContain('add column input_tokens integer')
    expect(sql).toContain('add column search_provider text')
  })

  it('serializes concurrent rate-limit updates per key', () => {
    expect(concurrencySql).toContain('pg_advisory_xact_lock')
    expect(concurrencySql).toContain("hashtextextended(p_key_hash || ':' || p_action, 0)")
    expect(concurrencySql).toContain('on conflict (key_hash, action) do update')
    expect(concurrencySql).toContain(
      'grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role',
    )
  })
})
