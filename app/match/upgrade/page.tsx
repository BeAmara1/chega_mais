import Link from 'next/link'
import { Heart, MessageCircle, Users, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const benefits = [
  { icon: Heart, title: 'Chega+ Match', desc: 'Conheça pessoas que vão aos mesmos eventos que você' },
  { icon: Users, title: 'Interesses em comum', desc: 'Match com perfis que compartilham seus gostos' },
  { icon: MessageCircle, title: 'Conexão direta', desc: 'Mensagem instantânea após o match' },
]

export default function UpgradePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-brand-500/5 to-background">
      <div className="p-4">
        <Link href="/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mx-auto max-w-sm text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFD166] px-4 py-1.5 text-sm font-bold text-[#7A3800]">
              <Sparkles className="h-4 w-4" />
              PREMIUM
            </div>

            <h1 className="text-3xl font-bold text-foreground">
              Chega+ <span className="text-brand-500">Match</span>
            </h1>

            <p className="text-muted-foreground">
              Descubra pessoas com interesses parecidos e que vão aos mesmos eventos que você
            </p>
          </div>

          <div className="space-y-4 text-left">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4 rounded-lg bg-card border border-border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10">
                  <b.icon className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="lg" className="w-full text-lg" disabled>
                    Assinar por R$ 19,90/mês
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Em breve</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <p className="text-xs text-muted-foreground">
              Já é assinante?{' '}
              <a href="mailto:suporte@chegamais.com" className="text-brand-500 hover:underline">
                suporte@chegamais.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
