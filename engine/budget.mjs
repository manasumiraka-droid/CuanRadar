// CuanRadar — engine/budget.mjs (SERVER-SIDE, BUILD 3)
// Budget Governor (PRD §41) + split budget LLM/Search (PRD §40) + estimasi biaya per scan (PRD §43).

export const MONTHLY_BUDGET = { llmUsd: 7, searchUsd: 3 } // PRD §40 v1.1

// Harga estimasi (2025, pra-potongan DeepSeek — kalibrasi saat implementasi)
export const RATES = {
  llmInputPer1k: 0.00027, // $0.27 / 1M input
  llmOutputPer1k: 0.0011, // $1.10 / 1M output
  searchPerQuery: 0, // Tavily basic free tier; ubah via konfigurasi bila kuota gratis terlampaui
}

export function estimateLlmCost({ inputTokens = 0, outputTokens = 0 }) {
  return (inputTokens / 1000) * RATES.llmInputPer1k + (outputTokens / 1000) * RATES.llmOutputPer1k
}

export function estimateSearchCost(queries = 0) {
  return queries * RATES.searchPerQuery
}

export function budgetMode(pct) {
  if (pct >= 100) return { mode: 'NO_NEW_DEEP_SCAN', canDeepScan: false }
  if (pct >= 95) return { mode: 'EMERGENCY', canDeepScan: false }
  if (pct >= 85) return { mode: 'LIMIT_DEEP_SCAN', canDeepScan: true }
  if (pct >= 70) return { mode: 'MORE_CACHING', canDeepScan: true }
  return { mode: 'NORMAL', canDeepScan: true }
}

export class BudgetGovernor {
  constructor({ spentLlmUsd = 0, spentSearchUsd = 0 } = {}) {
    this.spentLlmUsd = spentLlmUsd
    this.spentSearchUsd = spentSearchUsd
  }

  status() {
    const totalPct = ((this.spentLlmUsd + this.spentSearchUsd) / (MONTHLY_BUDGET.llmUsd + MONTHLY_BUDGET.searchUsd)) * 100
    const llmPct = (this.spentLlmUsd / MONTHLY_BUDGET.llmUsd) * 100
    const searchPct = (this.spentSearchUsd / MONTHLY_BUDGET.searchUsd) * 100
    return {
      ...budgetMode(totalPct),
      totalPct: Math.round(totalPct * 10) / 10,
      llmPct: Math.round(llmPct * 10) / 10,
      searchPct: Math.round(searchPct * 10) / 10,
      spentLlmUsd: round4(this.spentLlmUsd),
      spentSearchUsd: round4(this.spentSearchUsd),
      monthlyBudget: MONTHLY_BUDGET,
    }
  }
}

function round4(n) {
  return Math.round(n * 10000) / 10000
}
