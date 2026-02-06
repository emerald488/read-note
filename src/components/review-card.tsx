'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Brain, Smile, Zap } from 'lucide-react'

interface ReviewCardProps {
  card: {
    id: string
    question: string
    answer: string
    book?: { title: string } | null
  }
  onAnswer: (button: 'forgot' | 'hard' | 'normal' | 'easy') => void
}

export function ReviewCardFlip({ card, onAnswer }: ReviewCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="w-full max-w-lg mx-auto perspective-1000">
      <AnimatePresence mode="wait">
        <motion.div
          key={card.id + (isFlipped ? '-back' : '-front')}
          initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            className="min-h-[300px] cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
              {!isFlipped ? (
                <div className="text-center space-y-4">
                  {card.book && (
                    <p className="text-xs text-muted-foreground">{card.book.title}</p>
                  )}
                  <p className="text-lg font-medium">{card.question}</p>
                  <p className="text-sm text-muted-foreground">Нажмите, чтобы увидеть ответ</p>
                </div>
              ) : (
                <div className="text-center space-y-6 w-full">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Ответ:</p>
                    <p className="text-base">{card.answer}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-col h-auto py-3 border-red-500/30 hover:bg-red-500/10 text-red-400"
                      onClick={(e) => { e.stopPropagation(); onAnswer('forgot') }}
                    >
                      <RotateCcw className="h-4 w-4 mb-1" />
                      <span className="text-xs">Забыл</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-col h-auto py-3 border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
                      onClick={(e) => { e.stopPropagation(); onAnswer('hard') }}
                    >
                      <Brain className="h-4 w-4 mb-1" />
                      <span className="text-xs">Сложно</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-col h-auto py-3 border-green-500/30 hover:bg-green-500/10 text-green-400"
                      onClick={(e) => { e.stopPropagation(); onAnswer('normal') }}
                    >
                      <Smile className="h-4 w-4 mb-1" />
                      <span className="text-xs">Норм</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-col h-auto py-3 border-blue-500/30 hover:bg-blue-500/10 text-blue-400"
                      onClick={(e) => { e.stopPropagation(); onAnswer('easy') }}
                    >
                      <Zap className="h-4 w-4 mb-1" />
                      <span className="text-xs">Легко</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
