import { useData } from '../data/DataContext'
import { BillRow } from '../components/BillRow'
import { billStatus, byDueDate, DUE_SOON_DAYS } from '../utils/bills'
import { isSameMonth } from '../utils/date'
import { formatMoney, sum } from '../utils/money'

export function BillsPage(): React.JSX.Element {
  const { data, markBillAsPaid, undoBillPayment } = useData()

  // Contas em aberto que ainda não venceram
  const open = data.bills
    .filter((b) => {
      const status = billStatus(b)
      return status === 'dueSoon' || status === 'upcoming'
    })
    .sort(byDueDate)

  const dueSoon = open.filter((b) => billStatus(b) === 'dueSoon')
  const openThisMonth = open.filter((b) => isSameMonth(b.dueDate))
  const paidThisMonth = data.bills.filter((b) => b.paidAt && isSameMonth(b.paidAt)).sort(byDueDate)

  return (
    <section className="page">
      <header className="page-header">
        <h1>Contas em dia</h1>
        <p className="page-subtitle">
          Tudo que ainda não venceu. Quando passar do vencimento, vai para Vencidas.
        </p>
      </header>

      <div className="cards">
        <div className="card">
          <p className="card-label">A pagar neste mês</p>
          <p className="card-value">{formatMoney(sum(openThisMonth.map((b) => b.amount)))}</p>
          <p className="card-hint">{openThisMonth.length} contas</p>
        </div>
        <div className={`card ${dueSoon.length > 0 ? 'card-warning' : ''}`}>
          <p className="card-label">Vence em até {DUE_SOON_DAYS} dias</p>
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
            <BillRow key={bill.id} bill={bill} onPay={() => markBillAsPaid(bill.id)} />
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
    </section>
  )
}
