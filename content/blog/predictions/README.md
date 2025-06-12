# Predictions System

This directory contains cryptographically verified predictions. Each prediction is:

1. **Hashed** - SHA-256 hash of the content is stored in frontmatter
2. **Timestamped** - Creation time is recorded
3. **Git-tracked** - Git commit provides additional timestamping
4. **Optionally signed** - Can be signed with PGP for additional verification

## Creating a New Prediction

1. Copy `_template.md` to a new file (e.g., `2026-predictions.md`)
2. Fill in your predictions using the template structure
3. Run the signing script:
   ```bash
   node scripts/predictions/sign-prediction.mjs content/blog/predictions/2026-predictions.md
   ```
4. Commit the changes - the Git commit hash will be recorded

## Verifying a Prediction

The verification data in the frontmatter includes:

- `hash`: SHA-256 hash of the content
- `timestamp`: ISO timestamp of when prediction was signed
- `gitCommit`: Git commit hash when the prediction was created/updated
- `gitDate`: Git commit timestamp
- `signature`: Optional PGP signature

## Format

Each prediction should include:

- **Title**: Clear, specific description
- **Confidence**: Percentage (0-100%)
- **Deadline**: When this can be resolved
- **Description**: Detailed statement of what you're predicting
- **Reasoning**: Why you believe this will/won't happen

## Resolution

When predictions resolve, update the status to one of:
- `correct`
- `incorrect`
- `ambiguous`
- `resolved` (general resolution without clear outcome)

Keep the original prediction text intact for accountability.