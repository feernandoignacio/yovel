import { useEffect, useState } from 'react'
import { useData } from '../data/DataContext'
import { createEmptyData, createSampleData, isAppData } from '../data/sample'
import { CategoryEditor } from '../components/CategoryEditor'
import { Select } from '../components/Select'
import { DUE_SOON_DAYS } from '../utils/bills'

const days = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' }
]

const noticeOptions = [1, 2, 3, 5, 7, 10]

function dayLabel(days: number): string {
  return days === 1 ? '1 dia antes' : `${days} dias antes`
}

type Confirm = 'reset' | 'sample' | null
type Message = { type: 'success' | 'danger'; text: string } | null

export function SettingsPage(): React.JSX.Element {
  const { data, replaceData, setWorkDays, updateSettings } = useData()
  const { workDays } = data.settings
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [message, setMessage] = useState<Message>(null)
  const [version, setVersion] = useState('')
  const isWeb = window.api.platform === 'web'

  useEffect(() => {
    window.api.getVersion().then(setVersion)
  }, [])

  const toggleDay = (day: number): void => {
    const next = workDays.includes(day) ? workDays.filter((d) => d !== day) : [...workDays, day]
    // Precisa ter pelo menos um dia de trabalho para a meta funcionar
    if (next.length === 0) return
    setWorkDays(next)
  }

  const exportBackup = async (): Promise<void> => {
    const saved = await window.api.exportBackup(data)
    if (saved) setMessage({ type: 'success', text: 'Backup salvo.' })
  }

  const importBackup = async (): Promise<void> => {
    const backup = await window.api.importBackup()
    if (backup === null) return
    if (!isAppData(backup)) {
      setMessage({ type: 'danger', text: 'Esse arquivo não é um backup do Yovel.' })
      return
    }
    replaceData(backup)
    setMessage({ type: 'success', text: 'Backup restaurado.' })
  }

  const resetData = (): void => {
    // Mantém os ajustes (dias de trabalho e categorias)
    replaceData({ ...createEmptyData(workDays), settings: data.settings })
    setConfirm(null)
    setMessage({ type: 'success', text: 'Tudo zerado. Pode começar a cadastrar as suas contas.' })
  }

  const loadSample = (): void => {
    replaceData(createSampleData())
    setConfirm(null)
    setMessage({ type: 'success', text: 'Dados de exemplo carregados.' })
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Ajustes</h1>
        <p className="page-subtitle">
          Dias de trabalho, avisos, categorias, backup e dados do app.
        </p>
      </header>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <h2 className="section-title">Dias de trabalho</h2>
      <div className="settings-box">
        <p className="settings-text">
          A meta do dia é dividida só pelos dias marcados. Nos outros dias fica como folga.
        </p>
        <div className="days">
          {days.map((day) => (
            <button
              key={day.value}
              className={`day-chip ${workDays.includes(day.value) ? 'active' : ''}`}
              onClick={() => toggleDay(day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <h2 className="section-title">Avisos</h2>
      <div className="settings-box">
        <div className="settings-row">
          <p className="settings-text">
            {isWeb
              ? 'Com quantos dias de antecedência a conta fica amarela e entra no contador de vence em breve.'
              : 'Com quantos dias de antecedência a conta fica amarela e aparece o aviso do Windows de que vai vencer.'}
          </p>
          <div className="settings-select">
            <Select
              value={dayLabel(data.settings.dueSoonDays ?? DUE_SOON_DAYS)}
              options={noticeOptions.map(dayLabel)}
              onChange={(label) => updateSettings({ dueSoonDays: parseInt(label, 10) })}
            />
          </div>
        </div>
      </div>

      <h2 className="section-title">Investimentos</h2>
      <div className="settings-box">
        <p className="settings-text">
          As cotações de ações, fundos imobiliários e cripto vêm da brapi, que repassa os dados da
          B3. O plano gratuito atualiza de 30 em 30 minutos. Sem chave, só funcionam PETR4, VALE3,
          MGLU3 e ITUB4. Para os outros, crie uma conta grátis em{' '}
          <a href="https://brapi.dev/dashboard" target="_blank" rel="noreferrer">
            brapi.dev
          </a>
          , copie a chave (token) e cole aqui. Tesouro Selic e CDB não precisam de chave.
        </p>
        <label className="field">
          <span>Chave da brapi</span>
          <input
            className="input"
            type="password"
            placeholder="Cole a chave aqui"
            value={data.settings.brapiToken ?? ''}
            onChange={(e) => updateSettings({ brapiToken: e.target.value.trim() })}
          />
        </label>
      </div>

      <h2 className="section-title">Categorias</h2>
      <div className="settings-box">
        <p className="settings-text">
          Os nomes que aparecem na hora de lançar o que entrou e o que saiu. Clique no nome para
          renomear. Renomear também muda os lançamentos antigos daquela categoria.
        </p>
        <CategoryEditor type="income" title="Entradas" />
        <CategoryEditor type="expense" title="Saídas" />
      </div>

      <h2 className="section-title">Backup</h2>
      <div className="settings-box">
        <p className="settings-text">
          {isWeb
            ? 'Na versão online, seus dados ficam salvos só neste navegador, neste computador. Se os dados do navegador forem limpos, eles somem. Salve uma cópia de vez em quando para não perder nada.'
            : 'Seus dados ficam só neste computador. Salve uma cópia de vez em quando num pendrive ou na nuvem, para não perder nada se o PC der problema.'}
        </p>
        <div className="settings-actions">
          <button className="btn" onClick={exportBackup}>
            Salvar backup
          </button>
          <button className="btn btn-ghost" onClick={importBackup}>
            Restaurar backup
          </button>
        </div>
        <p className="field-hint">Restaurar troca todos os dados atuais pelos do arquivo.</p>
      </div>

      <h2 className="section-title">Dados</h2>
      <div className="settings-box settings-danger">
        <div className="settings-row">
          <div>
            <p className="bill-name">Começar do zero</p>
            <p className="settings-text">
              Apaga todas as contas, lançamentos e metas. Não dá para desfazer, então salve um
              backup antes se quiser guardar alguma coisa.
            </p>
          </div>
          {confirm === 'reset' ? (
            <div className="settings-actions">
              <button className="btn btn-danger" onClick={resetData}>
                Sim, apagar tudo
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button className="btn btn-danger-outline" onClick={() => setConfirm('reset')}>
              Apagar tudo
            </button>
          )}
        </div>

        <div className="settings-row">
          <div>
            <p className="bill-name">Carregar dados de exemplo</p>
            <p className="settings-text">
              Troca os dados atuais por contas e valores fictícios, para testar o app ou mostrar
              para alguém.
            </p>
          </div>
          {confirm === 'sample' ? (
            <div className="settings-actions">
              <button className="btn btn-danger" onClick={loadSample}>
                Sim, trocar
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button className="btn btn-ghost" onClick={() => setConfirm('sample')}>
              Carregar exemplo
            </button>
          )}
        </div>
      </div>
      <p className="app-version">
        Operação Yovel {version && `versão ${version}`}.{' '}
        {isWeb
          ? 'Versão online: sempre abre na versão mais nova.'
          : 'O app procura atualizações sozinho quando abre.'}
      </p>
    </section>
  )
}
