import { useState } from 'react'
import { useData } from '../data/DataContext'
import { GoalForm } from '../components/GoalForm'
import { Goal, GoalDraft } from '../types'
import { billStatus } from '../utils/bills'
import { addMonths, daysUntil, formatDate, todayISO } from '../utils/date'
import { formatMoney, parseAmount, sum } from '../utils/money'
import { orderForPayoff, payoffDates, PayoffStrategy, perWorkday } from '../utils/plan'
import { DatePicker } from '../components/DatePicker'

type FormState = { goal?: Goal; initial?: Partial<GoalDraft> } | null

export function GoalsPage(): React.JSX.Element {
  const { data, addGoal, updateGoal, deleteGoal, addToGoal } = useData()
  const { workDays } = data.settings
  const today = todayISO()

  const [form, setForm] = useState<FormState>(null)
  const [depositFor, setDepositFor] = useState<string | null>(null)
  const [depositValue, setDepositValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [strategy, setStrategy] = useState<PayoffStrategy>('smallest')
  const [payoffDeadline, setPayoffDeadline] = useState(addMonths(today, 6))

  const goals = [...data.goals].sort((a, b) => a.deadline.localeCompare(b.deadline))

  // Plano das vencidas
  const overdue = data.bills.filter((b) => billStatus(b) === 'overdue')
  const overdueTotal = sum(overdue.map((b) => b.amount))
  const ordered = orderForPayoff(overdue, strategy)
  const payoffPerDay = perWorkday(overdueTotal, today, payoffDeadline, workDays)
  const dates = payoffDates(ordered, payoffPerDay, today, workDays)
  const hasPayoffGoal = data.goals.some((g) => g.name === 'Quitar contas vencidas')

  const saveDeposit = (id: string): void => {
    const value = parseAmount(depositValue)
    if (value > 0) addToGoal(id, value)
    setDepositFor(null)
    setDepositValue('')
  }

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>Metas</h1>
          <p className="page-subtitle">
            Objetivos fora das obrigações. Não é cobrança, é o que você quer conquistar.
          </p>
        </div>
        <button className="btn" onClick={() => setForm({})}>
          Nova meta
        </button>
      </header>

      {goals.length === 0 ? (
        <div className="empty-box">Nenhuma meta ainda. Cria a primeira no botão Nova meta.</div>
      ) : (
        <div className="goals">
          {goals.map((goal) => {
            const missing = Math.max(0, goal.target - goal.saved)
            const percent = Math.min(100, (goal.saved / goal.target) * 100)
            const perDay = perWorkday(missing, today, goal.deadline, workDays)
            const daysLeft = daysUntil(goal.deadline)
            const done = missing === 0

            return (
              <div key={goal.id} className={`goal-card ${done ? 'done' : ''}`}>
                <div className="goal-top">
                  <p className="bill-name">{goal.name}</p>
                  <p className="bill-meta">
                    até {formatDate(goal.deadline)}
                    {!done && daysLeft >= 0 && ` · faltam ${daysLeft} dias`}
                    {!done && daysLeft < 0 && ' · prazo passou'}
                  </p>
                </div>

                <p className="goal-values">
                  <strong>{formatMoney(goal.saved)}</strong> de {formatMoney(goal.target)}
                </p>
                <div className="progress">
                  <div
                    className={`progress-bar ${done ? 'done' : ''}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="card-hint">
                  {done
                    ? 'Meta alcançada.'
                    : daysLeft < 0
                      ? `Faltam ${formatMoney(missing)}. Ajuste o prazo para voltar a calcular.`
                      : `Faltam ${formatMoney(missing)}. Separe ${formatMoney(perDay)} por dia de trabalho.`}
                </p>

                {depositFor === goal.id ? (
                  <div className="goal-deposit">
                    <input
                      className="input"
                      autoFocus
                      inputMode="decimal"
                      placeholder="R$ 0,00"
                      value={depositValue}
                      onChange={(e) => setDepositValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveDeposit(goal.id)}
                    />
                    <button className="btn" onClick={() => saveDeposit(goal.id)}>
                      Guardar
                    </button>
                    <button className="btn btn-ghost" onClick={() => setDepositFor(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="goal-actions">
                    {!done && (
                      <button className="btn" onClick={() => setDepositFor(goal.id)}>
                        Guardar valor
                      </button>
                    )}
                    <button className="link" onClick={() => setForm({ goal })}>
                      Editar
                    </button>
                    {confirmDelete === goal.id ? (
                      <>
                        <button className="link link-danger" onClick={() => deleteGoal(goal.id)}>
                          Confirmar exclusão
                        </button>
                        <button className="link" onClick={() => setConfirmDelete(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button className="link" onClick={() => setConfirmDelete(goal.id)}>
                        Apagar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <h2 className="section-title">Plano para as vencidas</h2>

      {overdue.length === 0 ? (
        <div className="alert alert-success">Nenhuma conta vencida. Nada para planejar aqui.</div>
      ) : (
        <div className="payoff">
          <div className="payoff-controls">
            <div className="field">
              <span>Ordem</span>
              <div className="toggle">
                <button
                  className={strategy === 'smallest' ? 'active neutral' : ''}
                  onClick={() => setStrategy('smallest')}
                >
                  Menor valor primeiro
                </button>
                <button
                  className={strategy === 'oldest' ? 'active neutral' : ''}
                  onClick={() => setStrategy('oldest')}
                >
                  Mais antiga primeiro
                </button>
              </div>
            </div>

            <div className="field">
              <span>Quitar tudo até</span>
              <DatePicker value={payoffDeadline} min={today} onChange={setPayoffDeadline} />
            </div>

            <div className="payoff-summary">
              <p className="card-label">Separar por dia de trabalho</p>
              <p className="card-value">{formatMoney(payoffPerDay)}</p>
              <p className="card-hint">Total vencido: {formatMoney(overdueTotal)}</p>
            </div>
          </div>

          <p className="field-hint">
            {strategy === 'smallest'
              ? 'Menor primeiro: você tira contas da lista mais rápido, o que ajuda a manter o ritmo.'
              : 'Mais antiga primeiro: resolve antes as que estão há mais tempo atrasadas, que costumam ter mais juros e cobrança.'}
          </p>

          <div className="list">
            {ordered.map((bill, index) => (
              <div key={bill.id} className="payoff-row">
                <span className="payoff-index">{index + 1}</span>
                <div>
                  <p className="bill-name">{bill.name}</p>
                  <p className="bill-meta">venceu em {formatDate(bill.dueDate)}</p>
                </div>
                <p className="bill-amount">{formatMoney(bill.amount)}</p>
                <p className="payoff-date">
                  {dates[bill.id] ? `quitada até ${formatDate(dates[bill.id])}` : 'depois do prazo'}
                </p>
              </div>
            ))}
          </div>

          {!hasPayoffGoal && (
            <div className="payoff-cta">
              <p>
                Quer que esse valor entre na meta de objetivos da aba Hoje? Cria uma meta com o
                total vencido e esse prazo.
              </p>
              <button
                className="btn"
                onClick={() =>
                  setForm({
                    initial: {
                      name: 'Quitar contas vencidas',
                      target: overdueTotal,
                      saved: 0,
                      deadline: payoffDeadline
                    }
                  })
                }
              >
                Criar meta
              </button>
            </div>
          )}
        </div>
      )}

      {form && (
        <GoalForm
          goal={form.goal}
          initial={form.initial}
          onClose={() => setForm(null)}
          onSave={(draft) => {
            if (form.goal) updateGoal(form.goal.id, draft)
            else addGoal(draft)
            setForm(null)
          }}
        />
      )}
    </section>
  )
}
