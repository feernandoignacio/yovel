import { Bill } from '../types'
import { billStatus, dueLabel } from '../utils/bills'
import { formatDate } from '../utils/date'
import { formatMoney } from '../utils/money'

type Props = {
  bill: Bill
  onPay?: () => void
  onUndo?: () => void
}

const statusLabel = {
  paid: 'Paga',
  overdue: 'Vencida',
  dueSoon: 'Vence em breve',
  upcoming: 'Em dia'
}

export function BillRow({ bill, onPay, onUndo }: Props): React.JSX.Element {
  const status = billStatus(bill)

  return (
    <div className={`bill-row status-${status}`}>
      <div className="bill-main">
        <p className="bill-name">
          {bill.name}
          {bill.recurring && <span className="tag">Fixa</span>}
        </p>
        <p className="bill-meta">{bill.category}</p>
      </div>

      <div className="bill-due">
        <p>{formatDate(bill.dueDate)}</p>
        <p className="bill-meta">
          {status === 'paid' && bill.paidAt ? `paga em ${formatDate(bill.paidAt)}` : dueLabel(bill)}
        </p>
      </div>

      <p className="bill-amount">{formatMoney(bill.amount)}</p>

      <span className={`pill pill-${status}`}>{statusLabel[status]}</span>

      <div className="bill-action">
        {status === 'paid'
          ? onUndo && (
              <button className="btn btn-ghost" onClick={onUndo}>
                Desfazer
              </button>
            )
          : onPay && (
              <button className="btn" onClick={onPay}>
                Marcar como paga
              </button>
            )}
      </div>
    </div>
  )
}
