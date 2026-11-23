import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Funções que a tela pode chamar para ler e salvar os dados
const api = {
  loadData: (): Promise<unknown> => ipcRenderer.invoke('data:load'),
  saveData: (data: unknown): Promise<void> => ipcRenderer.invoke('data:save', data)
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
