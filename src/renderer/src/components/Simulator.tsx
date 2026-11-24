import { useState } from 'react'
import { parseAmount, formatMoney } from '../utils/money'
import { simulate } from '../utils/investments'

const WIDTH = 900
const HEIGHT = 220
const PAD = { top: 14, right: 12, bottom: 28, left: 64 }

function compact(value: number): string {
  if (value >= 1000000)
    return `${(value / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (value >= 1000) return `${Math.round(value / 1000)} mil`
  return String(Math.round(value))
}

// Simulador de juros compostos com aporte mensal e taxa fixa
export function Simulator(): React.JSX.Element {
  const [monthly, setMonthly] = useState('300,00')
  const [rate, setRate] = useState('10')
  const [years, setYears] = useState('5')

  const monthlyValue = parseAmount(monthly) || 0
  const rateValue = Number(rate.replace(',', '.')) || 0
  const yearsValue = Math.min(40, Math.max(1, Math.round(Number(years) || 1)))
  const rows = simulate(monthlyValue, rateValue, yearsValue)
  const last = rows[rows.length - 1] ?? { contributed: 0, total: 0 }
  const interest = Math.max(0, last.total - last.contributed)

  const max = Math.max(1, ...rows.map((r) => r.total))
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const y = (v: number): number => PAD.top + plotH - (v / max) * plotH
  const slot = plotW / Math.max(1, rows.length)
  const barW = Math.min(48, slot * 0.6)
  const showLabel = (i: number): boolean => rows.length <= 10 || (i + 1) % 5 === 0 || i === 0

  return (
    <div className="simulator">
      <div className="simulator-inputs">
        <label className="field">
          <span>Por mês</span>
          <input
            className="input"
            inputMode="decimal"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Taxa ao ano (%)</span>
          <input
            className="input"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Por quantos anos</span>
          <input
            className="input"
            inputMode="numeric"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </label>
        <div className="simulator-result">
          <p className="card-label">No fim</p>
          <p className="card-value">{formatMoney(last.total)}</p>
          <p className="card-hint">
            {formatMoney(last.contributed)} seus + {formatMoney(interest)} de juros
          </p>
        </div>
      </div>

      <div className="chart-legend">
        <span>
          <i className="swatch swatch-stone" /> Seu dinheiro
        </span>
        <span>
          <i className="swatch swatch-mustard" /> Juros
        </span>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="chart-svg">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(max * f)}
              y2={y(max * f)}
              className={f === 0 ? 'chart-zero' : 'chart-grid'}
            />
            <text x={PAD.left - 8} y={y(max * f) + 4} className="chart-axis" textAnchor="end">
              {compact(max * f)}
            </text>
          </g>
        ))}
        {rows.map((row, i) => {
          const cx = PAD.left + slot * i + slot / 2
          const contributedTop = y(row.contributed)
          const totalTop = y(row.total)
          return (
            <g key={row.year}>
              <title>
                {`Ano ${row.year}: ${formatMoney(row.total)} (${formatMoney(row.contributed)} seus)`}
              </title>
              <rect
                x={cx - barW / 2}
                y={contributedTop}
                width={barW}
                height={Math.max(0, y(0) - contributedTop)}
                className="bar-stone"
              />
              <rect
                x={cx - barW / 2}
                y={totalTop}
                width={barW}
                height={Math.max(0, contributedTop - totalTop - 2)}
                rx={3}
                className="bar-mustard"
              />
              {showLabel(i) && (
                <text x={cx} y={HEIGHT - 8} className="chart-axis" textAnchor="middle">
                  Ano {row.year}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <p className="field-hint">
        Simulação com taxa fixa, só para ter uma ideia. Não é promessa de rendimento.
      </p>
    </div>
  )
}
