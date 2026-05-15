import { NextResponse } from 'next/server'
import {
  buildSql,
  exportCsv,
  exportJson,
  exportLogTxt,
  exportXlsx,
} from '@/app/lib/exporters'
import { sortComunas, type SortOrder } from '@/app/lib/sorter'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batchId')
  const type = searchParams.get('type') ?? 'csv'
  const sortOrder = (searchParams.get('sortOrder') ?? 'none') as SortOrder

  if (!batchId) {
    return NextResponse.json({ error: 'batchId requerido' }, { status: 400 })
  }

  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batchId)
    .single()

  if (batchError || !batch) {
    return NextResponse.json({ error: 'Batch no encontrado' }, { status: 404 })
  }

  const { data: comunas, error: comunaError } = await supabase
    .from('comunas')
    .select('original, normalized')
    .eq('batch_id', batchId)

  if (comunaError) {
    return NextResponse.json({ error: comunaError.message }, { status: 500 })
  }

  const rows = sortComunas(comunas ?? [], sortOrder)

  if (type === 'log') {
    const { data: logs } = await supabase
      .from('log_entries')
      .select('line_number, original, normalized, change_type, detail')
      .eq('batch_id', batchId)
      .order('line_number', { ascending: true })

    const content = exportLogTxt(batch.file_name, logs ?? [], {
      totalInput: batch.total_input,
      totalOutput: batch.total_output,
      duplicates: batch.duplicates,
      changes: batch.changes,
    })

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="log-${batch.file_name}.txt"`,
      },
    })
  }

  if (type === 'json') {
    const content = exportJson(rows, 'none')
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="comunas-${batchId}.json"`,
      },
    })
  }

  if (type === 'xlsx') {
    const buffer = exportXlsx(rows, 'none')
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="comunas-${batchId}.xlsx"`,
      },
    })
  }

  if (type === 'sql') {
    const content = buildSql(rows, 'none')
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="comunas-${batchId}.sql"`,
      },
    })
  }

  const content = exportCsv(rows, 'none')
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="comunas-${batchId}.csv"`,
    },
  })
}
