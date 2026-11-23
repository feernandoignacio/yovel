import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      loadData: () => Promise<unknown>
      saveData: (data: unknown) => Promise<void>
      onNavigate: (callback: (page: string) => void) => () => void
    }
  }
}
