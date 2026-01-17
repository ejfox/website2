/**
 * @file useTypingAnimation.ts
 * @description Typewriter effect for text with no layout shift
 * All characters are always rendered (holding their space),
 * animation reveals them via opacity transitions.
 */

interface AnimationState {
  isAnimating: boolean
  typedCount: number
  hasStarted: boolean
  errorChar: string | null  // Current typo character being shown
}

export function useTypingAnimation(text: Ref<string> | ComputedRef<string>) {
  const state = reactive<AnimationState>({
    isAnimating: false,
    errorChar: null,
    typedCount: 0,
    hasStarted: false,
  })

  const chars = computed(() => {
    const t = unref(text)
    if (!t) return []
    return t.split('')
  })

  const renderedHtml = computed(() => {
    if (!chars.value.length) return ''

    const showCursor = state.isAnimating

    // ALWAYS render with spans to prevent layout shift when animation starts
    return chars.value.map((char, i) => {
      if (char === ' ') {
        // Spaces always visible, in document flow
        return ' '
      }

      // Before animation: all visible. During: reveal one by one
      const isVisible = !state.hasStarted || i < state.typedCount
      const isCursorPos = showCursor && i === state.typedCount
      const cursor = isCursorPos ? '<span class="cursor"></span>' : ''

      // Show typo character if we're at the error position
      if (state.errorChar && i === state.typedCount - 1) {
        return `<span class="typing-char typed">${escapeHtml(state.errorChar)}${cursor}</span>`
      }

      // Character always takes up space; opacity reveals it
      return `<span class="typing-char${isVisible ? ' typed' : ''}">${escapeHtml(char)}${cursor}</span>`
    }).join('')
  })

  async function animate() {
    if (state.hasStarted) return

    state.hasStarted = true
    state.isAnimating = true
    state.typedCount = 0

    // EJ's typing profile from 247 monkeytype tests:
    // Short bursts: 155-188 WPM, settles to ~150 WPM
    // Accuracy: 98% (2% errors), Consistency: ~80%
    // 155 WPM ≈ 77ms base delay
    const baseDelay = 77
    const variance = 0.15 // 80% consistency = wider variance feels more human
    const errorRate = 0.02 // 98% accuracy

    // Track if we've had an error recently (don't stack errors)
    let recentError = false

    for (let i = 0; i <= chars.value.length; i++) {
      state.typedCount = i

      if (i < chars.value.length) {
        const char = chars.value[i]
        const prevChar = i > 0 ? chars.value[i - 1] : ''

        // Initial burst: first 4 chars are 15% faster
        const burstMultiplier = i < 4 ? 0.85 : 1

        // Natural rhythm modeling
        let delay = baseDelay * burstMultiplier

        // Spaces: brief pause between words
        if (char === ' ') {
          delay = baseDelay * 0.4
        }
        // Punctuation: slightly longer (reaching)
        else if (/[.,!?;:\-"']/.test(char)) {
          delay = baseDelay * 1.3
        }
        // Same-hand consecutive keys are slightly slower
        else if (isSameHand(prevChar, char)) {
          delay = baseDelay * 1.1
        }
        // Hand alternation is faster
        else if (prevChar && !isSameHand(prevChar, char)) {
          delay = baseDelay * 0.85
        }

        // Apply consistency variance
        const jitter = 1 + (Math.random() - 0.5) * 2 * variance
        delay = Math.round(delay * jitter)

        // TYPO SIMULATION: 2% chance, but not on spaces/punctuation, not if recent error
        const shouldError = !recentError &&
                           char !== ' ' &&
                           !/[.,!?;:\-"']/.test(char) &&
                           Math.random() < errorRate

        if (shouldError) {
          recentError = true

          // Type wrong character (adjacent key)
          const typo = getAdjacentKey(char)
          state.errorChar = typo
          state.typedCount = i + 1
          await new Promise((resolve) => setTimeout(resolve, delay))

          // "Oh shit" pause - realize the mistake
          await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 100))

          // Backspace - remove the error
          state.errorChar = null
          state.typedCount = i
          await new Promise((resolve) => setTimeout(resolve, 60))

          // Type correct character
          state.typedCount = i + 1
          await new Promise((resolve) => setTimeout(resolve, delay * 0.9))

          // Reset error flag after a few chars
          setTimeout(() => { recentError = false }, 500)
        } else {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // Brief pause then hide cursor
    await new Promise((resolve) => setTimeout(resolve, 300))
    state.isAnimating = false
  }

  // Get an adjacent key on QWERTY for realistic typos
  function getAdjacentKey(char: string): string {
    const adjacentKeys: Record<string, string[]> = {
      'a': ['s', 'q', 'z'], 'b': ['v', 'n', 'g', 'h'], 'c': ['x', 'v', 'd', 'f'],
      'd': ['s', 'f', 'e', 'r', 'x', 'c'], 'e': ['w', 'r', 'd', 's'],
      'f': ['d', 'g', 'r', 't', 'c', 'v'], 'g': ['f', 'h', 't', 'y', 'v', 'b'],
      'h': ['g', 'j', 'y', 'u', 'b', 'n'], 'i': ['u', 'o', 'k', 'j'],
      'j': ['h', 'k', 'u', 'i', 'n', 'm'], 'k': ['j', 'l', 'i', 'o', 'm'],
      'l': ['k', 'o', 'p'], 'm': ['n', 'j', 'k'], 'n': ['b', 'm', 'h', 'j'],
      'o': ['i', 'p', 'k', 'l'], 'p': ['o', 'l'], 'q': ['w', 'a'],
      'r': ['e', 't', 'd', 'f'], 's': ['a', 'd', 'w', 'e', 'z', 'x'],
      't': ['r', 'y', 'f', 'g'], 'u': ['y', 'i', 'h', 'j'],
      'v': ['c', 'b', 'f', 'g'], 'w': ['q', 'e', 'a', 's'],
      'x': ['z', 'c', 's', 'd'], 'y': ['t', 'u', 'g', 'h'], 'z': ['a', 'x', 's'],
    }
    const lower = char.toLowerCase()
    const options = adjacentKeys[lower] || ['e', 't', 'a', 'o', 'i', 'n']
    const typo = options[Math.floor(Math.random() * options.length)]
    return char === char.toUpperCase() ? typo.toUpperCase() : typo
  }

  // Rough QWERTY hand mapping
  function isSameHand(a: string, b: string): boolean {
    const left = 'qwertasdfgzxcvb'
    const right = 'yuiophjklnm'
    const aLower = a.toLowerCase()
    const bLower = b.toLowerCase()
    const aLeft = left.includes(aLower)
    const bLeft = left.includes(bLower)
    const aRight = right.includes(aLower)
    const bRight = right.includes(bLower)
    return (aLeft && bLeft) || (aRight && bRight)
  }

  function startAnimation(delay = 50) {
    setTimeout(() => animate(), delay)
  }

  return {
    renderedHtml,
    isAnimating: computed(() => state.isAnimating),
    startAnimation,
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
