import { app, shell, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { loadData, saveData } from './storage'
import { checkBills, NotifyTarget, startBillChecks } from './notifications'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
// Fechar a janela só esconde o app. Ele fecha de verdade pelo "Sair" perto do relógio
let isQuitting = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 800,
    minWidth: 1000,
    minHeight: 640,
    title: 'Operação Yovel',
    backgroundColor: '#E8DAC0',
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // Quando abre junto com o Windows, começa escondido perto do relógio
    if (!process.argv.includes('--hidden')) mainWindow?.show()
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  // Links externos abrem no navegador, não dentro do app
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function showWindow(target?: NotifyTarget): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
  // Clique no aviso abre direto na aba certa
  if (target) mainWindow.webContents.send('navigate', target)
}

// Iniciar com o Windows só funciona no app instalado, não no npm run dev
function startsWithWindows(): boolean {
  return app.getLoginItemSettings().openAtLogin
}

function setStartWithWindows(enabled: boolean): void {
  app.setLoginItemSettings({ openAtLogin: enabled, args: ['--hidden'] })
}

function updateTrayMenu(): void {
  if (!tray) return
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir Yovel', click: () => showWindow() },
      { label: 'Conferir contas agora', click: () => checkBills(icon, showWindow, true) },
      { type: 'separator' },
      {
        label: 'Iniciar com o Windows',
        type: 'checkbox',
        enabled: app.isPackaged,
        checked: app.isPackaged && startsWithWindows(),
        click: (item) => {
          setStartWithWindows(item.checked)
          updateTrayMenu()
        }
      },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])
  )
}

function createTray(): void {
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))
  tray.setToolTip('Operação Yovel')
  tray.on('click', () => showWindow())
  updateTrayMenu()
}

// Só deixa abrir um Yovel por vez. Se abrir de novo, mostra o que já está aberto
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => showWindow())

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.rignstudio.yovel')

    // F12 abre o DevTools em desenvolvimento
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Ponte entre a tela (React) e o arquivo de dados
    ipcMain.handle('data:load', () => loadData())
    ipcMain.handle('data:save', (_event, data: unknown) => saveData(data))

    createWindow()
    createTray()
    startBillChecks(icon, showWindow)

    app.on('activate', () => showWindow())
  })

  app.on('before-quit', () => {
    isQuitting = true
  })

  // Com a janela fechada o app continua rodando perto do relógio para mandar os avisos
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && isQuitting) app.quit()
  })
}
