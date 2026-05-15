import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batchId')

  if (!batchId) {
    return NextResponse.json({ error: 'batchId requerido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('log_entries')
    .select('*')
    .eq('batch_id', batchId)
    .order('line_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
