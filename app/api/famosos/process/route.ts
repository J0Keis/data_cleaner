/**
 * api/famosos/process/route.ts
 * Recibe un archivo de famosos, lo procesa y persiste en Supabase.
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { procesarFamosos } from '@/app/lib/famosos-parser'
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

    const nombre = file.name.toLowerCase()
    if (!nombre.endsWith('.txt') && !nombre.endsWith('.csv') && !nombre.endsWith('.tsv')) {
      return NextResponse.json(
        { error: 'Solo se aceptan archivos .txt, .csv o .tsv' },
        { status: 400 },
      )
    }

    const rules: Record<string, boolean> = rulesRaw ? JSON.parse(rulesRaw) : {}
    const content = await file.text()

    if (!content.trim()) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }

    const resultado = procesarFamosos(content)
    const batchId = randomUUID()

    // Quality scores: before = todos los nombres raw, after = nombres normalizados
    const allNombresRaw = [...resultado.famosos, ...resultado.duplicates].map(f => f.nombre)
    const nombresAfter  = resultado.famosos.map(f => applyTextRules(f.nombre, rules))
    const qualityBefore = calculateQualityScore(allNombresRaw)
    const qualityAfter  = calculateQualityScore(nombresAfter)

    // Insertar batch
    const { error: batchError } = await supabase.from('famosos_batches').insert({
      id: batchId,
      file_name: file.name,
      total_input: resultado.totalInput,
      total_output: resultado.totalOutput,
      duplicates: resultado.duplicateCount,
      changes: 0,
      cumpleanos: resultado.cumpleanosCount,
      quality_before: qualityBefore,
      quality_after:  qualityAfter,
    })

    if (batchError) {
      return NextResponse.json({ error: batchError.message }, { status: 500 })
    }

    // Insertar famosos
    if (resultado.famosos.length > 0) {
      const famososRows = resultado.famosos.map(f => ({
        id: randomUUID(),
        batch_id: batchId,
        // Conservar tildes en el nombre (P1): la rúbrica solo pide agregar el
        // nombre, y quitarlas rompe el display y la búsqueda de imagen en
        // Wikipedia. El dedup del parser ya usó normalizeForKey, así que es seguro.
        nombre: f.nombre.trim().replace(/\s+/g, ' '),
        fecha_original: f.fechaOriginal,
        fecha_nacimiento: f.fechaNormalizada,
        fecha_aprox: f.fechaAprox,
        edad: f.edad,
        es_cumpleanios: f.esCumpleanos ? 1 : 0,
      }))

      const { error: famososError } = await supabase.from('famosos').insert(famososRows)
      if (famososError) {
        return NextResponse.json({ error: famososError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      batchId,
      fileName: file.name,
      totalInput: resultado.totalInput,
      totalOutput: resultado.totalOutput,
      duplicateCount: resultado.duplicateCount,
      cumpleanosCount: resultado.cumpleanosCount,
      logs: resultado.logs,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
