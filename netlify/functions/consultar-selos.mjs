import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rnzjiqduzjxczotqjpjg.supabase.co'

export const config = {
  path: '/api/consultar-selos',
  method: 'POST',
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 5 },
}

function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  for (const n of [9, 10]) {
    let total = 0
    for (let i = 0; i < n; i++) total += Number(cpf[i]) * (n + 1 - i)
    if ((total * 10 % 11) % 10 !== Number(cpf[n])) return false
  }
  return true
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!secret) return json({ error: 'Serviço indisponível.' }, 503)

  let body
  try { body = await request.json() } catch { return json({ error: 'Requisição inválida.' }, 400) }
  const cpf = typeof body?.cpf === 'string' ? body.cpf.replace(/\D/g, '') : ''
  if (!cpfValido(cpf)) return json({ error: 'CPF inválido.' }, 400)

  try {
    const supabase = createClient(SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    const { data, error } = await supabase.from('clientes').select('selos').eq('cpf', cpf).maybeSingle()
    if (error) return json({ error: 'Consulta indisponível.' }, 500)
    if (!data) return json({ error: 'CPF não cadastrado.' }, 404)
    return json({ selos: data.selos })
  } catch {
    return json({ error: 'Consulta indisponível.' }, 500)
  }
}
