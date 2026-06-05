/**
 * comunas-api.ts
 * Enriquecimiento de comunas con una API REST pública REAL + fallback local.
 *
 * API primaria: https://chileabierto.cl/api/v1/comunas
 *   - REST público, sin autenticación. Chile tiene 346 comunas oficiales;
 *     esta API devuelve 349 entradas (incluye divisiones extra como Antártica).
 *   - Por comuna devuelve: name, region_name, province_name, lat, lng, population.
 *   - Fuente de datos atribuida al INE.
 *
 * Fallback offline: dataset local `comunas-enriquecidas.ts` (Censo 2017 INE),
 * usado si la API no responde a tiempo o no contiene la comuna.
 *
 * El `fuente` devuelto ('api' | 'local' | 'no_encontrado') alimenta el contador
 * de auditoría "no encontrados en la fuente oficial" (Parte I, criterio 6).
 */

import { enriquecerComuna as enriquecerLocal } from './comunas-enriquecidas'
import { normalizeForKey } from './normalizer'

const API_URL = 'https://chileabierto.cl/api/v1/comunas'
const API_TIMEOUT_MS = 5000

export type FuenteDato = 'api' | 'local' | 'no_encontrado'

export interface EnriquecimientoComuna {
  region: string | null
  habitantes: number | null
  fuente: FuenteDato
}

interface ApiComuna {
  name: string
  region_name: string
  population: number
}

/**
 * Trae el listado completo de la API UNA sola vez y lo indexa por clave
 * normalizada (sin tildes, minúsculas). Devuelve null si la API falla,
 * para que el llamador caiga al dataset local.
 */
async function fetchApiIndex(): Promise<Map<string, ApiComuna> | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS)
    const res = await fetch(API_URL, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'data-cleaner/1.0 (proyecto académico)' },
      next: { revalidate: 86400 }, // cache de Next.js por 24h (respeta el rate limit por IP)
    })
    clearTimeout(timer)
    if (!res.ok) return null

    const json = await res.json()
    const data: ApiComuna[] = json?.data ?? []
    if (!Array.isArray(data) || data.length === 0) return null

    return new Map(data.map((c) => [normalizeForKey(c.name), c]))
  } catch {
    // timeout, red caída, JSON inválido → fallback local
    return null
  }
}

export interface EnriquecedorLote {
  /** true si la API respondió correctamente (para mostrar en la auditoría). */
  apiDisponible: boolean
  /** Resuelve una comuna ya normalizada contra API → local → no_encontrado. */
  enriquecer: (nombreNormalizado: string) => EnriquecimientoComuna
  /** Nombres oficiales de TODAS las comunas de la API (vacío si la API falló).
   *  Se usa para construir el corrector ortográfico con la lista completa. */
  nombres: string[]
}

/**
 * Crea un enriquecedor para procesar un lote completo: hace UNA llamada a la
 * API y devuelve una función síncrona O(1) por comuna. Así un archivo con
 * miles de líneas hace una sola petición HTTP (no una por comuna).
 */
export async function crearEnriquecedorLote(): Promise<EnriquecedorLote> {
  const apiIndex = await fetchApiIndex()

  function enriquecer(nombreNormalizado: string): EnriquecimientoComuna {
    const key = normalizeForKey(nombreNormalizado)

    // 1. API real (fuente oficial)
    if (apiIndex) {
      const m = apiIndex.get(key)
      if (m) return { region: m.region_name, habitantes: m.population, fuente: 'api' }
    }

    // 2. Fallback dataset local
    const local = enriquecerLocal(nombreNormalizado)
    if (local) return { region: local.region, habitantes: local.habitantes, fuente: 'local' }

    // 3. No está en ninguna fuente
    return { region: null, habitantes: null, fuente: 'no_encontrado' }
  }

  const nombres = apiIndex ? Array.from(apiIndex.values(), (c) => c.name) : []
  return { apiDisponible: apiIndex !== null, enriquecer, nombres }
}

/** Enriquece una sola comuna (usado por el buscador individual de comunas). */
export async function enriquecerUnaComuna(
  nombreNormalizado: string,
): Promise<EnriquecimientoComuna> {
  const { enriquecer } = await crearEnriquecedorLote()
  return enriquecer(nombreNormalizado)
}
