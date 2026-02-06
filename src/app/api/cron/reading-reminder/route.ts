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

    // Get all users with telegram
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, telegram_chat_id, username, current_streak')
      .not('telegram_chat_id', 'is', null)

    if (!profiles || profiles.length === 0) return NextResponse.json({ sent: 0 })

    // One query for all today's sessions
    const userIds = profiles.map(p => p.id)
    const { data: todaySessions } = await supabase
      .from('reading_sessions')
      .select('user_id')
      .in('user_id', userIds)
      .eq('date', today)

    const readToday = new Set(todaySessions?.map(s => s.user_id) || [])
    const toNotify = profiles.filter(p => !readToday.has(p.id))

    // Parallel message sending
    await Promise.all(toNotify.map(profile => {
      const streakWarning = profile.current_streak > 0
        ? `\n⚠️ Ваш стрик ${profile.current_streak} дн. — не потеряйте его!`
        : ''

      return sendTelegramMessage(
        profile.telegram_chat_id!,
        `📖 Привет, ${profile.username || 'читатель'}! Время почитать!${streakWarning}\n\nОтправьте голосовую заметку или запишите чтение в приложении.`
      )
    }))

    return NextResponse.json({ sent: toNotify.length })
  } catch (error) {
    console.error('Reading reminder error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
