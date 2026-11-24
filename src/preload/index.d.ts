import { ElectronAPI } from '@electron-toolkit/preload'

type UpdateStatus =
  | { state: 'idle' }
  | { state: 'downloading'; version: string }
  | { state: 'ready'; version: string }

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      loadData: () => Promise<unknown>
      saveData: (data: unknown) => Promise<void>
      exportBackup: (data: unknown) => Promise<boolean>
      importBackup: () => Promise<unknown | null>
      getVersion: () => Promise<string>
      fetchQuotes: (
        items: { ticker: string; crypto: boolean }[],
        token?: string
      ) => Promise<
        { ticker: string; price: number | null; dayChange: number | null; error?: string }[]
      >
      fetchRates: (
        series: 'selic' | 'cdi',
        from: string
      ) => Promise<{ date: string; rate: number }[]>
      getUpdateStatus: () => Promise<UpdateStatus>
      installUpdate: () => Promise<void>
      onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
      onNavigate: (callback: (page: string) => void) => () => void
    }
  }
}
