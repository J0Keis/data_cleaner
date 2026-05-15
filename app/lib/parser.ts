export type FileFormat = 'txt' | 'csv' | 'tsv' | 'unknown'

export function detectFormat(fileName: string, content: string): FileFormat {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return 'csv'
  if (ext === 'tsv') return 'tsv'
  if (ext === 'txt') return 'txt'

  const firstLine = content.split(/\r?\n/)[0] ?? ''
  if (firstLine.includes('\t')) return 'tsv'
  if (firstLine.includes(',') && firstLine.split(',').length > 1) return 'csv'
  return 'txt'
}

function parseDelimited(content: string, delimiter: string): string[] {
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return []

  const rows = lines.map((line) => line.split(delimiter).map((c) => c.trim()))
  const header = rows[0].map((h) => h.toLowerCase())

  const nameIdx = header.findIndex((h) =>
    ['nombre', 'comuna', 'ciudad', 'lugar', 'name', 'city', 'valor', 'texto'].includes(h),
  )

  const dataRows = nameIdx >= 0 ? rows.slice(1) : rows
  const colIdx = nameIdx >= 0 ? nameIdx : 0

  return dataRows
    .map((row) => row[colIdx] ?? '')
    .filter((v) => v.length > 0)
}

export function parseFileContent(fileName: string, content: string): string[] {
  const format = detectFormat(fileName, content)

  switch (format) {
    case 'csv':
      return parseDelimited(content, ',')
    case 'tsv':
      return parseDelimited(content, '\t')
    case 'txt':
    default:
      return content.split(/\r?\n/)
  }
}
