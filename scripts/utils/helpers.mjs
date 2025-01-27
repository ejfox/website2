// Remove the commented out import statements if they're not needed
// import CryptoJS from 'crypto-js'
// import { md5 } from 'js-md5'
import path from 'path'
import chalk from 'chalk'

// Constants
const scrapTypeSymbols = {
  pinboard: '■', // U+25A0
  'mastodon-post': '▲', // U+25B2
  arena: '●', // U+25BC
  github: '◆', // U+25C6
  'github-star': '◆', // U+25C6
  // 'github-pr': '◆', // U+25C6
  // slight difference in shape
  'github-pr': '◇', // U+25C7
  twitter: '○' // U+25CB
}

const socialPlatforms = {
  'wikipedia.org': 'simple-icons:wikipedia',
  'github.com': 'simple-icons:github',
  'github.blog': 'simple-icons:github',
  'github.io': 'typcn:social-github',
  'youtube.com': 'simple-icons:youtube',
  'twitter.com': 'simple-icons:twitter',
  'apple.com': 'simple-icons:apple',
  'itunes.apple.com': 'simple-icons:apple',
  'observablehq.com': 'simple-icons:observable',
  'pinboard.in': 'simple-icons:pinboard',
  'goodreads.com': 'simple-icons:goodreads',
  'glitch.com': 'simple-icons:glitch',
  'stackoverflow.com': 'simple-icons:stackoverflow',
  'mailto:': 'ic:baseline-email',
  'nytimes.com': 'tabler:brand-nytimes',
  'washingtonpost.com': 'simple-icons:thewashingtonpost',
  'nbcnews.com': 'simple-icons:nbc',
  'cnn.com': 'simple-icons:cnn',
  'bbc.com': 'simple-icons:bbc',
  'reuters.com': 'arcticons:reuters',
  'archive.org': 'academicons:archive',
  'web.archive.org': 'academicons:archive',
  'buzzfeed.com': 'simple-icons:buzzfeed',
  'vox.com': 'simple-icons:vox',
  'medium.com': 'simple-icons:medium',
  'scribd.com': 'simple-icons:scribd',
  'patreon.com': 'simple-icons:patreon',
  'soundcloud.com': 'simple-icons:soundcloud',
  'bandcamp.com': 'simple-icons:bandcamp',
  'npmjs.com': 'simple-icons:npm',
  'hackernews.com': 'fa6-brands:square-hacker-news',
  'instagram.com': 'simple-icons:instagram',
  'facebook.com': 'simple-icons:facebook',
  'discord.com': 'simple-icons:discord',
  'reddit.com': 'fa6-brands:reddit',
  'tiktok.com': 'simple-icons:tiktok',
  'twitch.tv': 'simple-icons:twitch',
  'linkedin.com': 'simple-icons:linkedin',
  'pinterest.com': 'simple-icons:pinterest',
  'snapchat.com': 'simple-icons:snapchat',
  'tumblr.com': 'simple-icons:tumblr',
  'whatsapp.com': 'simple-icons:whatsapp',
  'telegram.com': 'simple-icons:telegram',
  'signal.com': 'simple-icons:signal',
  'slack.com': 'simple-icons:slack',
  'zoom.us': 'simple-icons:zoom',
  'meet.google.com': 'simple-icons:googlemeet',
  'discord.gg': 'simple-icons:discord',
  '.gov': 'game-icons:usa-flag',
  'vuejs.org': 'mdi:vuejs',
  'reactjs.org': 'mdi:react',
  'netlify.com': 'file-icons:netlify',
  'nuxtjs.org': 'mdi:nuxt',
  'cloudinary.com': 'simple-icons:cloudinary',
  'cloudflare.com': 'simple-icons:cloudflare',
  'aws.amazon.com': 'simple-icons:amazonaws',
  'gcp.google.com': 'simple-icons:googlecloud',
  'firebase.google.com': 'simple-icons:firebase',
  'microsoft.com': 'simple-icons:microsoft',
  'arxiv.org': 'cib:arxiv'
}

const hrSvg = `
<svg class="max-w-prose" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 365 17.45" style="opacity: 0.2;">
  <path d="M363.07,7.35c-6.21-.45-12.42-.9-18.64-1.35-18.41-1.33-36.82-2.76-55.24-3.97-10.28-.67-20.58-1.22-30.88-1.42-18.17-.35-36.34-.41-54.51-.54-7.59-.05-15.19-.15-22.78.09-14.2.46-28.48.93-42.6,1.72-13.22.46-26.48.33-39.67,1.17-17.66,1.12-35.34,2.41-52.89,4.59-14.88,1.85-29.58,5.06-44.36,7.73-.56.1-1.01.83-1.51,1.26.46.29.96.86,1.38.81,2.08-.25,4.14-.63,6.19-1.04,10.8-2.18,21.52-5,32.41-6.41,14.22-1.84,28.58-2.71,42.9-3.73,13.56-.97,27.13-1.75,40.72-2.32,15.19-.64,30.4-1.13,45.6-1.39,20.64-.35,41.28-.59,61.92-.55,13.09.03,26.17.61,39.26,1.01,11.59.36,23.2.58,34.77,1.29,12.3.76,24.58,1.99,36.86,3.07,6.81.6,13.63,1.16,20.41,2.05.23-.68.44-1.37.64-2.07Z"/>
</svg>`

const headerStar = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.81 17.81" class="header-star inline-block mr-2" width="14" height="17" opacity="0.2">
  <path d="M10.01,5.75c1.18-.82,2.19-1.55,3.22-2.24.48-.32,1.05-.52,1.45.07.39.58-.22.78-.54,1.07-1.15,1.05-2.29,2.12-3.46,3.14-1.61,1.41-1.68,2.82-.12,4.35.44.43.97.78,1.48,1.15.42.3.69.68.51,1.19-.2.58-.69.76-1.28.85-.87.14-1.6-1.14-2.32-.42-.47.48-.41,1.47-.65,2.2-.13.39-.52.6-.91.67-.54.1-.89-.26-1.1-.68-.37-.72-.37-1.45-.11-2.26.29-.91.9-2.19,0-2.72-.56-.33-1.53.82-2.14,1.53-.76.88-1.8,1.51-2.32,2.62-.23.48-.75.58-1.22.35-.67-.31-.56-.89-.31-1.4.71-1.44,1.94-2.43,3.1-3.46,2.66-2.37,2.68-2.36.36-5.11-.5-.6-1.05-1.16-1.57-1.74-.22-.25-.34-.56-.13-.84.2-.27.56-.24.87-.19,1.09.18,1.71,1.01,2.43,1.72.54.54,1.03,1.57,1.74,1.37.82-.24.4-1.36.48-2.08.18-1.48.32-2.95.89-4.33C8.48.27,8.7.01,9.04,0c.48-.01.69.37.72.75.07.93.1,1.87.07,2.81-.02.68-.26,1.36.17,2.19Z"/>
</svg>`

// Helper Functions
function generateShortId(data, length = 8) {
  const hash = CryptoJS.SHA256(data)
  const base64 = CryptoJS.enc.Base64.stringify(hash)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return base64.substring(0, length)
}

function scrapToUUID(scrapIdString) {
  return generateShortId(scrapIdString)
}

function uuidToScrap(uuid, scrapArray) {
  if (!scrapArray || !scrapArray.length || !uuid) {
    console.error('Invalid input', uuid)
    return null
  }

  const scrap = scrapArray.find((scrap) => scrap.scrap_id === uuid)

  if (!scrap) {
    console.error('No scrap found for the given UUID', uuid)
    return null
  }

  return scrap
}

function articleExists(article) {
  if (!article) return false
  if (!article.excerpt) return false
  if (!article.excerpt.children) return false
  if (!article.excerpt.children.length) return false
  return true
}

function countWords(article) {
  if (!articleExists(article)) return 0
  if (!article.excerpt.children) return 0
  const words = article.excerpt.children
    .filter(
      (node) =>
        node.tag === 'p' ||
        node.tag === 'h1' ||
        node.tag === 'h2' ||
        node.tag === 'h3' ||
        node.tag === 'h4' ||
        node.tag === 'blockquote' ||
        node.tag === 'li' ||
        node.tag === 'ol' ||
        node.tag === 'ul'
    )
    .map((node) => node.children)
    .flat()
    .filter((node) => node.type === 'text')
    .map((node) => node.value)
    .join(' ')
    .split(' ')
    .filter((word) => word.length > 0)
  return words.length
}

function countPhotos(article) {
  const photos = article.body.children
    .filter((node) => node.tag === 'img')
    .map((node) => node.attrs)
    .flat()

  return photos.length
}

function extractPhotos(article) {
  const photos = article.body.children
    .filter((node) => node.tag === 'img')
    .flat()

  return photos
}

function extractFirstPhoto(article) {
  const photos = extractPhotos(article)
  if (photos.length) return photos[0]
  return null
}

function countLinks(article) {
  if (!articleExists(article)) return 0
  if (!article.excerpt.children) return 0
  const links = article.excerpt.children
    .filter(
      (node) =>
        node.tag === 'p' ||
        node.tag === 'h1' ||
        node.tag === 'h2' ||
        node.tag === 'h3' ||
        node.tag === 'h4' ||
        node.tag === 'blockquote'
    )
    .map((node) => node.children)
    .flat()
    .filter((node) => node.tag === 'a')
    .map((node) => node.attrs)
    .flat()
  return links.length
}

function filterStrongTags(article) {
  if (!articleExists(article)) return []
  const strongTags = article.body.children
    .filter(
      (node) =>
        node.tag === 'p' ||
        node.tag === 'h1' ||
        node.tag === 'h2' ||
        node.tag === 'h3' ||
        node.tag === 'h4' ||
        node.tag === 'blockquote'
    )
    .map((node) => node.children)
    .flat()
    .filter((node) => node.tag === 'strong')
    .map((node) => node.children)
    .flat()
    .filter((node) => node.type === 'text')
    .map((node) => node.value)
    .filter((word) => word.length > 0)
  return strongTags
}

function isValidHttpUrl(string) {
  let url
  try {
    url = new URL(string)
  } catch (_) {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

function generatePassword(titleSlug) {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const title = titleSlug
  return `${year}-${month}-${day}-${title}`
}

function getTitleFromFrontmatter(frontmatter, filePath = '') {
  // Handle case where frontmatter is a string (filename)
  if (typeof frontmatter === 'string') {
    return frontmatter
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Handle case where frontmatter is an object
  if (frontmatter && frontmatter.title) {
    return frontmatter.title
  }

  // If we have a filePath, use that as fallback
  if (filePath) {
    const filename = path.basename(filePath, '.md')
    return filename
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Last resort - return the input or 'Untitled'
  return String(frontmatter || 'Untitled')
}

function getPostType(relativePath) {
  if (relativePath.startsWith('drafts/')) return 'draft'
  if (relativePath.startsWith('robots/')) return 'robot'
  if (relativePath.startsWith('week-notes/')) return 'weekNote'
  if (relativePath.startsWith('reading/')) return 'reading'
  if (relativePath.startsWith('projects/')) return 'project'
  if (relativePath.startsWith('prompts/')) return 'prompt'
  if (relativePath.startsWith('study-notes/')) return 'studyNote'
  return 'post'
}

function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

function formatCloudinaryUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary.com')) return url

  const defaults = {
    quality: 'auto',
    format: 'auto',
    fetchFormat: 'auto',
    width: 'auto',
    dpr: 2
  }

  const settings = { ...defaults, ...options }
  const [baseUrl, ...pathParts] = url.split('/upload/')
  if (pathParts.length === 0) return url

  const transforms = [
    `q_${settings.quality}`,
    `f_${settings.format}`,
    `fl_progressive`,
    `w_${settings.width}`,
    `dpr_${settings.dpr}`
  ]

  return (
    `${baseUrl}/upload/${transforms.join(',')}/` + pathParts.join('/upload/')
  )
}

function processLink(url) {
  if (!url) return url

  if (url.includes('cloudinary.com')) {
    return formatCloudinaryUrl(url)
  }

  if (url.startsWith('./') || url.startsWith('../')) {
    return url
  }

  if (url.startsWith('/')) {
    return url
  }

  if (isValidHttpUrl(url)) {
    return url
  }

  return `./${url}`
}

function calculateWordCount(text) {
  return text.split(/\s+/).filter((word) => word.length > 0).length
}

function generateRobotsMetaContent(frontmatter, filePath) {
  const directives = []

  if (frontmatter.hidden === true || frontmatter.draft === true) {
    directives.push('noindex')
  }

  const specialSections = [
    'reading/',
    'projects/',
    'robots/',
    'study-notes/',
    'prompts/'
  ]
  if (specialSections.some((section) => filePath.startsWith(section))) {
    directives.push('noindex')
  }

  if (filePath === 'index' || filePath.startsWith('!')) {
    directives.push('noindex')
  }

  return directives.length > 0 ? directives.join(', ') : null
}

function getValidDate(date, filePath = '') {
  if (!date) {
    return new Date()
  }

  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    console.warn(`Invalid date in ${filePath}: ${date}`)
    return new Date()
  }

  return parsedDate
}

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  const prefix = `[${timestamp}]`

  switch (type) {
    case 'success':
      console.log(chalk.green(prefix), message)
      break
    case 'error':
      console.error(chalk.red(prefix), message)
      break
    case 'warning':
      console.warn(chalk.yellow(prefix), message)
      break
    default:
      console.log(chalk.blue(prefix), message)
  }
}

// Single export statement for everything
export {
  // Constants
  scrapTypeSymbols,
  socialPlatforms,
  hrSvg,
  headerStar,

  // Functions
  generateShortId,
  scrapToUUID,
  uuidToScrap,
  countWords,
  countPhotos,
  extractPhotos,
  extractFirstPhoto,
  countLinks,
  filterStrongTags,
  isValidHttpUrl,
  generatePassword,
  getTitleFromFrontmatter,
  getPostType,
  formatFileSize,
  formatCloudinaryUrl,
  processLink,
  calculateWordCount,
  generateRobotsMetaContent,
  getValidDate,
  log
}
