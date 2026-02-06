'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings, MessageCircle, Copy, Check, ExternalLink } from 'lucide-react'

const TELEGRAM_BOT_USERNAME = 'Readnote922_bot'
import { toast } from 'sonner'
import { generateLinkCode } from '@/lib/telegram'

export default function SettingsPage() {
  const { profile, loading, refetch } = useProfile()
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', profile.id)
    toast.success('Профиль обновлён')
    setSaving(false)
    refetch()
  }

  const handleGenerateCode = async () => {
    if (!profile) return
    const supabase = createClient()
    const code = generateLinkCode()
    await supabase
      .from('profiles')
      .update({ telegram_link_code: code })
      .eq('id', profile.id)
    toast.success('Код привязки создан')
    refetch()
  }

  const copyCode = () => {
    if (profile?.telegram_link_code) {
      navigator.clipboard.writeText(`/start ${profile.telegram_link_code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6" /> Настройки
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Имя пользователя</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.telegram_chat_id ? (
            <div className="flex items-center gap-2 text-green-400">
              <Check className="h-4 w-4" />
              <span>Telegram привязан</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Привяжите Telegram для получения напоминаний и отправки голосовых заметок.
              </p>
              {profile?.telegram_link_code ? (
                <div className="space-y-3">
                  <Button asChild className="w-full gap-2">
                    <a
                      href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=${profile.telegram_link_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Открыть бота и привязать
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-3 py-2 rounded text-xs flex-1 text-muted-foreground">
                      /start {profile.telegram_link_code}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyCode}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleGenerateCode}>
                  Сгенерировать код привязки
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Уровень</p>
              <p className="text-xl font-bold">{profile?.level || 1}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Опыт</p>
              <p className="text-xl font-bold">{profile?.xp || 0} XP</p>
            </div>
            <div>
              <p className="text-muted-foreground">Текущий стрик</p>
              <p className="text-xl font-bold">🔥 {profile?.current_streak || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Лучший стрик</p>
              <p className="text-xl font-bold">{profile?.longest_streak || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
