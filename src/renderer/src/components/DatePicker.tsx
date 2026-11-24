import { useEffect, useRef, useState } from 'react'
import { addMonths, formatDate, parseISO, todayISO, toISO } from '../utils/date'

type Props = {
  value: string // AAAA-MM-DD, ou vazio quando ainda não tem data
  onChange: (value: string) => void
  min?: string
  placeholder?: string // texto quando está vazio
  clearLabel?: string // se tiver, mostra um botão para deixar sem data
}

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]
const weekLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Calendário com o visual do app, no lugar do calendário padrão do Windows
export function DatePicker({
  value,
  onChange,
  min,
  placeholder = 'Escolher data',
  clearLabel
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  // Mês que está aparecendo no calendário (sempre dia 01)
  // Sem data escolhida, o calendário abre no mês da data mínima ou no mês atual
  const initial = value || min || todayISO()
  const [month, setMonth] = useState(`${initial.slice(0, 7)}-01`)
  const ref = useRef<HTMLDivElement>(null)
  const today = todayISO()

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent): void => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onEsc = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const first = parseISO(month)
  const blanks = first.getDay()
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toISO(new Date(first.getFullYear(), first.getMonth(), i + 1))
    )
  ]

  const toggle = (): void => {
    if (!open) setMonth(`${initial.slice(0, 7)}-01`)
    setOpen(!open)
  }

  return (
    <div className="select" ref={ref}>
      <button
        type="button"
        className={`input select-trigger ${open ? 'open' : ''}`}
        onClick={toggle}
      >
        <span className={value ? '' : 'placeholder'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <svg className="select-arrow" viewBox="0 0 16 16" aria-hidden="true">
          <rect
            x="2"
            y="3"
            width="12"
            height="11"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      {open && (
        <div className="calendar">
          <div className="calendar-head">
            <button
              type="button"
              className="calendar-nav"
              onClick={() => setMonth(addMonths(month, -1))}
            >
              <svg viewBox="0 0 8 12" aria-hidden="true">
                <path d="M6.5 1l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <span>
              {monthNames[first.getMonth()]} {first.getFullYear()}
            </span>
            <button
              type="button"
              className="calendar-nav"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <svg viewBox="0 0 8 12" aria-hidden="true">
                <path d="M1.5 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>

          <div className="calendar-grid">
            {weekLetters.map((letter, i) => (
              <span key={i} className="calendar-week">
                {letter}
              </span>
            ))}
            {cells.map((day, i) =>
              day ? (
                <button
                  key={day}
                  type="button"
                  disabled={Boolean(min && day < min)}
                  className={`calendar-day ${day === value ? 'selected' : ''} ${day === today ? 'today' : ''}`}
                  onClick={() => {
                    onChange(day)
                    setOpen(false)
                  }}
                >
                  {parseISO(day).getDate()}
                </button>
              ) : (
                <span key={`blank-${i}`} />
              )
            )}
          </div>

          <button
            type="button"
            className="calendar-today"
            disabled={Boolean(min && today < min)}
            onClick={() => {
              onChange(today)
              setOpen(false)
            }}
          >
            Hoje
          </button>

          {clearLabel && value && (
            <button
              type="button"
              className="calendar-today calendar-clear"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
