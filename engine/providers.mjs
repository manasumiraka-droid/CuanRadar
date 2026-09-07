// CuanRadar — engine/providers.mjs (SERVER-SIDE ONLY — jangan diimport frontend)
// Provider nyata: Tavily/Serper (search) + DeepSeek (AI). Kunci dibaca dari env server.
// Abstraksi: SearchProvider / AIProvider (PRD §19–20); stub aktif bila kunci belum ada.

export class NotConfiguredError extends Error {
  constructor(what) {
    super(`${what} belum dikonfigurasi. Isi env terlebih dahulu (lihat .env.example).`)
    this.name = 'NotConfiguredError'
  }
}

const DEFAULT_TIMEOUT_MS = 20000

async function fetchJson(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status} dari ${url}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

// ---------- Search: Tavily ----------
function tavilyProvider(key) {
  return {
    name: 'tavily',
    async search(query, { limit = 5 } = {}) {
      const data = await fetchJson('https://api.tavily.com/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          search_depth: 'basic',
          topic: 'general',
          max_results: Math.min(limit, 20),
          country: 'indonesia',
          language: 'id',
          include_answer: false,
          include_raw_content: false,
          include_images: false,
        }),
      })
      return (data.results ?? []).map((r) => ({ title: r.title ?? '', url: r.url ?? '', snippet: r.content ?? '' }))
    },
  }
}

// ---------- Search: Serper (Google) ----------
function serperProvider(key) {
  return {
    name: 'serper',
    async search(query, { limit = 5 } = {}) {
      const data = await fetchJson('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: Math.min(limit, 20), gl: 'id', hl: 'id' }),
      })
      return (data.organic ?? []).map((r) => ({ title: r.title ?? '', url: r.link ?? '', snippet: r.snippet ?? '' }))
    },
  }
}

// ---------- Search: stub ----------
const stubProvider = {
  name: 'stub',
  async search() {
    throw new NotConfiguredError('SearchProvider (SEARCH_PROVIDER + SEARCH_API_KEY)')
  },
}

export function getSearchProvider() {
  // Tahan terhadap komentar inline ("serper # catatan") & spasi berlebih
  const kind = String(process.env.SEARCH_PROVIDER || 'stub')
    .trim()
    .split(/[\s#]/)[0]
    .toLowerCase()
  const key = process.env.SEARCH_API_KEY
  if (kind === 'tavily') {
    if (!key) throw new NotConfiguredError('SearchProvider tavily (SEARCH_API_KEY)')
    return tavilyProvider(key)
  }
  if (kind === 'serper') {
    if (!key) throw new NotConfiguredError('SearchProvider serper (SEARCH_API_KEY)')
    return serperProvider(key)
  }
  return stubProvider
}

// ---------- AI: DeepSeek (OpenAI-compatible) ----------
function deepseekProvider(key) {
  // Model routing (PRD §23): cheap/mid → deepseek-chat; premium → deepseek-reasoner
  const modelFor = (tier) => (tier === 'premium' ? 'deepseek-reasoner' : 'deepseek-chat')

  return {
    name: 'deepseek',
    async complete(prompt, { maxTokens = 2048, tier = 'cheap' } = {}) {
      const data = await fetchJson('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelFor(tier),
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0,
        }),
      })
      const text = data.choices?.[0]?.message?.content ?? ''
      if (!text) throw new Error('DeepSeek mengembalikan konten kosong')
      return text
    },
  }
}

export function getAIProvider() {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) throw new NotConfiguredError('AIProvider deepseek (DEEPSEEK_API_KEY)')
  return deepseekProvider(key)
}

// Query discovery per kategori (Bahasa Indonesia; konteks Indonesia)
export const SEARCH_QUERIES = {
  entertainment: 'aplikasi nonton video drama pendek dapat saldo DANA reward Indonesia 2026',
  shopping: 'cashback poin aplikasi belanja Indonesia Shopee Tokopedia Blibli promo terbaru',
  wallet: 'promo cashback poin e-wallet Indonesia DANA GoPay OVO ShopeePay terbaru',
  lainnya: 'aplikasi penghasil poin reward bisa diuangkan Indonesia 2026 survey cashback',
}
