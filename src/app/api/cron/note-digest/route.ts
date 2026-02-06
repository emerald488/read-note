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

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)

    if (!profiles) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const profile of profiles) {
      // Get a random note
      const { data: notes } = await supabase
        .from('notes')
        .select('formatted_text, manual_text, book:books(title)')
        .eq('user_id', profile.id)

      if (notes && notes.length > 0) {
        const randomNote = notes[Math.floor(Math.random() * notes.length)]
        const text = randomNote.formatted_text || randomNote.manual_text || ''
        const preview = text.length > 400 ? text.substring(0, 400) + '...' : text
        const bookInfo = randomNote.book ? `\n📚 ${(randomNote.book as any).title}` : ''

        await sendTelegramMessage(
          profile.telegram_chat_id!,
          `💡 <b>Из ваших заметок:</b>${bookInfo}\n\n${preview}`
        )
        sent++
      }
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Note digest error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
