/**
 * XML-safety primitives shared by the hand-rolled feed routes.
 *
 * These live together because each one guards against a failure mode where the
 * whole document becomes unparseable — not a degraded feed, a broken one — and
 * having divergent copies per route is how one feed ends up hardened and the
 * next doesn't. A new feed should import these rather than re-implement them.
 */

/**
 * Drop characters XML 1.0 forbids.
 *
 * Valid chars are #x9 | #xA | #xD | #x20-#xD7FF | #xE000-#xFFFD |
 * #x10000-#x10FFFF. They are illegal even inside CDATA, so a single control
 * byte from a binary blob makes the entire feed unparseable.
 *
 * Iterating by code point also drops lone surrogates, which surface as bare
 * #xD800-#xDFFF and are equally fatal — this is what makes it safe to `slice()`
 * a string mid-surrogate-pair, PROVIDED the slice happens before this runs.
 */
export function stripInvalidXmlChars(text: string): string {
  let out = ''
  for (const ch of text) {
    const c = ch.codePointAt(0) as number
    const valid =
      c === 0x9 ||
      c === 0xa ||
      c === 0xd ||
      (c >= 0x20 && c <= 0xd7ff) ||
      (c >= 0xe000 && c <= 0xfffd) ||
      c >= 0x10000
    if (valid) out += ch
  }
  return out
}

/** Escape text destined for an XML text node or attribute. */
export function escapeXml(unsafe: string): string {
  return stripInvalidXmlChars(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

/**
 * Wrap text in CDATA. A literal `]]>` in the payload would close the section
 * early, so split it across two sections: the parser meets the first `]]>`,
 * ends section one, and section two resumes with `>`, concatenating back to the
 * original text.
 */
export function cdata(text: string): string {
  const safe = stripInvalidXmlChars(text).replace(/\]\]>/g, ']]]]><![CDATA[>')
  return `<![CDATA[${safe}]]>`
}
