'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search, X, Download, FileText, FileJson, MapPin, ArrowUpDown, Check } from 'lucide-react'

interface Georef { latitud: number; longitud: number }
interface Direccion {
  nombre_calle: string | null
  numero_calle: string | null
  ciudad_estado_provincia: string | null
  pais: string | null
  raw_direccion: string
}
interface LugarRow { id: string; nombre: string; georef: Georef | null; direccion: Direccion | null }

interface LugaresTableProps { batchId: string }

const PAGE_SIZE = 20

export default function LugaresTable({ batchId }: LugaresTableProps) {
  const [lugares, setLugares] = useState<LugarRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [page, setPage] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [ordenado, setOrdenado] = useState(false)
  const [descargando, setDescargando] = useState<string | null>(null)

  useEffect(() => {
    setCargando(true)
    const ctrl = new AbortController()
    fetch(`/api/lugares/batch?id=${batchId}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setLugares(d.batch?.lugares ?? []))
      .catch(() => { /* cancelado */ })
      .finally(() => setCargando(false))
    return () => ctrl.abort()
  }, [batchId])

  useEffect(() => { setPage(1) }, [busqueda])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMostrarModal(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const filtrados = lugares.filter(l => {
    const q = busqueda.toLowerCase()
    return q === '' ||
      l.nombre.toLowerCase().includes(q) ||
      (l.direccion?.pais ?? '').toLowerCase().includes(q) ||
      (l.direccion?.ciudad_estado_provincia ?? '').toLowerCase().includes(q)
  })

  const totalPaginas = Math.ceil(filtrados.length / PAGE_SIZE)
  const slice = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hayFiltros = busqueda !== ''

  function descargar(tipo: string) {
    setDescargando(tipo)
    const rows = ordenado ? [...lugares].sort((a, b) => a.nombre.localeCompare(b.nombre)) : lugares
    let content = ''
    let mime = 'text/plain'
    let ext = tipo

    if (tipo === 'csv') {
      mime = 'text/csv'
      content = 'nombre,pais,ciudad,latitud,longitud\n' +
        rows.map(r => `"${r.nombre}","${r.direccion?.pais ?? ''}","${r.direccion?.ciudad_estado_provincia ?? ''}","${r.georef?.latitud ?? ''}","${r.georef?.longitud ?? ''}"`).join('\n')
    } else if (tipo === 'json') {
      mime = 'application/json'
      content = JSON.stringify(rows, null, 2)
    } else {
      content = rows.map(r => {
        const coords = r.georef ? `(${r.georef.latitud}, ${r.georef.longitud})` : ''
        return `${r.nombre} — ${r.direccion?.raw_direccion ?? ''} ${coords}`
      }).join('\n')
      ext = 'txt'
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lugares_${batchId.slice(0, 8)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDescargando(null), 1500)
  }

  if (cargando) {
    return <div className="text-center py-10 text-slate-400">Cargando lugares…</div>
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o país…"
              className="pl-8 pr-8 py-1.5 text-sm border border-teal-100 bg-white text-slate-800 rounded-lg focus:outline-none focus:border-teal-400 w-56"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {hayFiltros && <button onClick={() => setBusqueda('')} className="text-xs text-teal-600 hover:underline">Limpiar filtros</button>}
          <span className="text-sm text-slate-500">{filtrados.length} registros{hayFiltros && ` de ${lugares.length}`}</span>
        </div>

        <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 text-sm bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-teal-100">
        <table className="w-full text-sm">
          <thead className="bg-teal-50 text-teal-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left w-12">#</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">País</th>
              <th className="px-4 py-3 text-left">Ciudad / Estado</th>
              <th className="px-4 py-3 text-left">Coordenadas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-50">
            {slice.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">Sin resultados para esta búsqueda</td></tr>
            ) : (
              slice.map((l, i) => (
                <tr key={l.id} className="hover:bg-teal-50/40">
                  <td className="px-4 py-3 text-slate-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-teal-500 shrink-0" />
                      {l.nombre}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{l.direccion?.pais ?? <span className="text-slate-300 italic">—</span>}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{l.direccion?.ciudad_estado_provincia ?? <span className="text-slate-300 italic">—</span>}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {l.georef ? `${l.georef.latitud.toFixed(4)}, ${l.georef.longitud.toFixed(4)}` : <span className="text-slate-300 italic">sin georef</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-teal-100 disabled:opacity-40 hover:bg-teal-50 text-slate-600">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600">Página {page} de {totalPaginas}</span>
          <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page === totalPaginas} className="p-2 rounded-lg border border-teal-100 disabled:opacity-40 hover:bg-teal-50 text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal exportación */}
      {mostrarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setMostrarModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-teal-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-teal-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <Download className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Exportar lugares</h2>
                  <p className="text-xs text-slate-400">{lugares.length} registros</p>
                </div>
              </div>
              <button onClick={() => setMostrarModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-teal-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div
                onClick={() => setOrdenado(s => !s)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none
                  ${ordenado ? 'border-teal-500 bg-teal-50' : 'border-teal-100 hover:border-teal-200'}`}
              >
                <div className="flex items-center gap-3">
                  <ArrowUpDown className={`w-5 h-5 ${ordenado ? 'text-teal-600' : 'text-slate-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${ordenado ? 'text-teal-700' : 'text-slate-700'}`}>Ordenar A → Z</p>
                    <p className="text-xs text-slate-400">Exportar en orden alfabético por nombre</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${ordenado ? 'bg-teal-500' : 'bg-slate-200'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${ordenado ? 'left-5' : 'left-1'}`} />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Formato de exportación</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { tipo: 'csv',  label: 'CSV',  desc: 'Excel compatible', icono: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { tipo: 'json', label: 'JSON', desc: 'Para APIs',        icono: FileJson, color: 'text-amber-600',   bg: 'bg-amber-50'   },
                    { tipo: 'txt',  label: 'TXT',  desc: 'Texto plano',      icono: FileText, color: 'text-teal-600',    bg: 'bg-teal-50'    },
                  ].map(({ tipo, label, desc, icono: Icono, color, bg }) => (
                    <button key={tipo} onClick={() => descargar(tipo)} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-teal-100 hover:border-teal-200 hover:shadow-sm transition-all">
                      <div className={`p-2.5 rounded-lg ${bg}`}>
                        {descargando === tipo ? <Check className={`w-5 h-5 ${color}`} /> : <Icono className={`w-5 h-5 ${color}`} />}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
