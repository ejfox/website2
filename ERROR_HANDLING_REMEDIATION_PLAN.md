# Error Handling Remediation Plan - Parallel Agent Tasks

## Overview
Systematic approach to fixing all 45+ error handling issues across the codebase using parallel subagents with unlimited token windows.

## Task Breakdown for Parallel Execution

### TASK 1: useFetch Error Handling in Pages (6 pages)
**Agent Type:** general-purpose
**Scope:**
- `pages/now.vue` - 3 useFetch calls without error handling
- `pages/sitemap.vue` - 3 useFetch calls without error handling
- `pages/following.vue` - 1 useFetch call without error handling
- `pages/gear/index.vue` - 1 useFetch call without error handling
- `pages/reading/[slug].vue` - Already has good error handling (SKIP)
- `pages/predictions/index.vue` - 1 useFetch call without error handling

**Work Required:**
1. Add `error` to destructuring from useFetch
2. Add error state checks in template (v-if="error")
3. Add user-facing error message display
4. Ensure data null checks with optional chaining

**Deliverable:** All pages have error states displayed and proper error handling

---

### TASK 2: $fetch Without Try/Catch (9 locations)
**Agent Type:** general-purpose
**Scope:**
- `pages/external-links.vue:3` - useAsyncData with $fetch
- `pages/predictions/[slug].vue:166` - $fetch without explicit handling
- `pages/bookmarklet-popup.vue:219` - $fetch for tags
- `pages/bookmarklet-popup.vue:231` - $fetch for suggestions
- `pages/projects/index.vue:11` - $fetch without try/catch
- `pages/blog/[...slug].vue:59` - Already has try/catch (SKIP)
- `pages/blog/[...slug].vue:536` - watchEffect $fetch
- `composables/useProcessedMarkdown.ts:200` - $fetch manifest
- `composables/useProcessedMarkdown.ts:307-316` - Promise.all without recovery

**Work Required:**
1. Wrap $fetch calls in try/catch or within error handlers
2. Add fallback values for failed fetches
3. Return empty/default data instead of throwing
4. Log errors properly for debugging

**Deliverable:** All $fetch calls have explicit error handling

---

### TASK 3: Null Safety & Type Checks (5 locations)
**Agent Type:** ada-quality-engineer
**Scope:**
- `pages/now.vue:14-50` - Deep property access without null checks
- `server/api/youtube.get.ts:151-152` - Array index without bounds check
- `server/api/kalshi.get.ts:399` - Non-null assertion without safety
- `composables/useProcessedMarkdown.ts:424` - No null check on return
- `pages/reading/[slug].vue:38-50` - Nested property access without checks

**Work Required:**
1. Add optional chaining (?.) at each level
2. Add nullish coalescing (??) with sensible defaults
3. Add guard clauses before deep property access
4. Ensure array bounds checking before indexing

**Deliverable:** All null safety issues resolved, no unsafe property access

---

### TASK 4: Race Conditions in Async Data (3 locations)
**Agent Type:** ada-quality-engineer
**Scope:**
- `pages/bookmarklet-popup.vue:216-250` - Parallel loads with shared state
- `pages/now.vue:3-5` - Data fetched at top level, computed accesses during loading
- `composables/useProcessedMarkdown.ts:307-316` - Partial success handling

**Work Required:**
1. Add loading state guards before accessing data in computed
2. Implement proper state machine for async operations
3. Handle partial success/failure scenarios
4. Add optional chaining for undefined checks

**Deliverable:** No race conditions, proper loading state management

---

### TASK 5: Error Boundaries & Fallbacks (2 pages)
**Agent Type:** general-purpose
**Scope:**
- `pages/blog/index.vue` - No error state for posts fetch
- `pages/stats.vue` - Stats endpoint error handling

**Work Required:**
1. Add error boundary checks in templates
2. Display fallback/empty states
3. Show user-friendly error messages
4. Provide navigation options when data fails to load

**Deliverable:** Both pages gracefully handle API failures

---

### TASK 6: composables/useProcessedMarkdown.ts Audit (Complete Refactor)
**Agent Type:** ada-quality-engineer
**Scope:** Entire file - critical data loading utility
- Line 200: $fetch without fallback
- Line 307: Promise.all without error recovery
- Line 381: Promise.all with partial error handling
- Line 424: Promise.all without null check

**Work Required:**
1. Convert all Promise.all to Promise.allSettled
2. Add comprehensive error logging
3. Implement fallback data structures
4. Add null safety throughout
5. Test all error paths

**Deliverable:** Robust data loading with zero crash conditions

---

## Execution Order

**Parallel Wave 1 (Can run simultaneously):**
- Task 1: useFetch pages
- Task 2: $fetch issues
- Task 3: Null safety checks
- Task 4: Race conditions
- Task 5: Error boundaries

**Sequential (Depends on above):**
- Task 6: useProcessedMarkdown refactor (after Tasks 2-4 complete)

**Final:**
- Commit all changes
- Run ESLint check
- Build test

## Success Criteria

✅ All useFetch destructures `error`
✅ All $fetch calls have try/catch or error handlers
✅ No deep property access without optional chaining
✅ No array access without bounds checking
✅ No race conditions in async operations
✅ All pages show error states to users
✅ All endpoints use Promise.allSettled, not Promise.all
✅ Build succeeds with no errors

## Files to Modify

**Pages (7 files):**
- pages/now.vue
- pages/sitemap.vue
- pages/following.vue
- pages/gear/index.vue
- pages/predictions/index.vue
- pages/blog/index.vue
- pages/stats.vue

**Server (Already done, but verify - 12 files):**
- server/api/predictions.get.ts ✅
- server/api/reading.get.ts ✅
- server/api/kalshi.get.ts ✅
- server/api/youtube.get.ts ✅
- server/api/lastfm.get.ts ✅
- server/api/chess.get.ts ✅
- server/api/github.get.ts ✅
- server/api/rescuetime.get.ts ✅
- server/api/monkeytype.get.ts ✅
- server/api/suggest.get.ts ✅
- server/api/robot/timeline.get.ts ✅
- server/routes/robots-rss.xml.ts ✅

**Composables (2 files):**
- composables/useProcessedMarkdown.ts
- composables/other files (audit for $fetch issues)

**Pages with Bookmarklet:**
- pages/bookmarklet-popup.vue
- pages/bookmarklet.vue (audit needed)
