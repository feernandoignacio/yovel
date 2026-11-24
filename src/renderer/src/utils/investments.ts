import { Investment, InvestmentKind, MarketCache } from '../types'
import { sum } from './money'

export const kindLabels: Record<InvestmentKind, string> = {
  stock: 'Ação',
  fii: 'Fundo imobiliário',
  crypto: 'Cripto',
  selic: 'Tesouro Selic',
  cdi: 'CDB, LCI ou LCA',
  manual: 'Outro'
}

// Como cada tipo é atualizado (aparece embaixo do nome)
export const sourceLabels: Record<InvestmentKind, string> = {
  stock: 'cotação B3',
  fii: 'cotação B3',
  crypto: 'cotação em reais',
  selic: 'calculado pela Selic',
  cdi: 'calculado pelo CDI',
  manual: 'atualizado na mão'
}

export function isQuoted(kind: InvestmentKind): boolean {
  return kind === 'stock' || kind === 'fii' || kind === 'crypto'
}

export function quoteKey(investment: Investment): string {
  return `${investment.kind === 'crypto' ? 'crypto' : 'b3'}:${(investment.ticker ?? '').toUpperCase()}`
}

export function appliedOf(investment: Investment): number {
  return sum(investment.contributions.map((c) => c.amount))
}

export function quantityOf(investment: Investment): number {
  return investment.contributions.reduce((total, c) => total + (c.quantity ?? 0), 0)
}

// Fator acumulado da taxa diária desde uma data (Selic ou % do CDI)
function growthSince(
  date: string,
  rates: { date: string; rate: number }[],
  percent: number
): number {
  return rates
    .filter((r) => r.date > date)
    .reduce((factor, r) => factor * (1 + (r.rate / 100) * (percent / 100)), 1)
}

export type InvestmentValue = {
  value: number
  estimated: boolean // true quando é cálculo (renda fixa) ou quando faltou cotação
  missingQuote: boolean // não tem cotação ainda, mostrando o valor aplicado
}

export function valueOf(investment: Investment, market: MarketCache | undefined): InvestmentValue {
  const applied = appliedOf(investment)

  if (isQuoted(investment.kind)) {
    const quote = market?.quotes[quoteKey(investment)]
    if (!quote) return { value: applied, estimated: true, missingQuote: true }
    return {
      value: Math.round(quantityOf(investment) * quote.price * 100) / 100,
      estimated: false,
      missingQuote: false
    }
  }

  if (investment.kind === 'selic' || investment.kind === 'cdi') {
    const rates = (investment.kind === 'selic' ? market?.selic : market?.cdi) ?? []
    const percent = investment.kind === 'selic' ? 100 : (investment.cdiPercent ?? 100)
    const value = sum(
      investment.contributions.map((c) => c.amount * growthSince(c.date, rates, percent))
    )
    return { value, estimated: true, missingQuote: rates.length === 0 }
  }

  return { value: investment.manualValue ?? applied, estimated: false, missingQuote: false }
}

export type Change = { percent: number; period: 'hour' | 'day' }

const HOUR = 60 * 60 * 1000

/*
  Variação para a setinha:
  - Ação, fundo imobiliário e cripto: compara com o preço de uma hora atrás.
    Enquanto não tiver uma hora de histórico, usa a variação do dia informada pelo serviço.
  - Selic e CDI: a taxa é diária, então mostra quanto rendeu no último dia útil.
  - Manual: não tem variação.
*/
export function changeOf(
  investment: Investment,
  market: MarketCache | undefined,
  now = Date.now()
): Change | null {
  if (isQuoted(investment.kind)) {
    const quote = market?.quotes[quoteKey(investment)]
    if (!quote) return null
    const old = [...quote.history].reverse().find((p) => p.at <= now - HOUR + 5 * 60 * 1000)
    if (old && old.price > 0 && now - old.at <= 3 * HOUR) {
      return { percent: ((quote.price - old.price) / old.price) * 100, period: 'hour' }
    }
    return quote.dayChange === null ? null : { percent: quote.dayChange, period: 'day' }
  }

  if (investment.kind === 'selic' || investment.kind === 'cdi') {
    const rates = (investment.kind === 'selic' ? market?.selic : market?.cdi) ?? []
    const last = rates[rates.length - 1]
    if (!last) return null
    const percent = investment.kind === 'selic' ? 100 : (investment.cdiPercent ?? 100)
    return { percent: last.rate * (percent / 100), period: 'day' }
  }

  return null
}

export type PortfolioSummary = {
  applied: number
  value: number
  profit: number
  profitPercent: number
  hourChange: number | null // variação do total na última hora, só com o que tem cotação
}

export function summarize(
  investments: Investment[],
  market: MarketCache | undefined,
  now = Date.now()
): PortfolioSummary {
  const applied = sum(investments.map(appliedOf))
  const values = investments.map((i) => valueOf(i, market).value)
  const value = Math.round(sum(values) * 100) / 100
  const profit = Math.round((value - applied) * 100) / 100

  // Total de uma hora atrás: os que mudaram na hora voltam ao preço antigo, os outros ficam iguais
  let before = 0
  let hasHour = false
  investments.forEach((investment, index) => {
    const change = changeOf(investment, market, now)
    if (change?.period === 'hour') {
      hasHour = true
      before += values[index] / (1 + change.percent / 100)
    } else {
      before += values[index]
    }
  })

  return {
    applied,
    value,
    profit,
    profitPercent: applied > 0 ? (profit / applied) * 100 : 0,
    hourChange: hasHour && before > 0 ? ((value - before) / before) * 100 : null
  }
}

export type SimulationYear = { year: number; contributed: number; total: number }

// Juros compostos com aporte todo mês e taxa fixa ao ano
export function simulate(monthly: number, yearlyRate: number, years: number): SimulationYear[] {
  const monthlyRate = Math.pow(1 + yearlyRate / 100, 1 / 12) - 1
  const result: SimulationYear[] = []
  let total = 0
  for (let month = 1; month <= years * 12; month++) {
    total = total * (1 + monthlyRate) + monthly
    if (month % 12 === 0) {
      result.push({
        year: month / 12,
        contributed: monthly * month,
        total: Math.round(total * 100) / 100
      })
    }
  }
  return result
}
