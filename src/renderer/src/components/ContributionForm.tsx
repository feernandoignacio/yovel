import { FormEvent, useState } from 'react'
import { Contribution, Investment } from '../types'
import { isQuoted } from '../utils/investments'
import { parseAmount } from '../utils/money'
import { todayISO } from '../utils/date'
import { DatePicker } from './DatePicker'

type Props = {
  investment: Investment
  onSave: (contribution: Omit<Contribution, 'id'>) => void
  onClose: () => void
}

// Janela para registrar um aporte novo
export function ContributionForm({ investment, onSave, onClose }: Props): React.JSX.Element {
  const quoted = isQuoted(investment.kind)
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const value = parseAmount(amount)
    if (!value || value <= 0) return setError('Digite quanto você aplicou.')
    const qty = quoted ? Number(quantity.replace(',', '.')) : undefined
    if (quoted && (!qty || qty <= 0)) return setError('Digite quantas cotas ou moedas comprou.')
    onSave({ date, amount: value, ...(qty ? { quantity: qty } : {}) })
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Aportar em {investment.name}</h2>

        <div className="field-row">
          <label className="field">
            <span>Quanto aplicou</span>
            <input
              className="input"
              autoFocus
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          {quoted && (
            <label className="field">
              <span>{investment.kind === 'crypto' ? 'Quantas moedas' : 'Quantas cotas'}</span>
              <input
                className="input"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
          )}
        </div>

        <div className="field">
          <span>Quando</span>
          <DatePicker value={date} onChange={setDate} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn">
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}
