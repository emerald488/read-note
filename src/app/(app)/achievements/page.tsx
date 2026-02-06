'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ACHIEVEMENTS } from '@/lib/gamification'
import { AchievementBadge } from '@/components/achievement-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy } from 'lucide-react'

export default function AchievementsPage() {
  const [earned, setEarned] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAchievements() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }

      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', session.user.id)
        .order('earned_at', { ascending: false })

      setEarned(data || [])
      setLoading(false)
    }
    fetchAchievements()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    )
  }

  const earnedTypes = new Set(earned.map((a) => a.type))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-amber-400" />
        <h1 className="text-2xl font-bold">Достижения</h1>
        <span className="text-sm text-muted-foreground">({earned.length}/{ACHIEVEMENTS.length})</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((achievement, i) => {
          const earnedData = earned.find((e) => e.type === achievement.type)
          return (
            <AchievementBadge
              key={achievement.type}
              achievement={earnedData || achievement}
              earned={earnedTypes.has(achievement.type)}
              index={i}
            />
          )
        })}
      </div>
    </div>
  )
}
