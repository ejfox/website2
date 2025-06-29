# 🔮 Prediction System

Create cryptographically verifiable predictions with built-in quality guidance.

## Quick Start

**Interactive Wizard:**
```bash
yarn predict
```

**CLI Mode:**
```bash
# Time-bound prediction
yarn predict --statement "Bitcoin will hit $200k by 2025" --confidence 75 --deadline 2025-12-31 --resolution "Using CoinGecko closing price"

# Event-based prediction (no deadline)
yarn predict --statement "Next recession will last 18+ months" --confidence 70 --resolution "Using NBER recession dating"
```

Both modes create cryptographically verified predictions with quality analysis.

## What You Get

### 🔒 **Cryptographic Verification**
- SHA-256 content hashing
- Git commit timestamps
- Immutable file storage
- Optional PGP signing

### 🎯 **Quality Guidance**
- Step-by-step tutorials
- Built-in best practices
- Interactive refinement
- Optional AI-powered analysis

### 📊 **Professional Features**
- Proper confidence calibration
- Resolution criteria enforcement
- Category organization
- Evidence documentation

## How It Works

### 1. **Statement Creation**
The wizard helps you write clear, specific predictions:

✅ **Good:** "Bitcoin will exceed $150,000 USD by December 31, 2025"
❌ **Bad:** "Bitcoin will go up a lot"

### 2. **Resolution Criteria**
Define exactly how you'll determine if you were correct:

✅ **Good:** "Using CoinGecko's closing price on December 31, 2025 at 11:59 PM UTC"
❌ **Bad:** "If Bitcoin seems to have done well"

### 3. **Quality Analysis**
Built-in checker evaluates your prediction on:
- **Clarity** - Is it unambiguous?
- **Specificity** - Does it include numbers/dates?
- **Measurability** - Can the outcome be objectively determined?
- **Resolvability** - Are the criteria detailed enough?

### 4. **Flexible Deadlines**
- **Time-bound predictions**: "Bitcoin will hit $200k by Dec 31, 2025"
- **Event-based predictions**: "Next recession will last 18+ months" (resolves when it happens)
- **Optional deadlines**: System works perfectly with or without specific dates

### 5. **Cryptographic Storage**
Your prediction is automatically:
- Hashed with SHA-256
- Committed to Git with timestamp
- Stored as markdown with structured metadata
- Ready for your frontend to display

## Optional AI Enhancement

Add AI-powered quality checking by setting your OpenRouter API key:

```bash
# In your .env file
OPENROUTER_API_KEY=your_key_here
```

**With AI you get:**
- Detailed scoring (1-10)
- Specific improvement suggestions
- Strength identification
- Concern highlighting

**Without AI you get:**
- Built-in quality analysis
- Best practice guidance
- All core functionality

The system works great either way!

## File Structure

Predictions are stored as markdown files in `/content/predictions/`:

```
content/predictions/
├── 2025-bitcoin-price-prediction.md
├── 2026-ai-breakthrough.md
└── 2027-climate-targets.md
```

Each file contains:
```yaml
---
id: a1b2c3d4
statement: "Bitcoin will exceed $150,000 USD by December 31, 2025"
resolutionCriteria: "Using CoinGecko's closing price..."
confidence: 75
deadline: 2025-12-31  # Optional - only for time-bound predictions
categories: [cryptocurrency, finance]
created: 2025-01-18T12:00:00.000Z
hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
---

# Resolution Criteria

Using CoinGecko's closing price on December 31, 2025 at 11:59 PM UTC...

# Evidence and Reasoning

Institutional adoption continues to grow...
```

## Frontend Integration

Your existing Vue.js frontend automatically displays predictions with:
- Prediction cards
- Statistics dashboard
- Calibration analysis
- Verification display

No additional setup needed!

## Best Practices

### Writing Good Predictions

1. **Be Specific**
   - Include exact numbers, dates, thresholds
   - Avoid vague terms like "a lot" or "soon"

2. **Make It Measurable**
   - Choose objective, verifiable criteria
   - Specify data sources you'll use

3. **Avoid Compound Predictions**
   - Break "A and B will happen" into separate predictions
   - Each prediction should have one clear outcome

4. **Define Edge Cases**
   - What happens if the company goes bankrupt?
   - What if the data source changes?

### Confidence Guidelines

- **50%** = Coin flip / Complete uncertainty
- **70%** = Likely but significant doubt remains
- **85%** = Very likely, would be surprised if wrong
- **95%** = Almost certain, would bet heavily

**Avoid extremes** (0-5% or 95-100%) unless truly exceptional.

## Troubleshooting

### Command Not Found
```bash
# Make sure you're in the project directory
cd /path/to/website2
yarn predict
```

### Git Issues
The wizard handles Git gracefully:
- Creates commits automatically if in a Git repo
- Works fine without Git (just skips version control)
- Never fails if Git operations don't work

### LLM Not Working
This is completely normal! The system works great without AI:
- Built-in quality analysis is comprehensive
- All guidance and examples are built-in
- No functionality is lost

### File Permissions
```bash
# If the script isn't executable
chmod +x scripts/predict-pro.mjs
```

## Examples

### Time-bound Prediction
```bash
yarn predict \
  --statement "At least one major tech company will release an AI model that consistently outperforms GPT-4 by December 31, 2025" \
  --confidence 75 \
  --deadline 2025-12-31 \
  --resolution "Measured using MMLU, HumanEval, and HellaSwag benchmarks. Must score higher on 2 of 3." \
  --categories "ai,technology"
```

### Event-based Prediction (No Deadline)
```bash
yarn predict \
  --statement "The next major recession will last longer than 18 months" \
  --confidence 70 \
  --resolution "Using NBER recession dating committee official start and end dates" \
  --categories "economics,recession"
```

### Economic Prediction with Deadline
```bash
yarn predict \
  --statement "The S&P 500 will close above 6000 points" \
  --confidence 60 \
  --deadline 2025-06-30 \
  --resolution "Using official S&P 500 closing price as reported by S&P Dow Jones Indices" \
  --categories "finance,stocks"
```

## Advanced Features

### Categories
Organize predictions with tags:
- `ai`, `technology`, `economics`
- `politics`, `climate`, `sports`
- Custom categories welcome

### Evidence
Document your reasoning:
- Background research
- Data sources
- Expert opinions
- Historical patterns

### Verification
Each prediction includes:
- Unique cryptographic hash
- Git commit timestamp
- File modification tracking
- Optional PGP signature

## Integration with Frontend

Your predictions automatically appear in:
- `/predictions` - All predictions page
- Prediction dashboard with statistics
- Individual prediction pages
- RSS feeds for external tracking

The system is designed to be both simple to use and production-ready for serious forecasting.

---

*Ready to make your first prediction? Just run `yarn predict`!*