export default {
  site: 'http://localhost:3006',
  debug: true,
  urls: [
    '/',
    '/blog',
    // '/stats', // DISABLED - broken components
    // '/predictions', // DISABLED - broken components
    '/gear',
    '/projects'
  ],
  lighthouseOptions: {
    onlyCategories: ['performance', 'accessibility', 'seo']
  },
  hooks: {
    'report:generate': () => {
      console.log('📊 Performance report generated!')
    }
  },
  scanner: {
    // Sample a few URLs rather than crawling entire site
    samples: 6,
    device: 'desktop',
    throttle: false
  }
}
