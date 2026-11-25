import { fetchQuotes } from '../src/main/market'

// Função da Vercel usada pela versão online para buscar cotações na brapi
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      items?: { ticker?: unknown; crypto?: unknown }[]
      token?: unknown
    }
    const items = (body.items ?? [])
      .slice(0, 30)
      .map((item) => ({
        ticker: String(item.ticker ?? '').toUpperCase(),
        crypto: item.crypto === true
      }))
      // Só aceita códigos simples, como PETR4, MXRF11 ou BTC
      .filter((item) => /^[A-Z0-9]{2,12}$/.test(item.ticker))
    const token = typeof body.token === 'string' && body.token ? body.token : undefined
    return Response.json(await fetchQuotes(items, token))
  } catch {
    return Response.json({ error: 'Pedido inválido' }, { status: 400 })
  }
}
