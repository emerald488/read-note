import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await transcribeAudio(buffer, file.name)

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
