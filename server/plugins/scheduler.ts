// Schedule market resolution checks
export default defineNitroPlugin(() => {
  // Check markets daily at 3am
  const checkMarkets = async () => {
    try {
      const result = await $fetch('/api/predictions/check-resolutions', {
        method: 'POST'
      })
      console.log('✅ Scheduled market check:', result)
    } catch (error) {
      console.error('❌ Scheduled market check failed:', error)
    }
  }

  // Run on startup (optional)
  // checkMarkets()

  // Schedule daily checks at 3am
  const now = new Date()
  const next3am = new Date(now)
  next3am.setHours(3, 0, 0, 0)
  if (next3am < now) {
    next3am.setDate(next3am.getDate() + 1)
  }

  const msUntil3am = next3am.getTime() - now.getTime()

  setTimeout(() => {
    checkMarkets()
    // Then repeat every 24 hours
    setInterval(checkMarkets, 24 * 60 * 60 * 1000)
  }, msUntil3am)

  console.log(`📅 Market resolution checker scheduled (next run: ${next3am.toLocaleString()})`)
})
