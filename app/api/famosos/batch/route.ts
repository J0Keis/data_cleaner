/**
 * api/famosos/batch/route.ts
 *   GET    /api/famosos/batch          → lista los últimos batches
 *   GET    /api/famosos/batch?id=X     → batch con sus famosos
 *   DELETE /api/famosos/batch?id=X     → elimina batch (cascade)
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { esCumpleanosHoy } from '@/app/lib/date-parser'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

  if (id) {
    const { data: batch, error: batchError } = await supabase
      .from('famosos_batches')
      .select('*')
      .eq('id', id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch no encontrado' }, { status: 404 })
    }

    const { data: famosos, error: famososError } = await supabase
      .from('famosos')
      .select('*')
      .eq('batch_id', id)
      .order('created_at', { ascending: true })

    if (famososError) {
      return NextResponse.json({ error: famososError.message }, { status: 500 })
    }

    // Recalcular esCumpleanos en tiempo real
    const famososActualizados = (famosos ?? []).map(f => ({
      ...f,
      es_cumpleanios: esCumpleanosHoy(f.fecha_nacimiento) ? 1 : 0,
    }))

    return NextResponse.json({ batch: { ...batch, famosos: famososActualizados } })
  }

  // Listar batches
  const { data: batches, error } = await supabase
    .from('famosos_batches')
    .select('id, file_name, created_at, total_input, total_output, duplicates, cumpleanos')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ batches: batches ?? [] })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  }

  const { error } = await supabase.from('famosos_batches').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
