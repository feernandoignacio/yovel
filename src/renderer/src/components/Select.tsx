import { KeyboardEvent, useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  options: string[]
  onChange: (value: string) => void
}

// Lista de opções com o visual do app, no lugar da lista padrão do Windows
export function Select({ value, options, onChange }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(Math.max(0, options.indexOf(value)))
  const ref = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const choose = (option: string): void => {
    onChange(option)
    setOpen(false)
  }

  const openList = (): void => {
    setHighlight(Math.max(0, options.indexOf(value)))
    setOpen(true)
  }

  // Setas, Enter e Esc funcionam como numa lista normal
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) return openList()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setHighlight((h) => (h + step + options.length) % options.length)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) choose(options[highlight])
      else openList()
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="select" ref={ref}>
      <button
        type="button"
        className={`input select-trigger ${open ? 'open' : ''}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span>{value}</span>
        <svg className="select-arrow" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      {open && (
        <ul className="select-menu" role="listbox">
          {options.map((option, index) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              className={`${option === value ? 'selected' : ''} ${index === highlight ? 'highlight' : ''}`}
              onMouseEnter={() => setHighlight(index)}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(option)
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
