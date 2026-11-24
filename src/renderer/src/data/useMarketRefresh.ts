import { useCallback, useEffect, useRef, useState } from 'react'
import { useData } from './DataContext'
import { MarketCache, QuoteCache } from '../types'
import { isQuoted, quoteKey } from '../utils/investments'

// O plano gratuito da brapi atualiza ações a cada 30 minutos, então não adianta buscar antes
const QUOTES_EVERY_MS = 30 * 60 * 1000
// Selic e CDI mudam uma vez por dia útil
const RATES_EVERY_MS = 6 * 60 * 60 * 1000
// Guarda só as últimas horas de preços, que é o que a setinha usa
const HISTORY_MS = 4 * 60 * 60 * 1000

type RefreshState = { loading: boolean; lastError: string | null }

/*
  Busca cotações e taxas quando a aba Investimentos está aberta:
  ao abrir (se a última busca já tiver mais de 30 minutos) e depois de 30 em 30 minutos.
*/
export function useMarketRefresh(): RefreshState & { refresh: () => Promise<void> } {
  const { data, updateMarket } = useData()
  const [state, setState] = useState<RefreshState>({ loading: false, lastError: null })
  // Guarda os dados e a função de salvar em refs, para a busca não reiniciar a cada mudança
  const dataRef = useRef(data)
  const updateRef = useRef(updateMarket)
  useEffect(() => {
    dataRef.current = data
    updateRef.current = updateMarket
  })
  // Evita tentar de novo sem parar quando está sem internet
  const lastAttempt = useRef(0)

  const refresh = useCallback(async (force = true): Promise<void> => {
    const current = dataRef.current
    const investments = current.investments ?? []
    const market = current.market
    const now = Date.now()
    const token = current.settings.brapiToken?.trim() || undefined

    const quoted = investments.filter((i) => isQuoted(i.kind) && i.ticker)
    const needQuotes =
      quoted.length > 0 &&
      (force || !market?.quotesUpdatedAt || now - market.quotesUpdatedAt > QUOTES_EVERY_MS)
    const fixed = investments.filter((i) => i.kind === 'selic' || i.kind === 'cdi')
    const needRates =
      fixed.length > 0 &&
      (force || !market?.ratesUpdatedAt || now - market.ratesUpdatedAt > RATES_EVERY_MS)
    if (!needQuotes && !needRates) return
    if (!force && now - lastAttempt.current < 5 * 60 * 1000) return
    lastAttempt.current = now

    setState({ loading: true, lastError: null })
    const errors: string[] = []
    const changes: Partial<MarketCache> = {}

    try {
      if (needQuotes) {
        const unique = new Map(quoted.map((i) => [quoteKey(i), i]))
        const results = await window.api.fetchQuotes(
          [...unique.values()].map((i) => ({
            ticker: (i.ticker ?? '').toUpperCase(),
            crypto: i.kind === 'crypto'
          })),
          token
        )
        const quotes: Record<string, QuoteCache> = { ...(market?.quotes ?? {}) }
        results.forEach((result) => {
          const key = `${unique.get(`crypto:${result.ticker}`) ? 'crypto' : 'b3'}:${result.ticker}`
          if (result.price === null) {
            errors.push(result.ticker)
            return
          }
          const old = quotes[key]
          const history = [...(old?.history ?? []), { at: now, price: result.price }].filter(
            (p) => now - p.at <= HISTORY_MS
          )
          quotes[key] = {
            price: result.price,
            dayChange: result.dayChange,
            history,
            updatedAt: now
          }
        })
        changes.quotes = quotes
        changes.quotesUpdatedAt = now
      }

      if (needRates) {
        const earliest = (kind: 'selic' | 'cdi'): string | null =>
          fixed
            .filter((i) => i.kind === kind)
            .flatMap((i) => i.contributions.map((c) => c.date))
            .sort()[0] ?? null
        for (const series of ['selic', 'cdi'] as const) {
          const from = earliest(series)
          if (!from) continue
          changes[series] = await window.api.fetchRates(series, from)
        }
        changes.ratesUpdatedAt = now
      }
    } catch {
      errors.push('conexão')
    }

    const message =
      errors.length === 0
        ? undefined
        : errors.includes('conexão')
          ? 'Sem conexão com a internet. Mostrando os últimos valores salvos.'
          : `Não foi possível buscar a cotação de ${errors.join(', ')}. Confira o código ou a chave da brapi em Ajustes.`
    updateRef.current((m) => ({ ...m, ...changes, error: message }))
    setState({ loading: false, lastError: message ?? null })
  }, [])

  useEffect(() => {
    refresh(false)
    const timer = setInterval(() => refresh(false), 60 * 1000)
    return () => clearInterval(timer)
  }, [refresh])

  return { ...state, refresh: () => refresh(true) }
}
