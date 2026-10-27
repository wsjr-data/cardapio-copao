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

interface FidelidadeCliente {
  cpf: string
  nome: string
  saldo_pontos: number
}

type AbaTipo = 'promocoes' | 'copoes' | 'kits' | 'monte'

export default function Home() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<AbaTipo>('promocoes')

  // Estados do Monte seu Copão
  const [bebidaBase, setBebidaBase] = useState<{ nome: string; preco: number } | null>(null)
  const [geloSabor, setGeloSabor] = useState<{ nome: string; preco: number } | null>(null)
  const [acompanhamento, setAcompanhamento] = useState<{ nome: string; preco: number } | null>(null)

  // Estados do Modal de Fidelidade CPF
  const [modalFidelidadeAberto, setModalFidelidadeAberto] = useState(false)
  const [cpfConsulta, setCpfConsulta] = useState('')
  const [loadingFidelidade, setLoadingFidelidade] = useState(false)
  const [clienteFidelidade, setClienteFidelidade] = useState<FidelidadeCliente | null>(null)
  const [erroFidelidade, setErroFidelidade] = useState('')

  const logoUrl = "https://rnzjiqduzjxczotqjpjg.supabase.co/storage/v1/object/public/fotos-copoes/3a3cddac-b84c-438e-85c4-c806eff3f1e1.jfif"
  const enderecoTexto = "R. Fortaleza - Parque Brasil II, Teresina - PI"
  const pontoReferencia = "Próximo ao CETI José Pereira da Silva"
  const locationUrl = "https://maps.app.goo.gl/3doBnpnjSrSVn5w56"
  const whatsappNumber = "5586995532914"
  const instagramUrl = "https://www.instagram.com/_zerograu_bebidas"

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {
    setLoading(true)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de rede')), 4000)
    )

    try {
      const queryPromise = supabase
        .from('produtos')
        .select('*')
        .order('disponivel', { ascending: false })
        .order('em_promocao', { ascending: false })
        .order('nome', { ascending: true })

      const response: any = await Promise.race([queryPromise, timeoutPromise])

      if (response && response.data && response.data.length > 0) {
        setProdutos(response.data)
      } else {
        carregarProdutosPadrao()
      }
    } catch (err) {
      console.warn('Carregando dados de contingência local:', err)
      carregarProdutosPadrao()
    } finally {
      setLoading(false)
    }
  }

  function carregarProdutosPadrao() {
    setProdutos([
      {
        id: '1',
        nome: 'Copão de Whisky Red Label + Gelo de Coco',
        descricao: 'Dose de Red Label, Gelo de Coco e Energético Monster',
        preco_normal: 30.0,
        preco_promocional: 25.0,
        disponivel: true,
        em_promocao: true,
        imagem_url: null,
      },
      {
        id: '2',
        nome: 'Copão de Gin Tanqueray + Gelo de Maracujá',
        descricao: 'Dose de Gin Tanqueray, Gelo de Sabor e Tônica',
        preco_normal: 28.0,
        preco_promocional: null,
        disponivel: true,
        em_promocao: false,
        imagem_url: null,
      },
      {
        id: '3',
        nome: 'Copão de Vodka Smirnoff + Red Bull',
        descricao: 'Dose de Vodka Smirnoff e Energético Red Bull',
        preco_normal: 22.0,
        preco_promocional: 18.0,
        disponivel: true,
        em_promocao: true,
        imagem_url: null,
      },
    ])
  }

  async function consultarFidelidadeCPF() {
    if (!cpfConsulta.trim()) {
      setErroFidelidade('Por favor, digite o seu CPF.')
      return
    }

    setLoadingFidelidade(true)
    setErroFidelidade('')
    setClienteFidelidade(null)

    const cpfLimpo = cpfConsulta.replace(/\D/g, '')

    try {
      const { data, error } = await supabase
        .from('fidelidade')
        .select('*')
        .eq('cpf', cpfLimpo)
        .single()

      if (error || !data) {
        setErroFidelidade('CPF não localizado. Faça o seu primeiro pedido para se cadastrar!')
      } else {
        setClienteFidelidade(data)
      }
    } catch (err) {
      setErroFidelidade('Falha ao consultar o saldo de pontos.')
    } finally {
      setLoadingFidelidade(false)
    }
  }

  function pedirItemWhatsApp(nomeItem: string, preco: number) {
    const mensagem = `Olá, Zero Grau Bebidas! 🍹%0AGostaria de pedir:%0A• *${nomeItem}*%0A💰 *Valor:* R$ ${preco.toFixed(2)}`
    window.open(`https://wa.me/${whatsappNumber}?text=${mensagem}`, '_blank')
  }

  const promocoes = produtos.filter((p) => p.disponivel && p.em_promocao)
  const normais = produtos.filter((p) => p.disponivel && !p.em_promocao)
  const esgotados = produtos.filter((p) => !p.disponivel)

  const opcoesBebidas = [
    { nome: 'Dose Whisky Red Label', preco: 15.00 },
    { nome: 'Dose Whisky Black Label', preco: 22.00 },
    { nome: 'Dose Gin Tanqueray', preco: 18.00 },
    { nome: 'Dose Gin Gordon\'s', preco: 14.00 },
    { nome: 'Dose Vodka Smirnoff', preco: 12.00 },
    { nome: 'Dose Vodka Absolut', preco: 18.00 },
  ]

  const opcoesGelo = [
    { nome: 'Gelo de Coco', preco: 3.00 },
    { nome: 'Gelo de Maracujá', preco: 3.00 },
    { nome: 'Gelo de Melancia', preco: 3.00 },
    { nome: 'Gelo Tradicional (Sem Sabor)', preco: 1.00 },
  ]

  const opcoesAcompanhamento = [
    { nome: 'Red Bull Tradicional', preco: 12.00 },
    { nome: 'Red Bull Tropical', preco: 12.00 },
    { nome: 'Monster Energy', preco: 10.00 },
    { nome: 'Água Tônica Schweppes', preco: 6.00 },
    { nome: 'Citrus', preco: 6.00 },
    { nome: 'Coca-Cola 350ml', preco: 5.00 },
  ]

  const precoTotalCopao = (bebidaBase?.preco || 0) + (geloSabor?.preco || 0) + (acompanhamento?.preco || 0)

  function enviarPedidoPersonalizadoWhatsApp() {
    if (!bebidaBase || !geloSabor || !acompanhamento) {
      alert('Por favor, selecione os 3 ingredientes do seu copão!')
      return
    }

    const mensagem = `Olá, Zero Grau Bebidas! 🍹%0A` +
      `Gostaria de pedir um *Copão Personalizado*:%0A%0A` +
      `• *Bebida:* ${bebidaBase.nome} (R$ ${bebidaBase.preco.toFixed(2)})%0A` +
      `• *Gelo:* ${geloSabor.nome} (R$ ${geloSabor.preco.toFixed(2)})%0A` +
      `• *Acompanhamento:* ${acompanhamento.nome} (R$ ${acompanhamento.preco.toFixed(2)})%0A%0A` +
      `💰 *Total:* R$ ${precoTotalCopao.toFixed(2)}`

    window.open(`https://wa.me/${whatsappNumber}?text=${mensagem}`, '_blank')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans">
      {/* 1. HERO BANNER ZERO GRAU BEBIDAS */}
      <header className="relative bg-gradient-to-b from-black via-slate-900 to-slate-950 border-b border-amber-500/30 pt-8 pb-4 px-4 text-center overflow-hidden shadow-2xl">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto space-y-3">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-black border-2 border-amber-500/70 p-1 flex items-center justify-center shadow-2xl shadow-amber-500/20 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Zero Grau Bebidas" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-900 flex flex-col items-center justify-center p-1 text-center border border-amber-500/30">
                <span className="text-2xl">👑</span>
                <span className="text-[9px] font-black text-amber-400 tracking-wider uppercase leading-none mt-1">ZERO GRAU</span>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 uppercase tracking-wider">
              ZERO GRAU BEBIDAS
            </h1>
            <p className="text-xs text-amber-200/80 font-semibold tracking-wide italic mt-0.5">
              "O mais gelado da região!"
            </p>
          </div>

          {/* BOTÕES RÁPIDOS DE CONTATO & FIDELIDADE */}
          <div className="flex justify-center items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => setModalFidelidadeAberto(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition-all uppercase tracking-wider"
            >
              ⭐ Meus Selos (CPF)
            </button>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition-all"
            >
              💬 WhatsApp
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition-all"
            >
              📸 Instagram
            </a>
          </div>
        </div>
      </header>

      {/* 2. NAVEGAÇÃO POR ABAS HORIZONTAIS */}
      <nav className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-md mx-auto flex overflow-x-auto no-scrollbar scroll-smooth px-2 py-2.5 gap-1.5">
          <button
            onClick={() => setAbaAtiva('promocoes')}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              abaAtiva === 'promocoes' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            🔥 Promoções
          </button>
          <button
            onClick={() => setAbaAtiva('copoes')}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              abaAtiva === 'copoes' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            🍹 Copões Prontos
          </button>
          <button
            onClick={() => setAbaAtiva('kits')}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              abaAtiva === 'kits' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            📦 Kits & Combos
          </button>
          <button
            onClick={() => setAbaAtiva('monte')}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              abaAtiva === 'monte' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            🛠️ Monte seu Copão
          </button>
        </div>
      </nav>

      {/* 3. CONTEÚDO DAS ABAS */}
      <div className="max-w-md mx-auto p-4 space-y-6">
        {loading && (
          <p className="text-center text-slate-500 py-12 animate-pulse text-sm">
            A carregar bebidas geladas...
          </p>
        )}

        {/* ABA 1: PROMOÇÕES */}
        {!loading && abaAtiva === 'promocoes' && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-500/30 pb-2">
              <span className="text-lg">🔥</span>
              <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider">OFERTAS ESPECIAIS</h2>
            </div>

            {promocoes.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8 bg-slate-900/50 rounded-2xl border border-slate-800">
                Nenhuma promoção ativa no momento. Confira a aba Copões Prontos!
              </p>
            ) : (
              <div className="space-y-3">
                {promocoes.map((item) => {
                  const precoFinal = Number(item.preco_promocional || item.preco_normal)
                  return (
                    <div
                      key={item.id}
                      className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-3.5 flex gap-3 shadow-xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
                        OFF
                      </div>

                      {item.imagem_url ? (
                        <img src={item.imagem_url} alt={item.nome} className="w-20 h-20 rounded-xl object-cover bg-slate-800 flex-shrink-0 border border-amber-500/20" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-800/80 flex items-center justify-center text-2xl flex-shrink-0 border border-slate-700">🍹</div>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-white text-base truncate">{item.nome}</h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.descricao}</p>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-slate-500 line-through text-xs">R$ {Number(item.preco_normal).toFixed(2)}</span>
                            <span className="text-amber-400 font-black text-lg">R$ {precoFinal.toFixed(2)}</span>
                          </div>

                          <button
                            onClick={() => pedirItemWhatsApp(item.nome, precoFinal)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow transition-all uppercase"
                          >
                            💬 Pedir
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ABA 2: COPÕES PRONTOS */}
        {!loading && abaAtiva === 'copoes' && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-lg">🍹</span>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">COPÕES PRONTOS DA CASA</h2>
            </div>

            <div className="space-y-3">
              {normais.map((item) => {
                const preco = Number(item.preco_normal)
                return (
                  <div key={item.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex gap-3 shadow-lg">
                    {item.imagem_url ? (
                      <img src={item.imagem_url} alt={item.nome} className="w-20 h-20 rounded-xl object-cover bg-slate-800 flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">🍺</div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base truncate">{item.nome}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.descricao}</p>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-emerald-400 font-black text-lg">R$ {preco.toFixed(2)}</span>
                        <button
                          onClick={() => pedirItemWhatsApp(item.nome, preco)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow transition-all uppercase"
                        >
                          💬 Pedir
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ABA 3: KITS & COMBOS */}
        {!loading && abaAtiva === 'kits' && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-lg">📦</span>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">KITS & COMBOS DE GARRAFA</h2>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 text-center">
              <span className="text-3xl">🍾</span>
              <h3 className="text-sm font-bold text-amber-400">Combos Especiais de Fim de Semana</h3>
              <p className="text-xs text-slate-400">
                Garrafa de Whisky/Gin + 4 Energéticos + Saco de Gelo. Peça diretamente no nosso balcão ou WhatsApp!
              </p>
              <a
                href={`https://wa.me/${whatsappNumber}?text=Olá!%20Gostaria%20de%20consultar%20os%20kits%20e%20combos%20disponíveis.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
              >
                💬 Consultar Combos no WhatsApp
              </a>
            </div>
          </section>
        )}

        {/* ABA 4: MONTE SEU COPÃO */}
        {!loading && abaAtiva === 'monte' && (
          <section className="space-y-5">
            <div className="border-b border-amber-500/30 pb-2">
              <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span>🛠️</span> Monte seu Copão Personalizado
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Escolha 1 Bebida + 1 Gelo + 1 Acompanhamento</p>
            </div>

            {/* PASSO 1: BEBIDA BASE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">1. Escolha a Bebida Base</label>
              <div className="grid grid-cols-2 gap-2">
                {opcoesBebidas.map((item) => (
                  <button
                    key={item.nome}
                    onClick={() => setBebidaBase(item)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      bebidaBase?.nome === item.nome ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-semibold">{item.nome}</p>
                    <p className="text-[11px] text-emerald-400 font-bold mt-1">R$ {item.preco.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* PASSO 2: GELO DE SABOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">2. Escolha o Gelo de Sabor</label>
              <div className="grid grid-cols-2 gap-2">
                {opcoesGelo.map((item) => (
                  <button
                    key={item.nome}
                    onClick={() => setGeloSabor(item)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      geloSabor?.nome === item.nome ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-semibold">{item.nome}</p>
                    <p className="text-[11px] text-emerald-400 font-bold mt-1">R$ {item.preco.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* PASSO 3: ACOMPANHAMENTO */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">3. Escolha o Acompanhamento</label>
              <div className="grid grid-cols-2 gap-2">
                {opcoesAcompanhamento.map((item) => (
                  <button
                    key={item.nome}
                    onClick={() => setAcompanhamento(item)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      acompanhamento?.nome === item.nome ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-semibold">{item.nome}</p>
                    <p className="text-[11px] text-emerald-400 font-bold mt-1">R$ {item.preco.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* RESUMO DO PEDIDO */}
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-2xl mt-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">📋 Resumo do Seu Copão</h3>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p>• Bebida: <strong className="text-white">{bebidaBase?.nome || 'Pendente...'}</strong></p>
                <p>• Gelo: <strong className="text-white">{geloSabor?.nome || 'Pendente...'}</strong></p>
                <p>• Acompanhamento: <strong className="text-white">{acompanhamento?.nome || 'Pendente...'}</strong></p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Valor Total:</span>
                <span className="text-xl font-black text-amber-400">R$ {precoTotalCopao.toFixed(2)}</span>
              </div>

              <button
                onClick={enviarPedidoPersonalizadoWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
              >
                💬 Enviar Pedido no WhatsApp
              </button>
            </div>
          </section>
        )}
      </div>

      {/* MODAL DE FIDELIDADE CPF */}
      {modalFidelidadeAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setModalFidelidadeAberto(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white font-bold text-lg"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <span className="text-3xl">⭐</span>
              <h3 className="text-base font-black text-amber-400 uppercase">Programa de Fidelidade</h3>
              <p className="text-xs text-slate-400">Consulte seus selos e resgate o seu Copão Grátis!</p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Digite seu CPF (ex: 123.456.789-00)"
                value={cpfConsulta}
                onChange={(e) => setCpfConsulta(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 text-center"
              />

              <button
                onClick={consultarFidelidadeCPF}
                disabled={loadingFidelidade}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs uppercase transition-all"
              >
                {loadingFidelidade ? 'Buscando...' : 'Consultar Meus Selos'}
              </button>
            </div>

            {erroFidelidade && (
              <p className="text-xs text-rose-400 text-center bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">{erroFidelidade}</p>
            )}

            {clienteFidelidade && (
  <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
    <p className="text-xs text-slate-300">
      Olá, <strong className="text-amber-400">{clienteFidelidade.nome}</strong>!
    </p>
    <p className="text-xs text-slate-400">
      Você possui <span className="text-amber-400 font-black text-base">{clienteFidelidade.saldo_pontos}</span> de 10 selos.
    </p>

    {/* Régua de Selos */}
    <div className="grid grid-cols-5 gap-1.5 pt-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
            i < clienteFidelidade.saldo_pontos
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'bg-slate-800 text-slate-600'
          }`}
        >
          {i < clienteFidelidade.saldo_pontos ? '⭐' : i + 1}
        </div>
      ))}
    </div>

    {clienteFidelidade.saldo_pontos >= 10 && (
      <p className="text-xs font-bold text-emerald-400 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800">
        🎉 PARABÉNS! Você ganhou 1 COPÃO GRÁTIS! Peça no balcão apresentando seu CPF.
      </p>
    )}
  </div>
)}
          </div>
        </div>
      )}

      {/* RODAPÉ */}
      <footer className="mt-12 bg-slate-900 border-t border-slate-800 p-6 text-slate-400">
        <div className="max-w-md mx-auto space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">📍 Localização do Estabelecimento</h3>
            <a href={locationUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-200 hover:text-amber-400 transition-colors block underline decoration-amber-500/40">
              {enderecoTexto} ↗
            </a>
            <p className="text-xs text-amber-300/80 font-medium">{pontoReferencia}</p>
          </div>

          <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 relative">
            <iframe
              title="Mapa Zero Grau Bebidas"
              src={`https://maps.google.com/maps?q=${encodeURIComponent('Rua Fortaleza, Parque Brasil II, Teresina - PI, 64012-015')}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>

          <div className="text-center pt-3 border-t border-slate-800/80 space-y-1">
            <p className="text-xs text-amber-400/90 font-bold">Zero Grau Bebidas • (86) 99553-2914</p>
            <p className="text-[10px] text-slate-600">© Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </main>
  )
}