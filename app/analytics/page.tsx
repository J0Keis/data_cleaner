'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, FileStack, List, Hash, Copy,
  TrendingUp, TrendingDown, BarChart3, FolderOpen,
} from 'lucide-react'
import SiteNavbar from '@/app/components/SiteNavbar'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { chartTooltipProps } from '@/app/lib/chart-config'

type Analytics = {
  totalBatches: number
  totalInput: number
  totalOutput: number
  totalDuplicates: number
  avgQualityBefore: number
  avgQualityAfter: number
  recent: {
    fileName: string
    module: 'Comunas' | 'Famosos' | 'Lugares'
    date: string
    input: number
    output: number
    duplicates: number
    qualityBefore: number | null
    qualityAfter: number | null
  }[]
}

// Configuración de las tarjetas de resumen
const SUMMARY_CONFIG = [
  { key: 'totalBatches',    label: 'Archivos procesados',     icon: FileStack,    bg: 'bg-teal-50',    border: 'border-teal-100',    iconColor: 'text-teal-600',    valueColor: 'text-teal-900'    },
  { key: 'totalInput',      label: 'Líneas totales',           icon: List,         bg: 'bg-sky-50',     border: 'border-sky-100',     iconColor: 'text-sky-600',     valueColor: 'text-sky-900'     },
  { key: 'totalOutput',     label: 'Únicos totales',           icon: Hash,         bg: 'bg-emerald-50', border: 'border-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-900' },
  { key: 'totalDuplicates', label: 'Duplicados eliminados',    icon: Copy,         bg: 'bg-amber-50',   border: 'border-amber-100',   iconColor: 'text-amber-600',   valueColor: 'text-amber-900'   },
  { key: 'avgQualityBefore',label: 'Calidad promedio antes',   icon: TrendingDown, bg: 'bg-rose-50',    border: 'border-rose-100',    iconColor: 'text-rose-500',    valueColor: 'text-rose-800',   suffix: '%' },
  { key: 'avgQualityAfter', label: 'Calidad promedio después', icon: TrendingUp,   bg: 'bg-green-50',   border: 'border-green-100',   iconColor: 'text-green-600',   valueColor: 'text-green-900',  suffix: '%' },
] as const

// Leyenda HTML — orden explícito, sin depender del orden de Recharts
function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-5">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

// Tick personalizado para el eje Y: recorta nombres largos
function YAxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const name = payload?.value ?? ''
  const display = name.length > 18 ? name.slice(0, 16) + '…' : name
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="#64748b" fontSize={10}>
      {display}
    </text>
  )
}

export default function ResumenPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setData(null); setLoading(false) })
  }, [])

  // ── Gráfico 1: calidad antes vs después — solo archivos con score calculado ──
  const qualityData = data?.recent
    .filter((r) => r.qualityBefore != null || r.qualityAfter != null)
    .slice()
    .reverse()
    .map((r) => ({
      label:   `${r.fileName} · ${r.module}`,
      antes:   r.qualityBefore ?? 0,
      despues: r.qualityAfter  ?? 0,
    })) ?? []

  // ── Gráfico 2: entrada, únicos y duplicados (horizontal, 1 grupo por archivo) ──
  const filesData = data?.recent.map((r) => ({
    label:      `${r.fileName} · ${r.module}`,
    entrada:    r.input,
    unicos:     r.output,
    duplicados: r.duplicates,
  })) ?? []

  // Altura dinámica según cantidad de archivos: cada grupo necesita espacio para sus barras
  const qualityH = Math.min(320, Math.max(140, qualityData.length * 64 + 48))
  const filesH   = Math.min(380, Math.max(140, filesData.length  * 76 + 48))

  return (
    <div className="min-h-screen bg-[#f4f9f7]">
      <SiteNavbar />

      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* ── Breadcrumb ── */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        {/* ── Título ── */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Resumen general</h1>
            <p className="text-sm text-slate-500">Métricas acumuladas de todos los archivos procesados</p>
          </div>
        </div>

        {/* ── Cargando ── */}
        {loading && (
          <p className="text-sm text-slate-400">Cargando métricas…</p>
        )}

        {/* ── Sin datos ── */}
        {!loading && (!data || data.totalBatches === 0) && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-teal-100 bg-white py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
              <FolderOpen className="h-7 w-7 text-teal-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700">Aún no hay archivos procesados</p>
              <p className="mt-1 text-sm text-slate-400">
                Sube un archivo en la pantalla principal para ver métricas aquí.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full bg-teal-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              Procesar archivo →
            </Link>
          </div>
        )}

        {/* ── Contenido principal ── */}
        {!loading && data && data.totalBatches > 0 && (
          <div className="space-y-5">

            {/* ── 1. Tarjetas de métricas ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SUMMARY_CONFIG.map((cfg) => {
                const raw   = data[cfg.key as keyof Analytics]
                const value = typeof raw === 'number' ? raw.toLocaleString('es-CL') : String(raw)
                return (
                  <div
                    key={cfg.key}
                    className={`rounded-2xl border ${cfg.border} bg-white p-4 shadow-sm`}
                  >
                    <div className={`mb-3 inline-flex rounded-xl p-2 ${cfg.bg}`}>
                      <cfg.icon className={`h-4 w-4 ${cfg.iconColor}`} />
                    </div>
                    <p className={`text-2xl font-bold tabular-nums ${cfg.valueColor}`}>
                      {value}{'suffix' in cfg ? cfg.suffix : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{cfg.label}</p>
                  </div>
                )
              })}
            </div>

            {/* ── 2. Calidad antes vs después — barras horizontales ── */}
            {qualityData.length > 0 && (
              <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
                <h2 className="mb-0.5 text-sm font-semibold text-slate-800">
                  Calidad antes vs después por archivo
                </h2>
                <p className="mb-5 text-xs text-slate-400">
                  Score de calidad normalizado — escala 0 a 100%
                </p>

                <div
                  className="chart-container w-full select-none"
                  style={{ height: qualityH }}
                  tabIndex={-1}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={qualityData}
                      barSize={13}
                      barGap={3}
                      barCategoryGap="35%"
                      margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
                      accessibilityLayer={false}
                      style={{ outline: 'none' }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" horizontal={false} />
                      {/* Eje X: valores numéricos 0–100 */}
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      {/* Eje Y: nombres de archivos */}
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={130}
                        tick={<YAxisTick />}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        {...chartTooltipProps}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any, key: any) => [
                          `${Number(v ?? 0)}%`,
                          key === 'antes' ? 'Antes' : 'Después',
                        ]}
                      />
                      <Bar
                        dataKey="antes"
                        name="Antes"
                        fill="#f59e0b"
                        radius={[0, 4, 4, 0]}
                        isAnimationActive={false}
                        activeBar={{ stroke: 'none', strokeWidth: 0 }}
                      />
                      <Bar
                        dataKey="despues"
                        name="Después"
                        fill="#0d9488"
                        radius={[0, 4, 4, 0]}
                        isAnimationActive={false}
                        activeBar={{ stroke: 'none', strokeWidth: 0 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <ChartLegend items={[
                  { color: '#f59e0b', label: 'Antes' },
                  { color: '#0d9488', label: 'Después' },
                ]} />
              </div>
            )}

            {/* ── 3. Archivos recientes — barras horizontales ── */}
            <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
              <h2 className="mb-0.5 text-sm font-semibold text-slate-800">Archivos recientes</h2>
              <p className="mb-5 text-xs text-slate-400">
                Últimos {filesData.length} archivos — líneas de entrada, registros únicos y duplicados eliminados
              </p>

              <div
                className="chart-container w-full select-none"
                style={{ height: filesH }}
                tabIndex={-1}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={filesData}
                    barSize={11}
                    barGap={3}
                    barCategoryGap="35%"
                    margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
                    accessibilityLayer={false}
                    style={{ outline: 'none' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={130}
                      tick={<YAxisTick />}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      {...chartTooltipProps}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: any, key: any) => {
                        const map: Record<string, string> = {
                          entrada: 'Entrada', unicos: 'Únicos', duplicados: 'Duplicados',
                        }
                        return [Number(v ?? 0).toLocaleString('es-CL'), map[key as string] ?? key]
                      }}
                    />
                    <Bar
                      dataKey="entrada"
                      name="Entrada"
                      fill="#14b8a6"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={false}
                      activeBar={{ stroke: 'none', strokeWidth: 0 }}
                    />
                    <Bar
                      dataKey="unicos"
                      name="Únicos"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={false}
                      activeBar={{ stroke: 'none', strokeWidth: 0 }}
                    />
                    <Bar
                      dataKey="duplicados"
                      name="Duplicados"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={false}
                      activeBar={{ stroke: 'none', strokeWidth: 0 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ChartLegend items={[
                { color: '#14b8a6', label: 'Entrada' },
                { color: '#10b981', label: 'Únicos' },
                { color: '#f59e0b', label: 'Duplicados' },
              ]} />
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
