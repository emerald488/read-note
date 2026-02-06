'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addXp, updateStreak, XP_REWARDS, checkAchievements } from '@/lib/gamification'
import { toast } from 'sonner'
import { Book } from '@/hooks/use-books'

interface LogReadingDialogProps {
  books: Book[]
  onComplete?: () => void
  children?: React.ReactNode
}

export function LogReadingDialog({ books, onComplete, children }: LogReadingDialogProps) {
  const [open, setOpen] = useState(false)
  const [bookId, setBookId] = useState('')
  const [pagesRead, setPagesRead] = useState('')
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(false)

  const readingBooks = books.filter((b) => b.status === 'reading')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookId || !pagesRead) return
    setLoading(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setLoading(false); return }

    const pages = parseInt(pagesRead)
    const book = books.find((b) => b.id === bookId)

    // Streak + session creation in parallel
    const [streakResult] = await Promise.all([
      updateStreak(supabase, session.user.id),
      supabase.from('reading_sessions').insert({
        user_id: session.user.id,
        book_id: bookId,
        pages_read: pages,
        duration_minutes: duration ? parseInt(duration) : null,
        xp_earned: 0,
      }),
    ])
    const streakBonus = (streakResult?.streak || 0) * XP_REWARDS.STREAK_BONUS_PER_DAY
    const baseXp = pages * XP_REWARDS.PAGES_READ
    const totalXp = baseXp + (streakResult?.isNew ? streakBonus : 0)

    // Update book progress
    if (book) {
      const newPage = Math.min(book.current_page + pages, book.total_pages || book.current_page + pages)
      const isFinished = book.total_pages && newPage >= book.total_pages

      await supabase.from('books').update({
        current_page: newPage,
        status: isFinished ? 'finished' : 'reading',
        finished_at: isFinished ? new Date().toISOString().split('T')[0] : null,
      }).eq('id', bookId)

      if (isFinished) {
        const finishXp = XP_REWARDS.BOOK_FINISHED
        await addXp(supabase, session.user.id, totalXp + finishXp)
        toast.success(`Книга "${book.title}" прочитана! +${totalXp + finishXp} XP 🎉`)
      } else {
        await addXp(supabase, session.user.id, totalXp)
        toast.success(`+${totalXp} XP! ${streakResult?.isNew ? `🔥 Стрик: ${streakResult.streak} дн.` : ''}`)
      }
    }

    // Check achievements
    const newAchievements = await checkAchievements(supabase, session.user.id)
    for (const a of newAchievements) {
      toast.success(`🏆 Достижение: ${a.icon} ${a.name}!`)
    }

    setLoading(false)
    setBookId('')
    setPagesRead('')
    setDuration('')
    setOpen(false)
    onComplete?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Записать чтение</span>
            <span className="sm:hidden">Записать</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Записать чтение</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="log-book">Книга *</Label>
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger id="log-book">
                <SelectValue placeholder="Выберите книгу" />
              </SelectTrigger>
              <SelectContent>
                {readingBooks.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pages">Прочитано страниц *</Label>
            <Input id="pages" type="number" value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} placeholder="0" min="1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Время чтения (мин.)</Label>
            <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" min="1" />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !bookId || !pagesRead}>
            {loading ? 'Сохранение...' : 'Записать'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
