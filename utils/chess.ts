// Chess/gaming display helpers — rating-diff formatting + result colors.

export const formatRatingDiff = (diff: number): string => {
  if (diff === 0) return '±0'
  return diff > 0 ? `+${diff}` : `${diff}`
}

export const getChessResultColor = (result: string): string => {
  switch (result) {
    case 'win':
      return 'bg-zinc-400 dark:bg-zinc-500'
    case 'loss':
      return 'bg-red-500'
    case 'draw':
      return 'bg-zinc-500'
    default:
      return 'bg-zinc-500'
  }
}

export const getChessBarColor = (result: string): string => {
  switch (result) {
    case 'win':
      return '#a1a1aa' // Gray-400
    case 'loss':
      return '#3f3f46' // Gray-700
    case 'draw':
      return '#71717a' // Gray-500
    default:
      return '#71717a' // Gray-500
  }
}

export const getRatingDiffClass = (diff: number): string => {
  return diff > 0 ? 'text-zinc-600 dark:text-zinc-400' : 'text-red-500'
}
