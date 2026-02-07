'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Book } from '@/hooks/use-books'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NoteCard } from '@/components/note-card'
import { LogReadingDialog } from '@/components/log-reading-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { ArrowLeft, BookOpen, Calendar, FileText, Pencil, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [book, setBook] = useState<Book | null>(null)
  const [notes, setNotes] = useState<{ id: string; formatted_text: string | null; raw_transcription: string | null; manual_text: string | null; voice_file_url: string | null; source: 'voice' | 'manual'; page_reference: number | null; created_at: string; book?: { title: string } | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPage, setEditingPage] = useState(false)
  const [pageInput, setPageInput] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const [{ data: bookData }, { data: notesData }] = await Promise.all([
        supabase.from('books').select('*').eq('id', id).single(),
        supabase.from('notes').select('*').eq('book_id', id).order('created_at', { ascending: false }),
      ])

      setBook(bookData)
      setNotes(notesData || [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  const updateStatus = async (status: string) => {
    if (!book) return
    const supabase = createClient()
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

  const refetchBook = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) setBook(data)
  }

  const updateCurrentPage = async () => {
    if (!book) return
    const newPage = parseInt(pageInput)
    if (isNaN(newPage) || newPage < 0 || (book.total_pages && newPage > book.total_pages)) {
      toast.error(`Введите число от 0 до ${book.total_pages || '∞'}`)
      return
    }
    const supabase = createClient()
    const { data } = await supabase
      .from('books')
      .update({ current_page: newPage })
      .eq('id', book.id)
      .select()
      .single()
    if (data) {
      setBook(data)
      setEditingPage(false)
      toast.success('Страница обновлена')
    }
  }

  const deleteBook = async () => {
    if (!book) return
    if (!window.confirm('Вы уверены, что хотите удалить эту книгу? Это действие нельзя отменить.')) return
    const supabase = createClient()
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
              <div className="flex justify-between items-center text-sm">
                <span>Прогресс</span>
                {editingPage ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      className="w-20 h-7 text-sm"
                      min={0}
                      max={book.total_pages}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateCurrentPage()
                        if (e.key === 'Escape') setEditingPage(false)
                      }}
                    />
                    <span className="text-muted-foreground">/ {book.total_pages}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={updateCurrentPage}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingPage(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    onClick={() => { setPageInput(String(book.current_page)); setEditingPage(true) }}
                  >
                    <span>{book.current_page} / {book.total_pages} ({progress}%)</span>
                    <Pencil className="h-3 w-3 opacity-50" />
                  </button>
                )}
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

          <div className="flex items-center justify-between">
            <LogReadingDialog books={[book]} onComplete={refetchBook}>
              <Button className="gap-2">
                <BookOpen className="h-4 w-4" /> Записать чтение
              </Button>
            </LogReadingDialog>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={deleteBook}>
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
