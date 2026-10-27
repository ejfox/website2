/**
 * @file chess.ts
 * @description Chess display helpers — rating diffs + the primary time
 *   control. Used by components/stats/ChessStats.vue and TopStats.vue.
 */

export const formatRatingDiff = (diff: number): string => {
  if (diff === 0) return '±0'
  return diff > 0 ? `+${diff}` : `${diff}`
}

export const getRatingDiffClass = (diff: number): string => {
  return diff > 0
    ? 'text-zinc-600 dark:text-zinc-400'
    : 'text-red-600 dark:text-red-500'
}

export type ChessTimeControl = 'bullet' | 'blitz' | 'rapid'
const TIME_CONTROLS: ChessTimeControl[] = ['bullet', 'blitz', 'rapid']

interface ChessRatingsLike {
  currentRating?: number | Partial<Record<ChessTimeControl, number>>
  gamesPlayed?: number | Partial<Record<ChessTimeControl | 'total', number>>
}

/**
 * The one time control /stats leads with, everywhere (top tile, chess
 * section, skeleton). Blitz is the established rating; if it's missing, the
 * control with the most games wins. Never "the highest current rating", which
 * let a single provisional rapid game headline the section.
 */
export const primaryTimeControl = (
  chess: ChessRatingsLike | null | undefined
): ChessTimeControl | null => {
  const ratings = chess?.currentRating
  if (!ratings || typeof ratings !== 'object') return null
  if ((ratings.blitz || 0) > 0) return 'blitz'
  const games =
    chess?.gamesPlayed && typeof chess.gamesPlayed === 'object'
      ? chess.gamesPlayed
      : {}
  const rated = TIME_CONTROLS.filter((tc) => (ratings[tc] || 0) > 0)
  if (!rated.length) return null
  return rated.reduce((a, b) => ((games[b] || 0) > (games[a] || 0) ? b : a))
}
