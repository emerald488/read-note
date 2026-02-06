'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, PenLine, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

interface NoteCardProps {
  note: {
    id: string
    formatted_text: string | null
    manual_text: string | null
    source: 'voice' | 'manual'
    page_reference: number | null
    created_at: string
    book?: { title: string } | null
  }
  index?: number
}

export function NoteCard({ note, index = 0 }: NoteCardProps) {
  const text = note.formatted_text || note.manual_text || ''
  const preview = text.length > 200 ? text.substring(0, 200) + '...' : text

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {note.source === 'voice' ? (
                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Mic className="h-3 w-3 mr-1" /> Голос
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <PenLine className="h-3 w-3 mr-1" /> Текст
                </Badge>
              )}
              {note.book && (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <BookOpen className="h-3 w-3 mr-1" /> {note.book.title}
                </Badge>
              )}
            </div>
            {note.page_reference && (
              <span className="text-xs text-muted-foreground">стр. {note.page_reference}</span>
            )}
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{preview}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(note.created_at).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
