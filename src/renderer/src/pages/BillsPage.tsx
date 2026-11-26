import { useState } from 'react'
import { useData } from '../data/DataContext'
import { BillForm } from '../components/BillForm'
import { Bill } from '../types'
import { BillRow } from '../components/BillRow'
import { billStatus, byDueDate, getDueSoonDays } from '../utils/bills'
import { isSameMonth } from '../utils/date'
import { formatMoney, sum } from '../utils/money'
import { affordableBillIds, availableBalance } from '../utils/plan'

export function BillsPage(): React.JSX.Element {
  const { data, markBillAsPaid, undoBillPayment, addBill, updateBill, deleteBill } = useData()
  // null = formulário fechado; { bill: undefined } = nova conta; { bill } = editando
  const [form, setForm] = useState<{ bill?: Bill } | null>(null)

  // Contas em aberto que ainda não venceram
  const open = data.bills
    .filter((b) => {
      const status = billStatus(b)
      return status === 'dueSoon' || status === 'upcoming'
    })
    .sort(byDueDate)

  const dueSoon = open.filter((b) => billStatus(b) === 'dueSoon')
  const openThisMonth = open.filter((b) => isSameMonth(b.dueDate))
  const balance = availableBalance(data)
  const affordable = affordableBillIds(data)
  const coveredOpen = open.filter((b) => affordable.has(b.id)).length

  const paidThisMonth = data.bills.filter((b) => b.paidAt && isSameMonth(b.paidAt)).sort(byDueDate)

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>Contas em dia</h1>
          <p className="page-subtitle">
            Tudo que ainda não venceu. Quando passar do vencimento, vai para Vencidas.
          </p>
        </div>
        <button className="btn" onClick={() => setForm({})}>
          Nova conta
        </button>
      </header>

      <div className="cards cards-4">
        <div className={`card ${coveredOpen > 0 ? 'card-success' : ''}`}>
          <p className="card-label">Disponível agora</p>
          <p className={`card-value ${balance < 0 ? 'negative' : ''}`}>{formatMoney(balance)}</p>
          <p className="card-hint">
            {coveredOpen === 0
              ? 'Entradas menos gastos e contas pagas'
              : coveredOpen === 1
                ? 'Já cobre 1 conta'
                : `Já cobre ${coveredOpen} contas`}
          </p>
        </div>
        <div className="card">
          <p className="card-label">A pagar neste mês</p>
          <p className="card-value">{formatMoney(sum(openThisMonth.map((b) => b.amount)))}</p>
          <p className="card-hint">{openThisMonth.length} contas</p>
        </div>
        <div className={`card ${dueSoon.length > 0 ? 'card-warning' : ''}`}>
          <p className="card-label">Vence em até {getDueSoonDays()} dias</p>
          <p className="card-value">{formatMoney(sum(dueSoon.map((b) => b.amount)))}</p>
          <p className="card-hint">{dueSoon.length} contas</p>
        </div>
        <div className="card">
          <p className="card-label">Pago neste mês</p>
          <p className="card-value">{formatMoney(sum(paidThisMonth.map((b) => b.amount)))}</p>
          <p className="card-hint">{paidThisMonth.length} contas</p>
        </div>
      </div>

      {dueSoon.length > 0 && (
        <div className="alert alert-warning">
          {dueSoon.length === 1
            ? '1 conta vence nos próximos dias. Não deixa passar.'
            : `${dueSoon.length} contas vencem nos próximos dias. Não deixa passar.`}
        </div>
      )}

      <div className="list">
        {open.length === 0 ? (
          <p className="empty">Nenhuma conta em aberto. Tudo em dia.</p>
        ) : (
          open.map((bill) => (
            <BillRow
              key={bill.id}
              bill={bill}
              canPay={affordable.has(bill.id)}
              onPay={() => markBillAsPaid(bill.id)}
              onEdit={() => setForm({ bill })}
              onDelete={() => deleteBill(bill.id)}
            />
          ))
        )}
      </div>

      {paidThisMonth.length > 0 && (
        <>
          <h2 className="section-title">Pagas neste mês</h2>
          <div className="list">
            {paidThisMonth.map((bill) => (
              <BillRow key={bill.id} bill={bill} onUndo={() => undoBillPayment(bill.id)} />
            ))}
          </div>
        </>
      )}
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
