import { useState } from 'react'
import { DayRow } from '../utils/report'
import { formatDate, parseISO } from '../utils/date'
import { formatMoney } from '../utils/money'

type Props = {
  rows: DayRow[]
}

const WIDTH = 900
const HEIGHT = 240
const PAD = { top: 16, right: 12, bottom: 28, left: 64 }
const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Valores "redondos" para as linhas de fundo do gráfico
function niceStep(range: number): number {
  const raw = range / 4
  const power = Math.pow(10, Math.floor(Math.log10(raw || 1)))
  const options = [1, 2, 2.5, 5, 10]
  return (options.find((o) => o * power >= raw) ?? 10) * power
}

// Gráfico de barras do saldo de cada dia, com a meta do dia marcada por um traço
export function DailyChart({ rows }: Props): React.JSX.Element {
  const [hover, setHover] = useState<number | null>(null)

  const values = rows.flatMap((r) => [r.net, r.target])
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  const step = niceStep(max - min || 100)
  const top = Math.ceil(max / step) * step || step
  const bottom = Math.floor(min / step) * step

  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const y = (v: number): number => PAD.top + ((top - v) / (top - bottom)) * plotH
  const slot = plotW / rows.length
  const barW = Math.min(36, slot - 4)

  const ticks: number[] = []
  for (let v = bottom; v <= top + 0.001; v += step) ticks.push(v)

  const showLabel = (i: number): boolean => rows.length <= 7 || i % 5 === 0 || i === rows.length - 1

  const hovered = hover !== null ? rows[hover] : null

  return (
    <div className="chart">
      <div className="chart-legend">
        <span>
          <i className="swatch swatch-positive" /> Saldo positivo
        </span>
        <span>
          <i className="swatch swatch-negative" /> Saldo negativo
        </span>
        <span>
          <i className="swatch-line" /> Meta do dia
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="chart-svg"
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className={t === 0 ? 'chart-zero' : 'chart-grid'}
            />
            <text x={PAD.left - 8} y={y(t) + 4} className="chart-axis" textAnchor="end">
              {formatMoney(t).replace(',00', '')}
            </text>
          </g>
        ))}

        {rows.map((row, i) => {
          const cx = PAD.left + slot * i + slot / 2
          const y0 = y(0)
          const y1 = y(row.net)
          const h = Math.max(Math.abs(y1 - y0), row.net !== 0 ? 2 : 0)
          const positive = row.net >= 0
          const date = parseISO(row.date)

          return (
            <g key={row.date}>
              {hover === i && (
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  className="chart-hover"
                />
              )}
              {row.net !== 0 && (
                <rect
                  x={cx - barW / 2}
                  y={positive ? y0 - h : y0}
                  width={barW}
                  height={h}
                  rx={3}
                  className={positive ? 'bar-positive' : 'bar-negative'}
                />
              )}
              {row.target > 0 && (
                <line
                  x1={cx - barW / 2 - 3}
                  x2={cx + barW / 2 + 3}
                  y1={y(row.target)}
                  y2={y(row.target)}
                  className="chart-target"
                />
              )}
              {showLabel(i) && (
                <text x={cx} y={HEIGHT - 8} className="chart-axis" textAnchor="middle">
                  {rows.length <= 7 ? weekDayNames[date.getDay()] : date.getDate()}
                </text>
              )}
              {/* Área invisível maior que a barra, para facilitar passar o mouse */}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            </g>
          )
        })}
      </svg>

      {hovered && hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((PAD.left + slot * hover + slot / 2) / WIDTH) * 100}%`
          }}
        >
          <p className="tooltip-title">
            {weekDayNames[parseISO(hovered.date).getDay()]}, {formatDate(hovered.date)}
          </p>
          <p>Entrou {formatMoney(hovered.income)}</p>
          <p>Saiu {formatMoney(hovered.expense)}</p>
          <p className={hovered.net > 0 ? 'positive' : hovered.net < 0 ? 'negative' : ''}>
            Saldo {formatMoney(hovered.net)}
          </p>
          <p className="tooltip-muted">
            {hovered.isWorkday ? `Meta ${formatMoney(hovered.target)}` : 'Folga'}
          </p>
        </div>
      )}
    </div>
  )
}
