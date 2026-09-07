import { describe, expect, it } from 'vitest'
import {
  isEditorRole,
  isOriginAllowed,
  parseProviderJson,
  parseAllowedOrigins,
  readBoundedNumber,
  validateIdempotencyKey,
  validateRequestBody,
} from './security.ts'

describe('scan request validation', () => {
  it('accepts only known scan values', () => {
    expect(validateRequestBody({ action: 'scan', type: 'quick', category: 'wallet' })).toEqual({
      ok: true,
      value: { action: 'scan', type: 'quick', category: 'wallet' },
    })
    expect(validateRequestBody({ type: 'deep', category: 'all' }).ok).toBe(true)
    expect(validateRequestBody({ type: 'fast', category: 'wallet' }).ok).toBe(false)
    expect(validateRequestBody({ type: 'quick', category: 'admin' }).ok).toBe(false)
    expect(validateRequestBody({ type: 'quick', category: 'wallet', role: 'admin' }).ok).toBe(false)
    expect(validateRequestBody(null).ok).toBe(false)
  })

  it('bounds review queue reads', () => {
    expect(validateRequestBody({ action: 'listCandidates' })).toEqual({
      ok: true,
      value: { action: 'listCandidates', limit: 10 },
    })
    expect(validateRequestBody({ action: 'listCandidates', limit: 30 }).ok).toBe(true)
    expect(validateRequestBody({ action: 'listCandidates', limit: 31 }).ok).toBe(false)
    expect(validateRequestBody({ action: 'listCandidates', limit: 1.5 }).ok).toBe(false)
    expect(validateRequestBody({ action: 'listCandidates', limit: 10, status: 'all' }).ok).toBe(false)
  })
})

describe('authorization and request guards', () => {
  it('allows only explicit editor roles', () => {
    expect(isEditorRole({ role: 'editor' })).toBe(true)
    expect(isEditorRole({ role: 'admin' })).toBe(true)
    expect(isEditorRole({ role: 'user' })).toBe(false)
    expect(isEditorRole({ roles: ['admin'] })).toBe(false)
    expect(isEditorRole(null)).toBe(false)
  })

  it('uses an exact origin allowlist', () => {
    const origins = parseAllowedOrigins('https://app.example.com/,http://localhost:5173')
    expect(isOriginAllowed('https://app.example.com', origins)).toBe(true)
    expect(isOriginAllowed('https://app.example.com/', origins)).toBe(true)
    expect(isOriginAllowed('https://evil.example.com', origins)).toBe(false)
    expect(isOriginAllowed(null, origins)).toBe(true)
  })

  it('rejects weak idempotency keys', () => {
    expect(validateIdempotencyKey('scan_1234')).toBe('scan_1234')
    expect(validateIdempotencyKey('short')).toBeNull()
    expect(validateIdempotencyKey('invalid key with spaces')).toBeNull()
    expect(validateIdempotencyKey(null)).toBeNull()
  })

  it('clamps numeric controls safely', () => {
    expect(readBoundedNumber(undefined, 5, 1, 10)).toBe(5)
    expect(readBoundedNumber('99', 5, 1, 10)).toBe(10)
    expect(readBoundedNumber('-2', 5, 1, 10)).toBe(1)
    expect(readBoundedNumber('nope', 5, 1, 10)).toBe(5)
  })

  it('classifies truncated and malformed provider JSON safely', () => {
    expect(parseProviderJson('{"apps":[]}', 'stop')).toEqual({ apps: [] })
    expect(() => parseProviderJson('{"apps":[{"name":"cut', 'length')).toThrow('ai-output-truncated')
    expect(() => parseProviderJson('{"apps":', 'stop')).toThrow('ai-output-invalid-json')
  })
})
