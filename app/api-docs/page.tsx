import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SiteNavbar from '@/app/components/SiteNavbar'

const ENDPOINTS = [
  { method: 'POST', path: '/api/process', desc: 'Sube archivo (multipart) y guarda en Supabase' },
  { method: 'GET', path: '/api/comunas?batchId=&sortOrder=', desc: 'Lista comunas del batch' },
  { method: 'GET', path: '/api/logs?batchId=', desc: 'Log de líneas' },
  { method: 'GET', path: '/api/batches', desc: 'Historial de batches' },
  { method: 'DELETE', path: '/api/batches?id=', desc: 'Eliminar batch' },
  { method: 'GET', path: '/api/analytics', desc: 'Métricas globales' },
  {
    method: 'GET',
    path: '/api/download?batchId=&type=csv|json|xlsx|sql|log&sortOrder=',
    desc: 'Descarga exportación',
  },
  { method: 'POST', path: '/api/public/normalize', desc: 'JSON: { lines, rules? }' },
]

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#f4f9f7]">
      <SiteNavbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-slate-800">Documentación API</h1>
        <p className="mb-8 text-sm text-slate-600">
          Endpoints del proyecto data-cleaner (Next.js + Supabase).
        </p>

        <ul className="space-y-4">
          {ENDPOINTS.map((e) => (
            <li
              key={e.path}
              className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm"
            >
              <span className="font-mono text-xs font-bold text-teal-700">{e.method}</span>
              <code className="mt-1 block text-sm text-slate-800">{e.path}</code>
              <p className="mt-2 text-xs text-slate-500">{e.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
