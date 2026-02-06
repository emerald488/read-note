'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Book {
  id: string
  user_id: string
  title: string
  author: string | null
  total_pages: number | null
  current_page: number
  cover_url: string | null
  status: 'reading' | 'finished' | 'paused' | 'want'
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export function useBooks(statusFilter?: string) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchBooks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let query = supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setBooks(data || [])
    setLoading(false)
  }, [supabase, statusFilter])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const addBook = async (book: { title: string; author?: string; total_pages?: number; status?: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: book.title,
        author: book.author || null,
        total_pages: book.total_pages || null,
        status: book.status || 'want',
        started_at: book.status === 'reading' ? new Date().toISOString().split('T')[0] : null,
      })
      .select()
      .single()

    if (!error && data) {
      setBooks((prev) => [data, ...prev])
    }
    return data
  }

  const updateBook = async (id: string, updates: Partial<Book>) => {
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setBooks((prev) => prev.map((b) => (b.id === id ? data : b)))
    }
    return data
  }

  const deleteBook = async (id: string) => {
    await supabase.from('books').delete().eq('id', id)
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  return { books, loading, addBook, updateBook, deleteBook, refetch: fetchBooks }
}
