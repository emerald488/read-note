import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendTelegramMessage } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()

    // Get all users with telegram
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)

    if (!profiles || profiles.length === 0) return NextResponse.json({ sent: 0 })

    // One query for all notes of all telegram users
    const userIds = profiles.map(p => p.id)
    const { data: allNotes } = await supabase
      .from('notes')
      .select('user_id, formatted_text, manual_text, book:books(title)')
      .in('user_id', userIds)

    // Group notes by user
    const notesByUser: Record<string, typeof allNotes> = {}
    for (const note of allNotes || []) {
      if (!notesByUser[note.user_id]) notesByUser[note.user_id] = []
      notesByUser[note.user_id]!.push(note)
    }

    // Parallel message sending
    const toNotify = profiles.filter(p => (notesByUser[p.id]?.length || 0) > 0)
    await Promise.all(toNotify.map(profile => {
      const notes = notesByUser[profile.id]!
      const randomNote = notes[Math.floor(Math.random() * notes.length)]
      const text = randomNote.formatted_text || randomNote.manual_text || ''
      const preview = text.length > 400 ? text.substring(0, 400) + '...' : text
      const book = randomNote.book as unknown as { title: string } | null
      const bookInfo = book ? `\n📚 ${book.title}` : ''

      return sendTelegramMessage(
        profile.telegram_chat_id!,
        `💡 <b>Из ваших заметок:</b>${bookInfo}\n\n${preview}`
      )
    }))

    return NextResponse.json({ sent: toNotify.length })
  } catch (error) {
    console.error('Note digest error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
