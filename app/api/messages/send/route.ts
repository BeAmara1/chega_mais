import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { receiver_id, content } = await req.json()

    if (!receiver_id || !content?.trim()) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      console.error('Env vars faltando:', { url: !!supabaseUrl, key: !!serviceKey })
      return NextResponse.json(
        { error: 'Configuracao do servidor incompleta' },
        { status: 500 }
      )
    }

    const service = createClient(supabaseUrl, serviceKey)

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
      console.error('Erro ao salvar mensagem no banco:', error)
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
