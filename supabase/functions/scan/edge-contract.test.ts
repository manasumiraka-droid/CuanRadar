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
    expect(source).toContain("source: 'search',\n      results: [],")
    expect(source).not.toContain('results: candidates.map')
  })
})
