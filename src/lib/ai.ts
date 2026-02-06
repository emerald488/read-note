import OpenAI from 'openai'
import { PROMPTS } from './prompts'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const file = new File([new Uint8Array(audioBuffer)], filename, { type: 'audio/ogg' })
  const transcription = await getOpenAI().audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'ru',
  })
  return transcription.text
}

export async function formatNote(rawText: string, bookTitle?: string): Promise<string> {
  const context = bookTitle ? ` о книге "${bookTitle}"` : ''
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: PROMPTS.formatNote(context),
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
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: PROMPTS.generateReviewCards(context),
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
