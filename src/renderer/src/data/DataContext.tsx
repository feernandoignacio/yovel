import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { AppData, Bill, Entry } from '../types'
import { createSampleData } from './sample'
import { addMonths, todayISO } from '../utils/date'
import { createId } from '../utils/bills'

type DataContextValue = {
  data: AppData
  markBillAsPaid: (id: string) => void
  undoBillPayment: (id: string) => void
  addEntry: (entry: Omit<Entry, 'id'>) => void
  removeEntry: (id: string) => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [data, setData] = useState<AppData | null>(null)

  // Carrega o arquivo ao abrir o app. Se não existir, usa os dados fictícios
  useEffect(() => {
    window.api.loadData().then((saved) => {
      setData((saved as AppData | null) ?? createSampleData())
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

  return (
    <DataContext.Provider value={{ data, markBillAsPaid, undoBillPayment, addEntry, removeEntry }}>
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
