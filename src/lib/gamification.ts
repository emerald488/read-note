import { SupabaseClient } from '@supabase/supabase-js'

export const XP_REWARDS = {
  PAGES_READ: 2, // per page
  NOTE_MANUAL: 20,
  NOTE_VOICE: 30,
  REVIEW_CARD: 10,
  BOOK_FINISHED: 200,
  STREAK_BONUS_PER_DAY: 5,
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100
}

export function xpForNextLevel(level: number): number {
  return level * level * 100
}

export function xpProgress(xp: number): { current: number; needed: number; percentage: number } {
  const level = calculateLevel(xp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForNextLevel(level)
  const current = xp - currentLevelXp
  const needed = nextLevelXp - currentLevelXp
  return { current, needed, percentage: Math.min((current / needed) * 100, 100) }
}

export async function addXp(supabase: SupabaseClient, userId: string, amount: number) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level')
    .eq('id', userId)
    .single()

  if (!profile) return

  const newXp = profile.xp + amount
  const newLevel = calculateLevel(newXp)

  await supabase
    .from('profiles')
    .update({ xp: newXp, level: newLevel })
    .eq('id', userId)

  return { xp: newXp, level: newLevel, levelUp: newLevel > profile.level }
}

export async function updateStreak(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, last_read_date')
    .eq('id', userId)
    .single()

  if (!profile) return

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = profile.current_streak

  if (profile.last_read_date === today) {
    return { streak: newStreak, isNew: false }
  } else if (profile.last_read_date === yesterday) {
    newStreak += 1
  } else {
    newStreak = 1
  }

  const longestStreak = Math.max(newStreak, profile.longest_streak)

  await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_read_date: today,
    })
    .eq('id', userId)

  return { streak: newStreak, isNew: true }
}

export interface AchievementDef {
  type: string
  name: string
  description: string
  icon: string
  check: (stats: UserStats) => boolean
}

export interface UserStats {
  booksFinished: number
  currentStreak: number
  totalNotes: number
  totalReviews: number
  voiceNotes: number
  maxPagesInDay: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { type: 'first_book', name: 'Первые шаги', description: 'Прочитать 1 книгу', icon: '📖', check: (s) => s.booksFinished >= 1 },
  { type: 'bookworm', name: 'Книжный червь', description: 'Прочитать 5 книг', icon: '🐛', check: (s) => s.booksFinished >= 5 },
  { type: 'librarian', name: 'Библиотекарь', description: 'Прочитать 20 книг', icon: '📚', check: (s) => s.booksFinished >= 20 },
  { type: 'week_streak', name: 'Неделя огня', description: '7-дневный стрик', icon: '🔥', check: (s) => s.currentStreak >= 7 },
  { type: 'month_streak', name: 'Месяц дисциплины', description: '30-дневный стрик', icon: '💪', check: (s) => s.currentStreak >= 30 },
  { type: 'note_master', name: 'Заметочник', description: '50 заметок', icon: '📝', check: (s) => s.totalNotes >= 50 },
  { type: 'review_master', name: 'Мастер повторений', description: '100 повторений карточек', icon: '🧠', check: (s) => s.totalReviews >= 100 },
  { type: 'voice_reader', name: 'Голос читателя', description: '10 голосовых заметок', icon: '🎙️', check: (s) => s.voiceNotes >= 10 },
  { type: 'marathon', name: 'Марафонец', description: '100 страниц за день', icon: '🏃', check: (s) => s.maxPagesInDay >= 100 },
]

export async function checkAchievements(supabase: SupabaseClient, userId: string) {
  const [
    { count: booksFinished },
    { data: profile },
    { count: totalNotes },
    { count: voiceNotes },
    { data: existingAchievements },
  ] = await Promise.all([
    supabase.from('books').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'finished'),
    supabase.from('profiles').select('current_streak').eq('id', userId).single(),
    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('source', 'voice'),
    supabase.from('achievements').select('type').eq('user_id', userId),
  ])

  // Get total reviews count
  const { count: totalReviews } = await supabase
    .from('review_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gt('repetitions', 0)

  // Get max pages in a single day (sum pages_read grouped by date, take max)
  const { data: dailyPages } = await supabase
    .from('reading_sessions')
    .select('date, pages_read')
    .eq('user_id', userId)

  let maxPagesInDay = 0
  if (dailyPages) {
    const byDate: Record<string, number> = {}
    for (const s of dailyPages) {
      byDate[s.date] = (byDate[s.date] || 0) + s.pages_read
    }
    maxPagesInDay = Math.max(0, ...Object.values(byDate))
  }

  const stats: UserStats = {
    booksFinished: booksFinished || 0,
    currentStreak: profile?.current_streak || 0,
    totalNotes: totalNotes || 0,
    totalReviews: totalReviews || 0,
    voiceNotes: voiceNotes || 0,
    maxPagesInDay,
  }

  const earnedTypes = new Set(existingAchievements?.map((a) => a.type) || [])
  const newAchievements: AchievementDef[] = []

  for (const achievement of ACHIEVEMENTS) {
    if (!earnedTypes.has(achievement.type) && achievement.check(stats)) {
      newAchievements.push(achievement)
      await supabase.from('achievements').insert({
        user_id: userId,
        type: achievement.type,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
      })
    }
  }

  return newAchievements
}
