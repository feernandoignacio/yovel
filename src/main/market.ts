// Busca de cotações e taxas na internet. Roda no processo principal porque a tela
// não tem permissão para acessar sites de fora (política de segurança do app)

const TIMEOUT_MS = 15000

export type QuoteResult = {
  ticker: string
  price: number | null
  dayChange: number | null
  error?: string
}

export type RateResult = { date: string; rate: number }

async function getJson(url: string, token?: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function toNumber(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

// Ações e fundos imobiliários pela brapi (dados da B3, com atraso)
async function fetchStock(ticker: string, token?: string): Promise<QuoteResult> {
  const data = (await getJson(
    `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}`,
    token
  )) as { results?: { regularMarketPrice?: unknown; regularMarketChangePercent?: unknown }[] }
  const result = data.results?.[0]
  return {
    ticker,
    price: toNumber(result?.regularMarketPrice),
    dayChange: toNumber(result?.regularMarketChangePercent)
  }
}

// Cripto em reais pela brapi
async function fetchCrypto(coin: string, token?: string): Promise<QuoteResult> {
  const data = (await getJson(
    `https://brapi.dev/api/v2/crypto?coin=${encodeURIComponent(coin)}&currency=BRL`,
    token
  )) as { coins?: { regularMarketPrice?: unknown; regularMarketChangePercent?: unknown }[] }
  const result = data.coins?.[0]
  return {
    ticker: coin,
    price: toNumber(result?.regularMarketPrice),
    dayChange: toNumber(result?.regularMarketChangePercent)
  }
}

export async function fetchQuotes(
  items: { ticker: string; crypto: boolean }[],
  token?: string
): Promise<QuoteResult[]> {
  // Uma chamada por código, porque o plano gratuito limita quantos códigos vão juntos
  return Promise.all(
    items.map(async ({ ticker, crypto }) => {
      try {
        return crypto ? await fetchCrypto(ticker, token) : await fetchStock(ticker, token)
      } catch (error) {
        return {
          ticker,
          price: null,
          dayChange: null,
          error: error instanceof Error ? error.message : 'erro'
        }
      }
    })
  )
}

// Taxa Selic (série 11) ou CDI (série 12) de cada dia útil, em % ao dia, pelo Banco Central
export async function fetchRates(series: 'selic' | 'cdi', from: string): Promise<RateResult[]> {
  const code = series === 'selic' ? 11 : 12
  const [y, m, d] = from.split('-')
  const today = new Date()
  const end = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${d}/${m}/${y}&dataFinal=${end}`
  const data = (await getJson(url)) as { data?: string; valor?: string }[]
  if (!Array.isArray(data)) return []
  return data
    .map((row) => {
      const [dd, mm, yyyy] = (row.data ?? '').split('/')
      return { date: `${yyyy}-${mm}-${dd}`, rate: toNumber(row.valor) ?? NaN }
    })
    .filter((row) => Number.isFinite(row.rate) && row.date.length === 10)
}
