import { NextRequest, NextResponse } from 'next/server'
import { getBot, sendTelegramMessage } from '@/lib/telegram'
import { createServiceClient } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/ai'
import { formatNote, generateReviewCards } from '@/lib/ai'
import { addXp, updateStreak, XP_REWARDS, checkAchievements } from '@/lib/gamification'

export async function POST(request: NextRequest) {
  try {
    // Verify Telegram webhook secret (if configured)
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (webhookSecret) {
      const secret = request.headers.get('x-telegram-bot-api-secret-token')
      if (secret !== webhookSecret) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    console.log('[Telegram] Webhook received:', JSON.stringify(body, null, 2))
    const bot = getBot()

    // Handle callback query (inline button clicks)
    const callbackQuery = body.callback_query
    if (callbackQuery) {
      console.log('[Telegram] Processing callback_query:', callbackQuery.data)
      const chatId = callbackQuery.message.chat.id
      const supabase = await createServiceClient()

      // Find user by chat_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_chat_id', chatId)
        .single()

      if (!profile) {
        await bot.api.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Аккаунт не привязан',
          show_alert: true,
        })
        return NextResponse.json({ ok: true })
      }

      const data = callbackQuery.data || ''

      // Handle "show full note" button
      if (data.startsWith('show_note_')) {
        try {
          const noteId = data.replace('show_note_', '')
          console.log('[Telegram] Show full note requested:', noteId, 'by user:', profile.id)

          const { data: note, error } = await supabase
            .from('notes')
            .select('formatted_text')
            .eq('id', noteId)
            .eq('user_id', profile.id)
            .single()

          if (error) {
            console.error('[Telegram] Error fetching note:', error)
            await bot.api.answerCallbackQuery(callbackQuery.id, {
              text: '❌ Заметка не найдена',
              show_alert: true,
            })
            return NextResponse.json({ ok: true })
          }

          if (!note?.formatted_text) {
            console.error('[Telegram] Note has no formatted_text:', noteId)
            await bot.api.answerCallbackQuery(callbackQuery.id, {
              text: '❌ Заметка пустая',
              show_alert: true,
            })
            return NextResponse.json({ ok: true })
          }

          // Extract original message header (XP, streak, achievements)
          const originalText = callbackQuery.message.text || ''
          const header = originalText.split('\n\n📝')[0] || ''

          console.log('[Telegram] Editing message to show full note')
          await bot.api.editMessageText(
            callbackQuery.message.chat.id,
            callbackQuery.message.message_id,
            `${header}\n\n📝 <b>Полная заметка:</b>\n${note.formatted_text}`,
            { parse_mode: 'HTML' }
          )

          await bot.api.answerCallbackQuery(callbackQuery.id)
          console.log('[Telegram] Successfully showed full note:', noteId)
        } catch (error) {
          console.error('[Telegram] Error handling show_note callback:', error)
          await bot.api.answerCallbackQuery(callbackQuery.id, {
            text: '❌ Произошла ошибка',
            show_alert: true,
          })
        }
      }

      return NextResponse.json({ ok: true })
    }

    const message = body.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = message.text || ''
    const supabase = await createServiceClient()

    // Handle /start command with link code
    if (text.startsWith('/start')) {
      const code = text.split(' ')[1]
      if (code) {
        // Validate link code format (8 hex chars)
        const sanitizedCode = code.toUpperCase().replace(/[^A-F0-9]/g, '').substring(0, 8)
        if (sanitizedCode.length !== 8) {
          await sendTelegramMessage(chatId, '❌ Неверный формат кода привязки.')
          return NextResponse.json({ ok: true })
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('telegram_link_code', sanitizedCode)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({ telegram_chat_id: chatId, telegram_link_code: null })
            .eq('id', profile.id)

          await sendTelegramMessage(chatId, '✅ Telegram успешно привязан к аккаунту!\n\nТеперь вы можете:\n• Отправлять голосовые заметки\n• Отправлять текстовые заметки\n• Получать напоминания')
        } else {
          await sendTelegramMessage(chatId, '❌ Неверный код привязки. Сгенерируйте новый в настройках.')
        }
      } else {
        await sendTelegramMessage(chatId, '📖 <b>Читательский Дневник</b>\n\nДля привязки аккаунта используйте команду:\n/start КОД\n\nКод можно получить в настройках приложения.')
      }
      return NextResponse.json({ ok: true })
    }

    // Find user by chat_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .single()

    if (!profile) {
      await sendTelegramMessage(chatId, '❌ Аккаунт не привязан. Используйте /start КОД')
      return NextResponse.json({ ok: true })
    }

    // Handle /stats command
    if (text === '/stats') {
      const { data: p } = await supabase
        .from('profiles')
        .select('xp, level, current_streak')
        .eq('id', profile.id)
        .single()

      const { count: booksCount } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('status', 'reading')

      await sendTelegramMessage(chatId,
        `📊 <b>Ваша статистика</b>\n\n🔥 Стрик: ${p?.current_streak || 0} дн.\n⭐ Уровень: ${p?.level || 1}\n✨ XP: ${p?.xp || 0}\n📚 Читаю: ${booksCount || 0} книг`)
      return NextResponse.json({ ok: true })
    }

    // Handle /books command
    if (text === '/books') {
      const { data: books } = await supabase
        .from('books')
        .select('title, current_page, total_pages')
        .eq('user_id', profile.id)
        .eq('status', 'reading')

      if (!books?.length) {
        await sendTelegramMessage(chatId, '📚 Нет книг в процессе чтения.')
      } else {
        const list = books.map((b) => {
          const progress = b.total_pages ? ` (${Math.round((b.current_page / b.total_pages) * 100)}%)` : ''
          return `• ${b.title}${progress}`
        }).join('\n')
        await sendTelegramMessage(chatId, `📚 <b>Читаю сейчас:</b>\n\n${list}`)
      }
      return NextResponse.json({ ok: true })
    }

    // Handle voice message
    if (message.voice) {
      await sendTelegramMessage(chatId, '🎙️ Обрабатываю голосовое сообщение...')

      try {
        const fileId = message.voice.file_id
        const file = await bot.api.getFile(fileId)
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`

        const response = await fetch(fileUrl)
        const audioBuffer = Buffer.from(await response.arrayBuffer())

        // Upload to Supabase Storage
        const fileName = `voice/${profile.id}/${Date.now()}.ogg`
        await supabase.storage.from('voice-notes').upload(fileName, audioBuffer, {
          contentType: 'audio/ogg',
        })
        const { data: urlData } = supabase.storage.from('voice-notes').getPublicUrl(fileName)

        // Transcribe
        const rawTranscription = await transcribeAudio(audioBuffer, 'voice.ogg')

        // Get the user's currently reading book
        const { data: currentBook } = await supabase
          .from('books')
          .select('id, title')
          .eq('user_id', profile.id)
          .eq('status', 'reading')
          .limit(1)
          .single()

        // Format note
        const formattedText = await formatNote(rawTranscription, currentBook?.title)

        // Save note
        const { data: note } = await supabase.from('notes').insert({
          user_id: profile.id,
          book_id: currentBook?.id || null,
          raw_transcription: rawTranscription,
          formatted_text: formattedText,
          voice_file_url: urlData.publicUrl,
          source: 'voice',
        }).select().single()

        // Generate review cards
        if (note) {
          const cards = await generateReviewCards(formattedText, currentBook?.title)
          if (cards.length > 0) {
            await supabase.from('review_cards').insert(
              cards.map((c) => ({
                user_id: profile.id,
                note_id: note.id,
                book_id: currentBook?.id || null,
                question: c.question,
                answer: c.answer,
              }))
            )
          }
        }

        // XP & streak (parallel)
        const [streakResult] = await Promise.all([
          updateStreak(supabase, profile.id),
          addXp(supabase, profile.id, XP_REWARDS.NOTE_VOICE),
        ])

        // Check achievements
        const newAchievements = await checkAchievements(supabase, profile.id)
        const achievementText = newAchievements.length > 0
          ? `\n\n🏆 Новые достижения: ${newAchievements.map((a) => `${a.icon} ${a.name}`).join(', ')}`
          : ''

        const header = `✅ Заметка сохранена! +${XP_REWARDS.NOTE_VOICE} XP\n🔥 Стрик: ${streakResult?.streak || 0} дн.${achievementText}`

        if (formattedText.length > 300) {
          // Send with "Show full" button for long notes
          await bot.api.sendMessage(chatId,
            `${header}\n\n📝 <b>Превью:</b>\n${formattedText.substring(0, 300)}...`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[
                  { text: '📖 Показать полностью', callback_data: `show_note_${note!.id}` }
                ]]
              }
            })
        } else {
          // Send full note for short notes
          await sendTelegramMessage(chatId, `${header}\n\n📝 ${formattedText}`)
        }

      } catch (error) {
        console.error('Voice processing error:', error)
        await sendTelegramMessage(chatId, '❌ Ошибка обработки голосового сообщения. Попробуйте ещё раз.')
      }
      return NextResponse.json({ ok: true })
    }

    // Handle text message as note
    if (text && !text.startsWith('/')) {
      const { data: currentBook } = await supabase
        .from('books')
        .select('id, title')
        .eq('user_id', profile.id)
        .eq('status', 'reading')
        .limit(1)
        .single()

      const { data: note } = await supabase.from('notes').insert({
        user_id: profile.id,
        book_id: currentBook?.id || null,
        manual_text: text,
        source: 'manual',
      }).select().single()

      // Generate review cards
      if (note) {
        const cards = await generateReviewCards(text, currentBook?.title)
        if (cards.length > 0) {
          await supabase.from('review_cards').insert(
            cards.map((c) => ({
              user_id: profile.id,
              note_id: note.id,
              book_id: currentBook?.id || null,
              question: c.question,
              answer: c.answer,
            }))
          )
        }
      }

      const [streakResult] = await Promise.all([
        updateStreak(supabase, profile.id),
        addXp(supabase, profile.id, XP_REWARDS.NOTE_MANUAL),
      ])

      const newAchievements = await checkAchievements(supabase, profile.id)
      const achievementText = newAchievements.length > 0
        ? `\n🏆 ${newAchievements.map((a) => `${a.icon} ${a.name}`).join(', ')}`
        : ''

      await sendTelegramMessage(chatId,
        `✅ Заметка сохранена! +${XP_REWARDS.NOTE_MANUAL} XP\n🔥 Стрик: ${streakResult?.streak || 0} дн.${achievementText}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Telegram] Webhook error:', error)
    console.error('[Telegram] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ ok: true })
  }
}
