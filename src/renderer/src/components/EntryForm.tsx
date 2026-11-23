import { FormEvent, useState } from 'react'
import { Entry } from '../types'

type Props = {
  date: string
  onAdd: (entry: Omit<Entry, 'id'>) => void
}

const categories = {
  income: ['Corridas', 'Gorjeta', 'Freela', 'Outros'],
  expense: ['Combustível', 'Alimentação', 'Manutenção do carro', 'Mercado', 'Outros']
}

// Aceita "150", "150,50" e "1.250,90"
function parseAmount(text: string): number {
  const clean = text.trim().replace(/\./g, '').replace(',', '.')
  const value = Number(clean)
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : NaN
}

export function EntryForm({ date, onAdd }: Props): React.JSX.Element {
  const [type, setType] = useState<Entry['type']>('income')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories.income[0])
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const changeType = (next: Entry['type']): void => {
    setType(next)
    setCategory(categories[next][0])
  }

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const value = parseAmount(amount)
    if (!value || value <= 0) {
      setError('Digite um valor maior que zero.')
      return
    }
    onAdd({ date, type, amount: value, category, description: description.trim() })
    setAmount('')
    setDescription('')
    setError('')
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <div className="toggle">
        <button
          type="button"
          className={type === 'income' ? 'active income' : ''}
          onClick={() => changeType('income')}
        >
          Entrada
        </button>
        <button
          type="button"
          className={type === 'expense' ? 'active expense' : ''}
          onClick={() => changeType('expense')}
        >
          Saída
        </button>
      </div>

      <input
        className="input input-amount"
        inputMode="decimal"
        placeholder="R$ 0,00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
        {categories[type].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      <input
        className="input input-grow"
        placeholder="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button className="btn" type="submit">
        Lançar
      </button>

      {error && <p className="form-error">{error}</p>}
    </form>
  )
}
