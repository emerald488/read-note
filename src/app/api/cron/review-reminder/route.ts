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

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)

    if (!profiles) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const profile of profiles) {
      const { count } = await supabase
        .from('review_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .lte('next_review', today)

      if (count && count > 0) {
        await sendTelegramMessage(
          profile.telegram_chat_id!,
          `🧠 У вас ${count} ${count === 1 ? 'карточка' : count < 5 ? 'карточки' : 'карточек'} для повторения!\n\nОткройте приложение → Повторение`
        )
        sent++
      }
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Review reminder error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
