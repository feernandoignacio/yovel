import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Funções que a tela pode chamar para ler e salvar os dados
const api = {
  loadData: (): Promise<unknown> => ipcRenderer.invoke('data:load'),
  saveData: (data: unknown): Promise<void> => ipcRenderer.invoke('data:save', data),
  exportBackup: (data: unknown): Promise<boolean> => ipcRenderer.invoke('backup:export', data),
  importBackup: (): Promise<unknown | null> => ipcRenderer.invoke('backup:import'),
  // Avisa a tela quando um aviso do Windows pede para abrir uma aba
  onNavigate: (callback: (page: string) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, page: string): void => callback(page)
    ipcRenderer.on('navigate', listener)
    return () => ipcRenderer.removeListener('navigate', listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (definido no index.d.ts)
  window.electron = electronAPI
  // @ts-ignore (definido no index.d.ts)
  window.api = api
}
