'use client'

import { useState } from 'react'
import { useBooks } from '@/hooks/use-books'
import { BookCard } from '@/components/book-card'
import { AddBookDialog } from '@/components/add-book-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

export default function BooksPage() {
  const { books, loading, addBook } = useBooks()
  const [tab, setTab] = useState('all')

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Все ({books.length})</TabsTrigger>
          <TabsTrigger value="reading">Читаю ({books.filter((b) => b.status === 'reading').length})</TabsTrigger>
          <TabsTrigger value="finished">Готово ({books.filter((b) => b.status === 'finished').length})</TabsTrigger>
          <TabsTrigger value="paused">Пауза ({books.filter((b) => b.status === 'paused').length})</TabsTrigger>
          <TabsTrigger value="want">Хочу ({books.filter((b) => b.status === 'want').length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-2">📚</p>
              <p>Пока нет книг в этой категории</p>
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
