/**
 * @file markdownTable.client.ts
 * @description Client-only. Enhances tables in place: adds `.data-table`,
 *   marks numeric columns `.numeric` (judged from the first body row only),
 *   wraps each in `div.table-container` for mobile scroll, and makes every
 *   header click-to-sort with a ↕/↑/↓ indicator.
 *   Runs on window load and after every page:finish.
 *   Gotcha: matches `.prose table` AND any table under the layout's
 *   <main id="main-content">, so app-built tables must opt out with
 *   `data-plain`. Already-enhanced tables are skipped via `.data-table`.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  // Plugins run outside any component instance, so component lifecycle hooks
  // (onMounted) never fire here — the old onMounted wrapper meant this whole
  // plugin was silently dead. Hook the app lifecycle instead, same pattern as
  // plugins/video-viewport.client.ts: run after each page renders.
  nuxtApp.hook('page:finish', () => nextTick(enhanceMarkdownTables))
  if (document.readyState === 'complete') {
    nextTick(enhanceMarkdownTables)
  } else {
    window.addEventListener('load', () => nextTick(enhanceMarkdownTables), {
      once: true,
    })
  }

  function enhanceMarkdownTables() {
    // Find all tables in .prose content
    // `#main-content table` also matches every app-built table inside the
    // layout's <main id="main-content">. Those that lay out their own columns opt
    // out with `data-plain` — the enhancer's text-left th + ↕ indicators
    // knock their headers off their values.
    const tables = document.querySelectorAll(
      '.prose table:not([data-plain]), #main-content table:not([data-plain])'
    )

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
        const thEl = th as HTMLElement
        // Make header clickable
        thEl.style.cursor = 'pointer'
        th.classList.add('select-none')

        // Add sort indicator
        const sortIndicator = document.createElement('span')
        sortIndicator.className = 'ml-1 text-zinc-500 dark:text-zinc-400'
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

      const aText = aCell.textContent?.trim() || ''
      const bText = bCell.textContent?.trim() || ''

      // Parse as numbers if numeric column
      if (isNumericColumn) {
        const aNum = Number.parseFloat(aText.replace(/[,$%]/g, '')) || 0
        const bNum = Number.parseFloat(bText.replace(/[,$%]/g, '')) || 0
        if (aNum < bNum) return newDirection === 'asc' ? -1 : 1
        if (aNum > bNum) return newDirection === 'asc' ? 1 : -1
        return 0
      }

      if (aText < bText) return newDirection === 'asc' ? -1 : 1
      if (aText > bText) return newDirection === 'asc' ? 1 : -1
      return 0
    })

    // Re-append sorted rows
    rows.forEach((row) => tbody.appendChild(row))
  }
})
