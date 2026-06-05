'use client'

import { CaseSensitive } from 'lucide-react'
import { CASE_OPTIONS, type CaseMode } from '@/app/lib/normalizer'

type Props = {
  value: CaseMode
  onChange: (mode: CaseMode) => void
}

/**
 * Selector del formato de caso (Parte I, criterio 3): el usuario elige entre
 * MAYÚSCULAS / minúsculas / Formato Título / sin cambio para el resultado final.
 */
export default function CaseSelector({ value, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-teal-50 px-4 py-3">
        <CaseSensitive className="h-4 w-4 text-teal-600" />
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Formato de texto</h3>
          <p className="text-[11px] text-slate-400">Unificación de mayúsculas/minúsculas a tu elección</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {CASE_OPTIONS.map((opt) => {
          const activo = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                activo ? 'border-teal-500 bg-teal-50' : 'border-teal-100 hover:border-teal-200'
              }`}
            >
              <span className={`block text-sm font-medium ${activo ? 'text-teal-700' : 'text-slate-700'}`}>
                {opt.label}
              </span>
              <span className="block font-mono text-[10px] text-slate-400">{opt.ejemplo}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
