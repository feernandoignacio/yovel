import { FormEvent, useState } from 'react'
import { Goal, GoalDraft } from '../types'
import { addMonths, todayISO } from '../utils/date'
import { parseAmount } from '../utils/money'

type Props = {
  goal?: Goal // quando vem preenchido, edita essa meta
  initial?: Partial<GoalDraft> // valores iniciais para uma meta nova
  onSave: (draft: GoalDraft) => void
  onClose: () => void
}

function amountToText(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

export function GoalForm({ goal, initial, onSave, onClose }: Props): React.JSX.Element {
  const start = goal ?? initial
  const [name, setName] = useState(start?.name ?? '')
  const [target, setTarget] = useState(start?.target ? amountToText(start.target) : '')
  const [saved, setSaved] = useState(start?.saved ? amountToText(start.saved) : '')
  const [deadline, setDeadline] = useState(start?.deadline ?? addMonths(todayISO(), 3))
  const [error, setError] = useState('')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const targetValue = parseAmount(target)
    const savedValue = saved.trim() ? parseAmount(saved) : 0

    if (!name.trim()) return setError('Dê um nome para a meta.')
    if (!targetValue || targetValue <= 0) return setError('Digite o valor da meta.')
    if (Number.isNaN(savedValue) || savedValue < 0) return setError('Valor guardado inválido.')
    if (!deadline || deadline < todayISO()) return setError('O prazo precisa ser hoje ou depois.')

    onSave({ name: name.trim(), target: targetValue, saved: savedValue, deadline })
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{goal ? 'Editar meta' : 'Nova meta'}</h2>

        <label className="field">
          <span>Nome</span>
          <input
            className="input"
            autoFocus
            placeholder="Ex: Reserva de emergência, Pneus novos"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Valor da meta</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Já guardado</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={saved}
              onChange={(e) => setSaved(e.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>Prazo</span>
          <input
            className="input"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>

        <p className="field-hint">
          O que faltar é dividido pelos dias de trabalho até o prazo e entra na meta de objetivos da
          aba Hoje.
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
