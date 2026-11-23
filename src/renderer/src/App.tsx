import { useEffect, useState } from 'react'
import { Page, Sidebar } from './components/Sidebar'
import { useData } from './data/DataContext'
import { BillsPage } from './pages/BillsPage'
import { OverduePage } from './pages/OverduePage'
import { TodayPage } from './pages/TodayPage'
import { GoalsPage } from './pages/GoalsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { billStatus } from './utils/bills'

function App(): React.JSX.Element {
  const [page, setPage] = useState<Page>('today')
  const { data } = useData()

  // Clique num aviso do Windows abre a aba da conta (Contas em dia ou Vencidas)
  useEffect(() => {
    return window.api.onNavigate((target) => {
      if (target === 'bills' || target === 'overdue') setPage(target)
    })
  }, [])

  const dueSoonCount = data.bills.filter((b) => billStatus(b) === 'dueSoon').length
  const overdueCount = data.bills.filter((b) => billStatus(b) === 'overdue').length

  return (
    <div className="layout">
      <Sidebar
        current={page}
        onChange={setPage}
        dueSoonCount={dueSoonCount}
        overdueCount={overdueCount}
      />

      <main className="content">
        {/* Aviso enquanto o app estiver com os dados de exemplo */}
        {data.sample && page !== 'settings' && (
          <div className="alert alert-warning sample-banner">
            <span>
              Você está vendo dados de exemplo. Quando quiser usar com os seus, comece do zero em
              Ajustes.
            </span>
            <button className="btn" onClick={() => setPage('settings')}>
              Ir para Ajustes
            </button>
          </div>
        )}

        {page === 'today' && <TodayPage />}
        {page === 'bills' && <BillsPage />}
        {page === 'overdue' && <OverduePage />}
        {page === 'goals' && <GoalsPage />}
        {page === 'reports' && <ReportsPage />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}

export default App
