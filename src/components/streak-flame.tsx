'use client'

import { motion, useReducedMotion } from 'framer-motion'

export function StreakFlame({ streak }: { streak: number }) {
  const shouldReduceMotion = useReducedMotion()

  if (streak === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl opacity-20 grayscale">🔥</div>
        <span className="text-xs text-muted-foreground tracking-wider uppercase">Нет стрика</span>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="relative">
        {/* Ambient glow behind flame */}
        <div className="absolute inset-0 blur-xl rounded-full bg-primary/20 scale-150" />
        <motion.div
          className="text-5xl relative z-10"
          role="img"
          aria-label={`Стрик: ${streak}`}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.08, 1],
            rotate: [0, -3, 3, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          🔥
        </motion.div>
      </div>
      <div className="text-center">
        <motion.span
          className="text-2xl font-bold text-primary block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}
        </motion.span>
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">подряд</span>
      </div>
    </motion.div>
  )
}
