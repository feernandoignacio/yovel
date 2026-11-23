import { AppData } from '../types'
import { addDays, addMonths, formatDate, parseISO } from './date'
import { sum } from './money'
import { endOfMonth, entriesOn, planFor, totalsFor } from './plan'

export type Period = 'week' | 'month'

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

export type Range = { start: string; end: string; label: string }

// Semana (segunda a domingo) ou mês da data de referência
export function rangeFor(period: Period, anchor: string): Range {
  if (period === 'week') {
    const weekDay = parseISO(anchor).getDay()
    const start = addDays(anchor, weekDay === 0 ? -6 : 1 - weekDay)
    const end = addDays(start, 6)
    return {
      start,
      end,
      label: `${formatDate(start).slice(0, 5)} a ${formatDate(end).slice(0, 5)}`
    }
  }
  const start = `${anchor.slice(0, 7)}-01`
  const date = parseISO(start)
  return {
    start,
    end: endOfMonth(start),
    label: `${monthNames[date.getMonth()]} de ${date.getFullYear()}`
  }
}

// Anda uma semana ou um mês para frente ou para trás
export function shiftAnchor(period: Period, anchor: string, direction: 1 | -1): string {
  return period === 'week' ? addDays(anchor, 7 * direction) : addMonths(anchor, direction)
}

export type DayRow = {
  date: string
  isWorkday: boolean
  hasEntries: boolean
  income: number
  expense: number
  net: number
  target: number
  hitTarget: boolean
}

export function dayRows(data: AppData, range: Range): DayRow[] {
  const rows: DayRow[] = []
  for (let day = range.start; day <= range.end; day = addDays(day, 1)) {
    const plan = planFor(data, day)
    const hasEntries = entriesOn(data.entries, day).length > 0
    rows.push({
      date: day,
      isWorkday: plan.isWorkday,
      hasEntries,
      income: plan.totals.income,
      expense: plan.totals.expense,
      net: plan.totals.net,
      target: plan.target,
      hitTarget: plan.isWorkday && hasEntries && plan.difference >= 0
    })
  }
  return rows
}

export type CategoryTotal = { category: string; amount: number }

// Saídas agrupadas por categoria, da maior para a menor
export function expensesByCategory(data: AppData, range: Range): CategoryTotal[] {
  const totals = new Map<string, number>()
  data.entries
    .filter((e) => e.type === 'expense' && e.date >= range.start && e.date <= range.end)
    .forEach((e) => totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount))
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
}

export type Summary = {
  income: number
  expense: number
  net: number
  paidBillsCount: number
  paidBillsTotal: number
}

export function summaryFor(data: AppData, range: Range): Summary {
  const entries = data.entries.filter((e) => e.date >= range.start && e.date <= range.end)
  const totals = totalsFor(entries)
  const paidBills = data.bills.filter(
    (b) => b.paidAt && b.paidAt >= range.start && b.paidAt <= range.end
  )
  return {
    ...totals,
    paidBillsCount: paidBills.length,
    paidBillsTotal: sum(paidBills.map((b) => b.amount))
  }
}
