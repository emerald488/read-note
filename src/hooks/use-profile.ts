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
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, loading, refetch: fetchProfile }
}
