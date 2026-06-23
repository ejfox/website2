// Cal.com inline-embed loader. Isolates Cal.com's official bootstrap snippet so
// page/component code stays readable. Client-only — touches window/document, so
// call it from onMounted (or behind <ClientOnly>).
//
//   loadCalInline({
//     namespace: 'ff',
//     calLink: 'ejfox/ff',
//     selector: '#cal-ff-inline',
//     config: { layout: 'month_view', theme: 'auto' },
//   })
export function loadCalInline({ namespace, calLink, selector, config = {} }) {
  // Cal.com's official embed bootstrap (vendor snippet): queues calls until
  // embed.js loads, then replays them. Left structurally intact on purpose.
  ;(function (C, A, L) {
    const p = (a, ar) => a.q.push(ar)
    const d = C.document
    C.Cal =
      C.Cal ||
      function () {
        const cal = C.Cal
        const ar = arguments
        if (!cal.loaded) {
          cal.ns = {}
          cal.q = cal.q || []
          d.head.appendChild(d.createElement('script')).src = A
          cal.loaded = true
        }
        if (ar[0] === L) {
          const api = function () {
            p(api, arguments)
          }
          const ns = ar[1]
          api.q = api.q || []
          if (typeof ns === 'string') {
            cal.ns[ns] = cal.ns[ns] || api
            p(cal.ns[ns], ar)
            p(cal, ['initNamespace', ns])
          } else {
            p(cal, ar)
          }
          return
        }
        p(cal, ar)
      }
  })(window, 'https://app.cal.com/embed/embed.js', 'init')

  window.Cal('init', namespace, { origin: 'https://cal.com' })
  window.Cal.ns[namespace]('inline', {
    elementOrSelector: selector,
    config,
    calLink,
  })
}
