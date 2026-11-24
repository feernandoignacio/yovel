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

const round = (value: number): number => Math.round(value * 100) / 100

// Cada conta começa a contar na meta no máximo esse número de dias antes de vencer
export const SAVING_WINDOW_DAYS = 30

// Quanto uma conta está pedindo por dia até o vencimento dela
export type BillShare = {
  bill: Bill
  remaining: number // o que ainda falta guardar para essa conta
  days: number // dias de trabalho deste dia até o vencimento, contando os dois
  perDay: number
}

export type DayPlan = {
  date: string
  isWorkday: boolean
  saved: number // total já guardado para as contas que estão contando
  shares: BillShare[] // contas que estão contando na meta deste dia
  target: number // meta de obrigações do dia
  totals: DayTotals
  difference: number // positivo = passou da meta, negativo = faltou
  nextTarget: number | null // meta do próximo dia de trabalho se o dia fechar assim
  extra: number // o que passou da meta de obrigações e pode ir para os objetivos
}

// Data em que a conta começa a contar na meta: 30 dias antes de vencer
export function savingStart(bill: Bill): string {
  return addDays(bill.dueDate, -SAVING_WINDOW_DAYS)
}

/*
  Como a meta funciona (envelopes):
  - Cada conta tem um "envelope" com o que já foi guardado para ela.
  - Uma conta começa a contar 30 dias antes de vencer (ou hoje, se já estiver nesse prazo).
  - A cada dia de trabalho, cada conta pede o que falta no envelope dela dividido pelos
    dias de trabalho até o vencimento. A meta do dia é a soma disso.
  - O que entra no dia vai para os envelopes na mesma proporção. O que passar da meta
    vai para a conta que vence antes. Se faltar, cada envelope fica menor e o que faltou
    se espalha sozinho nos dias seguintes até o vencimento de cada conta.
  Assim cada conta pede um valor fixo por dia até vencer, e a meta só muda quando
  uma conta nova começa a contar, é paga ou quando você fica para trás ou passa da meta.
*/
type State = {
  covered: Map<string, number> // valor no envelope de cada conta
  free: number // dinheiro guardado que ainda não foi para nenhum envelope
  open: Bill[] // contas em aberto, da que vence antes para a que vence depois
}

function cloneState(state: State): State {
  return { covered: new Map(state.covered), free: state.free, open: [...state.open] }
}

function isCounting(bill: Bill, day: string): boolean {
  return savingStart(bill) <= day && bill.dueDate >= day
}

// Põe o dinheiro livre nos envelopes das contas que estão contando, da que vence antes.
// Se o livre estiver negativo (gastou mais do que entrou), tira dos envelopes das que vencem depois
function settle(state: State, day: string): void {
  if (state.free > 0) {
    for (const bill of state.open) {
      if (state.free <= 0) break
      if (!isCounting(bill, day)) continue
      const has = state.covered.get(bill.id) ?? 0
      const add = Math.min(state.free, bill.amount - has)
      if (add > 0) {
        state.covered.set(bill.id, has + add)
        state.free -= add
      }
    }
  } else if (state.free < 0) {
    for (const bill of [...state.open].reverse()) {
      if (state.free >= 0) break
      const has = state.covered.get(bill.id) ?? 0
      const take = Math.min(has, -state.free)
      state.covered.set(bill.id, has - take)
      state.free += take
    }
  }
}

function sharesOn(state: State, day: string, workDays: number[]): BillShare[] {
  if (!isWorkday(day, workDays)) return []
  const shares: BillShare[] = []
  for (const bill of state.open) {
    // Conta já paga nesse dia não pede mais nada
    if (!isCounting(bill, day) || (bill.paidAt && bill.paidAt <= day)) continue
    const remaining = round(bill.amount - (state.covered.get(bill.id) ?? 0))
    if (remaining <= 0) continue
    const days = Math.max(1, countWorkdays(day, bill.dueDate, workDays))
    shares.push({ bill, remaining, days, perDay: round(remaining / days) })
  }
  return shares
}

// Divide o que entrou no dia entre os envelopes
function addEarnings(state: State, shares: BillShare[], net: number, day: string): void {
  const target = sum(shares.map((s) => s.perDay))
  if (net <= 0 || target <= 0) {
    state.free += net
  } else {
    const ratio = Math.min(1, net / target)
    for (const share of shares) {
      const has = state.covered.get(share.bill.id) ?? 0
      state.covered.set(share.bill.id, has + share.perDay * ratio)
    }
    state.free += Math.max(0, net - target)
  }
  settle(state, day)
}

// Fim do dia: tira as contas pagas e as que venceram
function closeDay(state: State, day: string, assumePaidOnDue: boolean): void {
  const leaving = state.open.filter(
    (b) => b.paidAt === day || (b.dueDate === day && (assumePaidOnDue || b.paidAt === day))
  )
  const expired = state.open.filter((b) => b.dueDate === day && !b.paidAt && !assumePaidOnDue)

  for (const bill of leaving) {
    // Pagou: usa o envelope e o que faltar sai do dinheiro livre
    state.free -= bill.amount - (state.covered.get(bill.id) ?? 0)
    state.covered.delete(bill.id)
  }
  for (const bill of expired) {
    // Venceu sem pagar: vai para Vencidas e o dinheiro do envelope volta a ficar livre
    state.free += state.covered.get(bill.id) ?? 0
    state.covered.delete(bill.id)
  }
  const gone = new Set([...leaving, ...expired].map((b) => b.id))
  state.open = state.open.filter((b) => !gone.has(b.id))
  settle(state, day)
}

/*
  Refaz os envelopes dia a dia, do primeiro lançamento até o dia pedido.
  Dias que já passaram usam o que foi lançado de verdade.
  Dias futuros supõem que a meta é batida e que cada conta é paga no vencimento.
*/
function stateAt(data: AppData, date: string, today: string): State {
  const { workDays } = data.settings
  const firstEntry = data.entries.reduce<string | null>(
    (first, e) => (!first || e.date < first ? e.date : first),
    null
  )
  // Começa no primeiro lançamento. Para dias futuros, começa no máximo hoje
  let start = date > today ? today : date
  if (firstEntry && firstEntry < start) start = firstEntry

  const state: State = {
    covered: new Map(),
    free: 0,
    open: data.bills
      .filter((b) => b.dueDate >= start && (!b.paidAt || b.paidAt >= start))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }

  const todayHasEntries = entriesOn(data.entries, today).length > 0
  for (let day = start; day < date; day = addDays(day, 1)) {
    settle(state, day)
    const shares = sharesOn(state, day, workDays)
    const target = sum(shares.map((s) => s.perDay))
    const real = day < today || (day === today && todayHasEntries)
    const net = real ? totalsFor(entriesOn(data.entries, day)).net : target
    addEarnings(state, shares, net, day)
    closeDay(state, day, day >= today)
  }
  settle(state, date)
  return state
}

export function planFor(data: AppData, date: string, today: string = todayISO()): DayPlan {
  const { workDays } = data.settings
  const state = stateAt(data, date, today)
  const shares = sharesOn(state, date, workDays)
  const target = round(sum(shares.map((s) => s.perDay)))
  const totals = totalsFor(entriesOn(data.entries, date))
  const difference = sum([totals.net, -target])
  const saved = round(
    sum(state.open.filter((b) => isCounting(b, date)).map((b) => state.covered.get(b.id) ?? 0))
  )

  // Meta do próximo dia de trabalho se este dia fechar com o resultado atual
  let nextTarget: number | null = null
  const next = cloneState(state)
  addEarnings(next, shares, totals.net, date)
  closeDay(next, date, date >= today)
  for (let day = addDays(date, 1), i = 0; i < 14; day = addDays(day, 1), i++) {
    settle(next, day)
    const nextShares = sharesOn(next, day, workDays)
    if (isWorkday(day, workDays)) {
      nextTarget = round(sum(nextShares.map((s) => s.perDay)))
      break
    }
    closeDay(next, day, true)
  }

  return {
    date,
    isWorkday: isWorkday(date, workDays),
    saved,
    shares,
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
