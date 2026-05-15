// Gauge circular de calidad — usa posicionamiento absoluto para centrar el número correctamente
type Props = {
  score: number
  label: string
}

export default function QualityGauge({ score, label }: Props) {
  const textColor =
    score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-rose-500'
  const stroke =
    score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'

  const r = 38
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Contenedor relativo: SVG absoluto + número centrado */}
      <div className="relative flex h-[96px] w-[96px] items-center justify-center">
        <svg width="96" height="96" className="absolute inset-0 -rotate-90">
          {/* Pista gris-teal de fondo */}
          <circle cx="48" cy="48" r={r} fill="none" stroke="#ccfbf1" strokeWidth="7" />
          {/* Arco de progreso coloreado según score */}
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        {/* Número centrado encima del SVG */}
        <span className={`text-xl font-bold tabular-nums ${textColor}`}>{score}%</span>
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  )
}
