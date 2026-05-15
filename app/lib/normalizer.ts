import { fuzzyCorrectComuna } from './comunas-chile'
import { isRuleEnabled } from './etl-rules'

export type ChangeType = 'NORMALIZADO' | 'DUPLICADO' | 'CORREGIDO' | 'SIN_CAMBIO' | 'VACIO'

export type NormalizedLine = {
  lineNumber: number
  original: string
  normalized: string
  changeType: ChangeType
  detail: string | null
  isUnique: boolean
}

function trim(value: string): string {
  return value.trim()
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, ' ')
}

function removeAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ñ/gi, (m) => (m === 'Ñ' ? 'N' : 'n'))
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ')
}

function dedupKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ')
}

function buildDetail(parts: string[]): string | null {
  return parts.length > 0 ? parts.join(', ') : null
}

/**
 * Transforma una línea aplicando las reglas ETL habilitadas.
 *
 * @param fuzzyCache  Cache compartido entre todas las líneas del mismo lote.
 *                    Clave: valor justo antes de aplicar fuzzy (post-titleCase).
 *                    Valor: resultado de fuzzyCorrectComuna.
 *                    Con ~9.000 duplicados en 10.000 líneas esto reduce el trabajo
 *                    de fuzzy en ~96 % (de ~7 M a ~270 K llamadas Levenshtein).
 */
function transformLine(
  original: string,
  rules: Record<string, boolean>,
  fuzzyCache: Map<string, { corrected: string; matched: boolean }>,
): { normalized: string; details: string[]; fuzzyApplied: boolean } {
  let value = original
  const details: string[] = []

  if (isRuleEnabled('trim', rules)) {
    const trimmed = trim(value)
    if (trimmed !== value) details.push('espacios extremos eliminados')
    value = trimmed
  }

  if (isRuleEnabled('removeEmpty', rules) && value.length === 0) {
    return { normalized: '', details: ['línea vacía'], fuzzyApplied: false }
  }

  if (isRuleEnabled('collapseSpaces', rules)) {
    const collapsed = collapseSpaces(value)
    if (collapsed !== value) details.push('espacios múltiples')
    value = collapsed
  }

  if (isRuleEnabled('removeAccents', rules)) {
    const noAccents = removeAccents(value)
    if (noAccents !== value) details.push('tildes y eñes removidas')
    value = noAccents
  }

  if (isRuleEnabled('titleCase', rules)) {
    const titled = titleCase(value)
    if (titled !== value) details.push('capitalización normalizada')
    value = titled
  }

  let fuzzyApplied = false
  if (isRuleEnabled('fuzzyCorrect', rules)) {
    // Consultar cache antes de correr Levenshtein
    let result = fuzzyCache.get(value)
    if (result === undefined) {
      result = fuzzyCorrectComuna(value)
      fuzzyCache.set(value, result)
    }

    if (result.matched) {
      details.push('corrección ortográfica (coincidencia con lista de referencia)')
      fuzzyApplied = true
    }
    value = result.corrected
  }

  return { normalized: value, details, fuzzyApplied }
}

export function normalizeLines(
  lines: string[],
  rules: Record<string, boolean>,
): NormalizedLine[] {
  const results: NormalizedLine[] = []
  const seen = new Map<string, number>()

  // Cache de resultados fuzzy: se crea una vez por lote y se comparte entre
  // todas las líneas. Las líneas duplicadas obtienen el resultado en O(1).
  const fuzzyCache = new Map<string, { corrected: string; matched: boolean }>()

  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1
    const original   = lines[index]

    const { normalized, details, fuzzyApplied } = transformLine(original, rules, fuzzyCache)

    if (normalized.length === 0 && isRuleEnabled('removeEmpty', rules)) {
      results.push({
        lineNumber,
        original,
        normalized: '',
        changeType: 'VACIO',
        detail: 'línea vacía descartada',
        isUnique: false,
      })
      continue
    }

    const key         = dedupKey(normalized)
    const dedupEnabled = isRuleEnabled('deduplicate', rules)

    if (dedupEnabled && seen.has(key)) {
      const firstLine = seen.get(key)!
      results.push({
        lineNumber,
        original,
        normalized,
        changeType: 'DUPLICADO',
        detail: `duplicado de la línea ${firstLine}`,
        isUnique: false,
      })
      continue
    }

    if (dedupEnabled) {
      seen.set(key, lineNumber)
    }

    const changed    = normalized !== original
    let changeType: ChangeType = 'SIN_CAMBIO'
    if (fuzzyApplied)  changeType = 'CORREGIDO'
    else if (changed)  changeType = 'NORMALIZADO'

    results.push({
      lineNumber,
      original,
      normalized,
      changeType,
      detail: buildDetail(details),
      isUnique: true,
    })
  }

  return results
}

export function getUniqueComunas(lines: NormalizedLine[]) {
  return lines
    .filter((l) => l.isUnique && l.normalized.length > 0)
    .map((l) => ({ original: l.original, normalized: l.normalized }))
}
