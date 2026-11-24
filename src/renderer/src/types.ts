// Conta ou boleto a pagar
export type Bill = {
  id: string
  name: string
  amount: number
  dueDate: string // AAAA-MM-DD
  category: string
  recurring: boolean // se repete todo mês
  recurringUntil?: string // conta fixa: última data em que ela ainda vence (AAAA-MM-DD)
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
  image?: string // foto do objetivo, já reduzida, guardada como data URL
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
  // Chave da brapi (cotações da B3 e cripto)
  brapiToken?: string
}

// Tipos de investimento e como cada um é atualizado
export type InvestmentKind =
  | 'stock' // ação, cotação B3
  | 'fii' // fundo imobiliário, cotação B3
  | 'crypto' // cripto, cotação em reais
  | 'selic' // Tesouro Selic, calculado pela taxa Selic do Banco Central
  | 'cdi' // CDB, LCI, LCA, calculado por % do CDI
  | 'manual' // qualquer outro, valor atualizado na mão

// Aporte: dinheiro colocado no investimento
export type Contribution = {
  id: string
  date: string // AAAA-MM-DD
  amount: number
  quantity?: number // cotas ou moedas compradas (ação, fundo imobiliário, cripto)
}

export type Investment = {
  id: string
  name: string
  kind: InvestmentKind
  institution?: string // banco ou corretora
  ticker?: string // código, ex: PETR4, MXRF11, BTC
  cdiPercent?: number // ex: 100 para 100% do CDI
  manualValue?: number // valor atual informado na mão
  manualUpdatedAt?: string
  contributions: Contribution[]
}

export type InvestmentDraft = Omit<Investment, 'id' | 'contributions'>

// Preço guardado num momento, para calcular a variação da última hora
export type PricePoint = { at: number; price: number }

export type QuoteCache = {
  price: number
  dayChange: number | null // variação do dia em %, quando o serviço informa
  history: PricePoint[]
  updatedAt: number
}

// Taxa de um dia útil, em % ao dia (Banco Central)
export type RatePoint = { date: string; rate: number }

// Últimos valores buscados na internet, para mostrar mesmo sem conexão
export type MarketCache = {
  quotes: Record<string, QuoteCache>
  selic?: RatePoint[]
  cdi?: RatePoint[]
  ratesUpdatedAt?: number
  quotesUpdatedAt?: number
  error?: string
}

export type AppData = {
  version: 1
  bills: Bill[]
  entries: Entry[]
  goals: Goal[]
  settings: Settings
  investments?: Investment[]
  market?: MarketCache
  sample?: boolean // true enquanto o app estiver com os dados de exemplo
}
