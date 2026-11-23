import { useState } from 'react'
import { useData } from '../data/DataContext'
import { categoriesOf } from '../data/sample'
import { Entry } from '../types'

type Props = {
  type: Entry['type']
  title: string
}

// Lista de categorias que a pessoa pode renomear, apagar e criar
export function CategoryEditor({ type, title }: Props): React.JSX.Element {
  const { data, setCategories, renameCategory } = useData()
  const categories = categoriesOf(data.settings, type)
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<{ from: string; value: string } | null>(null)
  const [error, setError] = useState('')

  const exists = (name: string, except?: string): boolean =>
    categories.some((c) => c !== except && c.toLowerCase() === name.toLowerCase())

  const add = (): void => {
    const name = newName.trim()
    if (!name) return
    if (exists(name)) return setError('Essa categoria já existe.')
    setCategories(type, [...categories, name])
    setNewName('')
    setError('')
  }

  const saveRename = (): void => {
    if (!editing) return
    const name = editing.value.trim()
    if (name && name !== editing.from) {
      if (exists(name, editing.from)) return setError('Essa categoria já existe.')
      renameCategory(type, editing.from, name)
    }
    setEditing(null)
    setError('')
  }

  const remove = (name: string): void => {
    // Precisa sobrar pelo menos uma categoria
    if (categories.length === 1) return setError('Precisa ter pelo menos uma categoria.')
    setCategories(
      type,
      categories.filter((c) => c !== name)
    )
    setError('')
  }

  return (
    <div className="category-editor">
      <p className="bill-name">{title}</p>

      <div className="chips">
        {categories.map((category) =>
          editing?.from === category ? (
            <input
              key={category}
              className="input chip-input"
              autoFocus
              value={editing.value}
              onChange={(e) => setEditing({ from: category, value: e.target.value })}
              onBlur={saveRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename()
                if (e.key === 'Escape') setEditing(null)
              }}
            />
          ) : (
            <span key={category} className="chip">
              <button
                className="chip-name"
                title="Clique para renomear"
                onClick={() => setEditing({ from: category, value: category })}
              >
                {category}
              </button>
              <button className="chip-remove" title="Apagar" onClick={() => remove(category)}>
                <svg viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </span>
          )
        )}
      </div>

      <div className="chip-add">
        <input
          className="input"
          placeholder="Nova categoria"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn btn-ghost" onClick={add}>
          Adicionar
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
