import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const file = new File([new Uint8Array(audioBuffer)], filename, { type: 'audio/ogg' })
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'ru',
  })
  return transcription.text
}

export async function formatNote(rawText: string, bookTitle?: string): Promise<string> {
  const context = bookTitle ? ` о книге "${bookTitle}"` : ''
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Ты помощник для ведения читательского дневника. Переформатируй заметку${context} в структурированный, читаемый вид. Сохрани все ключевые мысли, добавь структуру с заголовками если уместно. Используй markdown. Отвечай на русском.`,
      },
      { role: 'user', content: rawText },
    ],
    max_tokens: 1000,
  })
  return response.choices[0]?.message?.content || rawText
}

export async function generateReviewCards(
  noteText: string,
  bookTitle?: string
): Promise<{ question: string; answer: string }[]> {
  const context = bookTitle ? ` из книги "${bookTitle}"` : ''
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `На основе заметки${context} создай 2-5 карточек для повторения материала. Каждая карточка содержит вопрос и краткий ответ. Вопросы должны быть разного типа: фактические, на понимание, на применение. Отвечай в формате JSON массива: [{"question": "...", "answer": "..."}]. Отвечай на русском. Ничего кроме JSON не пиши.`,
      },
      { role: 'user', content: noteText },
    ],
    max_tokens: 1000,
  })
  try {
    const content = response.choices[0]?.message?.content || '[]'
    return JSON.parse(content)
  } catch {
    return []
  }
}
