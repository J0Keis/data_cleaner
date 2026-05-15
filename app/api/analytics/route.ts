import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET() {
  const { data: batches, error } = await supabase
    .from('batches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const all = batches ?? []
  const totalBatches = all.length
  const totalInput = all.reduce((s, b) => s + b.total_input, 0)
  const totalOutput = all.reduce((s, b) => s + b.total_output, 0)
  const totalDuplicates = all.reduce((s, b) => s + b.duplicates, 0)
  const avgQualityBefore =
    all.filter((b) => b.quality_before != null).length > 0
      ? all.reduce((s, b) => s + (b.quality_before ?? 0), 0) /
        all.filter((b) => b.quality_before != null).length
      : 0
  const avgQualityAfter =
    all.filter((b) => b.quality_after != null).length > 0
      ? all.reduce((s, b) => s + (b.quality_after ?? 0), 0) /
        all.filter((b) => b.quality_after != null).length
      : 0

  const recent = all.slice(0, 10).map((b) => ({
    fileName: b.file_name,
    date: b.created_at,
    input: b.total_input,
    output: b.total_output,
    duplicates: b.duplicates,
    qualityBefore: b.quality_before,
    qualityAfter: b.quality_after,
  }))

  return NextResponse.json({
    totalBatches,
    totalInput,
    totalOutput,
    totalDuplicates,
    avgQualityBefore: Math.round(avgQualityBefore),
    avgQualityAfter: Math.round(avgQualityAfter),
    recent,
  })
}
