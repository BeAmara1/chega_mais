import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Mail className="h-8 w-8 text-accent-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Verifique seu email</h1>
          <p className="text-muted-foreground">
            Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
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
