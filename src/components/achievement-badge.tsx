'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

interface AchievementBadgeProps {
  achievement: {
    type: string
    name: string
    description: string
    icon: string
    earned_at?: string
  }
  earned?: boolean
  index?: number
}

export const AchievementBadge = memo(function AchievementBadge({ achievement, earned = true, index = 0 }: AchievementBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`${earned ? 'border-primary/20 bg-primary/[0.04]' : 'opacity-30 grayscale'} transition-all`}>
        <CardContent className="p-4 flex items-center gap-4">
          <span className={`text-3xl ${!earned && 'opacity-50'}`}>{achievement.icon}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm">{achievement.name}</h3>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            {earned && achievement.earned_at && (
              <p className="text-[11px] text-primary/70 mt-1">
                {new Date(achievement.earned_at).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
