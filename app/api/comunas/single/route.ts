import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDefaultRules } from '@/app/lib/etl-rules'
import { getUniqueComunas, normalizeLines, normalizeForKey, type CaseMode } from '@/app/lib/normalizer'
import { enriquecerUnaComuna } from '@/app/lib/comunas-api'
import { supabase } from '@/app/lib/supabase'

/**
 * POST /api/comunas/single
 * Procesa UNA comuna ingresada en el buscador (Parte I, criterio 1):
 * la normaliza con el mismo pipeline del archivo, la enriquece con la API real
 * (+ fallback) y la consolida (upsert anti-duplicados) en la estructura final.
 *
 * Body JSON: { nombre: string, caseMode?: 'title'|'upper'|'lower'|'none' }
 */
export async function POST(request: Request) {
  try {
    const body     = await request.json().catch(() => null)
    const nombre   = (body?.nombre as string | undefined)?.trim()
    const caseMode = (body?.caseMode as CaseMode | undefined) ?? 'title'

    if (!nombre) {
      return NextResponse.json({ error: 'nombre requerido' }, { status: 400 })
    }

    // Normalizar con el mismo pipeline que el archivo (1 línea)
    const normalizedLines = normalizeLines([nombre], getDefaultRules(), caseMode)
    const unique = getUniqueComunas(normalizedLines)
    if (unique.length === 0) {
      return NextResponse.json({ error: 'La comuna quedó vacía tras normalizar' }, { status: 400 })
    }
    const comuna = unique[0]

    // Enriquecer (API real + fallback local)
    const info = await enriquecerUnaComuna(comuna.normalized)

    // Consolidar en la estructura final (upsert por nombre_normalizado). Best-effort.
    let consolidadoPersistido = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('comunas_consolidadas') as any).upsert(
      {
        id:                 randomUUID(),
        nombre_normalizado: normalizeForKey(comuna.normalized),
        nombre:             comuna.normalized,
        region:             info.region,
        habitantes:         info.habitantes,
        fuente:             info.fuente,
        updated_at:         new Date().toISOString(),
      },
      { onConflict: 'nombre_normalizado', ignoreDuplicates: false },
    )
    consolidadoPersistido = !error

    return NextResponse.json({
      original:   comuna.original,
      normalized: comuna.normalized,
      region:     info.region,
      habitantes: info.habitantes,
      fuente:     info.fuente,
      consolidadoPersistido,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar la comuna'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
