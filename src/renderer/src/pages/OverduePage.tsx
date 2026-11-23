import { useState } from 'react'
import { useData } from '../data/DataContext'
import { BillForm } from '../components/BillForm'
import { Bill } from '../types'
import { BillRow } from '../components/BillRow'
import { billStatus, byDueDate } from '../utils/bills'
import { formatMoney, sum } from '../utils/money'

export function OverduePage(): React.JSX.Element {
  const { data, markBillAsPaid, addBill, updateBill, deleteBill } = useData()
  const [form, setForm] = useState<{ bill?: Bill } | null>(null)

  // Mais antigas primeiro
  const overdue = data.bills.filter((b) => billStatus(b) === 'overdue').sort(byDueDate)
  const total = sum(overdue.map((b) => b.amount))

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>Vencidas</h1>
          <p className="page-subtitle">
            Contas que passaram do vencimento e precisam ser colocadas em dia.
          </p>
        </div>
        <button className="btn" onClick={() => setForm({})}>
          Nova conta
        </button>
      </header>

      {overdue.length > 0 ? (
        <div className="alert alert-danger">
          {overdue.length === 1 ? '1 conta vencida' : `${overdue.length} contas vencidas`}, somando{' '}
          <strong>{formatMoney(total)}</strong>.
        </div>
      ) : (
        <div className="alert alert-success">Nenhuma conta vencida.</div>
      )}

      <div className="list">
        {overdue.map((bill) => (
          <BillRow
            key={bill.id}
            bill={bill}
            onPay={() => markBillAsPaid(bill.id)}
            onEdit={() => setForm({ bill })}
            onDelete={() => deleteBill(bill.id)}
          />
        ))}
      </div>
      {form && (
        <BillForm
          bill={form.bill}
          onClose={() => setForm(null)}
          onSave={(draft, installments) => {
            if (form.bill) updateBill(form.bill.id, draft)
            else addBill(draft, installments)
            setForm(null)
          }}
        />
      )}
    </section>
  )
}
