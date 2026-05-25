import Link from 'next/link'
import { MapPinned, BarChart3, BookOpen, Users, MapPin } from 'lucide-react'

export default function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-teal-200/60 bg-gradient-to-r from-teal-50 via-white to-amber-50/80 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="group flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-indigo-700 shadow-md ring-2 ring-white">
            <MapPinned className="h-6 w-6 text-white" strokeWidth={2.25} aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-700">
              INACAP · ETL
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-teal-800">
              Data Cleaner
            </h1>
            <p className="text-xs text-slate-500">Limpieza y normalización de datos</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link
            href="/"
            className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-teal-100 transition hover:bg-teal-600 hover:text-white hover:ring-teal-600"
          >
            Comunas
          </Link>
          <Link
            href="/famosos"
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-teal-100 transition hover:bg-teal-600 hover:text-white hover:ring-teal-600"
          >
            <Users className="h-4 w-4" />
            Famosos
          </Link>
          <Link
            href="/lugares"
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-teal-100 transition hover:bg-teal-600 hover:text-white hover:ring-teal-600"
          >
            <MapPin className="h-4 w-4" />
            Lugares
          </Link>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-teal-100 transition hover:bg-teal-600 hover:text-white hover:ring-teal-600"
          >
            <BarChart3 className="h-4 w-4" />
            Resumen
          </Link>
          <Link
            href="/api-docs"
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-teal-100 transition hover:bg-teal-600 hover:text-white hover:ring-teal-600"
          >
            <BookOpen className="h-4 w-4" />
            API
          </Link>
        </nav>
      </div>
    </header>
  )
}
