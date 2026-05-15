export default function AppVersion() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'
  return (
    <span className="font-mono text-xs text-slate-400">
      data-cleaner v{version}
    </span>
  )
}
