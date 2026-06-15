'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (resetError) {
      setError('Erro ao enviar email. Tente novamente.')
    } else {
      setSent(true)
    }
    setIsLoading(false)
  }

  if (sent) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.65_0.22_18/0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,oklch(0.72_0.2_45/0.04),transparent_50%)]" />
        <div className="relative w-full max-w-sm space-y-8 text-center rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-8 shadow-2xl">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-[0_0_12px_-3px_var(--primary)]">
            <Mail className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Email enviado!</h1>
            <p className="text-muted-foreground">
              Enviamos um link de redefinicao de senha para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/login">Voltar para login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.65_0.22_18/0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,oklch(0.72_0.2_45/0.04),transparent_50%)]" />
      <div className="relative w-full max-w-sm space-y-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-8 shadow-2xl">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Chega+"
            width={40}
            height={40}
            className="mx-auto mb-4 rounded-lg bg-primary shadow-[0_0_12px_-3px_var(--primary)]"
          />
          <h1 className="text-2xl font-bold text-foreground">Esqueceu sua senha?</h1>
          <p className="mt-2 text-muted-foreground">
            Digite seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar link'
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" />
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  )
}
