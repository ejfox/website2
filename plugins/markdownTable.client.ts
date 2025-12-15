// Auto-enhance markdown tables with DataTable component
// Deferred execution for better LCP
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  // Watch for markdown content and enhance tables
  onMounted(() => {
    const init = () => {
      enhanceMarkdownTables()

      // Re-enhance after route changes
      const router = useRouter()
      router.afterEach(() => {
        nextTick(() => {
          enhanceMarkdownTables()
        })
      })
    }

    // Defer to idle time for better LCP
    if ('requestIdleCallback' in window) {
      requestIdleCallback(init, { timeout: 2000 })
    } else {
      setTimeout(init, 1000)
    }
  })

  function enhanceMarkdownTables() {
    // Find all tables in .prose content
    const tables = document.querySelectorAll('.prose table, article table')

    tables.forEach((table) => {
      // Skip if already enhanced
      if (table.classList.contains('data-table')) return

      // Add our data table classes
      table.classList.add('data-table')

      // Detect numeric columns
      const tbody = table.querySelector('tbody')
      if (tbody) {
        const firstRow = tbody.querySelector('tr')
        if (firstRow) {
          const cells = firstRow.querySelectorAll('td')
          cells.forEach((cell, index) => {
            const text = cell.textContent?.trim() || ''
            // If it looks like a number, mark the column as numeric
            if (/^[\d,.$%-]+$/.test(text)) {
              // Mark all cells in this column
              tbody
                .querySelectorAll(`tr td:nth-child(${index + 1})`)
                .forEach((td) => {
                  td.classList.add('numeric')
                })
              // And the header if it exists
              const th = table.querySelector(`thead th:nth-child(${index + 1})`)
              if (th) th.classList.add('numeric')
            }
          })
        }
      }

      // Wrap in container for horizontal scroll on mobile
      if (!table.closest('.table-container')) {
        const wrapper = document.createElement('div')
        wrapper.className = 'table-container'
        table.parentNode?.insertBefore(wrapper, table)
        wrapper.appendChild(table)
      }

      // Add sorting functionality to headers
      const headers = table.querySelectorAll('thead th')
      headers.forEach((th, colIndex) => {
        // Make header clickable
        th.style.cursor = 'pointer'
        th.classList.add('select-none')

        // Add sort indicator
        const sortIndicator = document.createElement('span')
        sortIndicator.className = 'ml-1 text-zinc-400'
        sortIndicator.style.fontFamily = 'monospace'
        sortIndicator.textContent = '↕'
        th.appendChild(sortIndicator)

        // Add click handler for sorting
        th.addEventListener('click', () => {
          sortTable(table, colIndex, th, sortIndicator)
        })
      })
    })
  }

  function sortTable(
    table: Element,
    colIndex: number,
    th: Element,
    indicator: Element
  ) {
    const tbody = table.querySelector('tbody')
    if (!tbody) return

    const rows = Array.from(tbody.querySelectorAll('tr'))
    const isNumericColumn = th.classList.contains('numeric')

    // Determine current sort direction
    const currentDirection = th.getAttribute('data-sort') || 'none'
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc'

    // Reset all other headers
    table.querySelectorAll('thead th').forEach((header) => {
      if (header !== th) {
        header.setAttribute('data-sort', 'none')
        const ind = header.querySelector('span:last-child')
        if (ind) ind.textContent = '↕'
      }
    })

    // Update this header
    th.setAttribute('data-sort', newDirection)
    indicator.textContent = newDirection === 'asc' ? '↑' : '↓'

    // Sort rows
    rows.sort((a, b) => {
      const aCell = a.cells[colIndex]
      const bCell = b.cells[colIndex]
      if (!aCell || !bCell) return 0

      let aVal: any = aCell.textContent?.trim() || ''
      let bVal: any = bCell.textContent?.trim() || ''

      // Parse as numbers if numeric column
      if (isNumericColumn) {
        aVal = Number.parseFloat(aVal.replace(/[,$%]/g, '')) || 0
        bVal = Number.parseFloat(bVal.replace(/[,$%]/g, '')) || 0
      }

      if (aVal < bVal) return newDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return newDirection === 'asc' ? 1 : -1
      return 0
    })

    // Re-append sorted rows
    rows.forEach((row) => tbody.appendChild(row))
  }
})
