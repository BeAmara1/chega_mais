import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Erro na autenticação</h1>
          <p className="text-muted-foreground">
            Ocorreu um erro durante a autenticação. Por favor, tente novamente.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/auth/login">Voltar para login</Link>
        </Button>
      </div>
    </div>
  )
}
