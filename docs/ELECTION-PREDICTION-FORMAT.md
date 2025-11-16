# Election Prediction Data Format

Canonical schema for election model outputs consumed by this website.

## Philosophy

This site **displays** election predictions. It does NOT generate them.

The election model (separate repo) outputs standardized JSON → this site consumes & presents it.

## File Location

```
content/predictions/elections/
├── 2026/
│   ├── TX-GOV.json
│   ├── CA-SEN.json
│   └── FL-GOV.json
└── 2028/
    └── POTUS.json
```

## Schema v1.0.0

### Minimal Example

```json
{
  "version": "1.0.0",
  "race_id": "TX-GOV-2026",
  "race_type": "gubernatorial",
  "state": "TX",
  "year": 2026,
  "created_at": "2025-11-14T20:45:00Z",
  "updated_at": "2025-11-14T20:45:00Z",

  "prediction": {
    "winner": "R",
    "probability": 0.73,
    "margin": 6.0,
    "confidence": "medium"
  },

  "signature": {
    "hash": "SHA256:a7f3b9c2d8e5f1a3b6c9d2e7f4a1b8c5d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5",
    "method": "SHA256",
    "timestamp": "2025-11-14T20:45:00Z"
  }
}
```

### Full Example

```json
{
  "version": "1.0.0",
  "race_id": "TX-GOV-2026",
  "race_type": "gubernatorial",
  "state": "TX",
  "year": 2026,
  "fips": "48",

  "created_at": "2025-11-14T20:45:00Z",
  "updated_at": "2025-11-15T14:30:00Z",
  "model_version": "v1.2.3",

  "candidates": [
    { "name": "Greg Abbott", "party": "R" },
    { "name": "Beto O'Rourke", "party": "D" }
  ],

  "prediction": {
    "winner": "R",
    "probability": 0.73,
    "margin": 6.0,
    "confidence": "medium",
    "updated": false
  },

  "methodology": {
    "baseline": "R+7",
    "adjustments": {
      "incumbent_fatigue": -2,
      "demographic_shift": -1,
      "candidate_quality": 3,
      "media_narrative": -1,
      "ground_game": 2,
      "vibe_check": -1
    },
    "notes": "Abbott showing weakness in suburbs. Challenger has momentum but R turnout machine still formidable."
  },

  "market_comparison": {
    "kalshi_ticker": "TXGOV26-R",
    "kalshi_price": 0.65,
    "edge": 0.08,
    "position_size": 40,
    "entry_price": 0.65
  },

  "signature": {
    "hash": "SHA256:a7f3b9c2d8e5f1a3b6c9d2e7f4a1b8c5d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5",
    "method": "SHA256",
    "timestamp": "2025-11-14T20:45:00Z",
    "git_commit": "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8"
  },

  "related": {
    "blog_posts": ["/blog/2026/texas-governor-race-analysis"],
    "kalshi_positions": ["TXGOV26-R"],
    "prediction_id": "texas-governor-2026"
  }
}
```

### County-Level Extension (Future)

```json
{
  "version": "1.0.0",
  "race_id": "TX-GOV-2026",
  "granularity": "county",

  "prediction": {
    "winner": "R",
    "probability": 0.73,
    "margin": 6.0
  },

  "counties": [
    {
      "fips": "48201",
      "name": "Harris County",
      "winner": "D",
      "margin": -12.0,
      "turnout_estimate": 0.68
    },
    {
      "fips": "48113",
      "name": "Dallas County",
      "winner": "D",
      "margin": -8.0,
      "turnout_estimate": 0.65
    }
  ]
}
```

## Field Definitions

### Required Fields

- `version` (string): Schema version (semantic versioning)
- `race_id` (string): Unique identifier (STATE-RACETYPE-YEAR)
- `race_type` (enum): `"presidential"` | `"senate"` | `"house"` | `"gubernatorial"` | `"state_house"` | `"state_senate"` | `"mayoral"`
- `state` (string): 2-letter state code
- `year` (number): Election year
- `created_at` (ISO 8601): When prediction was first made
- `prediction.winner` (string): Predicted winner party code
- `prediction.probability` (number): Win probability 0-1
- `signature.hash` (string): Cryptographic hash of prediction
- `signature.timestamp` (ISO 8601): When signature was generated

### Optional Fields

- `fips` (string): FIPS code for state/district
- `updated_at` (ISO 8601): Last update timestamp
- `model_version` (string): Model version that generated this
- `candidates` (array): Candidate details
- `prediction.margin` (number): Expected vote margin
- `prediction.confidence` (enum): `"low"` | `"medium"` | `"high"`
- `prediction.updated` (boolean): Whether this is an update to earlier prediction
- `methodology` (object): How the prediction was made
- `market_comparison` (object): Kalshi market data
- `related` (object): Links to blog posts, Kalshi positions, etc
- `counties` (array): County-level breakdowns

## Race Type Conventions

### race_id Format

- **Presidential**: `POTUS-YEAR` (e.g., `POTUS-2028`)
- **Senate**: `STATE-SEN-YEAR` (e.g., `TX-SEN-2026`)
- **House**: `STATE-HOUSEDISTRICT-YEAR` (e.g., `TX-23-2026`)
- **Governor**: `STATE-GOV-YEAR` (e.g., `CA-GOV-2026`)
- **State Legislature**: `STATE-CHAMBER-DISTRICT-YEAR` (e.g., `TX-HD-23-2026`)

### Party Codes

- `R` - Republican
- `D` - Democratic
- `L` - Libertarian
- `G` - Green
- `I` - Independent
- `O` - Other

## Signature Requirements

Every prediction MUST be cryptographically signed to prevent retroactive editing.

### Minimum Signature

```json
{
  "signature": {
    "hash": "SHA256:...",
    "method": "SHA256",
    "timestamp": "2025-11-14T20:45:00Z"
  }
}
```

### Enhanced Signature (Recommended)

```json
{
  "signature": {
    "hash": "SHA256:...",
    "method": "SHA256",
    "timestamp": "2025-11-14T20:45:00Z",
    "git_commit": "9f8e7d6c...",
    "pgp_signature": "-----BEGIN PGP SIGNATURE-----..."
  }
}
```

## Validation Rules

1. `probability` must be between 0 and 1
2. `margin` is in percentage points
3. `confidence` must be one of: `"low"`, `"medium"`, `"high"`
4. `created_at` must be before election date
5. `signature.hash` must be SHA256 of canonical JSON (sorted keys, no whitespace)
6. If `updated_at` exists, must be >= `created_at`

## Usage in website2

The site consumes these files and:

1. **Displays on /predictions** page in "Election Models" section
2. **Links to related Kalshi positions** if `market_comparison` exists
3. **Shows methodology** for transparency
4. **Verifies signatures** to ensure integrity
5. **Updates automatically** when new files added
6. **Post-election analysis** comparing prediction to result

## Example Workflow

```bash
# Election model repo generates prediction
./predict.py TX-GOV-2026 > outputs/TX-GOV-2026.json

# Verify it's valid
./validate.py outputs/TX-GOV-2026.json

# Copy to website
cp outputs/TX-GOV-2026.json \
   ~/code/website2/content/predictions/elections/2026/

# Git commit (preserves timestamp)
cd ~/code/website2
git add content/predictions/elections/2026/TX-GOV-2026.json
git commit -m "Add Texas gubernatorial prediction"

# Website auto-detects and displays
```

## Versioning

This is **v1.0.0** of the schema.

Breaking changes will increment major version. Website will support multiple versions.

Future additions:

- `v1.1.0`: Add county-level data
- `v1.2.0`: Add time-series prediction history
- `v2.0.0`: Complete restructure (if needed)

---

_Keep it simple. Start with statewide races. Add complexity only when needed._
