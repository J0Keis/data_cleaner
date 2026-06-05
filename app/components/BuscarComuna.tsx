'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Search, MapPin, Loader2, Plus, Database, Users, ChevronDown } from 'lucide-react'
import { sugerirComunas } from '@/app/lib/comunas-chile'
import type { CaseMode } from '@/app/lib/normalizer'

interface ResultadoComuna {
  original: string
  normalized: string
  region: string | null
  habitantes: number | null
  fuente: string
}

interface ConsolidadaRow {
  nombre: string
  region: string | null
  habitantes: number | null
  fuente: string | null
}

const FUENTE_BADGE: Record<string, { txt: string; cls: string }> = {
  api:           { txt: 'API oficial',   cls: 'bg-emerald-100 text-emerald-700' },
  local:         { txt: 'Dataset local', cls: 'bg-amber-100 text-amber-700' },
  no_encontrado: { txt: 'No encontrada', cls: 'bg-red-100 text-red-700' },
}

function badge(fuente: string | null) {
  return FUENTE_BADGE[fuente ?? ''] ?? { txt: fuente ?? '—', cls: 'bg-slate-100 text-slate-500' }
}

/**
 * Buscador individual de comunas (Parte I, criterios 1 y 7).
 * Permite ingresar una comuna sin subir archivo, con sugerencias por similitud
 * ("florida" → "Florida"/"La Florida"). Al elegir: normaliza, enriquece con la
 * API real y consolida (upsert anti-duplicados) en la estructura final.
 */
export default function BuscarComuna({ caseMode }: { caseMode: CaseMode }) {
  const [query, setQuery]               = useState('')
  const [abierto, setAbierto]           = useState(false)
  const [cargando, setCargando]         = useState(false)
  const [resultado, setResultado]       = useState<ResultadoComuna | null>(null)
  const [consolidadas, setConsolidadas] = useState<ConsolidadaRow[]>([])
  const [verLista, setVerLista]         = useState(false)
  const [activeIdx, setActiveIdx]       = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  const sugerencias = useMemo(() => sugerirComunas(query, 6), [query])

  function cargarConsolidadas() {
    fetch('/api/comunas/consolidadas')
      .then((r) => r.json())
      .then((d) => setConsolidadas(d.comunas ?? []))
      .catch(() => {})
  }

  useEffect(() => { cargarConsolidadas() }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function agregar(nombre: string) {
    if (!nombre.trim() || cargando) return
    setCargando(true)
    setAbierto(false)
    try {
      const res = await fetch('/api/comunas/single', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre, caseMode }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al procesar la comuna')
        return
      }
      setResultado(data)
      setQuery('')
      if (data.fuente === 'no_encontrado') {
        toast('Comuna no encontrada en la fuente oficial', { icon: '⚠️' })
      } else {
        toast.success(`${data.normalized} consolidada`)
      }
      cargarConsolidadas()
    } catch {
      toast.error('Error de red')
    } finally {
      setCargando(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (abierto && sugerencias.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, sugerencias.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); return }
      if (e.key === 'Escape')    { setAbierto(false); return }
      if (e.key === 'Enter')     { e.preventDefault(); agregar(sugerencias[activeIdx] ?? query); return }
    } else if (e.key === 'Enter' && query.trim()) {
      e.preventDefault(); agregar(query)
    }
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-white shadow-sm">
      <div className="border-b border-teal-50 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-800">Buscar una comuna</h3>
        <p className="text-[11px] text-slate-400">
          Escribe el nombre y elige una sugerencia — sin subir archivo
        </p>
      </div>

      <div className="space-y-4 p-4">
        {/* Input + sugerencias */}
        <div ref={boxRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setAbierto(true); setActiveIdx(0) }}
              onFocus={() => setAbierto(true)}
              onKeyDown={onKeyDown}
              placeholder='Ej: "florida", "viña", "temuco"…'
              className="w-full rounded-xl border border-teal-100 bg-white py-2.5 pl-9 pr-24 text-sm text-slate-800 focus:border-teal-400 focus:outline-none"
            />
            <button
              onClick={() => agregar(query)}
              disabled={!query.trim() || cargando}
              className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-40"
            >
              {cargando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Agregar
            </button>
          </div>

          {abierto && sugerencias.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-teal-100 bg-white shadow-lg">
              {sugerencias.map((s, i) => (
                <li key={s}>
                  <button
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => agregar(s)}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                      i === activeIdx ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-teal-50/60'
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Resultado de la última comuna agregada */}
        {resultado && (
          <div className="rounded-xl border border-teal-100 bg-teal-50/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 line-through">{resultado.original}</span>
                <span className="text-slate-300">→</span>
                <span className="text-sm font-semibold text-slate-800">{resultado.normalized}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge(resultado.fuente).cls}`}>
                {badge(resultado.fuente).txt}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-teal-500" />
                {resultado.region ?? 'Región desconocida'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-teal-500" />
                {resultado.habitantes != null ? `${resultado.habitantes.toLocaleString('es-CL')} hab` : 'Población s/d'}
              </span>
            </div>
          </div>
        )}

        {/* Estructura final consolidada (demuestra que no duplica) */}
        <div className="rounded-xl border border-teal-50">
          <button
            onClick={() => setVerLista((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-left"
          >
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Database className="h-3.5 w-3.5 text-teal-500" />
              Estructura final consolidada
              <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-700">
                {consolidadas.length}
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${verLista ? 'rotate-180' : ''}`} />
          </button>

          {verLista && (
            <div className="max-h-56 overflow-y-auto border-t border-teal-50">
              {consolidadas.length === 0 ? (
                <p className="px-3 py-4 text-center text-[11px] text-slate-400">
                  Aún no hay comunas consolidadas
                  <br />
                  <span className="text-slate-300">(o falta aplicar schema_v4.sql en Supabase)</span>
                </p>
              ) : (
                <ul className="divide-y divide-teal-50">
                  {consolidadas.map((c) => (
                    <li key={c.nombre} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
                      <span className="font-medium text-slate-700">{c.nombre}</span>
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="hidden sm:inline">{c.region ?? '—'}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${badge(c.fuente).cls}`}>
                          {badge(c.fuente).txt}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
