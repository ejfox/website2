# Obsidian → Web Typography Guide

## Sidenotes & Margin Notes

### Method 1: Inline Sidenotes
```markdown
This is main text {side: This appears in the margin when rendered on web} and continues here.
```

### Method 2: Obsidian Comments (Hidden in Obsidian, visible on web)
```markdown
This is your main text %%sidenote: This margin note is invisible in Obsidian but shows on the web%% and continues.
```

### Method 3: Traditional Footnotes (auto-converted to sidenotes)
```markdown
This is text with a footnote[^1].

[^1]: This becomes a sidenote on the web.
```

## Expandable Details

### Method 1: Admonition-style (works with Obsidian Admonition plugin)
```markdown
??? "Click to expand technical details"
This content is hidden by default.
You can put multiple paragraphs here.
- Even lists
- Work perfectly
```

### Method 2: Inline Expandables
```markdown
Here's a sentence with {expand: a detail | that expands inline when clicked}.
```

## Sparklines for Blog Metadata

In your blog post frontmatter:
```yaml
---
title: My Post
wordCount: 2500
images: 5
fileSize: 45678
---
```

Then in your Vue template:
```vue
<PostMetadataVisuals
  :word-count="post.wordCount"
  :image-count="post.images"
  :file-size="post.fileSize"
  variant="compact"
/>
```

## Typography Features Already Working

- **[[Wikilinks]]** → Internal links
- **Smart quotes** → Automatic
- **Hanging punctuation** → Automatic
- **Tabular figures** → In data/stats sections
- **Optical sizing** → Automatic based on font size

## CSS Classes Available

```css
/* For custom styling */
.sidenote-ref { } /* The reference number */
.sidenote-content { } /* The margin note */
.expandable-details { } /* Expandable section */
.sparkline { } /* Data visualization */
```

## nvim Integration Tips

For nvim users, add these snippets to your config:

```vim
" Quick sidenote
inoremap <leader>sn {side: }<Esc>i

" Quick expandable
inoremap <leader>ex ??? ""<CR><Esc>kf"a

" Obsidian comment sidenote
inoremap <leader>mn %%sidenote: %%<Esc>F:a
```

## Testing Your Setup

1. Write in Obsidian using the syntaxes above
2. Run: `yarn blog:process`
3. Check rendered output: `yarn dev`
4. Sidenotes appear in margins on desktop, hidden on mobile
5. Expandables work with native HTML details/summary
6. Sparklines visualize your content metadata

## Performance Notes

- Sidenotes use CSS positioning (no JS recalc on scroll)
- Collision detection prevents overlapping notes
- Expandables use native browser APIs
- Sparklines are pure SVG (no D3 dependency for basic grids)

## Limitations

- Sidenotes hidden on screens < 1280px wide
- Maximum 300px width for margin notes
- Sparklines scale: 1 square per 100 words / 1KB / image

## Future Enhancements

- [ ] Inline sparklines with live data
- [ ] Margin figures/charts support
- [ ] Progressive image loading indicators
- [ ] Typography performance metrics