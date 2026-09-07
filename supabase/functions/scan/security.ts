export const SCAN_CATEGORIES = ['entertainment', 'shopping', 'wallet', 'lainnya'] as const

export type ScanCategory = (typeof SCAN_CATEGORIES)[number] | 'all'
export type ScanType = 'quick' | 'deep'

export type ValidatedAction =
  | { action: 'scan'; type: ScanType; category: ScanCategory }
  | { action: 'listCandidates'; limit: number }

export type ValidationResult =
  | { ok: true; value: ValidatedAction }
  | { ok: false; error: string }

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/

export function validateRequestBody(body: unknown): ValidationResult {
  if (!isRecord(body)) return { ok: false, error: 'Body harus berupa objek JSON.' }

  if (body.action === 'listCandidates') {
    if (Object.keys(body).some((key) => key !== 'action' && key !== 'limit')) {
      return { ok: false, error: 'Field request kandidat tidak dikenal.' }
    }
    const rawLimit = body.limit === undefined ? 10 : body.limit
    if (!Number.isInteger(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 30) {
      return { ok: false, error: 'Limit kandidat harus berupa integer 1–30.' }
    }
    return { ok: true, value: { action: 'listCandidates', limit: Number(rawLimit) } }
  }

  if (body.action !== undefined && body.action !== 'scan') {
    return { ok: false, error: 'Action tidak dikenal.' }
  }
  if (Object.keys(body).some((key) => key !== 'action' && key !== 'type' && key !== 'category')) {
    return { ok: false, error: 'Field request scan tidak dikenal.' }
  }

  if (body.type !== 'quick' && body.type !== 'deep') {
    return { ok: false, error: 'Tipe scan harus quick atau deep.' }
  }

  const category = body.category
  if (category !== 'all' && !SCAN_CATEGORIES.includes(category as (typeof SCAN_CATEGORIES)[number])) {
    return { ok: false, error: 'Kategori scan tidak valid.' }
  }

  return { ok: true, value: { action: 'scan', type: body.type, category: category as ScanCategory } }
}

export function isEditorRole(appMetadata: unknown): boolean {
  if (!isRecord(appMetadata)) return false
  return appMetadata.role === 'editor' || appMetadata.role === 'admin'
}

export function validateIdempotencyKey(value: string | null): string | null {
  if (value === null || value === '') return null
  return IDEMPOTENCY_KEY_PATTERN.test(value) ? value : null
}

export function parseAllowedOrigins(raw: string | undefined): Set<string> {
  const defaults = ['https://cuanradar.pages.dev', 'http://localhost:5173']
  const origins = (raw ?? defaults.join(','))
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean)
  return new Set(origins)
}

export function isOriginAllowed(origin: string | null, allowedOrigins: Set<string>): boolean {
  if (!origin) return true
  return allowedOrigins.has(origin.replace(/\/$/, ''))
}

export function readBoundedNumber(
  raw: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (raw === undefined || raw.trim() === '') return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(maximum, Math.max(minimum, parsed))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
