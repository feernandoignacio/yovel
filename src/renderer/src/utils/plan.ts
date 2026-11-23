import { AppData, Bill, Entry, Goal } from '../types'
import { addDays, parseISO, todayISO } from './date'
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
  monthWorkdays: number // dias de trabalho do mês inteiro
  base: number // contas do mês divididas pelos dias de trabalho do mês
  deficit: number // diferença acumulada antes deste dia (positivo = ficou para trás)
  coveredBefore: number // o que já sobrou nos dias anteriores do mês
  workdaysLeft: number // dias de trabalho deste dia até o fim do mês
  target: number // meta de obrigações do dia
  totals: DayTotals
  difference: number // positivo = passou da meta, negativo = faltou
  nextTarget: number | null // meta dos próximos dias se o dia fechar assim
  extra: number // o que passou da meta de obrigações e pode ir para os objetivos
}

const round = (value: number): number => Math.round(value * 100) / 100

type MonthBase = { monthObligations: number; monthWorkdays: number; base: number }

// Contas do mês divididas por todos os dias de trabalho do mês
function monthBase(data: AppData, date: string): MonthBase {
  const monthKey = date.slice(0, 7)
  const monthObligations = sum(
    data.bills.filter((b) => b.dueDate.slice(0, 7) === monthKey).map((b) => b.amount)
  )
  const monthWorkdays = countWorkdays(`${monthKey}-01`, endOfMonth(date), data.settings.workDays)
  const base = monthWorkdays > 0 ? monthObligations / monthWorkdays : 0
  return { monthObligations, monthWorkdays, base }
}

/*
  Meta de obrigações do dia:
  1. Base: soma das contas com vencimento no mês dividida por todos os dias de trabalho do mês.
     Ex: 3.000 em contas num mês com 26 dias de trabalho dá 115,38 por dia.
  2. Diferença acumulada: desde o primeiro lançamento do mês, quanto você ficou para trás
     (ou passou) da base em cada dia.
  3. Essa diferença é espalhada nos dias de trabalho que restam no mês, contando hoje.

  Assim, se num dia você faz menos, a diferença é dividida nos dias seguintes.
  Se faz mais, a meta dos próximos dias cai.
  Os dias antes do primeiro lançamento do mês não contam, porque você ainda não usava o app.

  Dias futuros usam a previsão de projectedPlan: a meta fica igual em todos eles.
*/
export function planFor(data: AppData, date: string, today: string = todayISO()): DayPlan {
  if (date > today) return projectedPlan(data, date, today)

  const { workDays } = data.settings
  const monthStart = `${date.slice(0, 7)}-01`
  const monthEnd = endOfMonth(date)
  const { monthObligations, monthWorkdays, base } = monthBase(data, date)

  // Começa a contar a diferença a partir do primeiro lançamento do mês
  const firstEntry = data.entries
    .filter((e) => e.date >= monthStart && e.date <= monthEnd)
    .reduce<string | null>((first, e) => (!first || e.date < first ? e.date : first), null)
  const start = firstEntry && firstEntry < date ? firstEntry : date

  const earlierEntries = data.entries.filter((e) => e.date >= start && e.date < date)
  const coveredBefore = totalsFor(earlierEntries).net
  const expectedBefore = start < date ? base * countWorkdays(start, addDays(date, -1), workDays) : 0
  const deficit = round(expectedBefore - coveredBefore)

  const workday = isWorkday(date, workDays)
  const workdaysLeft = countWorkdays(date, monthEnd, workDays)

  const target = workday && workdaysLeft > 0 ? round(Math.max(0, base + deficit / workdaysLeft)) : 0

  const totals = totalsFor(entriesOn(data.entries, date))
  const difference = sum([totals.net, -target])

  // Meta dos próximos dias de trabalho caso o dia termine com o resultado atual
  const daysAfter = workday ? workdaysLeft - 1 : workdaysLeft
  const deficitAfter = deficit + (workday ? base : 0) - totals.net
  const nextTarget = daysAfter > 0 ? round(Math.max(0, base + deficitAfter / daysAfter)) : null

  return {
    date,
    isWorkday: workday,
    monthObligations,
    monthWorkdays,
    base: round(base),
    deficit,
    coveredBefore,
    workdaysLeft,
    target,
    totals,
    difference,
    nextTarget,
    extra: Math.max(0, difference)
  }
}

/*
  Previsão para dias que ainda não chegaram, supondo que cada dia até lá bate a meta.
  Assim a meta fica igual em todos os dias futuros, em vez de ir crescendo.
  - No mês atual: se hoje ainda não tem lançamento, é a própria meta de hoje.
    Se já tem, é a meta dos próximos dias caso hoje feche como está.
  - Em outro mês: a base daquele mês (contas do mês divididas pelos dias de trabalho dele).
*/
function projectedPlan(data: AppData, date: string, today: string): DayPlan {
  const { workDays } = data.settings
  const workday = isWorkday(date, workDays)
  // Se já tiver algo lançado nesse dia (ex: lançou adiantado), mostra também
  const totals = totalsFor(entriesOn(data.entries, date))
  const { monthObligations, monthWorkdays, base } = monthBase(data, date)

  let target = 0
  let deficit = 0
  if (date.slice(0, 7) === today.slice(0, 7)) {
    const current = planFor(data, today, today)
    const todayHasEntries = entriesOn(data.entries, today).length > 0
    const flat =
      current.isWorkday && !todayHasEntries ? current.target : (current.nextTarget ?? base)
    deficit = current.deficit
    if (workday) target = flat
  } else if (workday) {
    target = round(base)
  }

  return {
    date,
    isWorkday: workday,
    monthObligations,
    monthWorkdays,
    base: round(base),
    deficit,
    coveredBefore: 0,
    workdaysLeft: countWorkdays(date, endOfMonth(date), workDays),
    target,
    totals,
    difference: sum([totals.net, -target]),
    nextTarget: target,
    extra: Math.max(0, sum([totals.net, -target]))
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
