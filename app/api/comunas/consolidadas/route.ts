import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

/**
 * GET /api/comunas/consolidadas
 * Devuelve la estructura final consolidada de comunas (deduplicada globalmente
 * por nombre_normalizado). Sirve para demostrar que reprocesar no duplica
 * (Parte I, criterio 5). Si schema_v4 aún no se aplicó, responde lista vacía.
 */
export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('comunas_consolidadas') as any)
    .select('nombre, region, habitantes, fuente, updated_at')
    .order('nombre', { ascending: true })

  if (error) {
    // Tabla inexistente (schema_v4 sin aplicar) u otro error → lista vacía + aviso
    return NextResponse.json({ comunas: [], disponible: false, mensaje: error.message })
  }

  return NextResponse.json({ comunas: data ?? [], disponible: true })
}
