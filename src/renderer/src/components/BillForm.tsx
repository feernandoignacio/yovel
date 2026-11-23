import { FormEvent, useState } from 'react'
import { Bill, BillDraft } from '../types'
import { todayISO } from '../utils/date'
import { parseAmount } from '../utils/money'

type Props = {
  bill?: Bill // quando vem preenchido, o formulário edita essa conta
  onSave: (draft: BillDraft, installments: number) => void
  onClose: () => void
}

const billCategories = [
  'Moradia',
  'Casa',
  'Transporte',
  'Dívidas',
  'Saúde',
  'Alimentação',
  'Educação',
  'Outros'
]

function amountToText(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

export function BillForm({ bill, onSave, onClose }: Props): React.JSX.Element {
  const editing = Boolean(bill)
  const [name, setName] = useState(bill?.name ?? '')
  const [amount, setAmount] = useState(bill ? amountToText(bill.amount) : '')
  const [dueDate, setDueDate] = useState(bill?.dueDate ?? todayISO())
  const [category, setCategory] = useState(bill?.category ?? billCategories[0])
  const [kind, setKind] = useState<'single' | 'recurring' | 'installments'>(
    bill?.recurring ? 'recurring' : 'single'
  )
  const [installments, setInstallments] = useState('2')
  const [error, setError] = useState('')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const value = parseAmount(amount)
    const parts = kind === 'installments' ? Number(installments) : 1

    if (!name.trim()) return setError('Dê um nome para a conta.')
    if (!value || value <= 0) return setError('Digite um valor maior que zero.')
    if (!dueDate) return setError('Escolha a data de vencimento.')
    if (!Number.isInteger(parts) || parts < 1 || parts > 120)
      return setError('Número de parcelas inválido.')

    onSave(
      { name: name.trim(), amount: value, dueDate, category, recurring: kind === 'recurring' },
      parts
    )
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{editing ? 'Editar conta' : 'Nova conta'}</h2>

        <label className="field">
          <span>Nome</span>
          <input
            className="input"
            autoFocus
            placeholder="Ex: Aluguel, Fatura do cartão"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>{kind === 'installments' ? 'Valor da parcela' : 'Valor'}</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className="field">
            <span>{kind === 'installments' ? 'Vencimento da 1ª parcela' : 'Vencimento'}</span>
            <input
              className="input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>Categoria</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {billCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>Tipo</span>
          <div className="toggle toggle-full">
            <button
              type="button"
              className={kind === 'single' ? 'active neutral' : ''}
              onClick={() => setKind('single')}
            >
              Única
            </button>
            <button
              type="button"
              className={kind === 'recurring' ? 'active neutral' : ''}
              onClick={() => setKind('recurring')}
            >
              Fixa todo mês
            </button>
            {!editing && (
              <button
                type="button"
                className={kind === 'installments' ? 'active neutral' : ''}
                onClick={() => setKind('installments')}
              >
                Parcelada
              </button>
            )}
          </div>
        </div>

        {kind === 'installments' && (
          <label className="field">
            <span>Quantas parcelas</span>
            <input
              className="input"
              type="number"
              min={2}
              max={120}
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </label>
        )}

        <p className="field-hint">
          {kind === 'recurring' &&
            'Quando você marcar como paga, a do mês seguinte é criada sozinha.'}
          {kind === 'installments' &&
            'Cria uma conta para cada parcela, uma por mês, a partir do vencimento escolhido.'}
        </p>

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
