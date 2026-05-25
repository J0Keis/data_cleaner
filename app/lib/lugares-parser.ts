/**
 * lugares-parser.ts
 * Parsea el archivo CSV de lugares turísticos.
 * Genera 3 entidades relacionadas: Lugar, Georeferencia, Direccion.
 *
 * Separadores de columna soportados: ";" | "|" | "\t"
 * El separador se detecta automáticamente leyendo las primeras 5 líneas de datos.
 * No se usa "," como separador de columnas porque las direcciones lo contienen.
 *
 * Regla de duplicados: mismo nombre + misma georef (coords redondeadas a 3 decimales).
 */

import { normalizeForKey } from './normalizer'

export interface DireccionParsed {
  nombreCalle: string | null
  numeroCalle: string | null
  ciudadEstadoProvincia: string | null
  pais: string | null
  rawDireccion: string
}

export interface GeorefParsed {
  latitud: number
  longitud: number
}

export interface LugarRecord {
  nombre: string
  direccion: DireccionParsed
  georef: GeorefParsed | null
  lineNumber: number
}

export interface LugaresResult {
  lugares: LugarRecord[]
  duplicates: { lineNumber: number; nombre: string; duplicadoDe: number }[]
  totalInput: number
  totalOutput: number
  duplicateCount: number
  logs: string[]
}

export function detectarEncoding(buffer: Buffer): string {
  const comoLatin1 = buffer.toString('latin1')
  const patronesUTF8 = /Ã|â€|Â|Ã©|Ã³|Ã±/
  return patronesUTF8.test(comoLatin1) ? 'utf8' : 'latin1'
}

export function detectarSeparadorCSV(lineas: string[]): string {
  const muestra = lineas.slice(0, 5)
  if (muestra.length === 0) return ';'

  const candidatos = [';', '|', '\t']
  for (const sep of candidatos) {
    const conteos = muestra.map(l => l.split(sep).length - 1)
    const promedio = conteos.reduce((a, b) => a + b, 0) / conteos.length
    if (promedio >= 2) return sep
  }
  return ';'
}

export function fixEncoding(text: string): string {
  return text
    .replace(/�/g, '?')
    .replace(/[-]/g, '')
}

export function parsearGeoref(raw: string): GeorefParsed | null {
  const match = raw.trim().match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
  if (!match) return null

  const latitud = parseFloat(match[1])
  const longitud = parseFloat(match[2])

  if (latitud < -90 || latitud > 90) return null
  if (longitud < -180 || longitud > 180) return null
  if (latitud === 0 && longitud === 0) return null

  return { latitud, longitud }
}

export function parsearDireccion(raw: string): DireccionParsed {
  const partes = raw.split(',').map(p => p.trim()).filter(p => p.length > 0)

  if (partes.length === 0) {
    return { nombreCalle: null, numeroCalle: null, ciudadEstadoProvincia: null, pais: null, rawDireccion: raw }
  }

  if (partes.length === 1) {
    return { nombreCalle: partes[0], numeroCalle: null, ciudadEstadoProvincia: null, pais: null, rawDireccion: raw }
  }

  const ultimo = partes[partes.length - 1]
  const ultimoEsPais = ultimo.length >= 3 && !/\d/.test(ultimo)
  const pais = ultimoEsPais ? ultimo : null

  let ciudadEstadoProvincia: string | null = null
  if (ultimoEsPais) {
    ciudadEstadoProvincia = partes.length >= 3 ? partes[partes.length - 2] : null
  } else {
    ciudadEstadoProvincia = partes.length >= 3 ? partes[partes.length - 2] : ultimo
  }

  const calleRaw = partes[0]
  const numMatch = calleRaw.match(/^(\d+)\s+(.+)$/)
  const nombreCalle = numMatch ? numMatch[2] : calleRaw
  const numeroCalle = numMatch ? numMatch[1] : null

  return { nombreCalle, numeroCalle, ciudadEstadoProvincia, pais, rawDireccion: raw }
}

function esLineaHeader(linea: string): boolean {
  const l = linea.toLowerCase()
  return (
    l.includes('nombre') ||
    l.includes('lugar')  ||
    l.includes('sitio')  ||
    l.includes('place')  ||
    l.includes('name')   ||
    l.includes('location') ||
    l.includes('direcci')
  )
}

export function procesarLugares(content: string): LugaresResult {
  const cleaned = fixEncoding(content)
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  const hasHeader = lines.length > 0 && esLineaHeader(lines[0])
  const dataLines = hasHeader ? lines.slice(1) : lines
  const sep = detectarSeparadorCSV(dataLines)

  const lugares: LugarRecord[] = []
  const duplicates: { lineNumber: number; nombre: string; duplicadoDe: number }[] = []
  const logs: string[] = []
  const seen = new Map<string, number>()

  dataLines.forEach((line, idx) => {
    const lineNumber = idx + (hasHeader ? 2 : 1)
    const partes = line.split(sep).map(p => p.trim())
    if (partes.length < 1 || !partes[0]) return

    const nombre = partes[0]
    const rawDireccion = partes[1] ?? ''
    const rawGeoref = partes[2] ?? ''

    const georef = parsearGeoref(rawGeoref)
    const direccion = parsearDireccion(rawDireccion)

    const keyNombre = normalizeForKey(nombre)
    const keyGeo = georef
      ? `${georef.latitud.toFixed(3)},${georef.longitud.toFixed(3)}`
      : 'sin-geo'
    const key = `${keyNombre}|${keyGeo}`

    if (seen.has(key)) {
      const duplicadoDe = seen.get(key)!
      duplicates.push({ lineNumber, nombre, duplicadoDe })
      logs.push(`Línea ${lineNumber}: DUPLICADO de línea ${duplicadoDe} — "${nombre}"`)
      return
    }

    seen.set(key, lineNumber)
    lugares.push({ nombre, direccion, georef, lineNumber })
    logs.push(`Línea ${lineNumber}: OK — "${nombre}" (${rawGeoref || 'sin georef'})`)
  })

  return {
    lugares,
    duplicates,
    totalInput: dataLines.length,
    totalOutput: lugares.length,
    duplicateCount: duplicates.length,
    logs,
  }
}
