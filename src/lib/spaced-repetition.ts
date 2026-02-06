export interface ReviewResult {
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: string // ISO date string
}

export function sm2(
  quality: number, // 0-5 rating
  easeFactor: number,
  interval: number,
  repetitions: number
): ReviewResult {
  let newEaseFactor = easeFactor
  let newInterval = interval
  let newRepetitions = repetitions

  if (quality < 3) {
    newRepetitions = 0
    newInterval = 1
  } else {
    if (newRepetitions === 0) {
      newInterval = 1
    } else if (newRepetitions === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(newInterval * newEaseFactor)
    }
    newRepetitions += 1
  }

  newEaseFactor = Math.max(
    1.3,
    newEaseFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + newInterval)

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: nextDate.toISOString().split('T')[0],
  }
}

export function qualityFromButton(button: 'forgot' | 'hard' | 'normal' | 'easy'): number {
  switch (button) {
    case 'forgot': return 1
    case 'hard': return 3
    case 'normal': return 4
    case 'easy': return 5
  }
}
