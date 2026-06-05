import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDefaultRules } from '@/app/lib/etl-rules'
import { getUniqueComunas, normalizeLines, normalizeForKey, type CaseMode } from '@/app/lib/normalizer'
import { parseFileContent } from '@/app/lib/parser'
import { calculateQualityScore } from '@/app/lib/quality-score'
import { crearEnriquecedorLote } from '@/app/lib/comunas-api'
import { crearCorrectorComunas, COMUNAS_REFERENCIA } from '@/app/lib/comunas-chile'
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
    let errores = 0

    const formData    = await request.formData()
    const file        = formData.get('file')     as File   | null
    const rulesRaw    = formData.get('rules')    as string | null
    const caseModeRaw = formData.get('caseMode') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    // ── 1. Leer y parsear el archivo ─────────────────────────────
    const content  = await file.text()
    const lines    = parseFileContent(file.name, content)
    const rules    = rulesRaw ? JSON.parse(rulesRaw) : getDefaultRules()
    const caseMode = (caseModeRaw as CaseMode | null) ?? 'title'

    // ── 2. API: lista COMPLETA de comunas (corrector) + enriquecedor ─
    // Una sola llamada a chileabierto.cl. La lista de comunas de la API alimenta
    // el corrector ortográfico (corrige typos contra TODAS las comunas de Chile)
    // y el enriquecedor agrega región/población. Si la API falla, se usa la
    // lista/dataset local como respaldo.
    const { apiDisponible, enriquecer, nombres } = await crearEnriquecedorLote()
    const corrector = crearCorrectorComunas(
      nombres.length ? [...nombres, ...COMUNAS_REFERENCIA] : COMUNAS_REFERENCIA,
    )

    // ── 3. ETL ───────────────────────────────────────────────────
    // normalizeLines usa un cache fuzzy interno → O(únicas) en vez de O(total)
    const qualityBefore = calculateQualityScore(lines)
    const normalized    = normalizeLines(lines, rules, caseMode, corrector)
    const unique        = getUniqueComunas(normalized)
    const qualityAfter  = calculateQualityScore(unique.map((c) => c.normalized))

    const duplicates = normalized.filter((l) => l.changeType === 'DUPLICADO').length
    const procesadas = normalized.filter((l) => l.changeType !== 'VACIO').length
    const changes    = normalized.filter(
      (l) => l.isUnique && l.changeType !== 'SIN_CAMBIO' && l.changeType !== 'VACIO',
    ).length

    // ── 4. Enriquecimiento región/población (API → local → no_encontrado) ─
    let noEncontradas = 0
    const comunasEnriquecidas = unique.map((c) => {
      const info = enriquecer(c.normalized)
      if (info.fuente === 'no_encontrado') noEncontradas++
      return { ...c, region: info.region, habitantes: info.habitantes, fuente: info.fuente }
    })

    // ── 4. Preparar filas para DB ────────────────────────────────
    const batchId = randomUUID()

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

    const consolidados = unique.length

    // ── 5. Insertar batch + comunas (por lote) ───────────────────
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
    if (comunaResult.error) errores++

    // log_entries: chunking en paralelo para archivos grandes
    const { error: logError } = await insertChunked('log_entries', logRows)
    if (logError) errores++

    // ── 6. Auditoría: persistir contadores nuevos (best-effort) ──
    // Si schema_v4.sql aún no se aplicó, estas columnas no existen y el update
    // falla silenciosamente; la auditoría igual viaja en la respuesta (ver §8).
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('batches') as any)
        .update({ consolidados, no_encontrados: noEncontradas, errores })
        .eq('id', batchId)
      if (error) errores += 0 // columnas ausentes → se ignora, no cuenta como error de datos
    }

    // ── 7. Estructura final consolidada: UPSERT anti-duplicados ──
    // Dedup GLOBAL por nombre_normalizado: si la comuna ya existe en la
    // estructura final, se ACTUALIZA (no se duplica). Best-effort: si la tabla
    // aún no existe (schema_v4 sin aplicar), se omite sin romper el proceso.
    let consolidadoPersistido = false
    {
      const consolidadoRows = comunasEnriquecidas.map((c) => ({
        id:                 randomUUID(),
        nombre_normalizado: normalizeForKey(c.normalized),
        nombre:             c.normalized,
        region:             c.region,
        habitantes:         c.habitantes,
        fuente:             c.fuente,
        updated_at:         new Date().toISOString(),
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('comunas_consolidadas') as any)
        .upsert(consolidadoRows, { onConflict: 'nombre_normalizado', ignoreDuplicates: false })
      consolidadoPersistido = !error
    }

    // ── 8. Respuesta (incluye la auditoría completa para la UI) ──
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
      // Registro de auditoría de la ejecución (Parte I, criterio 6): 7 campos
      auditoria: {
        fechaHora:     new Date().toISOString(),
        leidos:        lines.length,
        procesadas,
        duplicados:    duplicates,
        consolidados,
        noEncontrados: noEncontradas,
        errores,
        fuenteApi:     apiDisponible,             // ¿se usó la API real o el fallback?
        consolidadoPersistido,                    // ¿se guardó en la estructura final?
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
