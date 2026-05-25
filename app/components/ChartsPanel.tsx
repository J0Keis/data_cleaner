'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { chartAxisProps, chartMargin, chartTooltipProps } from '@/app/lib/chart-config'

type Props = {
  totalInput: number
  totalOutput: number
  duplicates: number
  changes: number
}

// Paleta: teal → emerald → amber → violet
const BAR_COLORS = ['#14b8a6', '#10b981', '#f59e0b', '#8b5cf6']
const PIE_COLORS = ['#10b981', '#f59e0b']

export default function ChartsPanel({ totalInput, totalOutput, duplicates, changes }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (totalInput === 0) return null
  if (!mounted) return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm h-[264px]" />
      <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm h-[264px]" />
    </div>
  )

  const barData = [
    { name: 'Entrada', valor: totalInput },
    { name: 'Únicos', valor: totalOutput },
    { name: 'Duplicados', valor: duplicates },
    { name: 'Cambios', valor: changes },
  ]

  const pieData = [
    { name: 'Únicos', value: totalOutput },
    { name: 'Duplicados', value: duplicates },
  ].filter((d) => d.value > 0)

  // Total real para calcular porcentajes en la leyenda
  const pieTotal = totalOutput + duplicates

  return (
    <div className="grid gap-4 md:grid-cols-2">

      {/* ── Gráfico de barras ── */}
      <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">Resumen del procesamiento</h3>
        <p className="mb-4 text-xs text-slate-400">Líneas analizadas por categoría</p>

        {/* tabIndex=-1 evita que el clic active el foco nativo del SVG */}
        <div className="chart-container h-[180px] w-full select-none" tabIndex={-1}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={chartMargin}
              accessibilityLayer={false}
              style={{ outline: 'none', userSelect: 'none' }}
              onMouseLeave={undefined}
              onClick={undefined}
            >
              <XAxis dataKey="name" {...chartAxisProps} />
              <YAxis {...chartAxisProps} />
              <Tooltip {...chartTooltipProps} />
              {/* activeBar con stroke none evita el borde negro al hacer clic */}
              <Bar
                dataKey="valor"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
                activeBar={{ stroke: 'none', strokeWidth: 0 }}
              >
                {barData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} stroke="none" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Gráfico de torta ── */}
      <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">
          Distribución únicos vs duplicados
        </h3>
        <p className="mb-4 text-xs text-slate-400">
          {totalOutput} únicos · {duplicates} duplicados
        </p>

        <div className="chart-container h-[180px] w-full select-none" tabIndex={-1}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer={false} style={{ outline: 'none' }}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={62}
                innerRadius={28}
                stroke="none"
                isAnimationActive={false}
                activeShape={false}
                label={false}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip {...chartTooltipProps} />
              {/* Leyenda con porcentaje calculado */}
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => {
                  const item = pieData.find((d) => d.name === value)
                  const pct =
                    pieTotal > 0 ? ((( item?.value ?? 0) / pieTotal) * 100).toFixed(0) : '0'
                  return (
                    <span style={{ color: '#475569' }}>
                      {value}: <strong>{pct}%</strong>
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
