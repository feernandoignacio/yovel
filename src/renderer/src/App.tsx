import { useState } from 'react'
import { Page, Sidebar } from './components/Sidebar'
import { useData } from './data/DataContext'
import { BillsPage } from './pages/BillsPage'
import { OverduePage } from './pages/OverduePage'
import { ComingSoon } from './pages/ComingSoon'
import { TodayPage } from './pages/TodayPage'
import { GoalsPage } from './pages/GoalsPage'
import { billStatus } from './utils/bills'

function App(): React.JSX.Element {
  const [page, setPage] = useState<Page>('today')
  const { data } = useData()

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
        {page === 'today' && <TodayPage />}
        {page === 'bills' && <BillsPage />}
        {page === 'overdue' && <OverduePage />}
        {page === 'goals' && <GoalsPage />}
        {page === 'reports' && (
          <ComingSoon title="Balanço" description="Resumo da semana e do mês, com gráficos." />
        )}
      </main>
    </div>
  )
}

export default App
