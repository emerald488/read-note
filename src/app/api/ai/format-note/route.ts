import { NextRequest, NextResponse } from 'next/server'
import { formatNote } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
