'use client'

import { useReview } from '@/hooks/use-review'
import { ReviewCardFlip } from '@/components/review-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain, CheckCircle2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { addXp, XP_REWARDS } from '@/lib/gamification'
import { toast } from 'sonner'

export default function ReviewPage() {
  const { currentCard, remaining, isComplete, loading, answerCard, refetch } = useReview()

  const handleAnswer = async (button: 'forgot' | 'hard' | 'normal' | 'easy') => {
    if (!currentCard) return

    const supabase = createClient()
    const [, { data: { session } }] = await Promise.all([
      answerCard(currentCard.id, button),
      supabase.auth.getSession(),
    ])
    if (session?.user) {
      await addXp(supabase, session.user.id, XP_REWARDS.REVIEW_CARD)
      toast.success(`+${XP_REWARDS.REVIEW_CARD} XP`)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6" /> Повторение
        </h1>
        {remaining > 0 && (
          <span className="text-sm text-muted-foreground">
            Осталось: {remaining}
          </span>
        )}
      </div>

      {isComplete ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-emerald-500/20 bg-emerald-500/[0.04]">
            <CardContent className="p-16 text-center">
              <CheckCircle2 className="h-14 w-14 mx-auto mb-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl font-bold mb-2">Все карточки повторены!</h2>
              <p className="text-sm text-muted-foreground mb-6">Отличная работа! Возвращайтесь завтра.</p>
              <Button onClick={refetch} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Обновить
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : currentCard ? (
        <ReviewCardFlip card={currentCard} onAnswer={handleAnswer} />
      ) : (
        <Card>
          <CardContent className="p-16 text-center">
            <Brain className="h-14 w-14 mx-auto mb-4 text-muted-foreground/20" />
            <h2 className="text-lg font-semibold mb-1">Нет карточек для повторения</h2>
            <p className="text-sm text-muted-foreground/60">Карточки появятся после создания заметок</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
