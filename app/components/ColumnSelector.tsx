'use client'

type Props = {
  showOriginal: boolean
  showNormalized: boolean
  onChange: (showOriginal: boolean, showNormalized: boolean) => void
}

export default function ColumnSelector({
  showOriginal,
  showNormalized,
  onChange,
}: Props) {
  return (
    <div className="flex gap-2 text-xs">
      <label className="flex items-center gap-1 text-slate-600">
        <input
          type="checkbox"
          checked={showOriginal}
          onChange={(e) => onChange(e.target.checked, showNormalized)}
          className="rounded border-teal-200 text-teal-600"
        />
        Original
      </label>
      <label className="flex items-center gap-1 text-slate-600">
        <input
          type="checkbox"
          checked={showNormalized}
          onChange={(e) => onChange(showOriginal, e.target.checked)}
          className="rounded border-teal-200 text-teal-600"
        />
        Normalizado
      </label>
    </div>
  )
}
