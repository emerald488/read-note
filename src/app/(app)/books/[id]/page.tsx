'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Book } from '@/hooks/use-books'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NoteCard } from '@/components/note-card'
import { LogReadingDialog } from '@/components/log-reading-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, BookOpen, Calendar, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [book, setBook] = useState<Book | null>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (bookData) {
        setBook(bookData)
        const { data: notesData } = await supabase
          .from('notes')
          .select('*')
          .eq('book_id', id)
          .order('created_at', { ascending: false })

        setNotes(notesData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [id, supabase])

  const updateStatus = async (status: string) => {
    if (!book) return
    const updates: Record<string, unknown> = { status }
    if (status === 'reading' && !book.started_at) {
      updates.started_at = new Date().toISOString().split('T')[0]
    }
    if (status === 'finished') {
      updates.finished_at = new Date().toISOString().split('T')[0]
      updates.current_page = book.total_pages || book.current_page
    }
    const { data } = await supabase
      .from('books')
      .update(updates)
      .eq('id', book.id)
      .select()
      .single()
    if (data) {
      setBook(data)
      toast.success('Статус обновлён')
    }
  }

  const deleteBook = async () => {
    if (!book) return
    await supabase.from('books').delete().eq('id', book.id)
    toast.success('Книга удалена')
    router.push('/books')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!book) {
    return <div className="text-center py-12 text-muted-foreground">Книга не найдена</div>
  }

  const progress = book.total_pages ? Math.round((book.current_page / book.total_pages) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/books">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{book.title}</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              {book.author && <p className="text-muted-foreground">{book.author}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {book.total_pages && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" /> {book.total_pages} стр.
                  </span>
                )}
                {book.started_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {new Date(book.started_at).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={book.status} onValueChange={updateStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Читаю</SelectItem>
                  <SelectItem value="finished">Прочитано</SelectItem>
                  <SelectItem value="paused">На паузе</SelectItem>
                  <SelectItem value="want">Хочу прочитать</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {book.total_pages && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Прогресс</span>
                <span>{book.current_page} / {book.total_pages} ({progress}%)</span>
              </div>
              <div className="h-3 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <LogReadingDialog books={[book]} onComplete={() => router.refresh()}>
              <Button className="gap-2">
                <BookOpen className="h-4 w-4" /> Записать чтение
              </Button>
            </LogReadingDialog>
            <Button variant="destructive" size="sm" onClick={deleteBook}>
              Удалить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes for this book */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Заметки ({notes.length})
          </h2>
        </div>
        {notes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Пока нет заметок для этой книги</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notes.map((note, i) => (
              <NoteCard key={note.id} note={note} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
