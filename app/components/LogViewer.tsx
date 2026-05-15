'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { esDuplicadoTipo, tipoCambioEspanol, type LogTipoCambio } from '@/app/lib/log-labels'

type LogEntry = {
  line_number: number
  original: string
  normalized: string
  change_type: string
  detail: string | null
}

type Props = {
  batchId?: string
}

const TYPE_COLORS: Record<LogTipoCambio, string> = {
  NORMALIZADO: 'text-sky-700 bg-sky-50',
  DUPLICADO: 'text-amber-800 bg-amber-50',
  CORREGIDO: 'text-violet-800 bg-violet-50',
  SIN_CAMBIO: 'text-slate-600 bg-slate-100',
  VACIO: 'text-slate-500 bg-slate-50',
}

const FILTROS_TIPO: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'NORMALIZADO', label: 'Normalizados' },
  { value: 'DUPLICADO', label: 'Duplicados' },
  { value: 'CORREGIDO', label: 'Corregidos' },
  { value: 'SIN_CAMBIO', label: 'Sin cambios' },
  { value: 'VACIO', label: 'Vacíos' },
]

/** Filtro según texto del campo detalle (transformaciones aplicadas) */
const FILTROS_DETALLE: { value: string; label: string; match: (detail: string | null) => boolean }[] =
  [
    {
      value: 'all',
      label: 'Todas las acciones',
      match: () => true,
    },
    {
      value: 'tildes',
      label: 'Tildes / eñes',
      match: (d) => !!d && (d.includes('tildes') || d.includes('eñes')),
    },
    {
      value: 'espacios',
      label: 'Espacios',
      match: (d) => !!d && d.includes('espacios'),
    },
    {
      value: 'capitalizacion',
      label: 'Capitalización',
      match: (d) => !!d && d.includes('capitaliz'),
    },
    {
      value: 'fuzzy',
      label: 'Corrección (lista INE)',
      match: (d) =>
        !!d &&
        (d.includes('corrección ortográfica') ||
          d.includes('lista de referencia') ||
          d.includes('fuzzy')),
    },
    {
      value: 'solo_duplicado',
      label: 'Solo repetidos',
      match: (d) => !!d && d.toLowerCase().includes('duplicado'),
    },
  ]

function textoCoincide(entry: LogEntry, q: string): boolean {
  if (!q.trim()) return true
  const haystack = [
    entry.original,
    entry.normalized,
    entry.detail ?? '',
    String(entry.line_number),
  ]
    .join(' \n ')
    .toLowerCase()

  const normalizedQuery = q.trim().toLowerCase()
  if (haystack.includes(normalizedQuery)) return true

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  return tokens.every((t) => haystack.includes(t))
}

export default function LogViewer({ batchId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [filterDetalle, setFilterDetalle] = useState<string>('all')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (!batchId) {
      setLogs([])
      return
    }

    setLoading(true)
    fetch(`/api/logs?batchId=${batchId}`)
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [batchId])

  const filtered = useMemo(() => {
    const porTipo =
      filterTipo === 'all'
        ? logs
        : logs.filter((l) => tipoCambioEspanol(l.change_type) === filterTipo)

    const def = FILTROS_DETALLE.find((f) => f.value === filterDetalle)
    const porDetalle = def ? porTipo.filter((l) => def.match(l.detail)) : porTipo

    return porDetalle.filter((l) => textoCoincide(l, busqueda))
  }, [logs, filterTipo, filterDetalle, busqueda])

  useEffect(() => {
    if (!batchId) return
    setFilterTipo('all')
    setFilterDetalle('all')
    setBusqueda('')
  }, [batchId])

  if (!batchId) {
    return (
      <div className="rounded-2xl border border-teal-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        El registro aparecerá después de procesar un archivo
      </div>
    )
  }

  const hayFiltros =
    filterTipo !== 'all' || filterDetalle !== 'all' || busqueda.trim().length > 0

  return (
    <div className="rounded-2xl border border-teal-100 bg-white shadow-sm">
      <div className="space-y-3 border-b border-teal-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">
            Registro de cambios ({filtered.length}
            {hayFiltros && logs.length > 0 ? ` de ${logs.length}` : ''})
          </h3>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="rounded-lg border border-teal-100 bg-white px-2 py-1.5 text-xs text-slate-700"
              aria-label="Filtrar por tipo de registro"
            >
              {FILTROS_TIPO.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              value={filterDetalle}
              onChange={(e) => setFilterDetalle(e.target.value)}
              className="rounded-lg border border-teal-100 bg-white px-2 py-1.5 text-xs text-slate-700"
              aria-label="Filtrar por acción en el detalle"
            >
              {FILTROS_DETALLE.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por línea, texto original, normalizado o detalle..."
            className="w-full rounded-lg border border-teal-100 bg-teal-50/30 py-2 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        {hayFiltros && (
          <button
            type="button"
            onClick={() => {
              setFilterTipo('all')
              setFilterDetalle('all')
              setBusqueda('')
            }}
            className="text-xs font-medium text-teal-700 underline decoration-teal-300 hover:text-teal-900"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <p className="p-4 text-sm text-slate-500">Cargando registro...</p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          No hay registros que coincidan con los filtros.
        </p>
      ) : (
        <div className="max-h-80 overflow-auto p-2">
          {filtered.map((log) => {
            const tipoEs = tipoCambioEspanol(log.change_type)
            return (
              <div
                key={log.line_number}
                className="flex items-start gap-2 border-b border-teal-50/80 px-2 py-2 text-xs"
              >
                <span className="w-12 shrink-0 text-slate-400">
                  {String(log.line_number).padStart(4, '0')}
                </span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${
                    TYPE_COLORS[tipoEs] ?? TYPE_COLORS.SIN_CAMBIO
                  }`}
                >
                  {tipoEs}
                </span>
                <span className="min-w-0 break-all font-mono text-slate-700">
                  {esDuplicadoTipo(log.change_type) ? (
                    <>
                      &quot;{log.original}&quot; → {log.detail}
                    </>
                  ) : (
                    <>
                      &quot;{log.original}&quot; → &quot;{log.normalized}&quot;
                      {log.detail && <span className="text-slate-400"> ({log.detail})</span>}
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
