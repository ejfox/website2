# Shared Utilities & Composables

Centralized, single-source-of-truth composables to reduce duplication and maintain consistency across the site.

## Date Formatting (`useDateFormat`)

Centralized date formatting using `date-fns`. Replaces 15+ duplicate `formatDate` functions.

### Basic Formatting

```typescript
const { formatDate, formatShortDate, formatLongDate, formatCompactDate } =
  useDateFormat()

formatDate(date, 'custom pattern') // Use date-fns patterns
formatShortDate(date) // "Nov 28, 2025"
formatLongDate(date) // "November 28, 2025"
formatCompactDate(date) // "2025-11-28"
formatYearOnly(date) // "2025"
```

### Relative Time (Human-Readable)

```typescript
const { calculateDaysAgo, formatTimeAgo, formatShortRelativeTime } =
  useDateFormat()

calculateDaysAgo('2025-11-21') // "7 days ago"
calculateDaysAgo('2020-11-28') // "5 years ago"

formatTimeAgo(date, 'filed') // "filed 7 years ago"
formatTimeAgo(date, 'updated') // "updated 2 days ago"
formatTimeAgo(date) // "7 years ago" (no prefix)

formatShortRelativeTime(date) // "7d ago" or "3h ago"
```

### Standard Formatting

```typescript
const { formatRelativeTime, formatTimestamp } = useDateFormat()

formatRelativeTime(date) // "2 hours ago" (date-fns default)
formatTimestamp(date) // "Nov 28, 2025 3:45 PM"
```

**Used in:** FOIA components, `/now` page, predictions page

---

## Status Formatting (`useStatusFormatting`)

Centralized status labels and styling for consistent data representation.

### FOIA Status

```typescript
const { formatFoiaStatus, isFoiaOpen, getFoiaStatusClass } =
  useStatusFormatting()

formatFoiaStatus('no_docs') // "NO_DOCS"
formatFoiaStatus('payment') // "PAYMENT"
isFoiaOpen('done') // false
isFoiaOpen('submitted') // true
getFoiaStatusClass('rejected') // "font-mono text-xs text-zinc-600..."
```

### Prediction Status

```typescript
const { formatPredictionStatus, getPredictionStatusClass } =
  useStatusFormatting()

formatPredictionStatus('correct') // "✓ Correct"
formatPredictionStatus('incorrect') // "✗ Incorrect"
formatPredictionStatus('pending') // "○ Pending"
getPredictionStatusClass('correct') // "text-green-600 dark:text-green-500"
```

### Generic Status

```typescript
const { formatStatus } = useStatusFormatting()

formatStatus('payment', 'foia') // "PAYMENT"
formatStatus('correct', 'prediction') // "✓ Correct"
formatStatus('active', 'generic') // "ACTIVE"
```

**Used in:** FOIA components, predictions page

---

## Number Formatting (`useNumberFormat`)

Comprehensive number formatting utilities already in the codebase.

```typescript
const {
  formatNumber, // "1,234,567"
  formatPercent, // "45.6%"
  formatCurrency, // "$1,234,567"
  formatCompact, // "1.2M"
  formatNumberSimple, // "1.2M" or "450K"
  formatBytes, // "2.5 MB"
  formatDuration, // "2h 30m"
  getColorForValue, // Get color for normalized value (0-1)
} = useNumberFormat()
```

**Used in:** Stats page, predictions page, gear page

---

## Migration Guide

### Before (Duplicate Functions)

```typescript
// In FoiaRequestItem.vue
function formatStatus(status: string) {
  const statusMap: Record<string, string> = {
    payment: 'PAYMENT',
    no_docs: 'NO_DOCS',
    // ... 8+ more entries
  }
  return statusMap[status] || status.toUpperCase()
}

function daysAgo(dateStr: string) {
  // 10 lines of manual date-fns calls
  const days = differenceInDays(new Date(), date)
  if (days === 0) return 'filed today'
  // ... repeated in 3+ places
}
```

### After (Centralized)

```typescript
const { formatFoiaStatus } = useStatusFormatting()
const { formatTimeAgo } = useDateFormat()

// Use directly in template
{
  {
    formatFoiaStatus(status)
  }
}
{
  {
    formatTimeAgo(filed, 'filed')
  }
}
```

**Code Reduction:** ~50 lines → 2 lines per component

---

## Adding New Utilities

When you find duplicate logic across 2+ components:

1. **Identify the pattern** - What's being repeated?
2. **Create function in appropriate composable** - Date? Status? Number?
3. **Add JSDoc comments** - Explain parameters and return values
4. **Export from composable** - Add to return object
5. **Replace in components** - Remove local function, import composable

Example:

```typescript
// In useStatusFormatting.ts
export const useStatusFormatting = () => {
  /**
   * Your new function with JSDoc
   */
  const myNewFormatter = (value) => {
    // implementation
  }

  return {
    // ... existing exports
    myNewFormatter, // Add here
  }
}

// In component
const { myNewFormatter } = useStatusFormatting()
```

---

## Testing Composables

All composables handle edge cases:

- `null` / `undefined` values → return empty string or sensible default
- Invalid dates → caught with try/catch
- Type coercion → number timestamps vs ISO strings handled

```typescript
// These all work safely
formatDate(null) // ""
formatDate('invalid') // ""
formatShortRelativeTime(123) // "X ago"
```

---

## Key Principles

✓ **Single source of truth** - One function, used everywhere
✓ **Consistent error handling** - All functions gracefully handle edge cases
✓ **Type safety** - Full TypeScript support
✓ **Documentation** - JSDoc comments with examples
✓ **Minimal dependencies** - Mostly date-fns + existing utilities
✓ **Composable** - Pair different utilities for complex formatting

---

## Related Files

- `composables/useDateFormat.ts` - All date/time logic
- `composables/useStatusFormatting.ts` - Status badges and labels
- `composables/useNumberFormat.ts` - Number/currency/duration formatting
- `components/foia/FoiaRequestItem.vue` - Example of proper usage
- `pages/now.vue` - Example of date-fns integration
