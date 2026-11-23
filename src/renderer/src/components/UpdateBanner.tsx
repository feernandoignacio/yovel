import { useEffect, useState } from 'react'

type UpdateStatus = Awaited<ReturnType<typeof window.api.getUpdateStatus>>

// Faixa no topo avisando que tem versão nova baixando ou pronta para instalar
export function UpdateBanner(): React.JSX.Element | null {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    window.api.getUpdateStatus().then(setStatus)
    return window.api.onUpdateStatus(setStatus)
  }, [])

  if (status.state === 'idle') return null

  if (status.state === 'downloading') {
    return (
      <div className="update-banner">
        <span>Baixando a versão {status.version} do Yovel. Avisamos quando estiver pronta.</span>
      </div>
    )
  }

  return (
    <div className="update-banner ready">
      <span>
        A versão {status.version} está pronta. Reinicie para atualizar, seus dados continuam salvos.
      </span>
      <button
        className="btn"
        disabled={installing}
        onClick={() => {
          setInstalling(true)
          window.api.installUpdate()
        }}
      >
        {installing ? 'Reiniciando...' : 'Reiniciar e atualizar'}
      </button>
    </div>
  )
}
