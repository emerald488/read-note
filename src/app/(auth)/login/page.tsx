'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/callback` },
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Аккаунт создан! Проверьте почту для подтверждения или войдите сразу.')
        // Try auto-login after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (!loginError) {
          router.push('/dashboard')
          router.refresh()
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-orange-950/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            📖
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Читательский Дневник
          </h1>
          <p className="text-muted-foreground mt-2">Читай каждый день, расти каждый день</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? 'Регистрация' : 'Вход'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Загрузка...' : isSignUp ? 'Создать аккаунт' : 'Войти'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
