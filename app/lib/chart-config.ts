/** Configuración compartida para gráficos Recharts (sin rectángulos negros al clic) */

export const chartTooltipProps = {
  cursor: false,
  contentStyle: {
    borderRadius: '8px',
    border: '1px solid #ccfbf1',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
    fontSize: '12px',
  },
} as const

export const chartAxisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: '#64748b', fontSize: 11 },
} as const

export const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 }
