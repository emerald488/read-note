'use client'

import { motion } from 'framer-motion'
import { xpProgress, calculateLevel, xpForNextLevel } from '@/lib/gamification'

export function XpProgressBar({ xp }: { xp: number }) {
  const level = calculateLevel(xp)
  const progress = xpProgress(xp)
  const nextLevelXp = xpForNextLevel(level)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Уровень</span>
          <motion.span
            key={level}
            initial={{ scale: 1.5, color: '#fbbf24' }}
            animate={{ scale: 1, color: 'inherit' }}
            className="text-xl font-bold"
          >
            {level}
          </motion.span>
        </div>
        <span className="text-xs text-muted-foreground">
          {xp} / {nextLevelXp} XP
        </span>
      </div>
      <div className="h-3 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
