import * as XLSX from 'xlsx'
import { ANCHO_TIPO_LOG, esDuplicadoTipo, tipoCambioEspanol } from '@/app/lib/log-labels'
import { sortComunas, type SortOrder } from './sorter'
import type { LogEntry } from './supabase'

type ComunaRow = { original: string; normalized: string }

export function exportCsv(comunas: ComunaRow[], order: SortOrder): string {
  const sorted = sortComunas(comunas, order)
  const header = 'original,normalizado'
  const rows = sorted.map(
    (c) => `"${c.original.replace(/"/g, '""')}","${c.normalized.replace(/"/g, '""')}"`,
  )
  return [header, ...rows].join('\n')
}

export function exportJson(comunas: ComunaRow[], order: SortOrder): string {
  const sorted = sortComunas(comunas, order)
  return JSON.stringify(sorted, null, 2)
}

export function exportXlsx(comunas: ComunaRow[], order: SortOrder): Buffer {
  const sorted = sortComunas(comunas, order)
  const ws = XLSX.utils.json_to_sheet(
    sorted.map((c) => ({ original: c.original, normalizado: c.normalized })),
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Comunas')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

export function buildSql(comunas: ComunaRow[], order: SortOrder): string {
  const sorted = sortComunas(comunas, order)
  if (sorted.length === 0) return '-- Sin datos'

  const values = sorted
    .map(
      (c) =>
        `  ('${c.original.replace(/'/g, "''")}', '${c.normalized.replace(/'/g, "''")}')`,
    )
    .join(',\n')

  return `-- Exportacion data-cleaner\nINSERT INTO comunas (original, normalized) VALUES\n${values};`
}

export function exportLogTxt(
  fileName: string,
  logs: Pick<LogEntry, 'line_number' | 'original' | 'normalized' | 'change_type' | 'detail'>[],
  stats: { totalInput: number; totalOutput: number; duplicates: number; changes: number },
): string {
  const date = new Date().toLocaleDateString('es-CL')
  const header = [
    `LOG DE NORMALIZACIÓN — Archivo: ${fileName}`,
    `Fecha: ${date}`,
    '='.repeat(60),
  ].join('\n')

  const body = logs.map((log) => {
    const line = String(log.line_number).padStart(4, '0')
    const tipoEs = tipoCambioEspanol(log.change_type)
    const type = tipoEs.padEnd(ANCHO_TIPO_LOG)
    if (esDuplicadoTipo(log.change_type)) {
      return `Línea ${line} [${type}] "${log.original}" → ${log.detail ?? 'duplicado'}`
    }
    return `Línea ${line} [${type}] "${log.original}" → "${log.normalized}"${log.detail ? ` (${log.detail})` : ''}`
  })

  const footer = [
    '='.repeat(60),
    `Total entrada: ${stats.totalInput} | Únicos: ${stats.totalOutput} | Duplicados: ${stats.duplicates} | Con cambios: ${stats.changes}`,
  ].join('\n')

  return [header, ...body, footer].join('\n')
}
