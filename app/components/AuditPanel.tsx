'use client'

import {
  CalendarClock, FileInput, ListChecks, Copy, Database, SearchX, AlertTriangle, Wifi, WifiOff,
} from 'lucide-react'

export interface Auditoria {
  fechaHora: string
  leidos: number
  procesadas: number
  duplicados: number
  consolidados: number
  noEncontrados: number
  errores: number
  fuenteApi?: boolean
  consolidadoPersistido?: boolean
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * Registro de auditoría de la ejecución (Parte I, criterio 6).
 * Muestra los 7 campos exigidos por la rúbrica de forma visible tras procesar.
 */
export default function AuditPanel({ auditoria }: { auditoria: Auditoria }) {
  const campos = [
    { icon: CalendarClock, label: 'Fecha y hora de ejecución', value: formatFecha(auditoria.fechaHora), wide: true },
    { icon: FileInput,     label: 'Registros leídos',          value: auditoria.leidos },
    { icon: ListChecks,    label: 'Comunas procesadas',        value: auditoria.procesadas },
    { icon: Copy,          label: 'Duplicados eliminados',     value: auditoria.duplicados },
    { icon: Database,      label: 'Consolidados correctamente', value: auditoria.consolidados },
    { icon: SearchX,       label: 'No encontrados en la fuente', value: auditoria.noEncontrados,
      alerta: auditoria.noEncontrados > 0 },
    { icon: AlertTriangle, label: 'Errores producidos',        value: auditoria.errores,
      alerta: auditoria.errores > 0 },
  ]

  return (
    <div className="rounded-2xl border border-teal-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-teal-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-800">Resumen de la ejecución (auditoría)</h3>
        </div>
        {auditoria.fuenteApi ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <Wifi className="h-3 w-3" /> API oficial
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            <WifiOff className="h-3 w-3" /> Fallback local
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
        {campos.map((c) => {
          const Icon = c.icon
          return (
            <div
              key={c.label}
              className={`rounded-xl border p-3 ${
                c.alerta ? 'border-red-100 bg-red-50/40' : 'border-teal-50 bg-teal-50/30'
              } ${c.wide ? 'col-span-2' : ''}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Icon className={`h-3 w-3 ${c.alerta ? 'text-red-500' : 'text-teal-500'}`} />
                {c.label}
              </div>
              <p className={`mt-1 font-semibold tabular-nums ${c.wide ? 'text-sm' : 'text-xl'} ${
                c.alerta ? 'text-red-600' : 'text-slate-800'
              }`}>
                {c.value}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
