# Performance Testing Setup 🚀

## Quick Commands

**Development Performance Check:**
```bash
# Start dev server, then in another terminal:
npm run perf
```

**Production Performance Check:**
```bash
# Full build + performance audit (takes ~2 minutes)
npm run perf:build
```

**Lighthouse CI (for CI/CD):**
```bash
npm run lighthouse        # Mobile
npm run lighthouse:desktop # Desktop
```

## What Gets Measured

### Core Web Vitals (The Important Stuff):
- **First Contentful Paint (FCP)** < 2 seconds
- **Largest Contentful Paint (LCP)** < 3 seconds  
- **Cumulative Layout Shift (CLS)** < 0.15
- **Speed Index** < 3.5 seconds

### Pages Tested:
- `/` (Homepage)
- `/blog` 
- `/stats`
- `/predictions`
- `/gear`
- `/projects`

## Performance Targets

| Metric | Target | What It Measures |
|--------|--------|------------------|
| Performance Score | >80 | Overall speed |
| FCP | <2s | When user sees first content |
| LCP | <3s | When main content loads |
| CLS | <0.15 | How much layout shifts |
| Accessibility | >90 | Screen reader/keyboard friendly |

## How to Use

### During Development:
1. Make your changes
2. Run `npm run perf` 
3. Check if Core Web Vitals got worse
4. If yes, investigate and optimize

### Before Deployment:
1. Run `npm run perf:build`
2. Check the full production performance
3. Make sure nothing regressed

### Reading the Reports:

**Unlighthouse Report:**
- Opens in browser with visual interface
- Shows all pages side-by-side
- Click any page to see detailed metrics

**Lighthouse CI:**
- Command line output
- Pass/fail for each metric
- Links to detailed reports

## Common Performance Issues

### What Usually Breaks Performance:
- Adding large images without optimization
- New JavaScript libraries (check bundle size)
- Complex animations on mobile
- Too many API calls on page load

### Quick Wins:
- Optimize images with `nuxt/image`
- Lazy load components with `defineAsyncComponent`
- Use `v-once` for static content
- Minimize third-party scripts

## CI Integration

The Lighthouse CI config will run automatically in GitHub Actions and:
- ✅ Pass if performance > 80%
- ❌ Fail if accessibility < 90%
- ⚠️  Warn if FCP > 2 seconds

## Files

- `lighthouserc.json` - CI configuration
- `unlighthouse.config.ts` - Development configuration
- Performance reports saved to `.lighthouseci/` (gitignored)

## Pro Tips

1. **Test on slow connections** - Lighthouse simulates 3G
2. **Mobile first** - Mobile scores are usually lower
3. **Real users matter more** - Use Google Analytics Core Web Vitals
4. **Don't obsess over 100** - 80+ is excellent for content sites

Performance testing setup based on 2024 industry best practices with Nuxt ecosystem tools.