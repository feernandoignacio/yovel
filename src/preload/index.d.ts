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
      getUpdateStatus: () => Promise<UpdateStatus>
      installUpdate: () => Promise<void>
      onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
      onNavigate: (callback: (page: string) => void) => () => void
    }
  }
}
