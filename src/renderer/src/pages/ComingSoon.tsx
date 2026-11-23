type Props = {
  title: string
  description: string
}

// Tela provisória para as abas que ainda vão ser feitas
export function ComingSoon({ title, description }: Props): React.JSX.Element {
  return (
    <section className="page">
      <header className="page-header">
        <h1>{title}</h1>
        <p className="page-subtitle">{description}</p>
      </header>
      <div className="empty-box">Em construção. Vem nas próximas etapas.</div>
    </section>
  )
}
