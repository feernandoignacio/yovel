// Conta ou boleto a pagar
export type Bill = {
  id: string
  name: string
  amount: number
  dueDate: string // AAAA-MM-DD
  category: string
  recurring: boolean // se repete todo mês
  paidAt: string | null // data em que foi paga, ou null se está em aberto
}

// Dados da conta preenchidos no formulário
export type BillDraft = Omit<Bill, 'id' | 'paidAt'>

// Lançamento do dia: o que entrou ou saiu
export type Entry = {
  id: string
  date: string // AAAA-MM-DD
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
}

// Meta ou objetivo (fora das obrigações)
export type Goal = {
  id: string
  name: string
  target: number
  saved: number
  deadline: string // AAAA-MM-DD
}

// Dados da meta preenchidos no formulário
export type GoalDraft = Omit<Goal, 'id'>

export type Settings = {
  // Dias da semana em que trabalha (0 = domingo, 6 = sábado)
  workDays: number[]
  // Nomes das categorias de entrada e saída, editáveis em Ajustes
  incomeCategories?: string[]
  expenseCategories?: string[]
  // Com quantos dias de antecedência a conta começa a avisar
  dueSoonDays?: number
  // Escolhas do plano para quitar as vencidas
  payoffStrategy?: 'smallest' | 'oldest'
  payoffDeadline?: string
}

export type AppData = {
  version: 1
  bills: Bill[]
  entries: Entry[]
  goals: Goal[]
  settings: Settings
  sample?: boolean // true enquanto o app estiver com os dados de exemplo
}
