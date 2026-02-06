'use client'

import { memo } from 'react'
import { Book } from '@/hooks/use-books'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Pause, CheckCircle2, BookMarked } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const statusConfig = {
  reading: { label: 'Читаю', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: BookOpen },
  finished: { label: 'Прочитано', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle2 },
  paused: { label: 'Пауза', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Pause },
  want: { label: 'Хочу прочитать', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: BookMarked },
}

export const BookCard = memo(function BookCard({ book, index = 0 }: { book: Book; index?: number }) {
  const status = statusConfig[book.status]
  const StatusIcon = status.icon
  const progress = book.total_pages ? Math.round((book.current_page / book.total_pages) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/books/${book.id}`}>
        <Card className="group hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-16 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6 text-primary/60" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={status.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  {book.total_pages && book.status === 'reading' && (
                    <span className="text-xs text-muted-foreground">
                      {book.current_page}/{book.total_pages} стр. ({progress}%)
                    </span>
                  )}
                </div>
                {book.status === 'reading' && book.total_pages && (
                  <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
})
