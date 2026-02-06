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
      .select('id, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)

    if (!profiles || profiles.length === 0) return NextResponse.json({ sent: 0 })

    // One query for all due review cards counts
    const userIds = profiles.map(p => p.id)
    const { data: dueCards } = await supabase
      .from('review_cards')
      .select('user_id')
      .in('user_id', userIds)
      .lte('next_review', today)

    // Count cards per user
    const cardsByUser: Record<string, number> = {}
    for (const card of dueCards || []) {
      cardsByUser[card.user_id] = (cardsByUser[card.user_id] || 0) + 1
    }

    // Parallel message sending
    const toNotify = profiles.filter(p => (cardsByUser[p.id] || 0) > 0)
    await Promise.all(toNotify.map(profile => {
      const count = cardsByUser[profile.id]
      return sendTelegramMessage(
        profile.telegram_chat_id!,
        `🧠 У вас ${count} ${count === 1 ? 'карточка' : count < 5 ? 'карточки' : 'карточек'} для повторения!\n\nОткройте приложение → Повторение`
      )
    }))

    return NextResponse.json({ sent: toNotify.length })
  } catch (error) {
    console.error('Review reminder error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
