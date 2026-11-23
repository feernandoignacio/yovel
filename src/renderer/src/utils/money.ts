const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatMoney(value: number): string {
  return formatter.format(value)
}

export function sum(values: number[]): number {
  // Arredonda para centavos para evitar 0.1 + 0.2 = 0.30000000000000004
  return Math.round(values.reduce((total, v) => total + v, 0) * 100) / 100
}
