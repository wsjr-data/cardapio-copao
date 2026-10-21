'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

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

export default function AdminPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  // Campos do Formulário
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [precoNormal, setPrecoNormal] = useState('')
  const [precoPromocional, setPrecoPromocional] = useState('')
  const [emPromocao, setEmPromocao] = useState(false)
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [imagemUrlAtual, setImagemUrlAtual] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {
    setLoading(true)
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setProdutos(data)
    setLoading(false)
  }

  // Upload de Imagem para o Supabase Storage
  async function uploadImagem(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('fotos-copoes')
      .upload(filePath, file)

    if (uploadError) {
      alert('Erro ao enviar imagem: ' + uploadError.message)
      return null
    }

    const { data } = supabase.storage.from('fotos-copoes').getPublicUrl(filePath)
    return data.publicUrl
  }

  // Preencher Formulário para Edição
  function iniciarEdicao(item: Produto) {
    setEditandoId(item.id)
    setNome(item.nome)
    setDescricao(item.descricao || '')
    setPrecoNormal(item.preco_normal.toString())
    setPrecoPromocional(item.preco_promocional ? item.preco_promocional.toString() : '')
    setEmPromocao(item.em_promocao)
    setImagemUrlAtual(item.imagem_url)
    setImagemFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Cancelar Edição
  function cancelarEdicao() {
    setEditandoId(null)
    setNome('')
    setDescricao('')
    setPrecoNormal('')
    setPrecoPromocional('')
    setEmPromocao(false)
    setImagemFile(null)
    setImagemUrlAtual(null)
  }

  // Salvar (Cadastrar ou Atualizar)
  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome || !precoNormal) return alert('Preencha o nome e o preço normal!')

    setSalvando(true)

    let imagemUrlFinal = imagemUrlAtual
    if (imagemFile) {
      const novaUrl = await uploadImagem(imagemFile)
      if (novaUrl) imagemUrlFinal = novaUrl
    }

    const dadosProduto = {
      nome,
      descricao,
      preco_normal: parseFloat(precoNormal),
      preco_promocional: precoPromocional ? parseFloat(precoPromocional) : null,
      em_promocao: emPromocao,
      imagem_url: imagemUrlFinal,
    }

    if (editandoId) {
      // Atualizar Produto Existente
      const { error } = await supabase
        .from('produtos')
        .update(dadosProduto)
        .eq('id', editandoId)

      if (error) alert('Erro ao atualizar: ' + error.message)
      else alert('Copão atualizado com sucesso!')
    } else {
      // Cadastrar Novo Produto
      const { error } = await supabase.from('produtos').insert([
        { ...dadosProduto, disponivel: true }
      ])

      if (error) alert('Erro ao cadastrar: ' + error.message)
    }

    cancelarEdicao()
    fetchProdutos()
    setSalvando(false)
  }

  // Toggles Rápidos
  async function toggleDisponivel(id: string, valorAtual: boolean) {
    await supabase.from('produtos').update({ disponivel: !valorAtual }).eq('id', id)
    fetchProdutos()
  }

  async function togglePromocao(id: string, valorAtual: boolean) {
    await supabase.from('produtos').update({ em_promocao: !valorAtual }).eq('id', id)
    fetchProdutos()
  }

  async function deletarProduto(id: string) {
    if (confirm('Tem certeza que deseja excluir este copão?')) {
      await supabase.from('produtos').delete().eq('id', id)
      fetchProdutos()
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-20 font-sans">
      <header className="max-w-md mx-auto mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-amber-400">⚙️ PAINEL DO PROPRIETÁRIO</h1>
          <p className="text-xs text-slate-400">Gerenciamento de Copões</p>
        </div>
        <a href="/" target="_blank" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
          Ver Cardápio ↗
        </a>
      </header>

      <div className="max-w-md mx-auto space-y-6">
        {/* FORMULÁRIO */}
        <form onSubmit={handleSalvar} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-amber-400 uppercase">
              {editandoId ? '✏️ Editar Copão' : '➕ Cadastrar Novo Copão'}
            </h2>
            {editandoId && (
              <button type="button" onClick={cancelarEdicao} className="text-xs text-red-400 hover:underline">
                Cancelar Edição
              </button>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400">Nome do Copão</label>
            <input
              type="text"
              placeholder="Ex: Copão de Gin Tônica"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm mt-1 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Descrição / Ingredientes</label>
            <textarea
              placeholder="Ex: Gin Tanqueray, Tônica, Gelo de Coco"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm mt-1 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Preço Normal (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="30.00"
                value={precoNormal}
                onChange={(e) => setPrecoNormal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm mt-1 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Preço Promo (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="22.00"
                value={precoPromocional}
                onChange={(e) => setPrecoPromocional(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm mt-1 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">Foto do Produto</label>
            {imagemUrlAtual && !imagemFile && (
              <div className="flex items-center gap-2 my-1 text-xs text-emerald-400">
                <img src={imagemUrlAtual} alt="Atual" className="w-8 h-8 rounded object-cover" />
                <span>Imagem atual carregada</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs mt-1 text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-amber-500 file:text-slate-950 file:font-bold cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="promo"
              checked={emPromocao}
              onChange={(e) => setEmPromocao(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded"
            />
            <label htmlFor="promo" className="text-xs text-slate-300 font-medium">
              Destacar em Promoção
            </label>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all mt-2 shadow-lg shadow-amber-500/10"
          >
            {salvando ? 'A Salvar...' : editandoId ? 'Salvar Alterações' : 'Cadastrar Copão'}
          </button>
        </form>

        {/* LISTA DE PRODUTOS */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase">📋 Todos os Copões ({produtos.length})</h2>

          {loading && <p className="text-xs text-slate-500">A carregar...</p>}

          {produtos.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3 shadow-md">
              <div className="flex justify-between items-start gap-3">
                {item.imagem_url ? (
                  <img src={item.imagem_url} alt={item.nome} className="w-12 h-12 rounded-lg object-cover bg-slate-800 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-lg flex-shrink-0">🍹</div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{item.nome}</h3>
                  <p className="text-xs text-slate-400">
                    Normal: <span className="text-emerald-400 font-bold">R$ {Number(item.preco_normal).toFixed(2)}</span>
                    {item.preco_promocional && (
                      <span className="ml-2 text-amber-400 font-bold">| Promo: R$ {Number(item.preco_promocional).toFixed(2)}</span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => iniciarEdicao(item)}
                    className="text-amber-400 hover:text-amber-300 text-xs p-1"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deletarProduto(item.id)}
                    className="text-red-400 hover:text-red-300 text-xs p-1"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* TOGGLES */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => toggleDisponivel(item.id, item.disponivel)}
                  className={`text-xs py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 ${
                    item.disponivel
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      : 'bg-red-950/80 text-red-400 border border-red-800/60'
                  }`}
                >
                  {item.disponivel ? '🟢 Disponível' : '🔴 Esgotado'}
                </button>

                <button
                  onClick={() => togglePromocao(item.id, item.em_promocao)}
                  className={`text-xs py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 ${
                    item.em_promocao
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.em_promocao ? '🔥 Em Promoção' : '⚪ Preço Normal'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}