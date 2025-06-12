# Predictions

This directory contains cryptographically verifiable predictions about the future. Each prediction is hashed and timestamped to prevent post-hoc modifications.

## Creating a New Prediction

1. Create a new markdown file in this directory with the format:

```markdown
---
statement: Your prediction statement
confidence: 75
deadline: 2025-12-31
categories: [category1, category2]
visibility: public
created: 2025-01-18
---

# Evidence and Reasoning

Your reasoning and evidence here...
```

2. Sign the prediction using the signing script:

```bash
node scripts/sign-prediction.mjs content/predictions/your-prediction.md
```

3. Optionally add PGP signature:

```bash
node scripts/sign-prediction.mjs content/predictions/your-prediction.md --pgp
```

4. Commit the signed prediction to Git for timestamping.

## Verification

Each prediction includes:
- **SHA-256 Hash**: Content integrity verification
- **Git Commit**: Immutable timestamp through version control
- **PGP Signature** (optional): Cryptographic signature with key `5D30A33E08E35B8915B4C7E2E2078E653FE389CD`

View all predictions with verification status at [/future](/future).

## Format

### Required Fields
- `statement`: The prediction being made
- `confidence`: 0-100 confidence level
- `deadline`: ISO date when the prediction should be evaluated
- `categories`: Array of category tags
- `visibility`: "public" or "private"
- `created`: ISO date when prediction was created

### Optional Fields
- `outcome`: Added when prediction is resolved
  - `resolved`: ISO date of resolution
  - `correct`: boolean
  - `notes`: explanation of outcome
- `hash`: SHA-256 hash (added by signing script)
- `gitCommit`: Git commit hash (added by signing script)
- `pgpSignature`: PGP signature (added with --pgp flag)