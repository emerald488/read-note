'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sm2, qualityFromButton } from '@/lib/spaced-repetition'

export interface ReviewCard {
  id: string
  user_id: string
  note_id: string | null
  book_id: string | null
  question: string
  answer: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review: string
  created_at: string
  book?: { title: string } | null
}

export function useReview() {
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const supabase = createClient()

  const fetchDueCards = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('review_cards')
      .select('*, book:books(title)')
      .eq('user_id', user.id)
      .lte('next_review', today)
      .order('next_review', { ascending: true })

    setCards(data || [])
    setCurrentIndex(0)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDueCards()
  }, [fetchDueCards])

  const answerCard = async (cardId: string, button: 'forgot' | 'hard' | 'normal' | 'easy') => {
    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    const quality = qualityFromButton(button)
    const result = sm2(quality, card.ease_factor, card.interval_days, card.repetitions)

    await supabase
      .from('review_cards')
      .update({
        ease_factor: result.easeFactor,
        interval_days: result.interval,
        repetitions: result.repetitions,
        next_review: result.nextReview,
      })
      .eq('id', cardId)

    setCurrentIndex((prev) => prev + 1)
    return result
  }

  const currentCard = cards[currentIndex] || null
  const remaining = Math.max(0, cards.length - currentIndex)
  const isComplete = currentIndex >= cards.length && cards.length > 0

  return { cards, currentCard, remaining, isComplete, loading, answerCard, refetch: fetchDueCards }
}
