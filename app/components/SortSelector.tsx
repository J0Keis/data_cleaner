'use client'

import { SORT_OPTIONS, type SortOrder } from '@/app/lib/sorter'

type Props = {
  value: SortOrder
  onChange: (order: SortOrder) => void
}

export default function SortSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.description}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
