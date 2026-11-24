import { Change } from '../utils/investments'

type Props = {
  change: Change | null
  showPeriod?: boolean // escreve "na última hora" ou "hoje" do lado
}

function formatPercent(value: number): string {
  return `${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

// Setinha verde para cima quando subiu, vermelha para baixo quando desceu
export function ChangeBadge({ change, showPeriod = false }: Props): React.JSX.Element {
  if (!change) return <span className="change change-none">sem variação</span>

  const rounded = Math.round(change.percent * 100) / 100
  const direction = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat'
  const period = change.period === 'hour' ? 'na última hora' : 'hoje'

  return (
    <span className={`change change-${direction}`}>
      {direction !== 'flat' && (
        <svg viewBox="0 0 12 12" aria-hidden="true">
          {direction === 'up' ? (
            <path
              d="M6 10V2M2.5 5.5L6 2l3.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          ) : (
            <path
              d="M6 2v8M2.5 6.5L6 10l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          )}
        </svg>
      )}
      <span>{formatPercent(rounded)}</span>
      {showPeriod ? (
        <span className="change-period">{period}</span>
      ) : (
        change.period === 'day' && <span className="change-period change-period-small">hoje</span>
      )}
    </span>
  )
}
