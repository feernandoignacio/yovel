import { fetchRates } from '../src/main/market'

// Função da Vercel usada pela versão online para buscar Selic e CDI no Banco Central
export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const series = params.get('series')
  const from = params.get('from') ?? ''
  if ((series !== 'selic' && series !== 'cdi') || !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    return Response.json({ error: 'Pedido inválido' }, { status: 400 })
  }
  try {
    return Response.json(await fetchRates(series, from))
  } catch {
    return Response.json({ error: 'Banco Central fora do ar' }, { status: 502 })
  }
}
