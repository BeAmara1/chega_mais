import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MessageCircle, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserMatches } from '@/lib/match'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sparkles } from 'lucide-react'

export default async function MatchesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_premium) redirect('/match/upgrade')

  const matches = await getUserMatches(supabase, user.id)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 items-center gap-3 px-4 max-w-lg md:max-w-4xl lg:max-w-6xl">
          <Link href="/match" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">Meus Matches</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD166] px-2 py-0.5 text-xs font-bold text-[#7A3800]">
              <Sparkles className="h-3 w-3" />
              PREMIUM
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg md:max-w-4xl lg:max-w-6xl px-4 py-6">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <HeartIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Nenhum match ainda</p>
            <p className="text-sm text-muted-foreground">Continue explorando perfis no Chega+ Match</p>
            <Button asChild>
              <Link href="/match">Explorar perfis</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-4 rounded-xl bg-card border border-border p-4"
              >
                <Avatar className="h-14 w-14">
                  <AvatarImage src={m.otherUser.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {m.otherUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {m.otherUser.username}
                  </p>
                  {m.common_events > 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {m.common_events} evento{m.common_events !== 1 ? 's' : ''} em comum
                    </p>
                  )}
                </div>

                <Button variant="outline" size="sm" asChild>
                  <Link href={`/chat/${m.otherUser.id}`}>
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Mensagem
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
