'use client'

import { MapPin, CheckCircle, Copy } from 'lucide-react'

interface LugaresStatsProps {
  totalInput: number
  totalOutput: number
  duplicateCount: number
}

export default function LugaresStats({ totalInput, totalOutput, duplicateCount }: LugaresStatsProps) {
  const tarjetas = [
    { label: 'Registros ingresados', valor: totalInput,     icono: MapPin,       color: 'text-teal-700',   bg: 'bg-teal-50'   },
    { label: 'Lugares únicos',       valor: totalOutput,    icono: CheckCircle,  color: 'text-emerald-700',bg: 'bg-emerald-50'},
    { label: 'Duplicados eliminados',valor: duplicateCount, icono: Copy,         color: 'text-amber-700',  bg: 'bg-amber-50'  },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {tarjetas.map((t) => {
        const Icono = t.icono
        return (
          <div
            key={t.label}
            className="bg-white rounded-2xl border border-teal-100 p-3 sm:p-5 flex items-center gap-3 shadow-sm"
          >
            <div className={`${t.bg} p-2 sm:p-3 rounded-xl shrink-0`}>
              <Icono className={`w-4 h-4 sm:w-5 sm:h-5 ${t.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-slate-800 tabular-nums">
                {t.valor.toLocaleString('es-CL')}
              </p>
              <p className="text-xs text-slate-500 leading-tight">{t.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
