/**
 * famosos-parser.ts
 * Parsea el archivo de famosos línea por línea.
 *
 * Formatos soportados (el número inicial es siempre opcional):
 *   "N. Nombre Completo - Fecha"   → separador " - "
 *   "N  Nombre Completo | Fecha"   → separador " | "
 *   "N. Nombre Completo : Fecha"   → separador " : "
 *   "Nombre Completo, Fecha"       → separador ","
 *
 * Detecta duplicados por nombre normalizado (sin tildes, minúsculas).
 * Normaliza fechas al estándar DD-MM-YYYY usando date-parser.ts.
 */

import { parseDate, calcularEdad, calcularEdadAprox, esCumpleanos } from './date-parser'
import { normalizeForKey } from './normalizer'

export interface FamosoRecord {
  nombre: string
  fechaOriginal: string
  fechaNormalizada: string | null
  fechaAprox: string | null
  edad: number | null
  esCumpleanos: boolean
  lineNumber: number
}

export interface FamososResult {
  famosos: FamosoRecord[]
  duplicates: FamosoRecord[]
  totalInput: number
  totalOutput: number
  duplicateCount: number
  cumpleanosCount: number
  logs: string[]
}

function pareceFecha(s: string): boolean {
  if (!s || s.trim().length === 0) return false
  if (/\d/.test(s)) return true
  if (/alrededor|circa|a\.C\.|a\.c\.|aprox|siglo|desconocida|desconocido|unknown/i.test(s)) return true
  return false
}

/** Quita BOM, espacios y comillas envolventes de un texto. */
function limpiarTexto(s: string): string {
  let t = s.replace(/^﻿/, '').trim()
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1).trim()
  return t.replace(/^["']+|["']+$/g, '').trim()
}

function detectarSeparador(linea: string): [string, string] | null {
  // El TAB y el ";" se agregan para archivos exportados desde Excel.
  const separadores = [' - ', ' | ', ' : ', '\t', ';', ',']
  for (const sep of separadores) {
    const idx = linea.indexOf(sep)
    if (idx === -1) continue
    const nombre = limpiarTexto(linea.slice(0, idx))
    const fechaRaw = limpiarTexto(linea.slice(idx + sep.length))
    if (nombre.length > 0 && pareceFecha(fechaRaw)) return [nombre, fechaRaw]
  }
  return null
}

export function procesarFamosos(content: string): FamososResult {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const famosos: FamosoRecord[] = []
  const duplicates: FamosoRecord[] = []
  const logs: string[] = []
  const seen = new Map<string, number>()

  lines.forEach((line, idx) => {
    const lineNumber = idx + 1
    const sinNumero = line.replace(/^\d+\.?\s+/, '')
    const par = detectarSeparador(sinNumero)

    if (!par) {
      logs.push(`Línea ${lineNumber}: no parseado — "${line}"`)
      return
    }

    const [nombre, fechaOriginal] = par
    const parsed = parseDate(fechaOriginal)
    const edad = calcularEdad(parsed.date) ?? calcularEdadAprox(parsed.aprox)
    const cumpleanos = esCumpleanos(parsed.date)

    const record: FamosoRecord = {
      nombre,
      fechaOriginal,
      fechaNormalizada: parsed.normalizada,
      fechaAprox: parsed.aprox,
      edad,
      esCumpleanos: cumpleanos,
      lineNumber,
    }

    const key = normalizeForKey(nombre)

    if (seen.has(key)) {
      duplicates.push(record)
      logs.push(`Línea ${lineNumber}: DUPLICADO de línea ${seen.get(key)!} — "${nombre}"`)
      return
    }

    seen.set(key, lineNumber)
    famosos.push(record)

    if (cumpleanos) {
      logs.push(`Línea ${lineNumber}: CUMPLEAÑOS HOY — "${nombre}"`)
    }
    if (parsed.normalizada) {
      logs.push(`Línea ${lineNumber}: "${fechaOriginal}" -> "${parsed.normalizada}"`)
    } else {
      logs.push(`Línea ${lineNumber}: fecha aproximada — "${parsed.aprox}"`)
    }
  })

  return {
    famosos,
    duplicates,
    totalInput: lines.length,
    totalOutput: famosos.length,
    duplicateCount: duplicates.length,
    cumpleanosCount: famosos.filter(f => f.esCumpleanos).length,
    logs,
  }
}
