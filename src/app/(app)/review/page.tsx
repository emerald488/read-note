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
    await answerCard(currentCard.id, button)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
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
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-bold mb-2">Все карточки повторены!</h2>
              <p className="text-muted-foreground mb-4">Отличная работа! Возвращайтесь завтра.</p>
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
          <CardContent className="p-12 text-center text-muted-foreground">
            <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h2 className="text-xl font-bold mb-2">Нет карточек для повторения</h2>
            <p>Карточки появятся после создания заметок</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
