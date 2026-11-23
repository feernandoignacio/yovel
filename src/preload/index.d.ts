import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      loadData: () => Promise<unknown>
      saveData: (data: unknown) => Promise<void>
      exportBackup: (data: unknown) => Promise<boolean>
      importBackup: () => Promise<unknown | null>
      onNavigate: (callback: (page: string) => void) => () => void
    }
  }
}
