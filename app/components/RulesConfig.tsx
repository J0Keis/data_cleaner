'use client'

import { Lock, ToggleLeft, ToggleRight } from 'lucide-react'
import { ETL_RULES } from '@/app/lib/etl-rules'

type Props = {
  rules: Record<string, boolean>
  onChange: (rules: Record<string, boolean>) => void
}

export default function RulesConfig({ rules, onChange }: Props) {
  const toggle = (id: string, required: boolean) => {
    if (required) return
    onChange({ ...rules, [id]: !rules[id] })
  }

  const active = ETL_RULES.filter((r) => r.required || (rules[r.id] ?? r.defaultEnabled)).length

  return (
    <div className="rounded-2xl border border-teal-100 bg-white shadow-sm">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-teal-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">Reglas ETL</h3>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
          {active}/{ETL_RULES.length} activas
        </span>
      </div>

      {/* Lista de reglas compacta */}
      <ul className="divide-y divide-teal-50/70 px-2 py-1">
        {ETL_RULES.map((rule) => {
          const enabled = rule.required || (rules[rule.id] ?? rule.defaultEnabled)

          return (
            <li key={rule.id}>
              <button
                type="button"
                disabled={rule.required}
                onClick={() => toggle(rule.id, rule.required)}
                title={rule.description}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors ${
                  rule.required
                    ? 'cursor-default opacity-60'
                    : 'cursor-pointer hover:bg-teal-50/70'
                }`}
              >
                {/* Toggle visual */}
                {rule.required ? (
                  <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                ) : enabled ? (
                  <ToggleRight className="h-5 w-5 shrink-0 text-teal-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 shrink-0 text-slate-300" />
                )}

                {/* Nombre de la regla */}
                <span
                  className={`flex-1 text-sm ${
                    enabled ? 'font-medium text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {rule.label}
                </span>

                {/* Pill de estado */}
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    rule.required
                      ? 'bg-slate-100 text-slate-500'
                      : enabled
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {rule.required ? 'siempre' : enabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Nota al pie */}
      <p className="px-4 pb-3 pt-1 text-[10px] text-slate-400">
        Pasa el cursor sobre cada regla para ver su descripción
      </p>
    </div>
  )
}
