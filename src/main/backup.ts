import { BrowserWindow, dialog } from 'electron'
import { readFile, writeFile } from 'fs/promises'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Abre a janela "Salvar como" do Windows e grava uma cópia dos dados
export async function exportBackup(window: BrowserWindow | null, data: unknown): Promise<boolean> {
  const options = {
    title: 'Salvar backup do Yovel',
    defaultPath: `yovel-backup-${todayISO()}.json`,
    filters: [{ name: 'Backup do Yovel', extensions: ['json'] }]
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return false

  await writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
  return true
}

// Abre a janela "Abrir" do Windows e lê um backup. Devolve null se cancelar ou der erro
export async function importBackup(window: BrowserWindow | null): Promise<unknown | null> {
  const options = {
    title: 'Restaurar backup do Yovel',
    filters: [{ name: 'Backup do Yovel', extensions: ['json'] }],
    properties: ['openFile' as const]
  }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)
  if (result.canceled || result.filePaths.length === 0) return null

  try {
    return JSON.parse(await readFile(result.filePaths[0], 'utf-8'))
  } catch {
    return null
  }
}
