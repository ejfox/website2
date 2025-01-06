// Remove the commented out import statements if they're not needed
// import CryptoJS from 'crypto-js'
// import { md5 } from 'js-md5'

export function generateShortId(data, length = 8) {
  const hash = CryptoJS.SHA256(data)
  const base64 = CryptoJS.enc.Base64.stringify(hash)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return base64.substring(0, length)
}
export function scrapToUUID(scrapIdString) {
  return generateShortId(scrapIdString)
}

export function uuidToScrap(uuid, scrapArray) {
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

export function countWords(article) {
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

export function countPhotos(article) {
  const photos = article.body.children
    .filter((node) => node.tag === 'img')
    .map((node) => node.attrs)
    .flat()

  return photos.length
}

export function extractPhotos(article) {
  const photos = article.body.children
    .filter((node) => node.tag === 'img')
    .flat()

  return photos
}

export function extractFirstPhoto(article) {
  const photos = extractPhotos(article)
  if (photos.length) return photos[0]
  return null
}

export function countLinks(article) {
  if (!articleExists(article)) return 0
  // look inside all paragraphs and headings for links
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

export function filterStrongTags(article) {
  if (!articleExists(article)) return []
  // look 3 levels deep in article.body.children for strong tags
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

export function isValidHttpUrl(string) {
  let url

  try {
    url = new URL(string)
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}

export function generatePassword(titleSlug) {
  // start with todays date in YYYY-MM-DD format
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // add the title slug
  const title = titleSlug

  const rawPassword = `${year}-${month}-${day}-${title}`
  // make a hash of the raw password
  const hash = md5(rawPassword)
  // take the first 8 characters of the hash and the last 8 characters of the hash
  const password = hash.slice(0, 8) + hash.slice(-8)
  return password
}

export const scrapTypeSymbols = {
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

// make a widget to turn a string, determinehe # of chars (digits, really) and then decide which tailwindcss text size class to use
export function stringLengthToFontSize(string) {
  const length = string.length
  if (length < 5) {
    return 'text-8xl'
  } else if (length < 6) {
    return 'text-7xl'
  } else if (length < 7) {
    return 'text-6xl'
  } else if (length < 8) {
    return 'text-5xl'
  } else if (length < 9) {
    return 'text-4xl'
  } else if (length < 10) {
    return 'text-3xl'
  } else if (length < 11) {
    return 'text-2xl'
  } else if (length < 12) {
    return 'text-xl'
  } else if (length < 13) {
    return 'text-lg'
  } else if (length < 14) {
    return 'text-base'
  } else if (length < 15) {
    return 'text-sm'
  } else if (length < 16) {
    return 'text-xs'
  } else {
    return 'text-xxs'
  }
}

export const socialPlatforms = {
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

// =============================
// Define SVGs
// =============================
export const hrSvg = `
<svg class="max-w-prose" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 365 17.45" style="opacity: 0.2;">
  <path d="M363.07,7.35c-6.21-.45-12.42-.9-18.64-1.35-18.41-1.33-36.82-2.76-55.24-3.97-10.28-.67-20.58-1.22-30.88-1.42-18.17-.35-36.34-.41-54.51-.54-7.59-.05-15.19-.15-22.78.09-14.2.46-28.48.93-42.6,1.72-13.22.46-26.48.33-39.67,1.17-17.66,1.12-35.34,2.41-52.89,4.59-14.88,1.85-29.58,5.06-44.36,7.73-.56.1-1.01.83-1.51,1.26.46.29.96.86,1.38.81,2.08-.25,4.14-.63,6.19-1.04,10.8-2.18,21.52-5,32.41-6.41,14.22-1.84,28.58-2.71,42.9-3.73,13.56-.97,27.13-1.75,40.72-2.32,15.19-.64,30.4-1.13,45.6-1.39,20.64-.35,41.28-.59,61.92-.55,13.09.03,26.17.61,39.26,1.01,11.59.36,23.2.58,34.77,1.29,12.3.76,24.58,1.99,36.86,3.07,6.81.6,13.63,1.16,20.41,2.05.23-.68.44-1.37.64-2.07Z"/>
</svg>`

export const headerStar = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.81 17.81" class="header-star inline-block mr-2" width="14" height="17" opacity="0.2">
  <path d="M10.01,5.75c1.18-.82,2.19-1.55,3.22-2.24.48-.32,1.05-.52,1.45.07.39.58-.22.78-.54,1.07-1.15,1.05-2.29,2.12-3.46,3.14-1.61,1.41-1.68,2.82-.12,4.35.44.43.97.78,1.48,1.15.42.3.69.68.51,1.19-.2.58-.69.76-1.28.85-.87.14-1.6-1.14-2.32-.42-.47.48-.41,1.47-.65,2.2-.13.39-.52.6-.91.67-.54.1-.89-.26-1.1-.68-.37-.72-.37-1.45-.11-2.26.29-.91.9-2.19,0-2.72-.56-.33-1.53.82-2.14,1.53-.76.88-1.8,1.51-2.32,2.62-.23.48-.75.58-1.22.35-.67-.31-.56-.89-.31-1.4.71-1.44,1.94-2.43,3.1-3.46,2.66-2.37,2.68-2.36.36-5.11-.5-.6-1.05-1.16-1.57-1.74-.22-.25-.34-.56-.13-.84.2-.27.56-.24.87-.19,1.09.18,1.71,1.01,2.43,1.72.54.54,1.03,1.57,1.74,1.37.82-.24.4-1.36.48-2.08.18-1.48.32-2.95.89-4.33C8.48.27,8.7.01,9.04,0c.48-.01.69.37.72.75.07.93.1,1.87.07,2.81-.02.68-.26,1.36.17,2.19Z"/>
</svg>`
