import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: 'https://f705c0c6c4843d3f5560ce4af0909611@o4507578103431168.ingest.us.sentry.io/4508847853338624',

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false
})
