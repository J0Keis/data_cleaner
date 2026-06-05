'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search, X, Download, FileText, FileJson, Cake, ArrowUpDown, Check, Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react'

interface FamosoRow {
  id: string
  nombre: string
  fecha_original: string
  fecha_nacimiento: string | null
  fecha_aprox: string | null
  edad: number | null
  es_cumpleanios: number
}

interface ImagenData { url: string | null; fuente: string | null; fecha: string | null; cached: boolean }

/** Formatea el timestamp ISO de captura a "DD-MM-YYYY HH:MM" legible. */
function formatCaptura(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso // compatibilidad con registros viejos (solo fecha)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function ModalImagen({ famoso, onClose }: { famoso: FamosoRow; onClose: () => void }) {
  const [datos, setDatos]     = useState<ImagenData | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    setCargando(true); setError(null)
    fetch(`/api/famosos/imagen?nombre=${encodeURIComponent(famoso.nombre)}&id=${famoso.id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setDatos(d) })
      .catch(() => setError('Error de red'))
      .finally(() => setCargando(false))
  }, [famoso.id, famoso.nombre])

  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-teal-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-teal-50">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{famoso.nombre}</h2>
            <p className="text-xs text-slate-400">{famoso.fecha_nacimiento ?? famoso.fecha_aprox ?? famoso.fecha_original}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-teal-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Imagen */}
        <div className="flex flex-col items-center justify-center p-6 gap-4 min-h-[260px]">
          {cargando && <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {!cargando && !error && datos?.url && (
            <img
              src={datos.url}
              alt={famoso.nombre}
              className="rounded-xl object-contain max-h-56 w-auto shadow-md"
            />
          )}
          {!cargando && !error && !datos?.url && (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <ImageIcon className="w-12 h-12 opacity-30" />
              <p className="text-sm">No se encontró imagen en Wikipedia</p>
            </div>
          )}
        </div>

        {/* Datos del famoso */}
        <div className="flex flex-wrap items-center justify-center gap-2 px-5 pb-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Edad: {famoso.edad != null ? `${famoso.edad} años` : '—'}
          </span>
          {famoso.es_cumpleanios === 1 && (
            <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
              <Cake className="h-3 w-3" />
              ¡Cumpleaños hoy!
            </span>
          )}
        </div>

        {/* Footer con fuente */}
        {datos?.fuente && (
          <div className="px-5 py-3 border-t border-teal-50 bg-teal-50/40 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fuente</p>
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(famoso.nombre)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-teal-600 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Wikipedia — {famoso.nombre}
            </a>
            <p className="text-[10px] text-slate-400">
              Capturada: {formatCaptura(datos.fecha)}
              {datos.cached && ' · desde caché'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface FamososTableProps {
  batchId: string
  famosos?: FamosoRow[] | null
}

const PAGE_SIZE = 20

export default function FamososTable({ batchId, famosos: famososProp }: FamososTableProps) {
  const [famososLocales, setFamososLocales] = useState<FamosoRow[]>([])
  const [cargandoInterno, setCargandoInterno] = useState(famososProp === undefined)
  const [page, setPage] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [soloCumpleanos, setSoloCumpleanos] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [ordenado, setOrdenado] = useState(false)
  const [descargando, setDescargando] = useState<string | null>(null)

  useEffect(() => {
    if (famososProp !== undefined) return
    const ctrl = new AbortController()
    setCargandoInterno(true)
    fetch(`/api/famosos/batch?id=${batchId}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setFamososLocales(d.batch?.famosos ?? []))
      .catch(() => { /* cancelado */ })
      .finally(() => setCargandoInterno(false))
    return () => ctrl.abort()
  }, [batchId, famososProp])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMostrarModal(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const famosos: FamosoRow[] = famososProp !== undefined && famososProp !== null ? famososProp : famososLocales
  const cargando = famososProp === null || cargandoInterno
  const [famosoImagen, setFamosoImagen] = useState<FamosoRow | null>(null)

  useEffect(() => { setPage(1) }, [busqueda, soloCumpleanos])

  const filtrados = famosos.filter(f => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = q === '' || f.nombre.toLowerCase().includes(q) ||
      (f.fecha_nacimiento ?? '').includes(q) || (f.fecha_aprox ?? '').toLowerCase().includes(q)
    const coincideCumple = !soloCumpleanos || f.es_cumpleanios === 1
    return coincideBusqueda && coincideCumple
  })

  const totalPaginas = Math.ceil(filtrados.length / PAGE_SIZE)
  const slice = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hayFiltros = busqueda !== '' || soloCumpleanos

  function descargar(tipo: string) {
    setDescargando(tipo)
    const rows = ordenado ? [...famosos].sort((a, b) => a.nombre.localeCompare(b.nombre)) : famosos
    let content = ''
    let mime = 'text/plain'
    let ext = tipo

    if (tipo === 'csv') {
      mime = 'text/csv'
      content = 'nombre,fecha_original,fecha_nacimiento,fecha_aprox,edad,es_cumpleanios\n' +
        rows.map(r => `"${r.nombre}","${r.fecha_original}","${r.fecha_nacimiento ?? ''}","${r.fecha_aprox ?? ''}","${r.edad ?? ''}","${r.es_cumpleanios}"`).join('\n')
    } else if (tipo === 'json') {
      mime = 'application/json'
      content = JSON.stringify(rows, null, 2)
    } else {
      content = rows.map(r => {
        const fecha  = r.fecha_nacimiento ?? r.fecha_aprox ?? r.fecha_original
        const edad   = r.edad != null ? `${r.edad} años` : 'edad N/D'
        const cumple = r.es_cumpleanios === 1 ? ' · 🎂 ¡cumpleaños hoy!' : ''
        return `${r.nombre} — ${fecha} — ${edad}${cumple}`
      }).join('\n')
      ext = 'txt'
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `famosos_${batchId.slice(0, 8)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDescargando(null), 1500)
  }

  if (cargando) {
    return <div className="text-center py-10 text-slate-400">Cargando famosos…</div>
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
              placeholder="Buscar por nombre o fecha…"
              className="pl-8 pr-8 py-1.5 text-sm border border-teal-100 bg-white text-slate-800 rounded-lg focus:outline-none focus:border-teal-400 w-56"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={soloCumpleanos} onChange={e => setSoloCumpleanos(e.target.checked)} className="w-3.5 h-3.5 accent-rose-500" />
            <Cake className="w-3.5 h-3.5 text-rose-400" />
            Solo cumpleaños
          </label>

          {hayFiltros && (
            <button onClick={() => { setBusqueda(''); setSoloCumpleanos(false) }} className="text-xs text-teal-600 hover:underline">
              Limpiar filtros
            </button>
          )}

          <span className="text-sm text-slate-500">{filtrados.length} registros{hayFiltros && ` de ${famosos.length}`}</span>
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
              <th className="px-4 py-3 text-left">Fecha original</th>
              <th className="px-4 py-3 text-left">Fecha normalizada</th>
              <th className="px-4 py-3 text-left w-16">Edad</th>
              <th className="px-4 py-3 text-center w-12" aria-label="Cumpleaños hoy">
                <Cake className="w-3.5 h-3.5 inline text-rose-400" />
              </th>
              <th className="px-4 py-3 text-center w-20">Imagen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-50">
            {slice.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">Sin resultados para esta búsqueda</td>
              </tr>
            ) : (
              slice.map((f, i) => (
                <tr key={f.id} className={`hover:bg-teal-50/40 ${f.es_cumpleanios === 1 ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-4 py-3 text-slate-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{f.nombre}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{f.fecha_original}</td>
                  <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                    {f.fecha_nacimiento ?? (
                      <span className="text-amber-600 italic">{f.fecha_aprox}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.edad != null ? f.edad : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {f.es_cumpleanios === 1 && <Cake className="w-4 h-4 text-rose-500 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setFamosoImagen(f)}
                      className="flex items-center gap-1 mx-auto text-xs text-teal-600 hover:text-teal-800 border border-teal-200 hover:border-teal-400 px-2 py-1 rounded-lg transition-colors"
                    >
                      <ImageIcon className="w-3 h-3" />
                      Ver
                    </button>
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

      {/* Modal imagen Wikipedia */}
      {famosoImagen && (
        <ModalImagen famoso={famosoImagen} onClose={() => setFamosoImagen(null)} />
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
                  <h2 className="text-base font-semibold text-slate-900">Exportar famosos</h2>
                  <p className="text-xs text-slate-400">{famosos.length} registros</p>
                </div>
              </div>
              <button onClick={() => setMostrarModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-teal-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Toggle A→Z */}
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

              {/* Botones formato */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Formato de exportación</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { tipo: 'csv',  label: 'CSV',  desc: 'Excel compatible', icono: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { tipo: 'json', label: 'JSON', desc: 'Para APIs',        icono: FileJson, color: 'text-amber-600',   bg: 'bg-amber-50'   },
                    { tipo: 'txt',  label: 'TXT',  desc: 'Texto plano',      icono: FileText, color: 'text-teal-600',    bg: 'bg-teal-50'    },
                  ].map(({ tipo, label, desc, icono: Icono, color, bg }) => (
                    <button
                      key={tipo}
                      onClick={() => descargar(tipo)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-teal-100 hover:border-teal-200 hover:shadow-sm transition-all"
                    >
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
