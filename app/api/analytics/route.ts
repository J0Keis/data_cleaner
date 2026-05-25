import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET() {
  const [comunasRes, famososRes, lugaresRes] = await Promise.all([
    supabase.from('batches').select('*').order('created_at', { ascending: false }),
    supabase.from('famosos_batches').select('*').order('created_at', { ascending: false }),
    supabase.from('lugares_batches').select('*').order('created_at', { ascending: false }),
  ])

  if (comunasRes.error) return NextResponse.json({ error: comunasRes.error.message }, { status: 500 })
  if (famososRes.error) return NextResponse.json({ error: famososRes.error.message }, { status: 500 })
  if (lugaresRes.error) return NextResponse.json({ error: lugaresRes.error.message }, { status: 500 })

  const comunas = (comunasRes.data ?? []).map(b => ({ ...b, _module: 'Comunas' as const }))
  const famosos = (famososRes.data ?? []).map(b => ({ ...b, _module: 'Famosos' as const }))
  const lugares = (lugaresRes.data ?? []).map(b => ({ ...b, _module: 'Lugares' as const }))

  const all = [...comunas, ...famosos, ...lugares]

  const totalBatches    = all.length
  const totalInput      = all.reduce((s, b) => s + b.total_input, 0)
  const totalOutput     = all.reduce((s, b) => s + b.total_output, 0)
  const totalDuplicates = all.reduce((s, b) => s + b.duplicates, 0)

  const withQB = all.filter(b => b.quality_before != null)
  const withQA = all.filter(b => b.quality_after  != null)
  const avgQualityBefore = withQB.length > 0
    ? withQB.reduce((s, b) => s + (b.quality_before ?? 0), 0) / withQB.length : 0
  const avgQualityAfter = withQA.length > 0
    ? withQA.reduce((s, b) => s + (b.quality_after ?? 0), 0) / withQA.length : 0

  // Últimos 10 de todos los módulos combinados, ordenados por fecha
  const recent = all
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(b => ({
      fileName:      b.file_name,
      module:        b._module,
      date:          b.created_at,
      input:         b.total_input,
      output:        b.total_output,
      duplicates:    b.duplicates,
      qualityBefore: b.quality_before,
      qualityAfter:  b.quality_after,
    }))

  return NextResponse.json({
    totalBatches,
    totalInput,
    totalOutput,
    totalDuplicates,
    avgQualityBefore: Math.round(avgQualityBefore),
    avgQualityAfter:  Math.round(avgQualityAfter),
    recent,
  })
}
