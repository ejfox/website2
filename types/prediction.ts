export interface Prediction {
  id: string;                // Unique identifier
  statement: string;         // The prediction itself
  created: Date;             // When the prediction was made
  confidence: number;        // 0-100% confidence level
  deadline?: Date;           // When to evaluate the prediction (optional)
  categories: string[];      // Tags/categories
  outcome?: {
    resolved: Date;          // When evaluated
    correct: boolean;        // Was it correct?
    notes: string;           // Reflection/notes on the outcome
  };
  visibility: 'public' | 'private'; // Allow some private predictions
  evidence?: string;         // Supporting reasoning/links
  
  // Verification fields
  hash?: string;             // SHA-256 hash of prediction content
  gitCommit?: string;        // Git commit hash when prediction was made
  pgpSignature?: string;     // Optional PGP signature
  signed?: string;           // ISO date when signed
  blockchainAnchor?: {       // Optional blockchain anchor
    type: string;
    height: number;
    url: string;
  };
}