import { useState } from 'react'
import { useData } from '../data/DataContext'
import { EntryForm } from '../components/EntryForm'
import { addDays, formatDate, parseISO, todayISO } from '../utils/date'
import { formatMoney } from '../utils/money'
import { entriesOn, goalsTargetFor, planFor } from '../utils/plan'

const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const longDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// Verde quando positivo, vermelho quando negativo
function signClass(value: number): string {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return ''
}

function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${formatMoney(value)}`
}

export function TodayPage(): React.JSX.Element {
  const { data, addEntry, removeEntry } = useData()
  const [date, setDate] = useState(todayISO())

  const today = todayISO()
  const plan = planFor(data, date)
  const dayEntries = entriesOn(data.entries, date)
  const goalsTarget = goalsTargetFor(data.goals, date, data.settings.workDays)

  // Semana de segunda a domingo da data escolhida
  const weekDay = parseISO(date).getDay()
  const monday = addDays(date, weekDay === 0 ? -6 : 1 - weekDay)
  const week = Array.from({ length: 7 }, (_, i) => planFor(data, addDays(monday, i)))

  const progress = plan.target > 0 ? Math.min(100, (plan.totals.net / plan.target) * 100) : 0
  const title =
    date === today ? 'Hoje' : `${longDayNames[parseISO(date).getDay()]}, ${formatDate(date)}`

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>{title}</h1>
          <p className="page-subtitle">
            {date === today ? formatDate(date) : 'Você está vendo outro dia.'}
          </p>
        </div>
        <div className="day-nav">
          <button className="btn btn-ghost" onClick={() => setDate(addDays(date, -1))}>
            Dia anterior
          </button>
          {date !== today && (
            <button className="btn btn-ghost" onClick={() => setDate(today)}>
              Hoje
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setDate(addDays(date, 1))}>
            Próximo dia
          </button>
        </div>
      </header>

      {data.bills.length === 0 && data.entries.length === 0 && (
        <div className="alert alert-warning">
          Bem-vindo ao Yovel. Comece cadastrando suas contas em Contas em dia, para o app calcular a
          sua meta do dia. Se quiser ver como funciona antes, carregue os dados de exemplo em
          Ajustes.
        </div>
      )}

      {!plan.isWorkday && (
        <div className="alert alert-success">
          Dia de folga. Sem meta hoje, mas dá para lançar o que entrou e saiu.
        </div>
      )}

      <div className="cards">
        <div className="card">
          <p className="card-label">Meta de obrigações</p>
          <p className="card-value">{formatMoney(plan.target)}</p>
          <div className="progress">
            <div
              className={`progress-bar ${plan.difference >= 0 ? 'done' : ''}`}
              style={{ width: `${Math.max(0, progress)}%` }}
            />
          </div>
          <p className="card-hint">
            {plan.target === 0
              ? 'Nada a cumprir neste dia.'
              : plan.difference >= 0
                ? 'Meta batida.'
                : `Faltam ${formatMoney(-plan.difference)}`}
          </p>
        </div>

        <div className="card">
          <p className="card-label">Saldo do dia</p>
          <p className={`card-value ${signClass(plan.totals.net)}`}>{signed(plan.totals.net)}</p>
          <p className="card-hint">
            Entrou {formatMoney(plan.totals.income)} · Saiu {formatMoney(plan.totals.expense)}
          </p>
        </div>

        <div className="card card-soft">
          <p className="card-label">Meta de objetivos</p>
          <p className="card-value">{formatMoney(goalsTarget)}</p>
          <p className="card-hint">
            {data.goals.length === 0
              ? 'Sem objetivos ainda. Vem na aba Metas.'
              : `Já foi para os objetivos: ${formatMoney(Math.min(plan.extra, goalsTarget))}`}
          </p>
        </div>
      </div>

      {plan.target > 0 && dayEntries.length > 0 && plan.nextTarget !== null && (
        <div className={`alert ${plan.difference >= 0 ? 'alert-success' : 'alert-warning'}`}>
          {plan.difference >= 0
            ? `Passou ${formatMoney(plan.difference)} da meta. Se fechar o dia assim, a meta dos próximos dias cai para ${formatMoney(plan.nextTarget)}.`
            : `Se fechar o dia assim, os ${formatMoney(-plan.difference)} que faltaram vão ser divididos nos próximos dias e a meta sobe para ${formatMoney(plan.nextTarget)}.`}
        </div>
      )}

      <h2 className="section-title">Lançar</h2>
      <EntryForm date={date} onAdd={addEntry} />

      <h2 className="section-title">Lançamentos do dia</h2>
      <div className="list">
        {dayEntries.length === 0 ? (
          <p className="empty">Nada lançado neste dia ainda.</p>
        ) : (
          dayEntries.map((entry) => (
            <div key={entry.id} className="entry-row">
              <span className={`entry-type ${entry.type}`}>
                {entry.type === 'income' ? 'Entrada' : 'Saída'}
              </span>
              <div>
                <p className="bill-name">{entry.category}</p>
                {entry.description && <p className="bill-meta">{entry.description}</p>}
              </div>
              <p className={`bill-amount ${entry.type === 'income' ? 'positive' : 'negative'}`}>
                {entry.type === 'income' ? '+' : '-'}
                {formatMoney(entry.amount)}
              </p>
              <button className="btn btn-ghost" onClick={() => removeEntry(entry.id)}>
                Apagar
              </button>
            </div>
          ))
        )}
      </div>

      <h2 className="section-title">Semana</h2>
      <div className="week">
        {week.map((day) => {
          const isFuture = day.date > today
          const hasEntries = entriesOn(data.entries, day.date).length > 0
          return (
            <button
              key={day.date}
              className={`week-day ${day.date === date ? 'selected' : ''} ${!day.isWorkday ? 'off' : ''}`}
              onClick={() => setDate(day.date)}
            >
              <span className="week-name">{weekDayNames[parseISO(day.date).getDay()]}</span>
              <span className="week-date">{formatDate(day.date).slice(0, 5)}</span>
              {!day.isWorkday ? (
                <span className="week-value">Folga</span>
              ) : isFuture || !hasEntries ? (
                <span className="week-value">Meta {formatMoney(day.target)}</span>
              ) : (
                <span className={`week-value ${signClass(day.difference)}`}>
                  {signed(day.difference)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="plan-note">
        Contas deste mês: {formatMoney(plan.monthObligations)}. Já sobrou nos dias anteriores:{' '}
        {formatMoney(plan.coveredBefore)}. Falta juntar {formatMoney(plan.remaining)} em{' '}
        {plan.workdaysLeft} {plan.workdaysLeft === 1 ? 'dia de trabalho' : 'dias de trabalho'}.
        Contas vencidas de meses anteriores entram no plano da aba Metas.
      </p>
    </section>
  )
}
