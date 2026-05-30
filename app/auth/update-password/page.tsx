'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas nao coincidem')
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Erro ao redefinir senha. Tente novamente.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    }
    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.65_0.22_18/0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,oklch(0.72_0.2_45/0.04),transparent_50%)]" />
        <div className="relative w-full max-w-sm space-y-8 text-center rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-8 shadow-2xl">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Senha redefinida!</h1>
            <p className="text-muted-foreground">
              Sua senha foi alterada com sucesso. Redirecionando para o login...
            </p>
          </div>
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
          <h1 className="text-2xl font-bold text-foreground">Criar nova senha</h1>
          <p className="mt-2 text-muted-foreground">
            Digite sua nova senha abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Digite novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading || !password || !confirmPassword}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redefinindo...
              </>
            ) : (
              'Redefinir senha'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
