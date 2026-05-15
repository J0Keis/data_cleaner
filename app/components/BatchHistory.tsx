'use client'

import { useCallback, useEffect, useState } from 'react'
import { Trash2, FileText, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Batch } from '@/app/lib/supabase'

type Props = {
  onSelect: (batchId: string) => void
  selectedId?: string
  refreshKey?: number
}

export default function BatchHistory({ onSelect, selectedId, refreshKey }: Props) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)

  // useCallback para que useEffect no se dispare en bucle en Strict Mode
  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/batches')
      .then((r) => r.json())
      .then((data) => setBatches(Array.isArray(data) ? data : []))
      .catch(() => setBatches([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este batch?')) return

    const res = await fetch(`/api/batches?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Batch eliminado')
      load()
    } else {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-white shadow-sm">
      <div className="border-b border-teal-50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Historial de archivos</h3>
      </div>

      {loading ? (
        <p className="p-4 text-sm text-slate-500">Cargando...</p>
      ) : batches.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">Sin archivos procesados aún</p>
      ) : (
        <div className="max-h-64 overflow-auto">
          {batches.map((b) => (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(b.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(b.id)
                }
              }}
              className={`flex w-full cursor-pointer items-center gap-3 border-b border-teal-50/80 px-4 py-3 text-left transition-colors hover:bg-teal-50/50 ${
                selectedId === b.id ? 'bg-teal-50' : ''
              }`}
            >
              <FileText className="h-4 w-4 shrink-0 text-teal-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{b.file_name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {new Date(b.created_at).toLocaleString('es-CL')} · {b.total_output} únicos
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => remove(b.id, e)}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Eliminar batch"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
