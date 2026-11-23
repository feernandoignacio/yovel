import { Bill } from '../types'
import { daysUntil } from './date'

// Quantos dias antes do vencimento a conta começa a avisar (padrão)
export const DUE_SOON_DAYS = 3

// Valor escolhido em Ajustes. O DataProvider atualiza sempre que os dados mudam
let dueSoonDays = DUE_SOON_DAYS

export function setDueSoonDays(days: number): void {
  dueSoonDays = days
}

export function getDueSoonDays(): number {
  return dueSoonDays
}

export type BillStatus = 'paid' | 'overdue' | 'dueSoon' | 'upcoming'

export function billStatus(bill: Bill): BillStatus {
  if (bill.paidAt) return 'paid'
  const days = daysUntil(bill.dueDate)
  if (days < 0) return 'overdue'
  if (days <= dueSoonDays) return 'dueSoon'
  return 'upcoming'
}

// Texto curto do prazo: "vence hoje", "vence em 2 dias", "venceu há 5 dias"
export function dueLabel(bill: Bill): string {
  const days = daysUntil(bill.dueDate)
  if (days === 0) return 'vence hoje'
  if (days === 1) return 'vence amanhã'
  if (days > 1) return `vence em ${days} dias`
  if (days === -1) return 'venceu ontem'
  return `venceu há ${Math.abs(days)} dias`
}

export function byDueDate(a: Bill, b: Bill): number {
  return a.dueDate.localeCompare(b.dueDate)
}

export function createId(): string {
  return crypto.randomUUID()
}
