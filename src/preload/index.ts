import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { UpdateStatus } from '../main/updater'
import type { QuoteResult, RateResult } from '../main/market'

// Funções que a tela pode chamar para ler e salvar os dados
const api = {
  platform: 'desktop' as const,
  loadData: (): Promise<unknown> => ipcRenderer.invoke('data:load'),
  saveData: (data: unknown): Promise<void> => ipcRenderer.invoke('data:save', data),
  exportBackup: (data: unknown): Promise<boolean> => ipcRenderer.invoke('backup:export', data),
  importBackup: (): Promise<unknown | null> => ipcRenderer.invoke('backup:import'),
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  // Cotações (brapi) e taxas Selic e CDI (Banco Central)
  fetchQuotes: (
    items: { ticker: string; crypto: boolean }[],
    token?: string
  ): Promise<QuoteResult[]> => ipcRenderer.invoke('market:quotes', items, token),
  fetchRates: (series: 'selic' | 'cdi', from: string): Promise<RateResult[]> =>
    ipcRenderer.invoke('market:rates', series, from),
  getUpdateStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke('update:get'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('update:install'),
  onUpdateStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus): void =>
      callback(status)
    ipcRenderer.on('update:status', listener)
    return () => ipcRenderer.removeListener('update:status', listener)
  },
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
