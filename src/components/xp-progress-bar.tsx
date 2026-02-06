'use client'

import { motion } from 'framer-motion'
import { xpProgress, calculateLevel, xpForNextLevel } from '@/lib/gamification'

export function XpProgressBar({ xp }: { xp: number }) {
  const level = calculateLevel(xp)
  const progress = xpProgress(xp)
  const nextLevelXp = xpForNextLevel(level)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Уровень</span>
          <motion.span
            key={level}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-primary"
          >
            {level}
          </motion.span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {xp} / {nextLevelXp} XP
        </span>
      </div>
      <div className="relative h-2.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-primary to-primary/70"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full" />
      </div>
    </div>
  )
}
