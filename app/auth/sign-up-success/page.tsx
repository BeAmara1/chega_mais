import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.65_0.22_18/0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,oklch(0.72_0.2_45/0.04),transparent_50%)]" />
      <div className="relative w-full max-w-sm space-y-8 text-center rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-8 shadow-2xl">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Verifique seu email</h1>
          <p className="text-muted-foreground">
            Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full hover:shadow-[0_0_20px_-5px_var(--primary)]">
            <Link href="/auth/login">Voltar para login</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Não recebeu o email? Verifique sua caixa de spam.
          </p>
        </div>
      </div>
    </div>
  )
}
