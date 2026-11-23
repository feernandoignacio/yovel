import { app } from 'electron'
import { join } from 'path'
import { readFile, writeFile, rename } from 'fs/promises'

// Os dados ficam num arquivo JSON na pasta do app no Windows
// (C:\Users\<usuario>\AppData\Roaming\yovel\yovel-dados.json)
function dataFilePath(): string {
  return join(app.getPath('userData'), 'yovel-dados.json')
}

export async function loadData(): Promise<unknown | null> {
  try {
    const text = await readFile(dataFilePath(), 'utf-8')
    return JSON.parse(text)
  } catch {
    // Primeira vez abrindo o app: ainda não existe arquivo
    return null
  }
}

export async function saveData(data: unknown): Promise<void> {
  const filePath = dataFilePath()
  const tempPath = `${filePath}.tmp`
  // Salva primeiro num arquivo temporário e depois troca,
  // assim o arquivo principal nunca fica pela metade se o PC desligar
  await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8')
  await rename(tempPath, filePath)
}
