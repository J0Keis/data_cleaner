'use client'

import { useCallback, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { FileText, ArrowRight, TrendingUp } from 'lucide-react'
import { getDefaultRules } from '@/app/lib/etl-rules'
import type { CaseMode } from '@/app/lib/normalizer'
import SiteNavbar from '@/app/components/SiteNavbar'
import FileUpload, { type ProcessResult } from '@/app/components/FileUpload'
import RulesConfig from '@/app/components/RulesConfig'
import CaseSelector from '@/app/components/CaseSelector'
import BuscarComuna from '@/app/components/BuscarComuna'
import AuditPanel from '@/app/components/AuditPanel'
import StatsPanel from '@/app/components/StatsPanel'
import QualityGauge from '@/app/components/QualityGauge'
import ChartsPanel from '@/app/components/ChartsPanel'
import DataTable from '@/app/components/DataTable'
import LogViewer from '@/app/components/LogViewer'
import BatchHistory from '@/app/components/BatchHistory'
import AppVersion from '@/app/components/AppVersion'

export default function Home() {
  const [rules, setRules] = useState(getDefaultRules)
  const [caseMode, setCaseMode] = useState<CaseMode>('title')
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [batchId, setBatchId] = useState<string>()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleProcessed = useCallback((data: ProcessResult) => {
    setResult(data)
    setBatchId(data.batchId)
    setRefreshKey((k) => k + 1)
  }, [])

  const handleSelectBatch = useCallback(async (id: string) => {
    setBatchId(id)
    const [comunasRes, batchesRes] = await Promise.all([
      fetch(`/api/comunas?batchId=${id}`),
      fetch('/api/batches'),
    ])
    const comunas = await comunasRes.json()
    const batches = await batchesRes.json()
    const batch = Array.isArray(batches) ? batches.find((b: { id: string }) => b.id === id) : null
    if (batch && Array.isArray(comunas)) {
      setResult({
        batchId: id,
        fileName: batch.file_name,
        totalInput: batch.total_input,
        totalOutput: batch.total_output,
        duplicates: batch.duplicates,
        changes: batch.changes,
        qualityBefore: batch.quality_before ?? 0,
        qualityAfter: batch.quality_after ?? 0,
        comunas,
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f4f9f7]">
      <SiteNavbar />
      <Toaster position="top-right" toastOptions={{ className: 'text-sm' }} />

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-5">

        {/* ══════════════════════════════════════════
            ESTADO INICIAL — sin resultados
            [upload hero 2/3]  |  [reglas + historial 1/3]
        ══════════════════════════════════════════ */}
        {!result && (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <FileUpload rules={rules} onProcessed={handleProcessed} caseMode={caseMode} />
              <BuscarComuna caseMode={caseMode} />
            </div>
            <div className="space-y-4">
              <CaseSelector value={caseMode} onChange={setCaseMode} />
              <RulesConfig rules={rules} onChange={setRules} />
              <BatchHistory onSelect={handleSelectBatch} selectedId={batchId} refreshKey={refreshKey} />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            ESTADO CON RESULTADOS
        ══════════════════════════════════════════ */}
        {result && (
          <div className="space-y-4">

            {/* ── 1. Barra de archivo procesado ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-white px-5 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                  <FileText className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Archivo procesado
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{result.fileName}</p>
                </div>
              </div>
              {/* Botón compacto para subir otro */}
              <FileUpload rules={rules} onProcessed={handleProcessed} caseMode={caseMode} compact />
            </div>

            {/* ── 2. Tarjetas de estadísticas (4 columnas) ── */}
            <StatsPanel
              totalInput={result.totalInput}
              totalOutput={result.totalOutput}
              duplicates={result.duplicates}
              changes={result.changes}
            />

            {/* ── 2b. Auditoría de la ejecución (7 campos) ── */}
            {result.auditoria && <AuditPanel auditoria={result.auditoria} />}

            {/* ── 3. Calidad + Reglas ETL ── */}
            <div className="grid gap-4 lg:grid-cols-3">

              {/* Gauges de calidad — 2/3 del ancho */}
              <div className="flex items-center justify-center gap-0 rounded-2xl border border-teal-100 bg-white shadow-sm lg:col-span-2">
                {/* Gauge: antes */}
                <div className="flex flex-1 flex-col items-center gap-1 px-6 py-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Antes
                  </p>
                  <QualityGauge score={result.qualityBefore} label="" />
                  <p className="mt-1 text-xs text-slate-500">Calidad original</p>
                </div>

                {/* Flecha central con mejora */}
                <div className="flex flex-col items-center gap-1 border-x border-teal-50 px-6 py-6">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <p className="text-3xl font-bold tabular-nums text-emerald-600">
                    +{Math.max(0, result.qualityAfter - result.qualityBefore)}%
                  </p>
                  <p className="text-[10px] text-slate-400">mejora</p>
                  <ArrowRight className="mt-1 h-4 w-4 text-teal-300" />
                </div>

                {/* Gauge: después */}
                <div className="flex flex-1 flex-col items-center gap-1 px-6 py-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Después
                  </p>
                  <QualityGauge score={result.qualityAfter} label="" />
                  <p className="mt-1 text-xs text-slate-500">Calidad normalizada</p>
                </div>
              </div>

              {/* Reglas ETL — 1/3 del ancho */}
              <RulesConfig rules={rules} onChange={setRules} />
            </div>

            {/* ── 4. Gráficos ── */}
            <ChartsPanel
              totalInput={result.totalInput}
              totalOutput={result.totalOutput}
              duplicates={result.duplicates}
              changes={result.changes}
            />

            {/* ── 5. Tabla de resultados  +  Historial lateral ── */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <DataTable comunas={result.comunas} batchId={batchId} />
                <LogViewer batchId={batchId} />
              </div>
              <BatchHistory
                onSelect={handleSelectBatch}
                selectedId={batchId}
                refreshKey={refreshKey}
              />
            </div>

          </div>
        )}

        {/* ── Footer ── */}
        <footer className="flex flex-col gap-2 border-t border-teal-100 pt-5 pb-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <AppVersion />
          <span>Pipeline ETL de normalización de texto</span>
        </footer>
      </main>
    </div>
  )
}
