'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Produto {
  id: string
  nome: string
  descricao: string
  preco_normal: number
  preco_promocional: number | null
  disponivel: boolean
  em_promocao: boolean
  imagem_url: string | null
}

export default function Home() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('disponivel', { ascending: false })
      .order('em_promocao', { ascending: false })
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar produtos:', error)
    } else if (data) {
      setProdutos(data)
    }
    setLoading(false)
  }

  const promocoes = produtos.filter((p) => p.disponivel && p.em_promocao)
  const normais = produtos.filter((p) => p.disponivel && !p.em_promocao)
  const esgotados = produtos.filter((p) => !p.disponivel)

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Cabeçalho */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 text-center shadow-lg">
        <h1 className="text-2xl font-black text-amber-400 tracking-wide">🍺 BAR DO COPÃO</h1>
        <p className="text-xs text-slate-400">Cardápio Digital Atualizado</p>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {loading && (
          <p className="text-center text-slate-500 py-8">A carregar cardápio...</p>
        )}

        {!loading && produtos.length === 0 && (
          <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
            <p className="text-slate-400">Nenhum copão cadastrado no momento.</p>
          </div>
        )}

        {/* 1. SEÇÃO DE PROMOÇÕES */}
        {promocoes.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-3">
              🔥 PROMOÇÕES IMPERDÍVEIS
            </h2>
            <div className="space-y-3">
              {promocoes.map((item) => (
                <div key={item.id} className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl p-3 flex gap-3 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-bl-lg uppercase">
                    Oferta
                  </div>
                  {item.imagem_url ? (
                    <img src={item.imagem_url} alt={item.nome} className="w-20 h-20 rounded-lg object-cover bg-slate-800 flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">🍹</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{item.nome}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.descricao}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-slate-500 line-through text-xs">R$ {Number(item.preco_normal).toFixed(2)}</span>
                      <span className="text-amber-400 font-extrabold text-lg">R$ {Number(item.preco_promocional || item.preco_normal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. CARDÁPIO PRINCIPAL */}
        {normais.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              🍹 Todos os Copões
            </h2>
            <div className="space-y-3">
              {normais.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-3">
                  {item.imagem_url ? (
                    <img src={item.imagem_url} alt={item.nome} className="w-20 h-20 rounded-lg object-cover bg-slate-800 flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">🍺</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{item.nome}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.descricao}</p>
                    <div className="mt-2">
                      <span className="text-emerald-400 font-extrabold text-base">R$ {Number(item.preco_normal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. INDISPONÍVEIS (ACINZENTADOS NO FUNDO) */}
        {esgotados.length > 0 && (
          <section className="pt-4 border-t border-slate-800/60">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              ⛔ Indisponíveis no momento
            </h2>
            <div className="space-y-3 opacity-50 grayscale">
              {esgotados.map((item) => (
                <div key={item.id} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 flex gap-3 relative">
                  {item.imagem_url ? (
                    <img src={item.imagem_url} alt={item.nome} className="w-20 h-20 rounded-lg object-cover bg-slate-800 flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">❌</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-300 truncate">{item.nome}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.descricao}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-slate-400 font-medium text-sm">R$ {Number(item.preco_normal).toFixed(2)}</span>
                      <span className="bg-red-950/80 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-800/50">ESGOTADO</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}