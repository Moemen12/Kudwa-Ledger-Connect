import { AppShell } from '@/presentation/components/shared/AppShell'
import { LedgerReportScreen } from '@/presentation/features/ledger/components/LedgerReportScreen'

export function App() {
  return (
    <AppShell>
      <LedgerReportScreen />
    </AppShell>
  )
}
