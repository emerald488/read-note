'use client'

import { memo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, PenLine, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NoteCardProps {
  note: {
    id: string
    formatted_text: string | null
    raw_transcription?: string | null
    manual_text: string | null
    voice_file_url?: string | null
    source: 'voice' | 'manual'
    page_reference: number | null
    created_at: string
    book?: { title: string } | null
  }
  index?: number
}

const PREVIEW_LENGTH = 200

export const NoteCard = memo(function NoteCard({ note, index = 0 }: NoteCardProps) {
  const text = note.formatted_text || note.manual_text || ''
  const isLong = text.length > PREVIEW_LENGTH
  const [expanded, setExpanded] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const hasOriginal = note.source === 'voice' && note.raw_transcription && note.formatted_text

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`transition-all duration-300 ${isLong ? 'cursor-pointer hover:border-primary/30' : ''}`}
        onClick={() => isLong && setExpanded(!expanded)}
        role={isLong ? 'button' : undefined}
        tabIndex={isLong ? 0 : undefined}
        onKeyDown={isLong ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } } : undefined}
        aria-expanded={isLong ? expanded : undefined}
        aria-label={isLong ? (expanded ? 'Свернуть заметку' : 'Развернуть заметку') : undefined}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {note.source === 'voice' ? (
                <Badge variant="outline" className="bg-primary/10 text-primary/80 border-primary/20">
                  <Mic className="h-3 w-3 mr-1" /> Голос
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                  <PenLine className="h-3 w-3 mr-1" /> Текст
                </Badge>
              )}
              {note.book && (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                  <BookOpen className="h-3 w-3 mr-1" /> {note.book.title}
                </Badge>
              )}
            </div>
            {note.page_reference && (
              <span className="text-xs text-muted-foreground">стр. {note.page_reference}</span>
            )}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={expanded ? 'full' : 'preview'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                {expanded ? text : (isLong ? text.substring(0, PREVIEW_LENGTH) + '\u2026' : text)}
              </p>
            </motion.div>
          </AnimatePresence>
          {note.voice_file_url && (
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <audio controls preload="none" className="w-full h-8 [&::-webkit-media-controls-panel]:bg-secondary/50" src={note.voice_file_url} />
            </div>
          )}
          {hasOriginal && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {showOriginal ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Оригинальная расшифровка
              </button>
              <AnimatePresence>
                {showOriginal && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap overflow-hidden"
                  >
                    {note.raw_transcription}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {new Date(note.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {isLong && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                {expanded ? <><ChevronUp className="h-3 w-3" /> Свернуть</> : <><ChevronDown className="h-3 w-3" /> Читать</>}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
