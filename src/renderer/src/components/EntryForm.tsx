import { FormEvent, useState } from 'react'
import { Entry } from '../types'
import { parseAmount } from '../utils/money'
import { Select } from './Select'
import { useData } from '../data/DataContext'
import { categoriesOf } from '../data/sample'

type Props = {
  date: string
  onAdd: (entry: Omit<Entry, 'id'>) => void
}

export function EntryForm({ date, onAdd }: Props): React.JSX.Element {
  const { data } = useData()
  // Categorias que a pessoa escolheu em Ajustes
  const categories = {
    income: categoriesOf(data.settings, 'income'),
    expense: categoriesOf(data.settings, 'expense')
  }
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
    // Se a categoria escolhida foi apagada em Ajustes, usa a primeira da lista
    const finalCategory = categories[type].includes(category) ? category : categories[type][0]
    onAdd({ date, type, amount: value, category: finalCategory, description: description.trim() })
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

      <Select
        value={categories[type].includes(category) ? category : categories[type][0]}
        options={categories[type]}
        onChange={setCategory}
      />

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
