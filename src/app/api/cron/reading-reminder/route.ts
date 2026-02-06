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
    const today = new Date().toISOString().split('T')[0]

    // Get users with telegram who haven't read today
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, telegram_chat_id, username, current_streak')
      .not('telegram_chat_id', 'is', null)

    if (!profiles) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const profile of profiles) {
      // Check if they have a session today
      const { count } = await supabase
        .from('reading_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('date', today)

      if (!count || count === 0) {
        const streakWarning = profile.current_streak > 0
          ? `\n⚠️ Ваш стрик ${profile.current_streak} дн. — не потеряйте его!`
          : ''

        await sendTelegramMessage(
          profile.telegram_chat_id!,
          `📖 Привет, ${profile.username || 'читатель'}! Время почитать!${streakWarning}\n\nОтправьте голосовую заметку или запишите чтение в приложении.`
        )
        sent++
      }
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Reading reminder error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
