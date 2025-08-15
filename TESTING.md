# Testing Guide for Website2

This guide covers the comprehensive testing setup for preventing rendering regressions and ensuring code quality.

## Overview

The testing setup includes:
- **Unit Tests** (Vitest) - Component logic and utilities
- **Integration Tests** (Playwright) - Page functionality  
- **Visual Regression Tests** (Playwright) - Prevent layout/style issues
- **Performance Tests** (Lighthouse) - Monitor web vitals
- **Security Audits** (npm audit) - Dependency vulnerabilities

## Quick Start

```bash
# Run all tests
npm run test:all

# Run comprehensive test suite with summary
node test/test-runner.js

# Run specific test types
npm run test           # Unit tests only
npm run test:e2e       # All e2e tests
npm run test:visual    # Visual regression only
npm run test:smoke     # Basic functionality only
```

## Test Types

### 1. Unit Tests (`npm run test`)

Tests individual components and utilities in isolation.

**Files**: `test/components/`, `test/utils/`, `test/composables/`

**Purpose**: 
- Verify component props and rendering logic
- Test utility functions
- Validate composable behavior

**Example**:
```bash
npm run test:components  # Test specific components
npm run test:watch      # Watch mode for development
```

### 2. Smoke Tests (`npm run test:smoke`)

Basic functionality tests to ensure pages load correctly.

**Files**: `test/e2e/smoke-tests.spec.ts`

**Checks**:
- All pages return 200 status
- Page titles are correct
- No critical JavaScript errors
- Basic navigation works
- Mobile responsiveness

### 3. Visual Regression Tests (`npm run test:visual`)

Screenshots of pages and components to catch visual changes.

**Files**: `test/e2e/visual-regression.spec.ts`

**Features**:
- Full-page screenshots on desktop/mobile
- Component-level screenshots
- Dark mode testing
- Automatic masking of dynamic content

**First run**:
```bash
# Generate baseline screenshots
npm run test:visual -- --update-snapshots
```

### 4. Performance Tests

Lighthouse CI integration for performance monitoring.

**Configuration**: `lighthouserc.js`

**Metrics**:
- Core Web Vitals (LCP, FID, CLS)
- Performance scores
- Accessibility compliance
- SEO best practices

## Preventing Rendering Regressions

### Before Making Changes

1. **Run baseline tests**:
   ```bash
   npm run test:all
   ```

2. **Take note of current visual state**:
   ```bash
   npm run test:visual
   ```

### After Making Changes

1. **Run unit tests**:
   ```bash
   npm run test
   ```

2. **Check for visual regressions**:
   ```bash
   npm run test:visual
   ```

3. **Verify functionality**:
   ```bash
   npm run test:smoke
   ```

4. **Full regression check**:
   ```bash
   node test/test-runner.js
   ```

### Handling Visual Test Failures

When visual tests fail, review the diff images:

```bash
# Open Playwright UI to see visual diffs
npm run test:e2e:ui
```

If changes are intentional:
```bash
# Update snapshots
npm run test:visual -- --update-snapshots
```

## Test Configuration

### Playwright Config (`playwright.config.ts`)

- **Base URL**: `http://localhost:3006`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Screenshots**: On failure only
- **Retry**: 2x on CI

### Visual Test Masking

Dynamic elements are automatically masked:
- Live stats (`[data-testid="live-stats"]`)
- Pulse animations (`.animate-pulse`)
- Relative dates (`[title*="ago"]`)

Add more masks in `test/e2e/visual-regression.spec.ts`.

### CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`

**GitHub Actions**: `.github/workflows/tests.yml`

**Workflow**:
1. Unit tests
2. E2E/Visual tests  
3. Performance tests
4. Security audit

## Debugging Tests

### Interactive Mode
```bash
# Visual debugging
npm run test:e2e:ui

# Headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test --debug test/e2e/smoke-tests.spec.ts
```

### Logs and Reports

- **Playwright Report**: `playwright-report/`
- **Test Summary**: `TEST-SUMMARY.md`
- **Screenshots**: `test-results/`

### Common Issues

**1. Visual tests fail after dependency updates**
- Check if component styling changed
- Update snapshots if changes are expected

**2. Smoke tests timeout**
- Increase timeout in `playwright.config.ts`
- Check if dev server is running

**3. Unit tests fail after prop changes**
- Update test props to match component interface
- Check component exports

## Adding New Tests

### New Page Test
Add to `test/e2e/visual-regression.spec.ts`:
```javascript
{ path: '/new-page', name: 'new-page' }
```

### New Component Test
Create `test/components/NewComponent.test.ts`:
```javascript
import { mount } from '@vue/test-utils'
import NewComponent from '~/components/NewComponent.vue'

describe('NewComponent', () => {
  it('should render correctly', () => {
    const wrapper = mount(NewComponent, {
      props: { /* test props */ }
    })
    expect(wrapper.text()).toContain('expected content')
  })
})
```

### New E2E Flow
Add to `test/e2e/smoke-tests.spec.ts`:
```javascript
test('new user flow works', async ({ page }) => {
  await page.goto('/start-page')
  // Test interactions
  await page.click('button')
  await expect(page).toHaveURL('/end-page')
})
```

## Performance Targets

| Metric | Target | Measured |
|--------|--------|----------|
| FCP | < 2s | First Contentful Paint |
| LCP | < 3s | Largest Contentful Paint |
| CLS | < 0.1 | Cumulative Layout Shift |
| Performance Score | > 80 | Lighthouse overall |
| Accessibility Score | > 90 | Lighthouse a11y |

## Integration with Development

### Pre-commit Hook (Optional)

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
npm run test
npm run test:smoke
```

### VS Code Integration

Install recommended extensions:
- Playwright Test for VS Code
- Vitest extension

### Continuous Monitoring

Consider setting up:
- [Percy](https://percy.io/) for visual regression monitoring
- [Chromatic](https://www.chromatic.com/) for Storybook integration
- [SpeedCurve](https://speedcurve.com/) for performance monitoring

## Troubleshooting

### Test Environment Issues

1. **Port conflicts**: Update `baseURL` in `playwright.config.ts`
2. **Browser not found**: Run `npx playwright install`
3. **Memory issues**: Reduce parallel workers in CI

### Visual Test Issues

1. **Font rendering differences**: Use system fonts or web fonts
2. **Animation timing**: Add `waitForTimeout()` before screenshots
3. **Dynamic content**: Add appropriate masks

### Performance Test Issues

1. **Lighthouse timeouts**: Increase server ready timeout
2. **Network issues**: Use offline mode in CI
3. **Resource blocking**: Check for external dependencies

## Summary

This testing setup provides comprehensive coverage for:
- ✅ Code correctness (unit tests)
- ✅ Functionality (integration tests)  
- ✅ Visual consistency (regression tests)
- ✅ Performance (Lighthouse)
- ✅ Security (audits)

Run `node test/test-runner.js` regularly to catch issues early and maintain high code quality.