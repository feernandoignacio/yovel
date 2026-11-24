import { useState } from 'react'
import { useData } from '../data/DataContext'
import { useMarketRefresh } from '../data/useMarketRefresh'
import { InvestmentForm } from '../components/InvestmentForm'
import { ContributionForm } from '../components/ContributionForm'
import { ChangeBadge } from '../components/ChangeBadge'
import { Simulator } from '../components/Simulator'
import { Investment } from '../types'
import { billStatus } from '../utils/bills'
import { formatDate } from '../utils/date'
import { formatMoney, sum } from '../utils/money'
import {
  appliedOf,
  changeOf,
  isQuoted,
  kindLabels,
  quantityOf,
  sourceLabels,
  summarize,
  valueOf
} from '../utils/investments'

function time(at?: number): string {
  if (!at) return ''
  return new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function InvestmentsPage(): React.JSX.Element {
  const { data, addInvestment, updateInvestment, deleteInvestment, addContribution } = useData()
  const { loading, refresh } = useMarketRefresh()
  const [form, setForm] = useState<{ investment?: Investment } | null>(null)
  const [contributeTo, setContributeTo] = useState<Investment | null>(null)

  const investments = data.investments ?? []
  const market = data.market
  const summary = summarize(investments, market)
  const overdue = data.bills.filter((b) => billStatus(b) === 'overdue')
  const overdueTotal = sum(overdue.map((b) => b.amount))
  const hasQuoted = investments.some((i) => isQuoted(i.kind))
  const lastUpdate = Math.max(market?.quotesUpdatedAt ?? 0, market?.ratesUpdatedAt ?? 0)
  const nextUpdate = market?.quotesUpdatedAt ? market.quotesUpdatedAt + 30 * 60 * 1000 : 0

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>Investimentos</h1>
          <p className="page-subtitle">Acompanhe o que você aplicou e simule quanto pode render.</p>
        </div>
        <button className="btn" onClick={() => setForm({})}>
          Novo investimento
        </button>
      </header>

      <div className="notes">
        <p className="note">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M1.5 6a9.5 9.5 0 0 1 13 0M3.8 8.6a6 6 0 0 1 8.4 0M6.1 11.1a2.6 2.6 0 0 1 3.8 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <circle cx="8" cy="13.4" r="1" fill="currentColor" />
          </svg>
          O app passa a precisar de internet só para essa parte. Sem conexão, mostra o último valor
          salvo.
        </p>
        {overdue.length > 0 && (
          <p className="note">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M8 7.2v4M8 4.8v.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Você tem{' '}
            {overdue.length === 1 ? '1 conta vencida' : `${overdue.length} contas vencidas`} (
            {formatMoney(overdueTotal)}). Juros de atraso costumam ser maiores que o rendimento de
            um investimento.
          </p>
        )}
        {market?.error && <p className="note note-warning">{market.error}</p>}
      </div>

      {investments.length === 0 ? (
        <div className="empty-box">
          Nenhum investimento ainda. Quando fizer o primeiro, cadastre no botão Novo investimento.
          Enquanto isso, o simulador aqui embaixo ajuda a planejar.
        </div>
      ) : (
        <div className="portfolio">
          <div className="portfolio-head">
            <div>
              <p className="card-label">Investido agora</p>
              <p className="portfolio-total">{formatMoney(summary.value)}</p>
              {summary.hourChange !== null && (
                <ChangeBadge change={{ percent: summary.hourChange, period: 'hour' }} showPeriod />
              )}
            </div>
            <div className="portfolio-side">
              <p>
                Você aplicou <strong>{formatMoney(summary.applied)}</strong>
              </p>
              <p>
                Rendeu desde o início{' '}
                <strong className={summary.profit >= 0 ? 'positive' : 'negative'}>
                  {summary.profit >= 0 ? '+' : '-'}
                  {formatMoney(Math.abs(summary.profit))} (
                  {summary.profitPercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)
                </strong>
              </p>
              {lastUpdate > 0 && (
                <p className="portfolio-time">
                  Atualizado às {time(lastUpdate)}
                  {hasQuoted && nextUpdate > 0 && ` · próxima às ${time(nextUpdate)}`}
                </p>
              )}
              <button className="link" disabled={loading} onClick={() => refresh()}>
                {loading ? 'Atualizando...' : 'Atualizar agora'}
              </button>
            </div>
          </div>

          <div className="portfolio-list">
            {investments.map((investment) => {
              const { value, missingQuote } = valueOf(investment, market)
              const applied = appliedOf(investment)
              const detail = [
                kindLabels[investment.kind],
                investment.institution,
                isQuoted(investment.kind)
                  ? `${investment.ticker} · ${quantityOf(investment).toLocaleString('pt-BR')} ${investment.kind === 'crypto' ? 'moedas' : 'cotas'}`
                  : investment.kind === 'cdi'
                    ? `${investment.cdiPercent ?? 100}% do CDI`
                    : null,
                investment.kind === 'manual' && investment.manualUpdatedAt
                  ? `atualizado em ${formatDate(investment.manualUpdatedAt)}`
                  : sourceLabels[investment.kind]
              ]
                .filter(Boolean)
                .join(' · ')

              return (
                <div key={investment.id} className="portfolio-row">
                  <button className="portfolio-name" onClick={() => setForm({ investment })}>
                    <span className="bill-name">{investment.name}</span>
                    <span className="bill-meta">{detail}</span>
                  </button>
                  <div className="portfolio-value">
                    <strong>{formatMoney(value)}</strong>
                    <span className={value - applied >= 0 ? 'positive' : 'negative'}>
                      {missingQuote
                        ? 'sem cotação ainda'
                        : `${value - applied >= 0 ? '+' : '-'}${formatMoney(Math.abs(value - applied))}`}
                    </span>
                  </div>
                  <ChangeBadge change={changeOf(investment, market)} />
                  <button className="link" onClick={() => setContributeTo(investment)}>
                    Aportar
                  </button>
                </div>
              )
            })}
          </div>

          <p className="plan-info">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M8 7.2v4M8 4.8v.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>
              Os valores calculados são uma estimativa. O valor oficial é sempre o que aparece no
              app do banco.
            </span>
          </p>
        </div>
      )}

      <h2 className="section-title">Simulador</h2>
      <Simulator />

      <div className="plan-note">
        <p>Como cada tipo se atualiza:</p>
        <ul>
          <li>Ação, fundo imobiliário e cripto: pela cotação da brapi, de 30 em 30 minutos.</li>
          <li>
            Tesouro Selic e CDB/LCI/LCA: calculados pela taxa do dia que o Banco Central publica. A
            setinha mostra o rendimento do dia, com &quot;hoje&quot; embaixo.
          </li>
          <li>Outro: valor atualizado na mão.</li>
        </ul>
      </div>

      {form && (
        <InvestmentForm
          investment={form.investment}
          onClose={() => setForm(null)}
          onDelete={
            form.investment
              ? () => {
                  deleteInvestment(form.investment!.id)
                  setForm(null)
                }
              : undefined
          }
          onSave={(draft, first) => {
            if (form.investment) updateInvestment(form.investment.id, draft)
            else addInvestment(draft, first)
            setForm(null)
            // Busca a cotação ou a taxa do investimento novo logo em seguida
            setTimeout(() => refresh(), 300)
          }}
        />
      )}

      {contributeTo && (
        <ContributionForm
          investment={contributeTo}
          onClose={() => setContributeTo(null)}
          onSave={(contribution) => {
            addContribution(contributeTo.id, contribution)
            setContributeTo(null)
          }}
        />
      )}
    </section>
  )
}
