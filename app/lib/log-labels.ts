/**
 * Etiquetas de tipo de cambio en español (log y base de datos).
 * Incluye mapeo desde valores en inglés por compatibilidad con datos antiguos.
 */

export type LogTipoCambio =
  | 'NORMALIZADO'
  | 'DUPLICADO'
  | 'CORREGIDO'
  | 'SIN_CAMBIO'
  | 'VACIO'

const INGLES_A_ES: Record<string, LogTipoCambio> = {
  NORMALIZED: 'NORMALIZADO',
  DUPLICATE: 'DUPLICADO',
  CORRECTED: 'CORREGIDO',
  UNCHANGED: 'SIN_CAMBIO',
  EMPTY: 'VACIO',
}

/** Convierte tipo guardado (español o inglés legado) a etiqueta en español */
export function tipoCambioEspanol(value: string): LogTipoCambio {
  return (INGLES_A_ES[value] ?? (value as LogTipoCambio)) as LogTipoCambio
}

export function esDuplicadoTipo(value: string): boolean {
  return tipoCambioEspanol(value) === 'DUPLICADO'
}

/** Ancho fijo para columna de tipo en exportación TXT */
export const ANCHO_TIPO_LOG = 14
