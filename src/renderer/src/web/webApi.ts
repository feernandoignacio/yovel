// Versão online: faz no navegador o que o app de desktop faz pelo Electron.
// Os dados ficam salvos no próprio navegador (localStorage), só neste computador.

const STORAGE_KEY = 'yovel-dados'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Abre a janela de escolher arquivo do navegador e devolve o texto do arquivo
function pickFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      file
        .text()
        .then(resolve)
        .catch(() => resolve(null))
    }
    input.click()
  })
}

export function createWebApi(): Window['api'] {
  return {
    platform: 'web',

    loadData: async () => {
      try {
        const text = localStorage.getItem(STORAGE_KEY)
        return text ? JSON.parse(text) : null
      } catch {
        return null
      }
    },

    saveData: async (data) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        // Navegador sem espaço ou bloqueado: não trava o app
      }
    },

    // Baixa um arquivo .json com todos os dados
    exportBackup: async (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `yovel-backup-${todayISO()}.json`
      link.click()
      URL.revokeObjectURL(url)
      return true
    },

    importBackup: async () => {
      const text = await pickFile()
      if (!text) return null
      try {
        return JSON.parse(text)
      } catch {
        return null
      }
    },

    // Cotações e taxas passam pelas funções da Vercel (pasta api), igual ao processo principal do desktop
    fetchQuotes: async (items, token) => {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, token })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },

    fetchRates: async (series, from) => {
      const response = await fetch(`/api/rates?series=${series}&from=${from}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },

    // Coisas que só existem no app de desktop
    getVersion: async () => __APP_VERSION__,
    getUpdateStatus: async () => ({ state: 'idle' }),
    installUpdate: async () => undefined,
    onUpdateStatus: () => () => undefined,
    onNavigate: () => () => undefined
  }
}
