import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { AppData, Bill, BillDraft, Entry, GoalDraft } from '../types'
import { createEmptyData } from './sample'
import { addMonths, todayISO } from '../utils/date'
import { createId } from '../utils/bills'

type DataContextValue = {
  data: AppData
  markBillAsPaid: (id: string) => void
  undoBillPayment: (id: string) => void
  addEntry: (entry: Omit<Entry, 'id'>) => void
  removeEntry: (id: string) => void
  addBill: (draft: BillDraft, installments: number) => void
  updateBill: (id: string, draft: BillDraft) => void
  deleteBill: (id: string) => void
  addGoal: (draft: GoalDraft) => void
  updateGoal: (id: string, draft: GoalDraft) => void
  deleteGoal: (id: string) => void
  addToGoal: (id: string, amount: number) => void
  replaceData: (data: AppData) => void
  setWorkDays: (workDays: number[]) => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [data, setData] = useState<AppData | null>(null)

  // Carrega o arquivo ao abrir o app. Na primeira vez começa limpo
  useEffect(() => {
    window.api.loadData().then((saved) => {
      setData((saved as AppData | null) ?? createEmptyData())
    })
  }, [])

  // Salva no arquivo sempre que algo muda
  useEffect(() => {
    if (data) window.api.saveData(data)
  }, [data])

  if (!data) {
    return <div className="loading">Carregando...</div>
  }

  const update = (change: (current: AppData) => AppData): void => {
    setData((current) => (current ? change(current) : current))
  }

  const markBillAsPaid = (id: string): void => {
    update((current) => {
      const bill = current.bills.find((b) => b.id === id)
      if (!bill) return current

      const bills = current.bills.map((b) => (b.id === id ? { ...b, paidAt: todayISO() } : b))

      // Conta fixa: ao pagar, já cria a do mês seguinte
      if (bill.recurring) {
        const nextDueDate = addMonths(bill.dueDate, 1)
        const alreadyExists = current.bills.some(
          (b) => b.name === bill.name && b.dueDate === nextDueDate
        )
        if (!alreadyExists) {
          const next: Bill = { ...bill, id: createId(), dueDate: nextDueDate, paidAt: null }
          bills.push(next)
        }
      }

      return { ...current, bills }
    })
  }

  // Desfaz o pagamento (caso tenha clicado sem querer)
  const undoBillPayment = (id: string): void => {
    update((current) => {
      const bill = current.bills.find((b) => b.id === id)
      if (!bill) return current
      const nextDueDate = addMonths(bill.dueDate, 1)
      const bills = current.bills
        // Remove a próxima conta fixa criada automaticamente, se ainda não foi paga
        .filter(
          (b) => !(bill.recurring && b.name === bill.name && b.dueDate === nextDueDate && !b.paidAt)
        )
        .map((b) => (b.id === id ? { ...b, paidAt: null } : b))
      return { ...current, bills }
    })
  }

  const addEntry = (entry: Omit<Entry, 'id'>): void => {
    update((current) => ({
      ...current,
      entries: [...current.entries, { ...entry, id: createId() }]
    }))
  }

  const removeEntry = (id: string): void => {
    update((current) => ({ ...current, entries: current.entries.filter((e) => e.id !== id) }))
  }

  // Nova conta. Se for parcelada, cria uma conta por parcela, uma por mês
  const addBill = (draft: BillDraft, installments: number): void => {
    const created: Bill[] =
      installments > 1
        ? Array.from({ length: installments }, (_, i) => ({
            ...draft,
            id: createId(),
            name: `${draft.name} (${i + 1}/${installments})`,
            dueDate: addMonths(draft.dueDate, i),
            recurring: false,
            paidAt: null
          }))
        : [{ ...draft, id: createId(), paidAt: null }]
    update((current) => ({ ...current, bills: [...current.bills, ...created] }))
  }

  const updateBill = (id: string, draft: BillDraft): void => {
    update((current) => ({
      ...current,
      bills: current.bills.map((b) => (b.id === id ? { ...b, ...draft } : b))
    }))
  }

  const deleteBill = (id: string): void => {
    update((current) => ({ ...current, bills: current.bills.filter((b) => b.id !== id) }))
  }

  const addGoal = (draft: GoalDraft): void => {
    update((current) => ({ ...current, goals: [...current.goals, { ...draft, id: createId() }] }))
  }

  const updateGoal = (id: string, draft: GoalDraft): void => {
    update((current) => ({
      ...current,
      goals: current.goals.map((g) => (g.id === id ? { ...g, ...draft } : g))
    }))
  }

  const deleteGoal = (id: string): void => {
    update((current) => ({ ...current, goals: current.goals.filter((g) => g.id !== id) }))
  }

  // Soma (ou tira, se negativo) um valor do que já foi guardado na meta
  const addToGoal = (id: string, amount: number): void => {
    update((current) => ({
      ...current,
      goals: current.goals.map((g) =>
        g.id === id ? { ...g, saved: Math.max(0, Math.round((g.saved + amount) * 100) / 100) } : g
      )
    }))
  }

  // Troca todos os dados de uma vez (começar do zero, dados de exemplo ou backup)
  const replaceData = (next: AppData): void => {
    setData(next)
  }

  const setWorkDays = (workDays: number[]): void => {
    update((current) => ({
      ...current,
      settings: { ...current.settings, workDays: [...workDays].sort() }
    }))
  }

  return (
    <DataContext.Provider
      value={{
        data,
        markBillAsPaid,
        undoBillPayment,
        addEntry,
        removeEntry,
        addBill,
        updateBill,
        deleteBill,
        addGoal,
        updateGoal,
        deleteGoal,
        addToGoal,
        replaceData,
        setWorkDays
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData precisa estar dentro do DataProvider')
  return context
}
