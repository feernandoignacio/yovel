import { app, BrowserWindow, Notification } from 'electron'
import { autoUpdater } from 'electron-updater'

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'downloading'; version: string }
  | { state: 'ready'; version: string }

const CHECK_EVERY_MS = 4 * 60 * 60 * 1000 // de 4 em 4 horas

let status: UpdateStatus = { state: 'idle' }

// Último estado, para a tela perguntar quando abrir
export function getUpdateStatus(): UpdateStatus {
  return status
}

/*
  Procura versão nova nas Releases do GitHub (configurado no electron-builder.yml).
  Se tiver, baixa sozinho em segundo plano e avisa a tela quando estiver pronta.
  Só funciona no app instalado, não no npm run dev.
*/
export function setupUpdater(getWindow: () => BrowserWindow | null, icon: string): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  // Se a pessoa não clicar em reiniciar, instala na próxima vez que fechar o app
  autoUpdater.autoInstallOnAppQuit = true

  const send = (next: UpdateStatus): void => {
    status = next
    getWindow()?.webContents.send('update:status', next)
  }

  autoUpdater.on('update-available', (info) => {
    send({ state: 'downloading', version: info.version })
  })

  autoUpdater.on('update-downloaded', (info) => {
    send({ state: 'ready', version: info.version })
    if (Notification.isSupported()) {
      new Notification({
        title: 'Atualização do Yovel pronta',
        body: `A versão ${info.version} já foi baixada. Abra o app e clique em Reiniciar para atualizar.`,
        icon
      }).show()
    }
  })

  // Sem internet ou GitHub fora do ar: tenta de novo na próxima checagem
  autoUpdater.on('error', () => {
    if (status.state === 'downloading') send({ state: 'idle' })
  })

  const check = (): void => {
    autoUpdater.checkForUpdates().catch(() => undefined)
  }
  setTimeout(check, 10000)
  setInterval(check, CHECK_EVERY_MS)
}

export function checkForUpdatesNow(): void {
  if (app.isPackaged) autoUpdater.checkForUpdates().catch(() => undefined)
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall(false, true)
}
