import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { receiver_id, content } = await req.json()

    if (!receiver_id || !content?.trim()) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id,
        content: content.trim(),
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (err: any) {
    console.error('Erro na API messages/send:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
