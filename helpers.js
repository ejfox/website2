import CryptoJS from 'crypto-js'
import { md5 } from 'js-md5'

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
  // console.log('Counting words in', article)
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
