'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  xp: number
  level: number
  current_streak: number
  longest_streak: number
  last_read_date: string | null
  telegram_chat_id: number | null
  telegram_link_code: string | null
  created_at: string
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setLoading(false); return }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setProfile(data)
    setLoading(false)
  }, [])

  // Data fetching on mount — async setState is intentional
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProfile() }, [fetchProfile])

  return { profile, loading, refetch: fetchProfile }
}
