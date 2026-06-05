'use client'

import { useEffect, useState } from 'react'
import { FileText, Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import { formatDate } from '../lib/format-date'

interface LugarBatchSummary {
  id: string
  file_name: string
  created_at: string
  total_input: number
  total_output: number
  duplicates: number
}

export interface LugaresResponse {
  batchId: string
  fileName: string
  totalInput: number
  totalOutput: number
  duplicateCount: number
  logs: string[]
}

interface Props {
  onLoad: (data: LugaresResponse) => void
  onDelete?: (id: string) => void
  refreshKey?: number
}

export default function LugaresBatchHistory({ onLoad, onDelete, refreshKey }: Props) {
  const [batches, setBatches] = useState<LugarBatchSummary[]>([])
  const [cargando, setCargando] = useState(true)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [hayMas, setHayMas] = useState(false)

  async function cargarHistorial() {
    setCargando(true)
    try {
      const res = await fetch('/api/lugares/batch?limit=21')
      const data = await res.json()
      const todos: LugarBatchSummary[] = data.batches ?? []
      setHayMas(todos.length > 20)
      setBatches(todos.slice(0, 20))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarHistorial() }, [refreshKey])

  function handleLoad(batch: LugarBatchSummary) {
    onLoad({
      batchId: batch.id,
      fileName: batch.file_name,
      totalInput: batch.total_input,
      totalOutput: batch.total_output,
      duplicateCount: batch.duplicates,
      logs: [],
    })
  }

  async function handleDelete(id: string) {
    if (confirmId !== id) { setConfirmId(id); return }
    setEliminandoId(id)
    setConfirmId(null)
    try {
      const res = await fetch(`/api/lugares/batch?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setBatches(prev => prev.filter(b => b.id !== id))
        onDelete?.(id)
      }
    } finally {
      setEliminandoId(null)
    }
  }

  if (cargando) {
    return <div className="text-center py-10 text-slate-400">Cargando historial…</div>
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>No hay batches procesados aún</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={cargarHistorial} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-700 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-teal-100" />
        <div className="space-y-3">
          {batches.map(batch => (
            <div key={batch.id} className="relative flex gap-4 pl-10">
              <div className="absolute left-3 top-4 w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white" />
              <div className="flex-1 bg-white rounded-xl border border-teal-100 p-4 hover:border-teal-300 transition-colors shadow-sm">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{batch.file_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(batch.created_at)}</p>
                </div>

                <div className="flex gap-3 mt-2 text-xs text-slate-500">
                  <span><strong className="text-slate-700">{batch.total_input}</strong> entrada</span>
                  <span><strong className="text-slate-700">{batch.total_output}</strong> únicos</span>
                  <span><strong className="text-amber-600">{batch.duplicates}</strong> dup.</span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleLoad(batch)}
                    className="flex items-center gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver resultados
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    disabled={eliminandoId === batch.id}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors
                      ${confirmId === batch.id
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'border border-teal-100 text-slate-500 hover:text-red-600 hover:border-red-200'
                      }`}
                  >
                    <Trash2 className="w-3 h-3" />
                    {confirmId === batch.id ? 'Confirmar' : eliminandoId === batch.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                  {confirmId === batch.id && (
                    <button onClick={() => setConfirmId(null)} className="text-xs text-slate-400 hover:text-slate-600 px-2">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hayMas && (
        <p className="text-xs text-center text-slate-400 py-2">
          Mostrando los 20 más recientes.{' '}
          <a href="/analytics" className="text-teal-600 hover:underline">Ver todos en Resumen →</a>
        </p>
      )}
    </div>
  )
}
