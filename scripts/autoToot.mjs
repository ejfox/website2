import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import matter from 'gray-matter'
import OpenAI from 'openai'
import { createRestAPIClient } from 'masto'
import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const masto = createRestAPIClient({
  url: 'https://mastodon.social',
  accessToken: process.env.MASTODON_ACCESS_TOKEN,
})

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog')
const CHANGE_THRESHOLD = 0.1 // 10% change threshold

async function getChangedFiles() {
  const output = execSync('git diff --name-status HEAD^ HEAD content/blog').toString()
  return output.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const [status, filePath] = line.split('\t')
      return { status, filePath }
    })
}

async function getFileContent(filePath) {
  const content = await fs.readFile(filePath, 'utf-8')
  return matter(content)
}

function shouldToot(file, today) {
  const { data, content } = file
  const postDate = new Date(data.date)
  const isNewPost = file.status === 'A'
  const isModified = file.status === 'M'
  const isAnniversary = postDate.getMonth() === today.getMonth() && postDate.getDate() === today.getDate()
  
  if (isNewPost) return true
  if (isAnniversary && !data.lastTooted) return true
  if (isModified) {
    const diff = execSync(`git diff HEAD^ HEAD "${file.filePath}"`).toString()
    const contentDiff = diff.split('---').pop().split('\n').filter(line => !line.startsWith('+') && !line.startsWith('-')).join('\n')
    return contentDiff.length / content.length > CHANGE_THRESHOLD
  }
  return false
}

async function generateToot(content, title) {
  const recentToots = await fetch('https://ejfox-mastodon.web.val.run').then(res => res.json())
  const recentTootText = recentToots.map(toot => toot.content).join('\n')

  const prompt = `Based on the tone of these recent toots:\n\n${recentTootText}\n\nGenerate a short, objective toot (max 250 characters) for this blog post, avoiding adjectives and adverbs:\n\nTitle: ${title}\n\nContent: ${content}`

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: "You are a witty and concise summarizer for blog posts. Your summaries are engaging and slightly irreverent. Only respond with the raw content of the toot, no HTML, no links, no hashtags, just a short summary." }, { role: "user", content: prompt }],
    max_tokens: 280,
    n: 1,
    // temperature: 0.7,
  })

  return response.choices[0].message.content.trim()
}

async function postToMastodon(tootText, postUrl) {
  const status = await masto.v1.statuses.create({
    status: `${tootText}\n\nRead more: ${postUrl}`,
    visibility: 'public',
  })

  return { id: status.id, url: status.url }
}

async function updateFrontmatter(filePath, tootId, tootUrl) {
  const content = await fs.readFile(filePath, 'utf-8')
  const { data, content: postContent } = matter(content)
  
  data.lastTooted = new Date().toISOString()
  data.tootId = tootId
  data.tootUrl = tootUrl

  const updatedContent = matter.stringify(postContent, data)
  await fs.writeFile(filePath, updatedContent)

  execSync(`git add "${filePath}"`)
  execSync(`git commit -m "chore: add Mastodon Toot ID ${tootId} for post"`)
  execSync('git push')
}

async function main() {
  const today = new Date()
  const changedFiles = await getChangedFiles()

  for (const file of changedFiles) {
    if (!file.filePath.endsWith('.md')) continue

    const fileContent = await getFileContent(file.filePath)
    if (shouldToot(file, today)) {
      const tootText = await generateToot(fileContent.content, fileContent.data.title)
      const postUrl = `https://ejfox.com/blog/${path.basename(file.filePath, '.md')}`
      const { id: tootId, url: tootUrl } = await postToMastodon(tootText, postUrl)
      await updateFrontmatter(file.filePath, tootId, tootUrl)
      console.log(`Tooted about: ${fileContent.data.title}`)
    }
  }
}

main().catch(console.error)
