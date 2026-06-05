/**
 * lugares-parser.ts
 * Parsea el archivo CSV de lugares turísticos.
 * Genera 3 entidades relacionadas: Lugar, Georeferencia, Direccion.
 *
 * Separadores de columna soportados: ";" | "|" | "\t" | "," (la coma solo si
 * ninguno de los otros estructura las columnas). La división respeta comillas
 * "..." y se limpian las comillas envolventes de cada campo (CSV de Excel).
 * El separador se detecta automáticamente leyendo las primeras 5 líneas de datos.
 *
 * Las coordenadas se interpretan de forma flexible (ver parsearGeoref): punto o
 * coma decimal, separadas por coma/;/espacio, con grados/hemisferio, o en dos
 * columnas (lat y lon).
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

/** Quita BOM, espacios y comillas envolventes (dobles o simples) de un campo. */
export function limpiarCampo(s: string): string {
  let t = (s ?? '').replace(/^﻿/, '').trim()
  if (
    t.length >= 2 &&
    ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))
  ) {
    t = t.slice(1, -1).replace(/""/g, '"').trim()
  }
  return t
}

/**
 * Divide una línea CSV respetando comillas dobles: los separadores que estén
 * dentro de "..." no cuentan (así una dirección entre comillas con comas no se
 * rompe). Soporta la comilla escapada "".
 */
export function splitCSVLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      out.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

export function detectarEncoding(buffer: Buffer): string {
  const comoLatin1 = buffer.toString('latin1')
  const patronesUTF8 = /Ã|â€|Â|Ã©|Ã³|Ã±/
  return patronesUTF8.test(comoLatin1) ? 'utf8' : 'latin1'
}

export function detectarSeparadorCSV(lineas: string[]): string {
  const muestra = lineas.slice(0, 5)
  if (muestra.length === 0) return ';'

  // La coma va al final: las direcciones y las coordenadas también la usan, así
  // que solo se elige si ningún otro separador estructura las columnas.
  const candidatos = [';', '|', '\t', ',']
  for (const sep of candidatos) {
    const conteos = muestra.map(l => splitCSVLine(l, sep).length - 1)
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

/**
 * Extrae lat/lon admitiendo múltiples formatos reales:
 *   "-13.16, -72.54"   ·   "-13,16; -72,54"   ·   "-13.16 -72.54"
 *   "13.16° S, 72.54° O"   ·   "Lat: -13.16 Lon: -72.54"
 *   lat y lon en columnas separadas (ya unidas con espacio por el llamador)
 */
export function parsearGeoref(raw: string): GeorefParsed | null {
  if (!raw) return null
  let s = limpiarCampo(raw)
  if (!s) return null

  // Hemisferio: define el signo aunque el número venga sin "-".
  const sur   = /\b(s|sur|south)\b/i.test(s)
  const oeste = /\b(w|o|oeste|west)\b/i.test(s)

  // Eliminar etiquetas, letras de hemisferio y símbolos de grado/comillas.
  s = s.replace(/[a-zñáéíóú]+/gi, ' ').replace(/[°º'"]/g, ' ').trim()

  const par = extraerCoords(s)
  if (!par) return null

  let [latitud, longitud] = par
  if (sur)   latitud  = -Math.abs(latitud)
  if (oeste) longitud = -Math.abs(longitud)

  if (latitud < -90 || latitud > 90) return null
  if (longitud < -180 || longitud > 180) return null
  if (latitud === 0 && longitud === 0) return null

  return { latitud, longitud }
}

/** Saca los dos primeros números (lat, lon) de un texto ya limpio de letras. */
function extraerCoords(s: string): [number, number] | null {
  // 1) Hay punto decimal → el punto es el decimal; coma/;/barra/espacio separan.
  if (/\d\.\d/.test(s)) {
    const nums = s.match(/-?\d+(?:\.\d+)?/g)
    if (nums && nums.length >= 2) return [parseFloat(nums[0]), parseFloat(nums[1])]
    return null
  }
  // 2) Decimal con coma → "-13,16 ; -72,54"  (formato Excel en español)
  const comaDec = s.match(/-?\d+,\d+/g)
  if (comaDec && comaDec.length >= 2) {
    return [parseFloat(comaDec[0].replace(',', '.')), parseFloat(comaDec[1].replace(',', '.'))]
  }
  // 3) Enteros (lat/lon sin decimales)
  const enteros = s.match(/-?\d+/g)
  if (enteros && enteros.length >= 2) return [parseFloat(enteros[0]), parseFloat(enteros[1])]
  return null
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

function esLineaHeader(linea: string, sep: string): boolean {
  // Nunca tratar como encabezado una fila que ya trae coordenadas válidas.
  const celdas = splitCSVLine(linea, sep).map(limpiarCampo)
  if (parsearGeoref(celdas.slice(2).join(' ')) || celdas.some(c => parsearGeoref(c))) {
    return false
  }
  const l = linea.toLowerCase()
  const claves = [
    'nombre', 'lugar', 'sitio', 'place', 'name', 'location', 'direcci',
    'original', 'normalizado', 'coordenada', 'latitud', 'longitud',
    'ciudad', 'país', 'pais', 'encabezado', 'georef',
  ]
  return claves.some(k => l.includes(k))
}

export function procesarLugares(content: string): LugaresResult {
  const cleaned = fixEncoding(content)
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Separador detectado desde las filas de datos (se omite la 1ª por si es encabezado).
  const muestra = lines.length > 1 ? lines.slice(1) : lines
  const sep = detectarSeparadorCSV(muestra)

  const hasHeader = lines.length > 0 && esLineaHeader(lines[0], sep)
  const dataLines = hasHeader ? lines.slice(1) : lines

  const lugares: LugarRecord[] = []
  const duplicates: { lineNumber: number; nombre: string; duplicadoDe: number }[] = []
  const logs: string[] = []
  const seen = new Map<string, number>()

  dataLines.forEach((line, idx) => {
    const lineNumber = idx + (hasHeader ? 2 : 1)
    const partes = splitCSVLine(line, sep).map(limpiarCampo)
    if (partes.length < 1 || !partes[0]) return

    const nombre = partes[0]
    const rawDireccion = partes[1] ?? ''
    // Las coordenadas pueden venir en 1 columna ("lat, lon") o en 2 (lat | lon):
    // se unen todas las columnas a partir de la 3ª.
    const rawGeoref = partes.slice(2).join(' ').trim()

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
    const geoLog = georef ? `${georef.latitud.toFixed(4)}, ${georef.longitud.toFixed(4)}` : 'sin georef'
    logs.push(`Línea ${lineNumber}: OK — "${nombre}" (${geoLog})`)
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
