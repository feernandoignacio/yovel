import { useEffect, useState } from 'react'
import { useData } from '../data/DataContext'
import { createEmptyData, createSampleData, isAppData } from '../data/sample'

const days = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' }
]

type Confirm = 'reset' | 'sample' | null
type Message = { type: 'success' | 'danger'; text: string } | null

export function SettingsPage(): React.JSX.Element {
  const { data, replaceData, setWorkDays } = useData()
  const { workDays } = data.settings
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [message, setMessage] = useState<Message>(null)
  const [version, setVersion] = useState('')

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
    // Mantém os dias de trabalho escolhidos
    replaceData(createEmptyData(workDays))
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
        <p className="page-subtitle">Dias de trabalho, backup e dados do app.</p>
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

      <h2 className="section-title">Backup</h2>
      <div className="settings-box">
        <p className="settings-text">
          Seus dados ficam só neste computador. Salve uma cópia de vez em quando num pendrive ou na
          nuvem, para não perder nada se o PC der problema.
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
        Operação Yovel {version && `versão ${version}`}. O app procura atualizações sozinho quando
        abre.
      </p>
    </section>
  )
}
