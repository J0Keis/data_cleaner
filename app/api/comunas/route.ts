import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { sortComunas, type SortOrder } from '@/app/lib/sorter'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batchId')
  const sortOrder = (searchParams.get('sortOrder') ?? 'none') as SortOrder

  if (!batchId) {
    return NextResponse.json({ error: 'batchId requerido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comunas')
    .select('original, normalized, region, habitantes')
    .eq('batch_id', batchId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const sorted = sortComunas(data ?? [], sortOrder)
  return NextResponse.json(sorted)
}
