import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = config.MONKEYTYPE_TOKEN

  const [statsData, pbData] = await Promise.all([
    fetch('https://api.monkeytype.com/users/stats', {
      headers: {
        Authorization: `ApeKey ${token.trim()}`,
        Accept: 'application/json'
      }
    }).then((r) => r.json()),
    fetch('https://api.monkeytype.com/users/personalBests?mode=time', {
      headers: {
        Authorization: `ApeKey ${token.trim()}`,
        Accept: 'application/json'
      }
    }).then((r) => r.json())
  ])

  return {
    stats: statsData?.data || {},
    personalBests: pbData?.data || {}
  }
})
