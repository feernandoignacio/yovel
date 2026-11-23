import logo from '../assets/rign-logo.svg'

export type Page = 'today' | 'bills' | 'overdue' | 'goals' | 'reports' | 'settings'

type Props = {
  current: Page
  onChange: (page: Page) => void
  dueSoonCount: number
  overdueCount: number
}

const items: { page: Page; label: string }[] = [
  { page: 'today', label: 'Hoje' },
  { page: 'bills', label: 'Contas em dia' },
  { page: 'overdue', label: 'Vencidas' },
  { page: 'goals', label: 'Metas' },
  { page: 'reports', label: 'Balanço' }
]

export function Sidebar({
  current,
  onChange,
  dueSoonCount,
  overdueCount
}: Props): React.JSX.Element {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={logo} alt="Rign Studio" className="brand-logo" />
        <span className="brand-line" />
        <p className="brand-name">Operação Yovel</p>
      </div>

      <nav className="nav">
        {items.map((item) => {
          // Contador ao lado do menu: amarelo para "vence em breve", vermelho para vencidas
          const badge =
            item.page === 'bills' && dueSoonCount > 0 ? (
              <span className="badge badge-warning">{dueSoonCount}</span>
            ) : item.page === 'overdue' && overdueCount > 0 ? (
              <span className="badge badge-danger">{overdueCount}</span>
            ) : null

          return (
            <button
              key={item.page}
              className={`nav-item ${current === item.page ? 'active' : ''}`}
              onClick={() => onChange(item.page)}
            >
              <span>{item.label}</span>
              {badge}
            </button>
          )
        })}
      </nav>

      <button
        className={`nav-item nav-settings ${current === 'settings' ? 'active' : ''}`}
        onClick={() => onChange('settings')}
      >
        <span>Ajustes</span>
      </button>

      <p className="sidebar-footer">por Rign Studio</p>
    </aside>
  )
}
