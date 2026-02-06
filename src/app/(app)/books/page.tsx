'use client'

import { useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useBooks } from '@/hooks/use-books'
import { BookCard } from '@/components/book-card'
import { AddBookDialog } from '@/components/add-book-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

export default function BooksPage() {
  const { books, loading, addBook } = useBooks()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tab = searchParams.get('status') || 'all'

  const setTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('status')
    } else {
      params.set('status', value)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const counts = useMemo(() => ({
    all: books.length,
    reading: books.filter(b => b.status === 'reading').length,
    finished: books.filter(b => b.status === 'finished').length,
    paused: books.filter(b => b.status === 'paused').length,
    want: books.filter(b => b.status === 'want').length,
  }), [books])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  const filtered = tab === 'all' ? books : books.filter((b) => b.status === tab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои книги</h1>
        <AddBookDialog onAdd={addBook} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full overflow-x-auto no-scrollbar">
          <TabsTrigger value="all" className="flex-1 min-w-0">Все ({counts.all})</TabsTrigger>
          <TabsTrigger value="reading" className="flex-1 min-w-0">Читаю ({counts.reading})</TabsTrigger>
          <TabsTrigger value="finished" className="flex-1 min-w-0">Готово ({counts.finished})</TabsTrigger>
          <TabsTrigger value="paused" className="flex-1 min-w-0">Пауза ({counts.paused})</TabsTrigger>
          <TabsTrigger value="want" className="flex-1 min-w-0">Хочу ({counts.want})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 opacity-40">📚</div>
              <p className="text-muted-foreground font-medium">Пока нет книг в этой категории</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Добавьте книгу, чтобы начать</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
