'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { sortComunas, SORT_OPTIONS, type SortOrder } from '@/app/lib/sorter'
import SortSelector from '@/app/components/SortSelector'
import ColumnSelector from '@/app/components/ColumnSelector'
import { Download, X, FileText, FileJson, Sheet, Database, ScrollText, ArrowDownUp } from 'lucide-react'

type Comuna = { original: string; normalized: string; region?: string | null; habitantes?: number | null }

type Props = {
  comunas: Comuna[]
  batchId?: string
}

// Formatos de exportación disponibles con ícono y descripción
const EXPORT_FORMATS = [
  { type: 'csv',  label: 'CSV',     icon: FileText,    desc: 'Hoja de cálculo delimitada por comas'  },
  { type: 'json', label: 'JSON',    icon: FileJson,    desc: 'Objeto JavaScript legible por APIs'     },
  { type: 'xlsx', label: 'Excel',   icon: Sheet,       desc: 'Archivo Microsoft Excel (.xlsx)'        },
  { type: 'sql',  label: 'SQL',     icon: Database,    desc: 'INSERT INTO para base de datos'         },
  { type: 'log',  label: 'Log TXT', icon: ScrollText,  desc: 'Registro detallado de cada cambio'      },
]

export default function DataTable({ comunas, batchId }: Props) {
  // ── Estado de la tabla (preview) ──────────────────────────────
  const [previewSort, setPreviewSort] = useState<SortOrder>('none')
  const [showOriginal, setShowOriginal]     = useState(true)
  const [showNormalized, setShowNormalized] = useState(true)

  // ── Estado del modal de exportación ──────────────────────────
  const [modalOpen, setModalOpen]           = useState(false)
  const [exportFormat, setExportFormat]     = useState('csv')
  // A→Z por defecto: los archivos se entregan ordenados
  const [exportSort, setExportSort]         = useState<SortOrder>('asc')

  const modalRef = useRef<HTMLDivElement>(null)

  // Bloquear scroll del <html> mientras el modal esté abierto.
  // Se usa documentElement (no body) para no afectar el containing block
  // de los elementos position:fixed (lo que causaba el overlay incompleto).
  useEffect(() => {
    const html = document.documentElement
    if (modalOpen) {
      html.style.overflow = 'hidden'
    } else {
      html.style.overflow = ''
    }
    return () => { html.style.overflow = '' }
  }, [modalOpen])

  // Cerrar modal con Escape o clic fuera
  useEffect(() => {
    if (!modalOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false) }
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setModalOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [modalOpen])

  const previewRows = sortComunas(comunas, previewSort)

  // Ejecutar la descarga con el formato y orden elegidos en el modal
  const handleDownload = () => {
    if (!batchId) return
    const url = `/api/download?batchId=${batchId}&type=${exportFormat}&sortOrder=${exportSort}`
    window.open(url, '_blank')
    setModalOpen(false)
  }

  if (comunas.length === 0) {
    return (
      <div className="rounded-2xl border border-teal-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Sube un archivo para ver los resultados
      </div>
    )
  }

  return (
    <>
      {/* ── Tarjeta de tabla ───────────────────────────────────── */}
      <div className="rounded-2xl border border-teal-100 bg-white shadow-sm">

        {/* Barra superior */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Resultados ({previewRows.length})
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de columnas visibles */}
            <ColumnSelector
              showOriginal={showOriginal}
              showNormalized={showNormalized}
              onChange={(o, n) => { setShowOriginal(o); setShowNormalized(n) }}
            />

            {/* Orden de la tabla (solo preview, no afecta la descarga) */}
            <SortSelector value={previewSort} onChange={setPreviewSort} />

            {/* Botón de exportación → abre el modal */}
            {batchId && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-700 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar
              </button>
            )}
          </div>
        </div>

        {/* Tabla de datos */}
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-teal-50/80 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">#</th>
                {showOriginal && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Original</th>
                )}
                {showNormalized && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Normalizado</th>
                )}
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Región</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Habitantes</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((c, i) => (
                <tr key={`${c.original}-${i}`} className="border-t border-teal-50 transition-colors hover:bg-teal-50/30">
                  <td className="px-4 py-2 text-xs text-slate-400">{i + 1}</td>
                  {showOriginal && (
                    <td className="px-4 py-2 font-mono text-sm text-slate-600">{c.original}</td>
                  )}
                  {showNormalized && (
                    <td className="px-4 py-2 font-mono text-sm font-semibold text-slate-900">{c.normalized}</td>
                  )}
                  <td className="px-4 py-2 text-xs text-slate-500">{c.region ?? <span className="italic text-slate-300">—</span>}</td>
                  <td className="px-4 py-2 text-xs text-slate-500 tabular-nums">
                    {c.habitantes != null ? c.habitantes.toLocaleString('es-CL') : <span className="italic text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de exportación ──────────────────────────────── */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-800/50 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="mx-4 w-full max-w-md rounded-2xl border border-teal-100 bg-white shadow-2xl"
          >
            {/* Encabezado del modal */}
            <div className="flex items-center justify-between border-b border-teal-50 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Exportar datos</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {comunas.length} registros normalizados
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-4">

              {/* ── Sección 1: Formato ── */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Formato de archivo
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {EXPORT_FORMATS.map(({ type, label, icon: Icon, desc }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setExportFormat(type)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        exportFormat === type
                          ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-300'
                          : 'border-slate-100 bg-white hover:border-teal-200 hover:bg-teal-50/40'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          exportFormat === type ? 'text-teal-600' : 'text-slate-400'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-sm font-medium ${
                            exportFormat === type ? 'text-teal-800' : 'text-slate-700'
                          }`}
                        >
                          {label}
                        </span>
                        <p className="text-[11px] text-slate-400">{desc}</p>
                      </div>
                      {exportFormat === type && (
                        <div className="h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Sección 2: Orden (solo si no es Log) ── */}
              {exportFormat !== 'log' && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <ArrowDownUp className="mr-1 inline h-3 w-3" />
                    Orden de los datos en el archivo
                  </p>
                  <div className="flex gap-2">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setExportSort(opt.value)}
                        title={opt.description}
                        className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
                          exportSort === opt.value
                            ? 'border-teal-400 bg-teal-600 text-white shadow-sm'
                            : 'border-slate-100 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {SORT_OPTIONS.find((o) => o.value === exportSort)?.description}
                  </p>
                </div>
              )}
            </div>

            {/* ── Pie del modal: acciones ── */}
            <div className="flex items-center justify-end gap-2 border-t border-teal-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
              >
                <Download className="h-4 w-4" />
                Descargar
              </button>
            </div>
          </div>
        </div>,
        document.body   // Portal: renderiza fuera del árbol DOM del componente
      )}
    </>
  )
}
