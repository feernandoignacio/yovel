import { AppData, Bill, Entry, Goal } from '../types'
import { addDays, parseISO } from './date'
import { sum } from './money'

// Último dia do mês da data (AAAA-MM-DD)
export function endOfMonth(iso: string): string {
  const date = parseISO(iso)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return addDays(iso, last.getDate() - date.getDate())
}

export function isWorkday(iso: string, workDays: number[]): boolean {
  return workDays.includes(parseISO(iso).getDay())
}

// Dias de trabalho entre duas datas, contando as duas pontas
export function countWorkdays(start: string, end: string, workDays: number[]): number {
  let count = 0
  for (let day = start; day <= end; day = addDays(day, 1)) {
    if (isWorkday(day, workDays)) count++
  }
  return count
}

// Lista de dias de trabalho entre duas datas
export function listWorkdays(start: string, end: string, workDays: number[]): string[] {
  const days: string[] = []
  for (let day = start; day <= end; day = addDays(day, 1)) {
    if (isWorkday(day, workDays)) days.push(day)
  }
  return days
}

export type DayTotals = {
  income: number
  expense: number
  net: number // o que sobrou no dia: entradas menos saídas
}

export function totalsFor(entries: Entry[]): DayTotals {
  const income = sum(entries.filter((e) => e.type === 'income').map((e) => e.amount))
  const expense = sum(entries.filter((e) => e.type === 'expense').map((e) => e.amount))
  return { income, expense, net: sum([income, -expense]) }
}

export function entriesOn(entries: Entry[], date: string): Entry[] {
  return entries.filter((e) => e.date === date)
}

export type DayPlan = {
  date: string
  isWorkday: boolean
  monthObligations: number // contas com vencimento neste mês
  coveredBefore: number // o que já sobrou nos dias anteriores do mês
  remaining: number // o que ainda falta juntar no mês
  workdaysLeft: number // dias de trabalho de hoje até o fim do mês
  target: number // meta de obrigações do dia
  totals: DayTotals
  difference: number // positivo = passou da meta, negativo = faltou
  nextTarget: number | null // meta dos próximos dias se o dia fechar assim
  extra: number // o que passou da meta de obrigações e pode ir para os objetivos
}

/*
  Meta de obrigações do dia:
  1. Soma todas as contas com vencimento no mês
  2. Tira o que já sobrou (entradas menos saídas) nos dias anteriores do mês
  3. Divide o que falta pelos dias de trabalho que restam, contando hoje

  Assim, se num dia você faz menos, a diferença é espalhada nos dias seguintes.
  Se faz mais, a meta dos próximos dias cai.
*/
export function planFor(data: AppData, date: string): DayPlan {
  const { workDays } = data.settings
  const monthKey = date.slice(0, 7)
  const monthStart = `${monthKey}-01`
  const monthEnd = endOfMonth(date)

  const monthObligations = sum(
    data.bills.filter((b) => b.dueDate.slice(0, 7) === monthKey).map((b) => b.amount)
  )

  const earlierEntries = data.entries.filter((e) => e.date >= monthStart && e.date < date)
  const coveredBefore = totalsFor(earlierEntries).net
  const remaining = Math.max(0, sum([monthObligations, -coveredBefore]))

  const workday = isWorkday(date, workDays)
  const workdaysLeft = countWorkdays(date, monthEnd, workDays)

  let target = 0
  if (workday && workdaysLeft > 0) target = remaining / workdaysLeft
  target = Math.round(target * 100) / 100

  const totals = totalsFor(entriesOn(data.entries, date))
  const difference = sum([totals.net, -target])

  // Meta dos próximos dias de trabalho caso o dia termine com o resultado atual
  const daysAfter = workday ? workdaysLeft - 1 : workdaysLeft
  const remainingAfter = Math.max(0, sum([remaining, -totals.net]))
  const nextTarget = daysAfter > 0 ? Math.round((remainingAfter / daysAfter) * 100) / 100 : null

  return {
    date,
    isWorkday: workday,
    monthObligations,
    coveredBefore,
    remaining,
    workdaysLeft,
    target,
    totals,
    difference,
    nextTarget,
    extra: Math.max(0, difference)
  }
}

// Meta de objetivos do dia: o que falta de cada meta dividido pelos dias de trabalho até o prazo
export function goalsTargetFor(goals: Goal[], date: string, workDays: number[]): number {
  if (!isWorkday(date, workDays)) return 0
  const values = goals.map((goal) => {
    const missing = Math.max(0, goal.target - goal.saved)
    if (missing === 0 || goal.deadline < date) return 0
    const days = countWorkdays(date, goal.deadline, workDays)
    return days > 0 ? missing / days : missing
  })
  return Math.round(sum(values) * 100) / 100
}

// Quanto separar por dia de trabalho para chegar no valor até o prazo
export function perWorkday(
  missing: number,
  from: string,
  deadline: string,
  workDays: number[]
): number {
  if (missing <= 0) return 0
  const days = countWorkdays(from, deadline, workDays)
  return Math.round((days > 0 ? missing / days : missing) * 100) / 100
}

export type PayoffStrategy = 'smallest' | 'oldest'

// Ordem para quitar as vencidas: menor valor primeiro ou mais antiga primeiro
export function orderForPayoff(bills: Bill[], strategy: PayoffStrategy): Bill[] {
  return [...bills].sort((a, b) =>
    strategy === 'smallest'
      ? a.amount - b.amount || a.dueDate.localeCompare(b.dueDate)
      : a.dueDate.localeCompare(b.dueDate) || a.amount - b.amount
  )
}

/*
  Previsão de quando cada vencida fica quitada separando um valor fixo por dia de trabalho.
  Vai acumulando dia a dia e, quando o acumulado cobre a conta da vez, ela é dada como quitada.
*/
export function payoffDates(
  ordered: Bill[],
  perDay: number,
  from: string,
  workDays: number[]
): Record<string, string> {
  const result: Record<string, string> = {}
  if (perDay <= 0 || workDays.length === 0) return result

  let saved = 0
  let index = 0
  let day = from
  // Limite de 3 anos para não rodar para sempre com valores muito baixos
  for (let i = 0; i < 365 * 3 && index < ordered.length; i++) {
    if (isWorkday(day, workDays)) {
      saved += perDay
      while (index < ordered.length && saved + 0.001 >= ordered[index].amount) {
        saved -= ordered[index].amount
        result[ordered[index].id] = day
        index++
      }
    }
    day = addDays(day, 1)
  }
  return result
}
