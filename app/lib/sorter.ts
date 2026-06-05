// ==========================================
// SORTER — Lógica de ordenamiento de datos
// El usuario elige el orden antes de exportar o ver la tabla.
// Opciones: sin ordenar / A→Z / Z→A
// ==========================================

// Tipo para las tres opciones de orden disponibles
export type SortOrder = 'none' | 'asc' | 'desc'

// Opciones que se muestran en el componente SortSelector
export const SORT_OPTIONS: { value: SortOrder; label: string; description: string }[] = [
  {
    value: 'none',
    label: 'Sin ordenar',
    description: 'Orden de procesamiento original',
  },
  {
    value: 'asc',
    label: 'A → Z',
    description: 'Orden alfabético ascendente',
  },
  {
    value: 'desc',
    label: 'Z → A',
    description: 'Orden alfabético descendente',
  },
]

// ==========================================
// sortComunas
// Ordena un arreglo de comunas por el campo 'normalized'.
// Usa localeCompare en español para respetar la ñ y tildes.
// Retorna un nuevo arreglo sin mutar el original.
// ==========================================
export function sortComunas<T extends { original: string; normalized: string }>(
  comunas: T[],
  order: SortOrder,
): T[] {
  if (order === 'none') return comunas
  return [...comunas].sort((a, b) => {
    const cmp = a.normalized.localeCompare(b.normalized, 'es', { sensitivity: 'base' })
    return order === 'asc' ? cmp : -cmp
  })
}
