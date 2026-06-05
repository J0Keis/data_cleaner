// ==========================================
// REGLAS ETL — Configuración del pipeline de normalización
// Cada regla puede activarse o desactivarse individualmente.
// Las reglas obligatorias no pueden desactivarse por el usuario.
// ==========================================

// Tipo que describe una regla del pipeline ETL
export type EtlRule = {
  id: string            // identificador único de la regla
  label: string         // nombre visible en la interfaz
  description: string   // descripción breve de qué hace
  required: boolean     // true = no se puede desactivar (siempre activa)
  defaultEnabled: boolean // estado inicial al cargar la app
}

// Lista completa de reglas en el orden que se aplican en el pipeline
export const ETL_RULES: EtlRule[] = [
  {
    id: 'trim',
    label: 'Eliminar espacios extremos',
    description: 'Quita espacios al inicio y al final de cada línea (ej: " Talca" → "Talca")',
    required: true,        // obligatoria, no se puede desactivar
    defaultEnabled: true,
  },
  {
    id: 'removeEmpty',
    label: 'Eliminar líneas vacías',
    description: 'Descarta líneas que queden vacías después del trim',
    required: true,        // obligatoria
    defaultEnabled: true,
  },
  {
    id: 'collapseSpaces',
    label: 'Colapsar espacios múltiples',
    description: 'Reemplaza espacios dobles o más por uno solo (ej: "Viña  del Mar" → "Viña del Mar")',
    required: false,
    defaultEnabled: true,
  },
  {
    id: 'removeAccents',
    label: 'Eliminar tildes y diacríticos',
    description: 'Elimina tildes, ñ y otros diacríticos (ej: "COPIAPÓ" → "COPIAPO", "Ñuñoa" → "Nunoa")',
    required: false,
    defaultEnabled: true,
  },
  // Nota: el formato de caso (MAYÚSCULAS / minúsculas / Título) ya no es una regla
  // on/off: ahora lo elige el usuario con el selector de caso (ver CaseMode en
  // normalizer.ts y el componente CaseSelector). Esto cumple el criterio de la
  // rúbrica "unificación a elección del usuario".
  {
    id: 'deduplicate',
    label: 'Eliminar duplicados',
    description: 'Mantiene solo la primera ocurrencia de cada valor normalizado (ej: "Puerto Montt" / "PUERTO MONTT" → uno solo)',
    required: false,
    defaultEnabled: true,
  },
  {
    id: 'fuzzyCorrect',
    label: 'Corrección ortográfica (fuzzy)',
    description: 'Corrige typos comparando contra lista de referencia usando distancia Levenshtein (ej: "vina delmar" → "Vina Del Mar")',
    required: false,
    // ACTIVADO por defecto: el dataset del profesor tiene typos intencionales
    defaultEnabled: true,
  },
]

// Devuelve un mapa id→boolean con el estado inicial de cada regla
export function getDefaultRules(): Record<string, boolean> {
  return Object.fromEntries(
    ETL_RULES.map((rule) => [rule.id, rule.defaultEnabled])
  )
}

// Devuelve true si la regla con ese id está activa (considerando las obligatorias)
export function isRuleEnabled(
  ruleId: string,
  activeRules: Record<string, boolean>,
): boolean {
  const rule = ETL_RULES.find((r) => r.id === ruleId)
  if (!rule) return false
  if (rule.required) return true  // las obligatorias siempre están activas
  return activeRules[ruleId] ?? rule.defaultEnabled
}
