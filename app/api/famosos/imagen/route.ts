import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

const WIKI_API = 'https://en.wikipedia.org/w/api.php'

/**
 * GET /api/famosos/imagen?nombre=NOMBRE&id=FAMOSO_ID
 *
 * Busca la imagen del famoso en Wikipedia (Wikimedia REST API).
 * Si ya existe en BD, la devuelve desde caché.
 * Si no, la consulta a Wikipedia, la almacena y la retorna.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const nombre = searchParams.get('nombre')?.trim()
  const id     = searchParams.get('id')?.trim()

  if (!nombre || !id) {
    return NextResponse.json({ error: 'nombre e id son requeridos' }, { status: 400 })
  }

  // 1. Verificar caché en BD
  const { data: famoso } = await supabase
    .from('famosos')
    .select('imagen_url, imagen_fuente, imagen_fecha')
    .eq('id', id)
    .single()

  if (famoso?.imagen_url) {
    return NextResponse.json({
      url:    famoso.imagen_url,
      fuente: famoso.imagen_fuente,
      fecha:  famoso.imagen_fecha,
      cached: true,
    })
  }

  // 2. Consultar Wikipedia API
  try {
    const params = new URLSearchParams({
      action:      'query',
      titles:      nombre,
      prop:        'pageimages|pageterms',
      pithumbsize: '400',
      format:      'json',
      origin:      '*',
    })

    const res  = await fetch(`${WIKI_API}?${params}`, {
      headers: { 'User-Agent': 'data-cleaner/1.0 (academic project)' },
      next: { revalidate: 86400 }, // cache Next.js por 24h
    })

    if (!res.ok) throw new Error('Wikipedia no respondió')

    const json  = await res.json()
    const pages = json?.query?.pages ?? {}
    const page  = Object.values(pages)[0] as Record<string, unknown>

    const imageUrl: string | null = (page?.thumbnail as { source?: string })?.source ?? null
    const fuente = imageUrl
      ? `Wikipedia — https://en.wikipedia.org/wiki/${encodeURIComponent(nombre)}`
      : null
    // Timestamp completo (fecha + hora) de cuándo la app recuperó el dato de la API
    const fecha = new Date().toISOString()

    // 3. Guardar en caché (columnas opcionales, falla silenciosa si no existen)
    if (imageUrl) {
      await supabase
        .from('famosos')
        .update({ imagen_url: imageUrl, imagen_fuente: fuente, imagen_fecha: fecha })
        .eq('id', id)
    }

    return NextResponse.json({ url: imageUrl, fuente, fecha, cached: false })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al consultar Wikipedia'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
