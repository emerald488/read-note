'use client'

import { motion } from 'framer-motion'

export function StreakFlame({ streak }: { streak: number }) {
  if (streak === 0) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-4xl opacity-30">🔥</div>
        <span className="text-sm text-muted-foreground">Нет стрика</span>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <motion.div
        className="text-5xl"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, -5, 5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        🔥
      </motion.div>
      <motion.span
        className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}
      </motion.span>
    </motion.div>
  )
}
