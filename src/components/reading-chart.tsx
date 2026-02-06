'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface DayData {
  day: string
  pages: number
}

export function ReadingChart() {
  const [data, setData] = useState<DayData[]>([])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const fromDate = sevenDaysAgo.toISOString().split('T')[0]

      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('date, pages_read')
        .eq('user_id', session.user.id)
        .gte('date', fromDate)

      const byDate: Record<string, number> = {}
      for (const s of sessions || []) {
        byDate[s.date] = (byDate[s.date] || 0) + s.pages_read
      }

      const days: DayData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const dayIndex = (date.getDay() + 6) % 7
        days.push({ day: dayNames[dayIndex], pages: byDate[dateStr] || 0 })
      }

      setData(days)
    }
    fetchData()
  }, [])

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value) => [`${value} стр.`, 'Прочитано']}
          />
          <Bar dataKey="pages" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
