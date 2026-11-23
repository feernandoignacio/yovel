const DAY_MS = 24 * 60 * 60 * 1000

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Converte AAAA-MM-DD em data local (sem problema de fuso)
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): string {
  return toISO(new Date())
}

export function addDays(iso: string, days: number): string {
  const date = parseISO(iso)
  date.setDate(date.getDate() + days)
  return toISO(date)
}

// Avança meses mantendo o dia. Se o mês não tiver o dia (ex: 31), usa o último dia
export function addMonths(iso: string, months: number): string {
  const date = parseISO(iso)
  const day = date.getDate()
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastDay))
  return toISO(target)
}

// Quantos dias faltam até a data (negativo = já passou)
export function daysUntil(iso: string): number {
  return Math.round((parseISO(iso).getTime() - parseISO(todayISO()).getTime()) / DAY_MS)
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function isSameMonth(iso: string, reference: string = todayISO()): boolean {
  return iso.slice(0, 7) === reference.slice(0, 7)
}
