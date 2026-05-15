import { FileText, Hash, Copy, RefreshCw } from 'lucide-react'

type Props = {
  totalInput: number
  totalOutput: number
  duplicates: number
  changes: number
}

// Configuración de cada tarjeta de stat
const STATS_CONFIG = [
  {
    key: 'input' as const,
    label: 'Líneas entrada',
    icon: FileText,
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    iconColor: 'text-teal-600',
    valueColor: 'text-teal-900',
  },
  {
    key: 'output' as const,
    label: 'Únicos',
    icon: Hash,
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconColor: 'text-emerald-600',
    valueColor: 'text-emerald-900',
  },
  {
    key: 'duplicates' as const,
    label: 'Duplicados',
    icon: Copy,
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconColor: 'text-amber-600',
    valueColor: 'text-amber-900',
  },
  {
    key: 'changes' as const,
    label: 'Cambios aplicados',
    icon: RefreshCw,
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    iconColor: 'text-violet-600',
    valueColor: 'text-violet-900',
  },
]

export default function StatsPanel({ totalInput, totalOutput, duplicates, changes }: Props) {
  const values = { input: totalInput, output: totalOutput, duplicates, changes }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STATS_CONFIG.map((s) => (
        <div
          key={s.key}
          className={`rounded-2xl border ${s.border} bg-white p-4 shadow-sm`}
        >
          {/* Icono con fondo tintado */}
          <div className={`mb-3 inline-flex rounded-xl p-2 ${s.bg}`}>
            <s.icon className={`h-4 w-4 ${s.iconColor}`} />
          </div>
          {/* Número grande */}
          <p className={`text-2xl font-bold tabular-nums ${s.valueColor}`}>
            {values[s.key].toLocaleString('es-CL')}
          </p>
          {/* Etiqueta */}
          <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
