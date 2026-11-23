import { useState } from 'react'
import { Page, Sidebar } from './components/Sidebar'
import { useData } from './data/DataContext'
import { BillsPage } from './pages/BillsPage'
import { OverduePage } from './pages/OverduePage'
import { ComingSoon } from './pages/ComingSoon'
import { billStatus } from './utils/bills'

function App(): React.JSX.Element {
  const [page, setPage] = useState<Page>('bills')
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
        {page === 'today' && (
          <ComingSoon
            title="Hoje"
            description="Entradas e saídas do dia, meta de obrigações e meta de objetivos."
          />
        )}
        {page === 'bills' && <BillsPage />}
        {page === 'overdue' && <OverduePage />}
        {page === 'goals' && (
          <ComingSoon
            title="Metas"
            description="Seus objetivos e quanto separar por dia para cada um."
          />
        )}
        {page === 'reports' && (
          <ComingSoon title="Balanço" description="Resumo da semana e do mês, com gráficos." />
        )}
      </main>
    </div>
  )
}

export default App
