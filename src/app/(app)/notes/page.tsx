'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NoteCard } from '@/components/note-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { addXp, updateStreak, XP_REWARDS, checkAchievements } from '@/lib/gamification'
import { Book } from '@/hooks/use-books'

export default function NotesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [notes, setNotes] = useState<{ id: string; formatted_text: string | null; manual_text: string | null; source: 'voice' | 'manual'; page_reference: number | null; created_at: string; book?: { title: string } | null }[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')

  const syncSearchToUrl = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, router, pathname])

  useEffect(() => {
    const timeout = setTimeout(() => syncSearchToUrl(search), 300)
    return () => clearTimeout(timeout)
  }, [search, syncSearchToUrl])
  const [open, setOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteBookId, setNoteBookId] = useState('')
  const [pageRef, setPageRef] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setLoading(false); return }

    const [{ data: notesData }, { data: booksData }] = await Promise.all([
      supabase
        .from('notes')
        .select('*, book:books(title)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }),
      supabase.from('books').select('*').eq('user_id', session.user.id).order('title'),
    ])

    setNotes(notesData || [])
    setBooks(booksData || [])
    setLoading(false)
  }, [])

  // Data fetching on mount — async setState is intentional
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [fetchData])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setSaving(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setSaving(false); return }

    const { data: note, error } = await supabase.from('notes').insert({
      user_id: session.user.id,
      book_id: noteBookId || null,
      manual_text: noteText.trim(),
      source: 'manual',
      page_reference: pageRef ? parseInt(pageRef) : null,
    }).select('id').single()

    if (!error) {
      // XP & streak (parallel)
      await Promise.all([
        updateStreak(supabase, session.user.id),
        addXp(supabase, session.user.id, XP_REWARDS.NOTE_MANUAL),
      ])
      toast.success(`Заметка сохранена! +${XP_REWARDS.NOTE_MANUAL} XP`)

      // Generate review cards
      try {
        await fetch('/api/ai/generate-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteText: noteText.trim(),
            bookId: noteBookId || null,
            noteId: note?.id || null,
          }),
        })
      } catch {}

      const newAchievements = await checkAchievements(supabase, session.user.id)
      for (const a of newAchievements) {
        toast.success(`🏆 ${a.icon} ${a.name}!`)
      }

      setNoteText('')
      setNoteBookId('')
      setPageRef('')
      setOpen(false)
      fetchData()
    }
    setSaving(false)
  }

  const filtered = search
    ? notes.filter((n) => {
        const text = (n.formatted_text || n.manual_text || '').toLowerCase()
        return text.includes(search.toLowerCase())
      })
    : notes

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Заметки</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Новая заметка</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая заметка</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-book">Книга (необязательно)</Label>
                <Select value={noteBookId} onValueChange={setNoteBookId}>
                  <SelectTrigger id="note-book">
                    <SelectValue placeholder="Выберите книгу" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-page">Страница</Label>
                <Input id="note-page" type="number" value={pageRef} onChange={(e) => setPageRef(e.target.value)} placeholder="Номер страницы" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-text">Текст заметки *</Label>
                <Textarea id="note-text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ваша заметка..." rows={6} required />
              </div>
              <Button type="submit" className="w-full" disabled={saving || !noteText.trim()}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по заметкам..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <div className="text-5xl mb-4 opacity-40">{search ? '🔍' : '📝'}</div>
            <p className="text-muted-foreground font-medium">
              {search ? 'Ничего не найдено' : 'Пока нет заметок'}
            </p>
            {!search && (
              <p className="text-sm text-muted-foreground/60 mt-1">Создайте первую заметку, чтобы начать</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((note, i) => (
            <NoteCard key={note.id} note={note} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
