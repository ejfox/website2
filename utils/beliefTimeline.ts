/**
 * Belief changelog: turns prediction frontmatter into timeline rows for
 * components/predictions/BeliefTimeline.vue. Pure, so it's testable.
 */

export interface BeliefUpdate {
  timestamp: string
  confidenceBefore: number
  confidenceAfter: number
  reasoning?: string
}

export interface BeliefPrediction {
  slug: string
  statement: string
  confidence: number
  created?: string
  deadline?: string
  resolved?: boolean
  resolved_date?: string
  status?: string
  updates?: BeliefUpdate[]
}

export interface BeliefRow {
  slug: string
  statement: string
  label: string
  signed: number
  current: number
  created: number
  deadline: number
  resolvedAt: number | null
  status: 'correct' | 'incorrect' | 'resolved' | 'open'
  updates: Array<{
    t: number
    before: number
    after: number
    reasoning: string
  }>
}

const ms = (d?: string) => (d ? Date.parse(d) : Number.NaN)

// `confidence` in frontmatter is the CURRENT belief — predict-pro overwrites it
// on update. What was signed is the first update's `confidenceBefore`.
export const beliefSignedConfidence = (p: BeliefPrediction): number => {
  const ups = [...(p.updates || [])].sort(
    (a, b) => ms(a.timestamp) - ms(b.timestamp)
  )
  return ups[0]?.confidenceBefore ?? p.confidence
}

// Cut at a word boundary; the full statement rides along in a <title>
export const beliefShortLabel = (s: string, max = 30): string => {
  const flat = (s || '').replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > max * 0.5 ? cut.slice(0, sp) : cut).replace(/[,;:.]$/, '')}…`
}

// Resolved first (in resolution order), then open by deadline
export const buildBeliefRows = (preds: BeliefPrediction[]): BeliefRow[] =>
  preds
    .filter(
      (p) => !Number.isNaN(ms(p.created)) && !Number.isNaN(ms(p.deadline))
    )
    .map((p) => {
      const resolvedAt = p.resolved ? ms(p.resolved_date) : Number.NaN
      return {
        slug: p.slug,
        statement: p.statement,
        label: beliefShortLabel(p.statement),
        signed: beliefSignedConfidence(p),
        current: p.confidence,
        created: ms(p.created),
        deadline: ms(p.deadline),
        resolvedAt: Number.isNaN(resolvedAt) ? null : resolvedAt,
        status: (p.resolved
          ? p.status === 'correct' || p.status === 'incorrect'
            ? p.status
            : 'resolved'
          : 'open') as BeliefRow['status'],
        updates: [...(p.updates || [])]
          .filter((u) => !Number.isNaN(ms(u.timestamp)))
          .sort((a, b) => ms(a.timestamp) - ms(b.timestamp))
          .map((u) => ({
            t: ms(u.timestamp),
            before: u.confidenceBefore,
            after: u.confidenceAfter,
            reasoning: (u.reasoning || '').replace(/\s+/g, ' ').trim(),
          })),
      }
    })
    .sort((a, b) => {
      const ao = a.status === 'open' ? 1 : 0
      const bo = b.status === 'open' ? 1 : 0
      if (ao !== bo) return ao - bo
      const ae = a.resolvedAt ?? a.deadline
      const be = b.resolvedAt ?? b.deadline
      return ae - be || a.deadline - b.deadline || a.created - b.created
    })
