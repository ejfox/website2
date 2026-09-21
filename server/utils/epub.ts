/**
 * @file epub.ts
 * @description Minimal EPUB 3 writer. Builds a spec-compliant .epub in memory
 *   from a list of chapters, for /archive.epub and /photos.epub.
 *
 * Hand-rolled rather than pulled from a library on purpose: the EPUB container
 * is four small XML files, and every e-reader library worth using either drags
 * in a headless browser or hides the stylesheet — which is the one thing that
 * matters most here, because these are read on e-ink.
 *
 * ## E-ink constraints this encodes
 *
 * - **No JS, no webfonts, no color-dependent meaning.** E-ink panels are
 *   slow-refreshing and usually greyscale; anything that only reads as
 *   "different" in color reads as "identical" on the device.
 * - **Serif body, generous leading, hyphenation on.** Long-form on a small
 *   panel with no sub-pixel antialiasing.
 * - **Images capped and centred, never floated.** Reflow on a 6–8" screen
 *   turns floats into single-word columns.
 * - **JPEG, not WebP/AVIF.** EPUB reader support for modern formats is
 *   inconsistent in a way that fails silently — a blank frame, no error.
 *
 * ## Structural notes
 *
 * `mimetype` MUST be the first entry in the zip and MUST be stored
 * uncompressed — readers identify the file by reading those bytes at a fixed
 * offset. JSZip honours per-file compression, hence the explicit STORE.
 */
import JSZip from 'jszip'

export interface EpubChapter {
  /** Used for the ToC and the chapter's <h1>. */
  title: string
  /** Body HTML. Sanitised and XHTML-escaped by the caller. */
  html: string
  /** ISO date, rendered under the title. Optional. */
  date?: string
  /** Original URL on the site, rendered as a footer link. Optional. */
  sourceUrl?: string
}

export interface EpubImage {
  /** Zip-relative path, e.g. `images/abc.jpg`. Referenced from chapter HTML. */
  path: string
  data: Buffer | ArrayBuffer
  mediaType: string
}

export interface EpubOptions {
  title: string
  author: string
  /** Stable across rebuilds for the same logical book — readers dedupe on it. */
  identifier: string
  language?: string
  description?: string
  chapters: EpubChapter[]
  images?: EpubImage[]
  /** Cover image path, must also appear in `images`. */
  coverPath?: string
}

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Reader CSS. Deliberately small and unopinionated about color: an e-ink
 * device renders every one of these greys as the same near-black, so the
 * hierarchy has to come from size, weight and space instead.
 */
const STYLESHEET = `
html { -epub-hyphens: auto; hyphens: auto; }
body {
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1.6;
  margin: 0 5%;
  text-align: left;
  widows: 2;
  orphans: 2;
}
h1 { font-size: 1.6em; line-height: 1.25; margin: 1.2em 0 0.2em; font-weight: 600; }
h2 { font-size: 1.25em; line-height: 1.3; margin: 1.6em 0 0.3em; font-weight: 600; }
h3 { font-size: 1.1em; margin: 1.4em 0 0.3em; font-weight: 600; }
p { margin: 0 0 0.9em; }
a { color: inherit; text-decoration: underline; }
/* Never float: reflowed onto a 6" panel a float becomes a one-word column. */
img { max-width: 100%; height: auto; display: block; margin: 1.2em auto; float: none; }
figure { margin: 1.4em 0; }
figcaption { font-size: 0.85em; font-style: italic; margin-top: 0.4em; text-align: center; }
blockquote { margin: 1.2em 1.5em; font-style: italic; }
/* Code must not reflow mid-token; e-ink readers won't scroll horizontally. */
pre {
  font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
  font-size: 0.8em; line-height: 1.35;
  white-space: pre-wrap; word-wrap: break-word;
  margin: 1.2em 0; padding: 0.6em;
  border-left: 3px solid #888;
}
code { font-family: 'DejaVu Sans Mono', 'Courier New', monospace; font-size: 0.85em; }
pre code { font-size: 1em; }
hr { border: 0; border-top: 1px solid #999; margin: 2em 20%; }
.chapter-meta { font-size: 0.8em; margin: 0 0 1.6em; }
.chapter-source { font-size: 0.75em; margin-top: 2.5em; }
ul, ol { margin: 0 0 0.9em 1.2em; padding: 0; }
li { margin-bottom: 0.3em; }
table { border-collapse: collapse; width: 100%; font-size: 0.8em; margin: 1.2em 0; }
th, td { border: 1px solid #999; padding: 0.3em 0.5em; text-align: left; }
`.trim()

function chapterXhtml(ch: EpubChapter, lang: string): string {
  const meta = [
    ch.date ? `<p class="chapter-meta">${esc(ch.date)}</p>` : '',
  ].join('')
  const source = ch.sourceUrl
    ? `<p class="chapter-source"><a href="${esc(ch.sourceUrl)}">${esc(ch.sourceUrl)}</a></p>`
    : ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head><meta charset="utf-8"/><title>${esc(ch.title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<h1>${esc(ch.title)}</h1>
${meta}
${ch.html}
${source}
</body>
</html>`
}

export async function buildEpub(opts: EpubOptions): Promise<Buffer> {
  const lang = opts.language || 'en'
  const images = opts.images || []
  const zip = new JSZip()

  // Must be first and STORED — readers sniff these bytes at a fixed offset.
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
  )

  const oebps = zip.folder('OEBPS')!
  oebps.file('style.css', STYLESHEET)

  opts.chapters.forEach((ch, i) => {
    oebps.file(`ch${i + 1}.xhtml`, chapterXhtml(ch, lang))
  })
  for (const img of images) oebps.file(img.path, img.data)

  const manifestItems = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="css" href="style.css" media-type="text/css"/>',
    ...opts.chapters.map(
      (_, i) =>
        `<item id="ch${i + 1}" href="ch${i + 1}.xhtml" media-type="application/xhtml+xml"/>`
    ),
    ...images.map(
      (img, i) =>
        `<item id="img${i}" href="${esc(img.path)}" media-type="${esc(img.mediaType)}"${
          img.path === opts.coverPath ? ' properties="cover-image"' : ''
        }/>`
    ),
  ].join('\n    ')

  const spine = opts.chapters
    .map((_, i) => `<itemref idref="ch${i + 1}"/>`)
    .join('\n    ')

  // dcterms:modified is required by EPUB 3 and must be second-precision UTC.
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

  oebps.file(
    'content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${esc(opts.identifier)}</dc:identifier>
    <dc:title>${esc(opts.title)}</dc:title>
    <dc:creator>${esc(opts.author)}</dc:creator>
    <dc:language>${lang}</dc:language>
    ${opts.description ? `<dc:description>${esc(opts.description)}</dc:description>` : ''}
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine>
    ${spine}
  </spine>
</package>`
  )

  oebps.file(
    'nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head><meta charset="utf-8"/><title>Contents</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>
${opts.chapters.map((ch, i) => `<li><a href="ch${i + 1}.xhtml">${esc(ch.title)}</a></li>`).join('\n')}
</ol></nav>
</body>
</html>`
  )

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })
}
