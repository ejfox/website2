import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

export const useSidenotes = (contentRef: Ref<HTMLElement | null>) => {
  const sidenotes = ref<
    Array<{
      id: string
      number: number
      content: string
      refPosition: { x: number; y: number }
      notePosition: { x: number; y: number }
    }>
  >([])

  const curves = ref<
    Array<{
      id: string
      path: string
      active: boolean
    }>
  >([])

  const activeNoteId = ref<string | null>(null)

  // Extract footnotes from content
  const extractFootnotes = () => {
    if (!contentRef.value) return

    const footnoteRefs = contentRef.value.querySelectorAll('sup.footnote-ref a')
    const footnoteContents = contentRef.value.querySelectorAll('.footnotes li')

    const notes: typeof sidenotes.value = []

    footnoteRefs.forEach((ref, index) => {
      const id = ref.getAttribute('href')?.slice(1) || ''
      const content = footnoteContents[index]?.textContent || ''

      const refRect = ref.getBoundingClientRect()

      notes.push({
        id,
        number: index + 1,
        content: content.replace(/↩︎$/, '').trim(),
        refPosition: {
          x: refRect.right,
          y: refRect.top + refRect.height / 2
        },
        notePosition: { x: 0, y: 0 } // Will be calculated after render
      })
    })

    sidenotes.value = notes
  }

  // Calculate curve paths
  const calculateCurves = () => {
    curves.value = sidenotes.value.map((note) => {
      const startX = 0
      const startY = note.refPosition.y
      const endX = 300 // Width of margin
      const endY = note.notePosition.y

      // Bezier curve with natural sag
      const distance = endX - startX
      const sag = Math.min(30, distance * 0.1)

      const path = `M ${startX},${startY} C ${startX + distance * 0.3},${startY + sag} ${endX - distance * 0.3},${endY + sag} ${endX},${endY}`

      return {
        id: note.id,
        path,
        active: activeNoteId.value === note.id
      }
    })
  }

  // Position notes with collision detection
  const positionNotes = () => {
    let lastBottom = 0

    sidenotes.value = sidenotes.value.map((note) => {
      let y = note.refPosition.y

      // Collision detection
      if (y < lastBottom + 20) {
        y = lastBottom + 20
      }

      lastBottom = y + 100 // Estimate height

      return {
        ...note,
        notePosition: { x: 320, y }
      }
    })

    calculateCurves()
  }

  // Handle interactions
  const setActiveNote = (id: string | null) => {
    activeNoteId.value = id
    curves.value = curves.value.map((curve) => ({
      ...curve,
      active: curve.id === id
    }))
  }

  // Lifecycle
  onMounted(() => {
    extractFootnotes()
    nextTick(() => {
      positionNotes()
    })

    // Reposition on resize
    const handleResize = debounce(() => {
      extractFootnotes()
      positionNotes()
    }, 150)

    window.addEventListener('resize', handleResize)

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })
  })

  // Watch for content changes
  watch(
    () => contentRef.value?.innerHTML,
    () => {
      extractFootnotes()
      nextTick(() => {
        positionNotes()
      })
    }
  )

  return {
    sidenotes: readonly(sidenotes),
    curves: readonly(curves),
    setActiveNote
  }
}

// Utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
