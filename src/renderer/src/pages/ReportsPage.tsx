import { useState } from 'react'
import { useData } from '../data/DataContext'
import { DailyChart } from '../components/DailyChart'
import { todayISO } from '../utils/date'
import { formatMoney } from '../utils/money'
import {
  dayRows,
  expensesByCategory,
  Period,
  rangeFor,
  shiftAnchor,
  summaryFor
} from '../utils/report'

export function ReportsPage(): React.JSX.Element {
  const { data } = useData()
  const today = todayISO()
  const [period, setPeriod] = useState<Period>('week')
  const [anchor, setAnchor] = useState(today)

  const range = rangeFor(period, anchor)
  const rows = dayRows(data, range)
  const summary = summaryFor(data, range)
  const categories = expensesByCategory(data, range)
  const biggest = categories[0]?.amount ?? 0

  // Só conta dias de trabalho que já passaram ou são hoje
  const workedDays = rows.filter((r) => r.isWorkday && r.date <= today)
  const hitDays = workedDays.filter((r) => r.hitTarget).length
  const isCurrent = range.start <= today && today <= range.end

  const saldoClass = summary.net > 0 ? 'positive' : summary.net < 0 ? 'negative' : ''

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>Balanço</h1>
          <p className="page-subtitle">{range.label}</p>
        </div>
        <div className="day-nav">
          <div className="toggle">
            <button
              className={period === 'week' ? 'active neutral' : ''}
              onClick={() => setPeriod('week')}
            >
              Semana
            </button>
            <button
              className={period === 'month' ? 'active neutral' : ''}
              onClick={() => setPeriod('month')}
            >
              Mês
            </button>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => setAnchor(shiftAnchor(period, anchor, -1))}
          >
            Anterior
          </button>
          {!isCurrent && (
            <button className="btn btn-ghost" onClick={() => setAnchor(today)}>
              Atual
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => setAnchor(shiftAnchor(period, anchor, 1))}
          >
            Próximo
          </button>
        </div>
      </header>

      <div className="cards cards-4">
        <div className="card">
          <p className="card-label">Entrou</p>
          <p className="card-value">{formatMoney(summary.income)}</p>
        </div>
        <div className="card">
          <p className="card-label">Saiu</p>
          <p className="card-value">{formatMoney(summary.expense)}</p>
        </div>
        <div className="card">
          <p className="card-label">Saldo</p>
          <p className={`card-value ${saldoClass}`}>
            {summary.net > 0 ? '+' : ''}
            {formatMoney(summary.net)}
          </p>
        </div>
        <div className="card">
          <p className="card-label">Meta batida</p>
          <p className="card-value">
            {hitDays} de {workedDays.length}
          </p>
          <p className="card-hint">dias de trabalho</p>
        </div>
      </div>

      <h2 className="section-title">Saldo por dia</h2>
      <DailyChart rows={rows} />

      <div className="reports-grid">
        <div>
          <h2 className="section-title">Para onde foi o dinheiro</h2>
          {categories.length === 0 ? (
            <p className="empty">Nenhuma saída lançada neste período.</p>
          ) : (
            <div className="category-list">
              {categories.map((c) => (
                <div key={c.category} className="category-row">
                  <div className="category-head">
                    <span>{c.category}</span>
                    <strong>{formatMoney(c.amount)}</strong>
                  </div>
                  <div className="category-track">
                    <div
                      className="category-bar"
                      style={{ width: `${(c.amount / biggest) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="section-title">Contas pagas</h2>
          <div className="card">
            <p className="card-value">{formatMoney(summary.paidBillsTotal)}</p>
            <p className="card-hint">
              {summary.paidBillsCount === 1
                ? '1 conta paga neste período'
                : `${summary.paidBillsCount} contas pagas neste período`}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
