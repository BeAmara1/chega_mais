'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Trash2, 
  Bell, 
  Moon, 
  Sun, 
  LogOut,
  Loader2,
  UserX,
  MessageCircle,
  Users,
  Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface SettingsClientProps {
  userId: string
  userEmail: string
  username: string
}

interface NotificationPreferences {
  friendEvents: boolean
  friendRequests: boolean
  newMessages: boolean
}

export function SettingsClient({ userId, userEmail, username }: SettingsClientProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // Email change state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Delete account state
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    friendEvents: true,
    friendRequests: true,
    newMessages: true,
  })

  // Load notification preferences on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem(`notifications_${userId}`)
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }
  }, [userId])

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  const handleNotificationChange = (key: keyof NotificationPreferences) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] }
    setNotifications(newNotifications)
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(newNotifications))
  }

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return
    
    setEmailLoading(true)
    setEmailError('')
    setEmailSuccess(false)
    
    const supabase = createClient()
    
    if (!supabase) {
      setEmailError('Serviço temporariamente indisponível')
      setEmailLoading(false)
      return
    }
    
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    
    if (error) {
      setEmailError(error.message)
    } else {
      setEmailSuccess(true)
      setTimeout(() => {
        setEmailDialogOpen(false)
        setNewEmail('')
        setEmailSuccess(false)
      }, 2000)
    }
    
    setEmailLoading(false)
  }

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) return
    
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas nao coincidem')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess(false)
    
    const supabase = createClient()
    
    if (!supabase) {
      setPasswordError('Serviço temporariamente indisponível')
      setPasswordLoading(false)
      return
    }
    
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setTimeout(() => {
        setPasswordDialogOpen(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordSuccess(false)
      }, 2000)
    }
    
    setPasswordLoading(false)
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    const supabase = createClient()
    
    if (!supabase) {
      setDeleteLoading(false)
      return
    }
    
    // Delete user profile (cascade will handle related data)
    await supabase.from('profiles').delete().eq('id', userId)
    
    // Sign out
    await supabase.auth.signOut()
    
    router.push('/auth/login')
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    if (!supabase) {
      setIsLoggingOut(false)
      return
    }
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Configuracoes</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24">
        <div className="space-y-6">
          {/* Account Section */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Conta</h2>
            
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              {/* Email */}
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted transition-colors border-b border-border">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">Alterar email</p>
                      <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar email</DialogTitle>
                    <DialogDescription>
                      Um email de confirmacao sera enviado para o novo endereco.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Novo email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="novo@email.com"
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                    {emailSuccess && (
                      <p className="text-sm text-green-600">Email de confirmacao enviado!</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleEmailChange}
                      disabled={emailLoading || !newEmail.trim()}
                    >
                      {emailLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Password */}
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted transition-colors border-b border-border">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Alterar senha</p>
                      <p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar senha</DialogTitle>
                    <DialogDescription>
                      Digite sua nova senha abaixo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova senha</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimo 6 caracteres"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar senha</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Digite novamente"
                      />
                    </div>
                    {passwordError && (
                      <p className="text-sm text-destructive">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-sm text-green-600">Senha alterada com sucesso!</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading || !newPassword || !confirmPassword}
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Alterar senha'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Account */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted transition-colors text-destructive">
                    <Trash2 className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium">Excluir conta</p>
                      <p className="text-sm opacity-80">Esta acao e irreversivel</p>
                    </div>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <UserX className="h-5 w-5 text-destructive" />
                      Excluir conta permanentemente?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acao nao pode ser desfeita. Todos os seus dados serao permanentemente removidos, incluindo:
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Seu perfil e informacoes pessoais</li>
                        <li>Historico de eventos e presencas</li>
                        <li>Amizades e conexoes</li>
                        <li>Mensagens e conversas</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        'Sim, excluir minha conta'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notificacoes</h2>
            
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Presenca de amigos</p>
                    <p className="text-sm text-muted-foreground">Quando um amigo confirmar presenca</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.friendEvents}
                  onCheckedChange={() => handleNotificationChange('friendEvents')}
                />
              </div>

              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Solicitacoes de amizade</p>
                    <p className="text-sm text-muted-foreground">Quando alguem quiser ser seu amigo</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.friendRequests}
                  onCheckedChange={() => handleNotificationChange('friendRequests')}
                />
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Novas mensagens</p>
                    <p className="text-sm text-muted-foreground">Quando receber uma mensagem</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.newMessages}
                  onCheckedChange={() => handleNotificationChange('newMessages')}
                />
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Aparencia</h2>
            
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">Modo escuro</p>
                    <p className="text-sm text-muted-foreground">
                      {isDarkMode ? 'Ativado' : 'Desativado'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
            </div>
          </section>

          {/* Logout Button */}
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saindo...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
