/**
 * api/lugares/batch/route.ts
 *   GET    /api/lugares/batch          → lista los últimos batches
 *   GET    /api/lugares/batch?id=X     → batch con lugares, georef y dirección
 *   DELETE /api/lugares/batch?id=X     → elimina batch (cascade)
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

  if (id) {
    const { data: batch, error: batchError } = await supabase
      .from('lugares_batches')
      .select('*')
      .eq('id', id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch no encontrado' }, { status: 404 })
    }

    // Cargar lugares con sus relaciones
    const { data: lugares, error: lugaresError } = await supabase
      .from('lugares')
      .select(`
        id,
        nombre_lugar,
        created_at,
        georeferencias ( latitud, longitud ),
        direcciones ( nombre_calle, numero_calle, ciudad_estado_provincia, pais, raw_direccion )
      `)
      .eq('batch_id', id)
      .order('created_at', { ascending: true })

    if (lugaresError) {
      return NextResponse.json({ error: lugaresError.message }, { status: 500 })
    }

    // Normalizar estructura para la UI (Supabase devuelve arrays en relaciones 1:N)
    const lugaresNorm = (lugares ?? []).map(l => ({
      id: l.id,
      nombre: l.nombre_lugar,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      georef: Array.isArray(l.georeferencias) ? (l.georeferencias[0] ?? null) : (l.georeferencias as any ?? null),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      direccion: Array.isArray(l.direcciones) ? (l.direcciones[0] ?? null) : (l.direcciones as any ?? null),
    }))

    return NextResponse.json({ batch: { ...batch, lugares: lugaresNorm } })
  }

  // Listar batches
  const { data: batches, error } = await supabase
    .from('lugares_batches')
    .select('id, file_name, created_at, total_input, total_output, duplicates')
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

  const { error } = await supabase.from('lugares_batches').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
