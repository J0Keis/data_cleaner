'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Toaster, toast } from 'react-hot-toast'
import { MapPin, Database, Upload, X, Loader2, Table, ScrollText, FileText, Map, History } from 'lucide-react'
import SiteNavbar from '../components/SiteNavbar'
import LugaresStats from '../components/LugaresStats'
import LugaresTable from '../components/LugaresTable'
import LugaresBatchHistory, { type LugaresResponse } from '../components/LugaresBatchHistory'
import RulesConfig from '../components/RulesConfig'
import { getDefaultRules } from '../lib/etl-rules'
import dynamic from 'next/dynamic'

const MapaLugares = dynamic(() => import('../components/MapaLugares'), { ssr: false })

type Tab = 'datos' | 'mapa' | 'log'

interface LugarRow {
  id: string
  nombre: string
  georef: { latitud: number; longitud: number } | null
  direccion: { pais: string | null; ciudad_estado_provincia: string | null } | null
}

export default function PaginaLugares() {
  return <Suspense><PaginaLugaresInner /></Suspense>
}

function PaginaLugaresInner() {
  const [resultado, setResultado] = useState<LugaresResponse | null>(null)
  const [cargando, setCargando] = useState(false)
  const [tab, setTab] = useState<Tab>('datos')
  const [rules, setRules] = useState(getDefaultRules())
  const [lugaresData, setLugaresData] = useState<LugarRow[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const searchParams = useSearchParams()

  useEffect(() => {
    const batchId = searchParams.get('batch')
    if (!batchId) return
    const controller = new AbortController()
    fetch(`/api/lugares/batch?id=${batchId}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        const b = d.batch
        if (!b) return
        setResultado({ batchId: b.id, fileName: b.file_name, totalInput: b.total_input, totalOutput: b.total_output, duplicateCount: b.duplicates, logs: [] })
        setTab('datos')
      })
      .catch((e: unknown) => { if (e instanceof Error && e.name !== 'AbortError') console.warn(e) })
    return () => controller.abort()
  }, [searchParams])

  const procesarArchivo = useCallback(async (archivo: File) => {
    const ext = archivo.name.toLowerCase()
    if (!ext.endsWith('.txt') && !ext.endsWith('.csv') && !ext.endsWith('.tsv')) {
      toast.error('Solo se aceptan archivos .txt, .csv o .tsv')
      return
    }
    setCargando(true)
    try {
      const form = new FormData()
      form.append('file', archivo)
      form.append('rules', JSON.stringify(rules))
      const res = await fetch('/api/lugares/process', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Error al procesar el archivo'); return }
      setResultado(data)
      setTab('datos')
      setRefreshKey(k => k + 1)
      toast.success(`${data.totalOutput} lugares procesados`)
    } catch {
      toast.error('Error de red al procesar el archivo')
    } finally {
      setCargando(false)
    }
  }, [rules])

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) procesarArchivo(accepted[0])
  }, [procesarArchivo])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: cargando,
  })

  useEffect(() => {
    if (!resultado?.batchId) { setLugaresData([]); return }
    const controller = new AbortController()
    fetch(`/api/lugares/batch?id=${resultado.batchId}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => setLugaresData(d.batch?.lugares ?? []))
      .catch(() => {})
    return () => controller.abort()
  }, [resultado?.batchId])

  function handleBatchDelete(id: string) {
    if (resultado?.batchId === id) setResultado(null)
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      <SiteNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-5 items-start">

          {/* ── Columna principal ── */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Cabecera */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-100 rounded-xl">
                <MapPin className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Lugares Turísticos</h2>
                <p className="text-xs text-slate-500">Normalización de nombres, direcciones y georeferencias</p>
              </div>
            </div>

            {/* Zona de carga */}
            <section className="bg-white rounded-2xl border border-teal-100 p-4 sm:p-6 space-y-3 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cargar archivo de lugares</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Formato:{' '}
                  <code className="bg-teal-50 px-1 rounded text-teal-700">Nombre;Dirección;Lat, Lon</code>
                  {' '}— separador{' '}
                  <code className="bg-teal-50 px-1 rounded text-teal-700">;</code>
                  {' '}detectado automáticamente
                </p>
              </div>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-teal-500 bg-teal-50' : 'border-teal-200 hover:border-teal-400 hover:bg-teal-50/40'}
                  ${cargando ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  {cargando
                    ? <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                    : <Upload className="w-10 h-10 text-teal-400" />
                  }
                  <div>
                    {cargando ? (
                      <p className="text-teal-600 font-medium">Procesando…</p>
                    ) : isDragActive ? (
                      <p className="text-teal-600 font-medium">Suelta el archivo aquí</p>
                    ) : (
                      <>
                        <p className="font-medium text-slate-700">Arrastra tu archivo aquí</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Acepta{' '}
                          <code className="bg-teal-50 px-1 rounded">.txt</code>{' '}
                          <code className="bg-teal-50 px-1 rounded">.csv</code>{' '}
                          <code className="bg-teal-50 px-1 rounded">.tsv</code>
                          {' '}— o haz clic para seleccionar
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <RulesConfig rules={rules} onChange={setRules} />
            </section>

            {/* Resultados */}
            {resultado && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Resultados — {resultado.fileName}
                  </p>
                  <button
                    onClick={() => setResultado(null)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 border border-teal-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Limpiar
                  </button>
                </div>

                <LugaresStats
                  totalInput={resultado.totalInput}
                  totalOutput={resultado.totalOutput}
                  duplicateCount={resultado.duplicateCount}
                />

                <div className="bg-white rounded-2xl border border-teal-100 overflow-hidden shadow-sm">
                  <div className="flex border-b border-teal-50">
                    {([
                      { id: 'datos', label: 'Datos procesados', icon: Table      },
                      { id: 'mapa',  label: 'Mapa mundial',     icon: Map        },
                      { id: 'log',   label: 'Log de proceso',   icon: ScrollText },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex items-center gap-1.5 px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors
                          ${tab === id
                            ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50'
                            : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className={tab === 'mapa' ? '' : 'p-3 sm:p-6'}>
                    {tab === 'datos' && <LugaresTable batchId={resultado.batchId} />}
                    {tab === 'mapa'  && (
                      <MapaLugares
                        lugares={lugaresData
                          .filter(l => l.georef)
                          .map(l => ({
                            id:     l.id,
                            nombre: l.nombre,
                            lat:    l.georef!.latitud,
                            lon:    l.georef!.longitud,
                            pais:   l.direccion?.pais,
                            ciudad: l.direccion?.ciudad_estado_provincia,
                          }))}
                      />
                    )}
                    {tab === 'log' && <LogLugares logs={resultado.logs.length ? resultado.logs : derivarLogLugares(lugaresData)} />}
                  </div>
                </div>
              </>
            )}

            {!resultado && (
              <div className="text-center py-16 text-slate-300">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Carga un archivo para ver los resultados</p>
              </div>
            )}
          </div>

          {/* ── Panel lateral: historial ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-teal-50 bg-teal-50/40">
                <History className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-700">Historial de archivos</h3>
              </div>
              <div className="p-4">
                <LugaresBatchHistory
                  refreshKey={refreshKey}
                  onLoad={data => { setResultado(data); setTab('datos') }}
                  onDelete={handleBatchDelete}
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

/** Deriva un log legible desde los lugares ya guardados, para que la pestaña
 *  "Log de proceso" no quede vacía al cargar un batch del historial (P2). */
function derivarLogLugares(lugares: LugarRow[]): string[] {
  return lugares.map((l, i) => {
    const dir    = [l.direccion?.ciudad_estado_provincia, l.direccion?.pais].filter(Boolean).join(', ')
    const coords = l.georef ? ` (${l.georef.latitud}, ${l.georef.longitud})` : ''
    return `Línea ${i + 1}: ${l.nombre} — ${dir || 's/dirección'}${coords}`
  })
}

function LogLugares({ logs }: { logs: string[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Carga un archivo para ver el log detallado</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-teal-100 overflow-hidden">
      <div className="max-h-[500px] overflow-y-auto divide-y divide-teal-50">
        {logs.map((linea, i) => {
          const esDuplicado = linea.includes('DUPLICADO')
          return (
            <div key={i} className="px-4 py-2.5 hover:bg-teal-50/40 flex items-start gap-3">
              <span className="text-xs text-slate-400 w-8 shrink-0 pt-0.5 font-mono">
                {String(i + 1).padStart(3, '0')}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                esDuplicado ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
              }`}>
                {esDuplicado ? 'Duplicado' : 'OK'}
              </span>
              <p className="text-xs text-slate-600 font-mono leading-relaxed">{linea}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
