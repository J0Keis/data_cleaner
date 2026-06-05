import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDefaultRules } from '@/app/lib/etl-rules'
import { getUniqueComunas, normalizeLines } from '@/app/lib/normalizer'
import { parseFileContent } from '@/app/lib/parser'
import { calculateQualityScore } from '@/app/lib/quality-score'
import { enriquecerComuna } from '@/app/lib/comunas-enriquecidas'
import { supabase } from '@/app/lib/supabase'

// Tamaño máximo de cada chunk al insertar en Supabase.
// PostgREST acepta cuerpos grandes, pero chunking en paralelo
// reduce la latencia total para lotes de miles de filas.
const DB_CHUNK_SIZE = 1000

/** Divide un array en chunks y los inserta en paralelo. */
async function insertChunked(
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[],
): Promise<{ error: { message: string } | null }> {
  if (rows.length === 0) return { error: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunks: any[][] = []
  for (let i = 0; i < rows.length; i += DB_CHUNK_SIZE) {
    chunks.push(rows.slice(i, i + DB_CHUNK_SIZE))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chunks.map((chunk) => (supabase.from(table) as any).insert(chunk)),
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const failed = results.find((r: any) => r.error)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { error: (failed as any)?.error ?? null }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file     = formData.get('file')    as File   | null
    const rulesRaw = formData.get('rules')   as string | null

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    // ── 1. Leer y parsear el archivo ─────────────────────────────
    const content = await file.text()
    const lines   = parseFileContent(file.name, content)
    const rules   = rulesRaw ? JSON.parse(rulesRaw) : getDefaultRules()

    // ── 2. ETL ───────────────────────────────────────────────────
    // normalizeLines usa un cache fuzzy interno → O(únicas) en vez de O(total)
    const qualityBefore = calculateQualityScore(lines)
    const normalized    = normalizeLines(lines, rules)
    const unique        = getUniqueComunas(normalized)
    const qualityAfter  = calculateQualityScore(unique.map((c) => c.normalized))

    const duplicates = normalized.filter((l) => l.changeType === 'DUPLICADO').length
    const changes    = normalized.filter(
      (l) => l.isUnique && l.changeType !== 'SIN_CAMBIO' && l.changeType !== 'VACIO',
    ).length

    // ── 3. Preparar filas para DB ────────────────────────────────
    const batchId    = randomUUID()

    // Enriquecer comunas con región y habitantes desde el dataset INE
    let noEncontradas = 0
    const comunasEnriquecidas = unique.map((c) => {
      const info = enriquecerComuna(c.normalized)
      if (!info) noEncontradas++
      return { ...c, region: info?.region ?? null, habitantes: info?.habitantes ?? null }
    })

    const comunaRows = comunasEnriquecidas.map((c) => ({
      id:         randomUUID(),
      batch_id:   batchId,
      original:   c.original,
      normalized: c.normalized,
      region:     c.region,
      habitantes: c.habitantes,
    }))

    const logRows = normalized
      .filter((l) => l.changeType !== 'VACIO')
      .map((l) => ({
        id:          randomUUID(),
        batch_id:    batchId,
        line_number: l.lineNumber,
        original:    l.original,
        normalized:  l.normalized,
        change_type: l.changeType,
        detail:      l.detail,
      }))

    // ── 4. Insertar en Supabase ──────────────────────────────────
    // batch + comunas en paralelo (son independientes entre sí)
    const [batchResult, comunaResult] = await Promise.all([
      supabase.from('batches').insert({
        id:             batchId,
        file_name:      file.name,
        total_input:    lines.length,
        total_output:   unique.length,
        duplicates,
        changes,
        quality_before: qualityBefore,
        quality_after:  qualityAfter,
      }),
      insertChunked('comunas', comunaRows),
    ])

    if (batchResult.error) {
      return NextResponse.json({ error: batchResult.error.message }, { status: 500 })
    }
    if (comunaResult.error) {
      return NextResponse.json({ error: comunaResult.error.message }, { status: 500 })
    }

    // log_entries: chunking en paralelo para archivos grandes
    const { error: logError } = await insertChunked('log_entries', logRows)
    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    // ── 5. Respuesta ─────────────────────────────────────────────
    return NextResponse.json({
      batchId,
      fileName:      file.name,
      totalInput:    lines.length,
      totalOutput:   unique.length,
      duplicates,
      changes,
      qualityBefore,
      qualityAfter,
      noEncontradas,
      comunas: comunasEnriquecidas,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
