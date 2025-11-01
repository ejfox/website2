export interface PredictionUpdate {
  timestamp: string // ISO date when update was made
  confidenceBefore?: number // Previous confidence level (if changed)
  confidenceAfter?: number // New confidence level (if changed)
  reasoning: string // Explanation for the update
  hash: string // SHA-256 hash after this update
  gitCommit?: string // Git commit hash for this update
}

export interface Prediction {
  id: string // Unique identifier
  statement: string // The prediction itself
  created: Date // When the prediction was made
  createdAt?: Date // Alternative creation field name
  confidence: number // 0-100% confidence level
  deadline?: Date // When to evaluate the prediction (optional)
  categories: string[] // Tags/categories
  outcome?: {
    resolved: Date // When evaluated
    correct: boolean // Was it correct?
    notes: string // Reflection/notes on the outcome
  }
  visibility: 'public' | 'private' // Allow some private predictions
  evidence?: string // Supporting reasoning/links

  // Update trail
  updates?: PredictionUpdate[] // History of updates to this prediction

  // Resolution fields
  resolution?: boolean // Was the prediction correct?
  resolvedAt?: Date // When the prediction was resolved
  notes?: string // Additional notes
  updatedAt?: Date // When the prediction was last updated

  // Verification fields
  hash?: string // SHA-256 hash of prediction content
  gitCommit?: string // Git commit hash when prediction was made
  pgpSignature?: string // Optional PGP signature
  signed?: string // ISO date when signed
  blockchainAnchor?: {
    // Optional blockchain anchor
    type: string
    height: number
    url: string
  }
}

// Input types for API operations
export interface CreatePredictionInput {
  statement: string
  confidence: number
  deadline?: Date
  categories: string[]
  visibility: 'public' | 'private'
  evidence?: string
}

export interface UpdatePredictionInput {
  statement?: string
  confidence?: number
  deadline?: Date
  categories?: string[]
  visibility?: 'public' | 'private'
  evidence?: string
  resolution?: boolean
  resolvedAt?: Date
  notes?: string
}

// Stats interface for predictions
export interface PredictionStats {
  total: number
  resolved: number
  correct: number
  incorrect: number
  pending: number
  accuracy: number
  avgConfidence?: number
  brierScore?: number
  categoryCounts?: Record<string, number>
  confidenceBuckets?: {
    low: number
    medium: number
    high: number
  }
  recentPredictions?: Prediction[]
}
