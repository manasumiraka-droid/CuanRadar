import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const functionPath = fileURLToPath(new URL('./index.ts', import.meta.url))
const source = readFileSync(functionPath, 'utf8')

describe('Edge Function security contract', () => {
  it('does not use wildcard CORS', () => {
    expect(source).not.toContain("'Access-Control-Allow-Origin': '*'")
    expect(source).toContain("isOriginAllowed(origin, allowedOrigins())")
  })

  it('requires an editor role before reading the queue', () => {
    const roleGuard = source.indexOf('if (!isEditorRole(user.app_metadata))')
    const queueRead = source.indexOf(".from('review_queue_items')", roleGuard)
    expect(roleGuard).toBeGreaterThan(-1)
    expect(queueRead).toBeGreaterThan(roleGuard)
  })

  it('never returns raw Deep Scan candidates to the public client', () => {
    expect(source).toMatch(/source:\s*'search',\s*results:\s*\[\],/)
    expect(source).not.toContain('results: candidates.map')
  })

  it('uses the bounded Tavily free-tier request contract', () => {
    expect(source).toContain("fetchJson('https://api.tavily.com/search'")
    expect(source).toContain("search_depth: 'basic'")
    expect(source).toContain("country: 'indonesia'")
    expect(source).toContain("language: 'id'")
    expect(source).toContain('max_results: Math.min(limit, 20)')
    expect(source).not.toContain('api.search.brave.com')
  })

  it('bounds AI extraction and detects truncated output', () => {
    expect(source).toContain('MAX_EXTRACTED_APPS = 5')
    expect(source).toContain("envNumber('AI_MAX_OUTPUT_TOKENS', 2_500, 1_500, 5_000)")
    expect(source).toContain('parseProviderJson(result.text, result.finishReason)')
    expect(source).toContain('appsValue.slice(0, MAX_EXTRACTED_APPS)')
  })
})
