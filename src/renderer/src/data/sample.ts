import { AppData, Bill, Settings } from '../types'
import { addDays, todayISO } from '../utils/date'
import { createId } from '../utils/bills'

// Dados fictícios para testar o app. As datas são calculadas a partir de hoje,
// assim sempre tem conta vencida, perto de vencer e em dia.
export function createSampleData(): AppData {
  const today = todayISO()

  const bill = (
    name: string,
    amount: number,
    daysFromToday: number,
    category: string,
    recurring: boolean,
    paid = false
  ): Bill => ({
    id: createId(),
    name,
    amount,
    dueDate: addDays(today, daysFromToday),
    category,
    recurring,
    paidAt: paid ? addDays(today, daysFromToday) : null
  })

  return {
    version: 1,
    bills: [
      bill('Aluguel', 900, 6, 'Moradia', true),
      bill('Energia', 182.4, 2, 'Casa', true),
      bill('Internet', 99.9, 0, 'Casa', true),
      bill('Água', 86.3, 12, 'Casa', true),
      bill('Plano do celular', 59.9, 17, 'Casa', true),
      bill('Parcela do carro', 650, 9, 'Transporte', true),
      bill('Seguro do carro', 212.5, 21, 'Transporte', true),
      bill('Fatura cartão A', 1240.75, -41, 'Dívidas', false),
      bill('Fatura cartão B', 860.2, -23, 'Dívidas', false),
      bill('Boleto loja de móveis', 320, -6, 'Dívidas', false),
      bill('Academia', 89.9, -3, 'Saúde', true, true)
    ],
    entries: [],
    goals: [],
    settings: defaultSettings(),
    sample: true
  }
}

export const defaultIncomeCategories = ['Projetos', 'Freela', 'Outros']
export const defaultExpenseCategories = [
  'Combustível',
  'Alimentação',
  'Manutenção do carro',
  'Mercado',
  'Outros'
]

export function defaultSettings(): Settings {
  return {
    workDays: [1, 2, 3, 4, 5, 6],
    incomeCategories: [...defaultIncomeCategories],
    expenseCategories: [...defaultExpenseCategories]
  }
}

// Lista padrão antiga. Quem nunca mexeu nela recebe a nova ao abrir o app
const oldIncomeCategories = ['Corridas', 'Gorjeta', 'Freela', 'Outros']

// Ajusta dados salvos por versões anteriores
export function migrateData(data: AppData): AppData {
  const income = data.settings.incomeCategories
  const untouched =
    !!income &&
    income.length === oldIncomeCategories.length &&
    income.every((c, i) => c === oldIncomeCategories[i])
  if (!untouched) return data
  return { ...data, settings: { ...data.settings, incomeCategories: [...defaultIncomeCategories] } }
}

// Categorias salvas ou, se ainda não tiver, as padrão
export function categoriesOf(settings: Settings, type: 'income' | 'expense'): string[] {
  const saved = type === 'income' ? settings.incomeCategories : settings.expenseCategories
  if (saved && saved.length > 0) return saved
  return type === 'income' ? defaultIncomeCategories : defaultExpenseCategories
}

// App zerado, sem contas, lançamentos nem metas
export function createEmptyData(workDays?: number[]): AppData {
  return {
    version: 1,
    bills: [],
    entries: [],
    goals: [],
    settings: { ...defaultSettings(), workDays: workDays ?? defaultSettings().workDays }
  }
}

// Confere se um arquivo de backup tem o formato do Yovel
export function isAppData(value: unknown): value is AppData {
  const data = value as AppData
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray(data.bills) &&
    Array.isArray(data.entries) &&
    Array.isArray(data.goals) &&
    Array.isArray(data.settings?.workDays)
  )
}
