import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  }

  const { error } = await supabase.from('batches').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
