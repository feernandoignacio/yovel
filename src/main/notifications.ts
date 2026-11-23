import { app, Notification } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { loadData } from './storage'

// Prazo padrão, o mesmo da tela (utils/bills.ts). A pessoa pode mudar em Ajustes
const DUE_SOON_DAYS = 3
const CHECK_EVERY_MS = 60 * 60 * 1000 // de hora em hora

type StoredBill = {
  id: string
  name: string
  amount: number
  dueDate: string
  paidAt: string | null
}
type NotifyState = { date: string; dueSoon: boolean; overdue: boolean }

export type NotifyTarget = 'bills' | 'overdue'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((new Date(y, m - 1, d).getTime() - start.getTime()) / 86400000)
}

function money(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Guarda quais avisos já foram mostrados hoje, para não repetir a cada hora
function statePath(): string {
  return join(app.getPath('userData'), 'yovel-avisos.json')
}

async function loadState(): Promise<NotifyState> {
  try {
    const state = JSON.parse(await readFile(statePath(), 'utf-8')) as NotifyState
    if (state.date === todayISO()) return state
  } catch {
    // sem arquivo ainda
  }
  return { date: todayISO(), dueSoon: false, overdue: false }
}

function saveState(state: NotifyState): Promise<void> {
  return writeFile(statePath(), JSON.stringify(state), 'utf-8')
}

function describe(bills: StoredBill[]): string {
  const total = bills.reduce((sum, b) => sum + b.amount, 0)
  const names = bills
    .slice(0, 3)
    .map((b) => b.name)
    .join(', ')
  const more = bills.length > 3 ? ` e mais ${bills.length - 3}` : ''
  return `${names}${more}. Total de ${money(total)}.`
}

export async function checkBills(
  icon: string,
  onClick: (target: NotifyTarget) => void,
  force = false
): Promise<void> {
  if (!Notification.isSupported()) return

  const data = (await loadData()) as {
    bills?: StoredBill[]
    settings?: { dueSoonDays?: number }
  } | null
  const bills = (data?.bills ?? []).filter((b) => !b.paidAt)
  const dueSoonDays = data?.settings?.dueSoonDays ?? DUE_SOON_DAYS
  const state = force ? { date: todayISO(), dueSoon: false, overdue: false } : await loadState()

  const overdue = bills.filter((b) => daysUntil(b.dueDate) < 0)
  const dueSoon = bills.filter((b) => {
    const days = daysUntil(b.dueDate)
    return days >= 0 && days <= dueSoonDays
  })

  // Aviso de vencidas: tom mais forte, diferente do aviso de "vence em breve"
  if (overdue.length > 0 && !state.overdue) {
    const notification = new Notification({
      title:
        overdue.length === 1
          ? 'Você tem 1 conta vencida'
          : `Você tem ${overdue.length} contas vencidas`,
      body: describe(overdue),
      icon,
      urgency: 'critical'
    })
    notification.on('click', () => onClick('overdue'))
    notification.show()
    state.overdue = true
  }

  if (dueSoon.length > 0 && !state.dueSoon) {
    const today = dueSoon.filter((b) => daysUntil(b.dueDate) === 0)
    const title =
      today.length > 0
        ? today.length === 1
          ? '1 conta vence hoje'
          : `${today.length} contas vencem hoje`
        : dueSoon.length === 1
          ? '1 conta vence nos próximos dias'
          : `${dueSoon.length} contas vencem nos próximos dias`
    const notification = new Notification({ title, body: describe(dueSoon), icon })
    notification.on('click', () => onClick('bills'))
    notification.show()
    state.dueSoon = true
  }

  await saveState(state)
}

// Confere ao abrir (depois de alguns segundos) e de hora em hora
export function startBillChecks(icon: string, onClick: (target: NotifyTarget) => void): void {
  setTimeout(() => checkBills(icon, onClick), 5000)
  setInterval(() => checkBills(icon, onClick), CHECK_EVERY_MS)
}
