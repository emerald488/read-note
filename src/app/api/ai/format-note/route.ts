import { NextRequest, NextResponse } from 'next/server'
import { formatNote } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { text, bookTitle } = await request.json()
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const formatted = await formatNote(text, bookTitle)
    return NextResponse.json({ formatted })
  } catch (error) {
    console.error('Format error:', error)
    return NextResponse.json({ error: 'Formatting failed' }, { status: 500 })
  }
}
