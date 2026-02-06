'use client'

import { useProfile } from '@/hooks/use-profile'
import { useBooks } from '@/hooks/use-books'
import { StreakFlame } from '@/components/streak-flame'
import { XpProgressBar } from '@/components/xp-progress-bar'
import { BookCard } from '@/components/book-card'
import { LogReadingDialog } from '@/components/log-reading-dialog'
import { AddBookDialog } from '@/components/add-book-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Brain, FileText } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const ReadingChart = dynamic(
  () => import('@/components/reading-chart').then(m => ({ default: m.ReadingChart })),
  { loading: () => <Skeleton className="h-[200px]" />, ssr: false }
)

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export default function DashboardPage() {
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile()
  const { books, loading: booksLoading, addBook, refetch: refetchBooks } = useBooks()
  const [reviewCount, setReviewCount] = useState(0)
  const [notesCount, setNotesCount] = useState(0)

  useEffect(() => {
    async function fetchCounts() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const today = new Date().toISOString().split('T')[0]

      const [{ count: reviews }, { count: notes }] = await Promise.all([
        supabase
          .from('review_cards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .lte('next_review', today),
        supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id),
      ])

      setReviewCount(reviews || 0)
      setNotesCount(notes || 0)
    }
    fetchCounts()
  }, [])

  if (profileLoading || booksLoading) return <DashboardSkeleton />

  const currentBooks = books.filter((b) => b.status === 'reading')

  const handleComplete = () => {
    refetchProfile()
    refetchBooks()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase mb-1">Добро пожаловать</p>
          <h1 className="text-2xl font-bold truncate">
            {profile?.username || 'Читатель'}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <LogReadingDialog books={books} onComplete={handleComplete} />
          <AddBookDialog onAdd={addBook} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border-primary/10">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <StreakFlame streak={profile?.current_streak || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <XpProgressBar xp={profile?.xp || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Читаю
              </div>
              <span className="font-bold">{currentBooks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4" />
                На повторение
              </div>
              <Link href="/review" className="font-bold text-primary hover:underline">
                {reviewCount}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Заметок
              </div>
              <span className="font-bold">{notesCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reading Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Чтение за неделю</CardTitle>
        </CardHeader>
        <CardContent>
          <ReadingChart />
        </CardContent>
      </Card>

      {/* Current Books */}
      {currentBooks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Сейчас читаю</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentBooks.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
