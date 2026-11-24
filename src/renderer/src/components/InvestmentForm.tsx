import { FormEvent, useState } from 'react'
import { Contribution, Investment, InvestmentDraft, InvestmentKind } from '../types'
import { kindLabels, isQuoted } from '../utils/investments'
import { parseAmount } from '../utils/money'
import { formatDate, todayISO } from '../utils/date'
import { Select } from './Select'
import { DatePicker } from './DatePicker'

type Props = {
  investment?: Investment // quando vem preenchido, edita esse investimento
  onSave: (draft: InvestmentDraft, first: Omit<Contribution, 'id'> | null) => void
  onDelete?: () => void
  onClose: () => void
}

const kinds = Object.keys(kindLabels) as InvestmentKind[]

function amountToText(value?: number): string {
  return value === undefined ? '' : value.toFixed(2).replace('.', ',')
}

// Janela de novo investimento ou de edição
export function InvestmentForm({
  investment,
  onSave,
  onDelete,
  onClose
}: Props): React.JSX.Element {
  const editing = Boolean(investment)
  const [name, setName] = useState(investment?.name ?? '')
  const [kind, setKind] = useState<InvestmentKind>(investment?.kind ?? 'cdi')
  const [institution, setInstitution] = useState(investment?.institution ?? '')
  const [ticker, setTicker] = useState(investment?.ticker ?? '')
  const [cdiPercent, setCdiPercent] = useState(String(investment?.cdiPercent ?? 100))
  const [manualValue, setManualValue] = useState(amountToText(investment?.manualValue))
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(todayISO())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const quoted = isQuoted(kind)

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    if (!name.trim()) return setError('Dê um nome para o investimento.')
    if (quoted && !ticker.trim()) return setError('Digite o código, por exemplo PETR4 ou BTC.')
    const percent = Number(cdiPercent.replace(',', '.'))
    if (kind === 'cdi' && (!percent || percent <= 0)) return setError('Digite quanto rende do CDI.')

    let first: Omit<Contribution, 'id'> | null = null
    if (!editing) {
      const value = parseAmount(amount)
      if (!value || value <= 0) return setError('Digite quanto você aplicou.')
      const qty = quoted ? Number(quantity.replace(',', '.')) : undefined
      if (quoted && (!qty || qty <= 0)) return setError('Digite quantas cotas ou moedas comprou.')
      first = { date, amount: value, ...(qty ? { quantity: qty } : {}) }
    }

    const manual = kind === 'manual' && manualValue.trim() ? parseAmount(manualValue) : undefined
    if (manual !== undefined && (Number.isNaN(manual) || manual < 0))
      return setError('Valor atual inválido.')

    onSave(
      {
        name: name.trim(),
        kind,
        ...(institution.trim() ? { institution: institution.trim() } : {}),
        ...(quoted ? { ticker: ticker.trim().toUpperCase() } : {}),
        ...(kind === 'cdi' ? { cdiPercent: percent } : {}),
        ...(manual !== undefined
          ? {
              manualValue: manual,
              manualUpdatedAt:
                manual === investment?.manualValue ? investment?.manualUpdatedAt : todayISO()
            }
          : {})
      },
      first
    )
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{editing ? 'Editar investimento' : 'Novo investimento'}</h2>

        <label className="field">
          <span>Nome</span>
          <input
            className="input"
            autoFocus
            placeholder="Ex: Reserva de emergência"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="field-row">
          <div className="field">
            <span>Tipo</span>
            <Select
              value={kindLabels[kind]}
              options={kinds.map((k) => kindLabels[k])}
              onChange={(label) => setKind(kinds.find((k) => kindLabels[k] === label) ?? 'manual')}
            />
          </div>
          <label className="field">
            <span>Onde está (opcional)</span>
            <input
              className="input"
              placeholder="Banco ou corretora"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </label>
        </div>

        {quoted && (
          <label className="field">
            <span>Código</span>
            <input
              className="input"
              placeholder={
                kind === 'crypto' ? 'Ex: BTC' : kind === 'fii' ? 'Ex: MXRF11' : 'Ex: PETR4'
              }
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
            />
          </label>
        )}

        {kind === 'cdi' && (
          <label className="field">
            <span>Rende quantos % do CDI</span>
            <input
              className="input"
              inputMode="decimal"
              value={cdiPercent}
              onChange={(e) => setCdiPercent(e.target.value)}
            />
          </label>
        )}

        {kind === 'manual' && (
          <label className="field">
            <span>Valor atual (opcional)</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="Olhe no app do banco"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
            />
          </label>
        )}

        {!editing && (
          <div className="field-row">
            <label className="field">
              <span>Quanto aplicou</span>
              <input
                className="input"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            {quoted && (
              <label className="field">
                <span>{kind === 'crypto' ? 'Quantas moedas' : 'Quantas cotas'}</span>
                <input
                  className="input"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
            )}
            <div className="field">
              <span>Quando</span>
              <DatePicker value={date} onChange={setDate} />
            </div>
          </div>
        )}

        {editing && investment && investment.contributions.length > 0 && (
          <div className="field">
            <span>Aportes</span>
            <div className="contribution-list">
              {[...investment.contributions]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((c) => (
                  <p key={c.id}>
                    {formatDate(c.date)}: R$ {amountToText(c.amount)}
                    {c.quantity ? ` (${c.quantity.toLocaleString('pt-BR')} cotas)` : ''}
                  </p>
                ))}
            </div>
          </div>
        )}

        <p className="field-hint">
          {quoted &&
            'O valor é atualizado pela cotação, de 30 em 30 minutos, quando tiver internet.'}
          {kind === 'selic' &&
            'O valor é calculado pela taxa Selic de cada dia, publicada pelo Banco Central.'}
          {kind === 'cdi' &&
            'O valor é calculado pelo CDI de cada dia, publicado pelo Banco Central.'}
          {kind === 'manual' &&
            'Esse tipo não tem atualização automática. Atualize o valor de vez em quando.'}
        </p>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          {onDelete &&
            (confirmDelete ? (
              <button type="button" className="btn btn-danger modal-left" onClick={onDelete}>
                Sim, apagar
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger-outline modal-left"
                onClick={() => setConfirmDelete(true)}
              >
                Apagar
              </button>
            ))}
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
