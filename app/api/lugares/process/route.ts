/**
 * api/lugares/process/route.ts
 * Recibe un CSV de lugares turísticos, lo procesa y persiste en Supabase.
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { procesarLugares, detectarEncoding } from '@/app/lib/lugares-parser'
import { calculateQualityScore } from '@/app/lib/quality-score'
import { supabase } from '@/app/lib/supabase'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function applyTextRules(text: string, rules: Record<string, boolean>): string {
  let result = text.trim()
  if (rules['collapseSpaces']) result = result.replace(/\s+/g, ' ')
  if (rules['removeAccents']) {
    result = result.normalize('NFD').replace(/[̀-ͯ]/g, '')
  }
  return result
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const rulesRaw = form.get('rules') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Archivo demasiado grande. Máximo: 10 MB` },
        { status: 413 },
      )
    }

    const nombreArchivo = file.name.toLowerCase()
    if (!nombreArchivo.endsWith('.txt') && !nombreArchivo.endsWith('.csv') && !nombreArchivo.endsWith('.tsv')) {
      return NextResponse.json(
        { error: 'Solo se aceptan archivos .txt, .csv o .tsv' },
        { status: 400 },
      )
    }

    const rules: Record<string, boolean> = rulesRaw ? JSON.parse(rulesRaw) : {}
    const buffer = Buffer.from(await file.arrayBuffer())
    const encoding = detectarEncoding(buffer)
    const content = buffer.toString(encoding as BufferEncoding)

    if (!content.trim()) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }

    const resultado = procesarLugares(content)
    const batchId = randomUUID()

    // Quality scores: before = todos los nombres raw, after = nombres normalizados
    const allNombresRaw  = [...resultado.lugares, ...resultado.duplicates.map(d => ({ nombre: d.nombre }))].map(l => l.nombre)
    const nombresAfter   = resultado.lugares.map(l => applyTextRules(l.nombre, rules))
    const qualityBefore  = calculateQualityScore(allNombresRaw)
    const qualityAfter   = calculateQualityScore(nombresAfter)

    // Insertar batch
    const { error: batchError } = await supabase.from('lugares_batches').insert({
      id: batchId,
      file_name: file.name,
      total_input: resultado.totalInput,
      total_output: resultado.totalOutput,
      duplicates: resultado.duplicateCount,
      changes: 0,
      quality_before: qualityBefore,
      quality_after:  qualityAfter,
    })

    if (batchError) {
      return NextResponse.json({ error: batchError.message }, { status: 500 })
    }

    // Pre-assign IDs to join across batch inserts
    const lugaresConId = resultado.lugares.map(lugar => ({
      ...lugar,
      lugarId: randomUUID(),
      // Conservar tildes en el nombre del lugar (P1, cosmético): el dedup ya
      // ocurrió en el parser; aquí solo se recorta y colapsan espacios.
      nombreNorm: lugar.nombre.trim().replace(/\s+/g, ' '),
    }))

    // Batch insert 1: lugares
    const lugaresRows = lugaresConId.map(l => ({
      id: l.lugarId,
      batch_id: batchId,
      nombre_lugar: l.nombreNorm,
    }))
    const { error: lugaresError } = await supabase.from('lugares').insert(lugaresRows)
    if (lugaresError) {
      return NextResponse.json({ error: lugaresError.message }, { status: 500 })
    }

    // Batch insert 2: georeferencias (solo lugares con coords)
    const georefRows = lugaresConId
      .filter(l => l.georef)
      .map(l => ({
        id: randomUUID(),
        id_lugar: l.lugarId,
        latitud: l.georef!.latitud,
        longitud: l.georef!.longitud,
      }))
    if (georefRows.length > 0) {
      const { error: georefError } = await supabase.from('georeferencias').insert(georefRows)
      if (georefError) {
        return NextResponse.json({ error: georefError.message }, { status: 500 })
      }
    }

    // Batch insert 3: direcciones
    const dirRows = lugaresConId.map(l => ({
      id: randomUUID(),
      id_lugar: l.lugarId,
      nombre_calle: l.direccion.nombreCalle,
      numero_calle: l.direccion.numeroCalle,
      ciudad_estado_provincia: l.direccion.ciudadEstadoProvincia,
      pais: l.direccion.pais,
      raw_direccion: l.direccion.rawDireccion,
    }))
    if (dirRows.length > 0) {
      const { error: dirError } = await supabase.from('direcciones').insert(dirRows)
      if (dirError) {
        return NextResponse.json({ error: dirError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      batchId,
      fileName: file.name,
      totalInput: resultado.totalInput,
      totalOutput: resultado.totalOutput,
      duplicateCount: resultado.duplicateCount,
      logs: resultado.logs,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
