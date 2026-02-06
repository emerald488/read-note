import { NextRequest, NextResponse } from 'next/server'
import { generateReviewCards } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteText, bookId, noteId } = await request.json()
    if (!noteText) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Get book title if bookId provided
    let bookTitle: string | undefined
    if (bookId) {
      const { data: book } = await supabase
        .from('books')
        .select('title')
        .eq('id', bookId)
        .single()
      bookTitle = book?.title
    }

    const cards = await generateReviewCards(noteText, bookTitle)

    if (cards.length > 0) {
      await supabase.from('review_cards').insert(
        cards.map((c) => ({
          user_id: user.id,
          note_id: noteId || null,
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
