import { NextResponse } from 'next/server'
import { getDefaultRules } from '@/app/lib/etl-rules'
import { getUniqueComunas, normalizeLines } from '@/app/lib/normalizer'
import { parseFileContent } from '@/app/lib/parser'
import { calculateQualityScore } from '@/app/lib/quality-score'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lines, rules } = body as {
      lines?: string[]
      rules?: Record<string, boolean>
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'lines requerido' }, { status: 400 })
    }

    const activeRules = rules ?? getDefaultRules()
    const qualityBefore = calculateQualityScore(lines)
    const normalized = normalizeLines(lines, activeRules)
    const unique = getUniqueComunas(normalized)
    const qualityAfter = calculateQualityScore(unique.map((c) => c.normalized))

    return NextResponse.json({
      qualityBefore,
      qualityAfter,
      totalInput: lines.length,
      totalOutput: unique.length,
      duplicates: normalized.filter((l) => l.changeType === 'DUPLICADO').length,
      changes: normalized.filter(
        (l) => l.isUnique && l.changeType !== 'SIN_CAMBIO' && l.changeType !== 'VACIO',
      ).length,
      comunas: unique,
      logs: normalized
        .filter((l) => l.changeType !== 'VACIO')
        .map((l) => ({
          lineNumber: l.lineNumber,
          original: l.original,
          normalized: l.normalized,
          changeType: l.changeType,
          detail: l.detail,
        })),
    })
  } catch {
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const content = searchParams.get('content')
  const fileName = searchParams.get('fileName') ?? 'data.txt'

  if (!content) {
    return NextResponse.json({ error: 'content requerido' }, { status: 400 })
  }

  const lines = parseFileContent(fileName, content)
  const rules = getDefaultRules()
  const qualityBefore = calculateQualityScore(lines)
  const normalized = normalizeLines(lines, rules)
  const unique = getUniqueComunas(normalized)
  const qualityAfter = calculateQualityScore(unique.map((c) => c.normalized))

  return NextResponse.json({
    qualityBefore,
    qualityAfter,
    totalInput: lines.length,
    totalOutput: unique.length,
    duplicates: normalized.filter((l) => l.changeType === 'DUPLICADO').length,
    comunas: unique,
  })
}
