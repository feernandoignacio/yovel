import { FormEvent, useState } from 'react'
import { Entry } from '../types'
import { useData } from '../data/DataContext'
import { categoriesOf } from '../data/sample'
import { parseAmount } from '../utils/money'
import { Select } from './Select'
import { DatePicker } from './DatePicker'

type Props = {
  entry: Entry
  onSave: (entry: Omit<Entry, 'id'>) => void
  onClose: () => void
}

// Janela para corrigir um lançamento já feito
export function EntryEditForm({ entry, onSave, onClose }: Props): React.JSX.Element {
  const { data } = useData()
  const [type, setType] = useState<Entry['type']>(entry.type)
  const [amount, setAmount] = useState(entry.amount.toFixed(2).replace('.', ','))
  const [category, setCategory] = useState(entry.category)
  const [description, setDescription] = useState(entry.description)
  const [date, setDate] = useState(entry.date)
  const [error, setError] = useState('')

  // Mantém a categoria antiga na lista, mesmo que tenha sido apagada em Ajustes
  const base = categoriesOf(data.settings, type)
  const options =
    type === entry.type && !base.includes(entry.category) ? [...base, entry.category] : base
  const currentCategory = options.includes(category) ? category : options[0]

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const value = parseAmount(amount)
    if (!value || value <= 0) return setError('Digite um valor maior que zero.')
    onSave({
      type,
      amount: value,
      category: currentCategory,
      description: description.trim(),
      date
    })
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Editar lançamento</h2>

        <div className="field">
          <span>Tipo</span>
          <div className="toggle toggle-full">
            <button
              type="button"
              className={type === 'income' ? 'active income' : ''}
              onClick={() => setType('income')}
            >
              Entrada
            </button>
            <button
              type="button"
              className={type === 'expense' ? 'active expense' : ''}
              onClick={() => setType('expense')}
            >
              Saída
            </button>
          </div>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Valor</span>
            <input
              className="input"
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <div className="field">
            <span>Dia</span>
            <DatePicker value={date} onChange={setDate} />
          </div>
        </div>

        <div className="field">
          <span>Categoria</span>
          <Select value={currentCategory} options={options} onChange={setCategory} />
        </div>

        <label className="field">
          <span>Descrição</span>
          <input
            className="input"
            placeholder="Opcional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

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
