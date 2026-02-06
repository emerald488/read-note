import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB (Whisper limit)
const ALLOWED_TYPES = ['audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/flac']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 413 })
    }

    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 415 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await transcribeAudio(buffer, file.name)

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
