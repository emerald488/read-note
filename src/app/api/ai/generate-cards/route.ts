import { NextRequest, NextResponse } from 'next/server'
import { generateReviewCards } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { noteText, bookId, userId } = await request.json()
    if (!noteText || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Get book title if bookId provided
    let bookTitle: string | undefined
    if (bookId) {
      const supabase = await createClient()
      const { data: book } = await supabase
        .from('books')
        .select('title')
        .eq('id', bookId)
        .single()
      bookTitle = book?.title
    }

    const cards = await generateReviewCards(noteText, bookTitle)

    if (cards.length > 0) {
      const supabase = await createClient()

      // Find the note
      const { data: note } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      await supabase.from('review_cards').insert(
        cards.map((c) => ({
          user_id: userId,
          note_id: note?.id || null,
          book_id: bookId || null,
          question: c.question,
          answer: c.answer,
        }))
      )
    }

    return NextResponse.json({ cards: cards.length })
  } catch (error) {
    console.error('Generate cards error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
