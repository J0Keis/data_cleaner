function hasExtraSpaces(value: string): boolean {
  return /^\s|\s$|\s{2,}/.test(value)
}

function hasAccents(value: string): boolean {
  return value !== value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function hasWrongCase(value: string): boolean {
  return value !== value
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function calculateQualityScore(lines: string[]): number {
  const nonEmpty = lines.filter((l) => l.trim().length > 0)
  if (nonEmpty.length === 0) return 100

  let clean = 0
  for (const line of nonEmpty) {
    const issues =
      (hasExtraSpaces(line) ? 1 : 0) +
      (hasAccents(line) ? 1 : 0) +
      (hasWrongCase(line) ? 1 : 0)
    if (issues === 0) clean++
  }

  return Math.round((clean / nonEmpty.length) * 100)
}
