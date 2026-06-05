'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { CaseMode } from '@/app/lib/normalizer'
import type { Auditoria } from './AuditPanel'

export type ProcessResult = {
  batchId: string
  fileName: string
  totalInput: number
  totalOutput: number
  duplicates: number
  changes: number
  qualityBefore: number
  qualityAfter: number
  comunas: { original: string; normalized: string; region?: string | null; habitantes?: number | null }[]
  auditoria?: Auditoria
}

type Props = {
  rules: Record<string, boolean>
  onProcessed: (result: ProcessResult) => void
  /** Caso de texto elegido por el usuario (MAYÚS/minús/Título/sin cambio) */
  caseMode?: CaseMode
  /** Si se pasa, muestra una franja compacta en lugar del hero */
  compact?: boolean
}

export default function FileUpload({ rules, onProcessed, caseMode = 'title', compact = false }: Props) {
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return

      const ext = file.name.toLowerCase()
      if (!ext.endsWith('.txt') && !ext.endsWith('.csv') && !ext.endsWith('.tsv')) {
        toast.error('Solo se aceptan archivos .txt, .csv o .tsv')
        return
      }

      setLoading(true)
      const toastId = toast.loading(`Procesando ${file.name}…`)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('rules', JSON.stringify(rules))
        formData.append('caseMode', caseMode)

        const res = await fetch('/api/process', { method: 'POST', body: formData })
        const data = await res.json()

        if (!res.ok) throw new Error(data.error ?? 'Error al procesar')

        toast.success(`${data.totalOutput} únicos de ${data.totalInput} líneas`, { id: toastId })
        onProcessed(data)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error', { id: toastId })
      } finally {
        setLoading(false)
      }
    },
    [rules, onProcessed, caseMode],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: loading,
  })

  /* ── Modo compacto: franja pequeña para re-subir ── */
  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors ${
          isDragActive
            ? 'border-teal-500 bg-teal-50 text-teal-700'
            : 'border-teal-200 bg-white text-slate-500 hover:border-teal-400 hover:text-teal-700'
        } ${loading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
        ) : (
          <Upload className="h-4 w-4 shrink-0" />
        )}
        <span>{loading ? 'Procesando…' : 'Subir otro archivo'}</span>
      </div>
    )
  }

  /* ── Modo hero: pantalla de inicio ── */
  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed bg-white shadow-sm transition-all ${
        isDragActive
          ? 'border-teal-500 bg-teal-50/90 shadow-teal-100'
          : 'border-teal-200 hover:border-teal-400 hover:bg-teal-50/30 hover:shadow-md'
      } ${loading ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4 px-6 py-10">
        {/* Icono central */}
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
            isDragActive ? 'bg-teal-100' : 'bg-slate-100'
          }`}
        >
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          ) : isDragActive ? (
            <FileText className="h-8 w-8 text-teal-600" />
          ) : (
            <Upload className="h-8 w-8 text-slate-400" />
          )}
        </div>

        {/* Texto principal */}
        <div className="text-center">
          <p className="text-base font-semibold text-slate-800">
            {loading
              ? 'Procesando archivo…'
              : isDragActive
                ? 'Suelta el archivo aquí'
                : 'Arrastra tu archivo aquí'}
          </p>
          <p className="mt-1 text-sm text-slate-500">o haz clic para explorar tu equipo</p>
        </div>

        {/* Formatos aceptados */}
        {!loading && (
          <div className="flex items-center gap-2">
            {['.txt', '.csv', '.tsv'].map((fmt) => (
              <span
                key={fmt}
                className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 font-mono text-xs text-teal-700"
              >
                {fmt}
              </span>
            ))}
          </div>
        )}

        {/* Qué hace */}
        {!loading && !isDragActive && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {[
              'Elimina tildes y eñes',
              'Unifica mayúsculas',
              'Quita duplicados',
              'Corrige typos (fuzzy)',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1 text-xs text-slate-400">
                <CheckCircle2 className="h-3 w-3 text-teal-400" />
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
