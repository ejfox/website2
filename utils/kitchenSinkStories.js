// Kitchen-sink stories: hand-written mock props for EVERY reusable component, so
// every tile in /kitchen-sink renders a real live preview. Keyed by the
// component's base name (filename without dir/.client/.vue). Each entry is an
// array of variants; each variant is { name, props, wrapper?, slot? }.
//
// wrapper: 'table' renders the component inside <table><tbody> (for <tr> comps).
// slot:    string rendered as the component's default slot content.
//
// Heavy D3/canvas/3D components are given plausible mock shapes; if one still
// can't render from mock data, the preview's error boundary shows a small
// warning rather than crashing the page. Tune any story by editing it here —
// HMR + the ?c= URL focus make iterating on a single component fast.

// ── shared mock fixtures ─────────────────────────────────────────────────────
const GEAR_ITEM = {
  Name: 'WLF Enduro Pack Vest',
  Weight_oz: 14.8,
  Type: 'Storage',
  Category: 'Adventure',
  Subcategory: 'Pack',
  Priority: 'High',
  Waterproof: 'Partial',
  Condition: 'Good',
  Last_Used: '2026-06-18',
  Notes: 'Trail running vest, 12L, two front bottle pockets',
  Amazon_URL: 'https://www.amazon.com/dp/B07P4WTBJ7',
  Photo_URL: '',
  Scan_3D_URL: '',
  Brand: 'WLF',
  Status: 'Active',
}
// Real rows from data/gear.csv, spread across every Type so the specimen-plate
// glyph legend reads (Bag/Tech/Comfort/Sleep/Safety/Creativity). No Photo_URL in
// the CSV, so Photo_URL is left empty on purpose — the grayscale type-glyph IS
// the specimen-plate aesthetic. (Name/Weight_oz/Type/Priority are the reliable
// CSV columns; Condition is set to sane real values.)
const GEAR_ITEMS = [
  GEAR_ITEM,
  { Name: '5.11 Rush 24 Backpack', Weight_oz: 41.5, Type: 'Bag', Category: 'Adventure', Priority: 'High', Star: 'Yes', Condition: 'New', Waterproof: 'No', Brand: '5.11', Photo_URL: '', Scan_3D_URL: '' },
  { Name: 'Hyperlite Daybreak 22', Weight_oz: 20, Type: 'Bag', Category: 'Adventure', Priority: 'High', Star: 'Yes', Condition: 'New', Waterproof: 'Yes', Brand: 'Hyperlite Mountain Gear', Photo_URL: '', Scan_3D_URL: '' },
  { Name: 'XPro-3', Weight_oz: 28.9, Type: 'Tech', Category: 'Tech', Priority: 'High', Condition: 'Good', Brand: 'Fujifilm', Photo_URL: '', Scan_3D_URL: '' },
  { Name: 'TIDRADIO TD-H3', Weight_oz: 10.5, Type: 'Tech', Category: 'Tech', Priority: 'Medium', Condition: 'Good', Brand: 'TIDRADIO', Photo_URL: '', Scan_3D_URL: '' },
  { Name: "Arc'teryx Atom Hoody", Weight_oz: 13.1, Type: 'Comfort', Category: 'Personal', Priority: 'High', Condition: 'New', Brand: "Arc'teryx", Photo_URL: '', Scan_3D_URL: '' },
  { Name: 'Large Packtowel', Weight_oz: 6.4, Type: 'Comfort', Category: 'Adventure', Priority: 'Medium', Condition: 'Good', Photo_URL: '', Scan_3D_URL: '' },
  { Name: 'Small Watercolor Notebook', Weight_oz: 6, Type: 'Creativity', Category: 'Creative', Priority: 'High', Condition: 'Good', Brand: 'Leuchtturm', Photo_URL: '', Scan_3D_URL: '' },
  { Name: 'Nemo Pillow', Weight_oz: 9.7, Type: 'Sleep', Category: 'Adventure', Priority: 'Medium', Condition: 'Good', Brand: 'Nemo', Photo_URL: '', Scan_3D_URL: '' },
  { Name: 'Silk Bag Liner', Weight_oz: 5.1, Type: 'Sleep', Category: 'Adventure', Priority: 'Medium', Condition: 'Good', Photo_URL: '', Scan_3D_URL: '' },
  { Name: 'First Aid Kit Dry Bag', Weight_oz: 13, Type: 'Safety', Category: 'Adventure', Priority: 'Medium', Condition: 'Good', Waterproof: 'Yes', Photo_URL: '', Scan_3D_URL: '' },
]

// blog post-footer / related shape: [{ post, overlappingTags }]
const RELATED_POSTS = [
  { post: { slug: 'threads', title: 'Threads', date: '2025-11-02', metadata: { title: 'Threads' } }, overlappingTags: ['d3', 'canvas'] },
  { post: { slug: 'the-gear-system', title: 'The Gear System', date: '2026-06-18', metadata: { title: 'The Gear System' } }, overlappingTags: ['gear'] },
]
const TOC_CHILDREN = [
  { slug: 'introduction', text: 'Introduction' },
  { slug: 'method', text: 'Method' },
  { slug: 'results', text: 'Results' },
  { slug: 'conclusion', text: 'Conclusion' },
]
// REAL recent commits (this repo's git log) for GitHubStats' activity feed.
const GH_EVENTS = [
  { occurredAt: '2026-06-22T14:10:00Z', message: 'fix(health): repair stats aggregation + surface sleep', repository: 'website2', type: 'PushEvent' },
  { occurredAt: '2026-06-21T19:00:00Z', message: 'copy: de-robotize taglines + clean og descriptions', repository: 'website2', type: 'PushEvent' },
  { occurredAt: '2026-06-20T11:30:00Z', message: 'feat: mirror blog posts into AT-Proto / standard.site', repository: 'website2', type: 'PushEvent' },
  { occurredAt: '2026-06-19T16:45:00Z', message: "perf(reveal): don't hide above-the-fold content (fixes LCP)", repository: 'website2', type: 'PushEvent' },
  { occurredAt: '2026-06-18T10:20:00Z', message: 'feat: projects page image-first masonry overhaul', repository: 'website2', type: 'PushEvent' },
  { occurredAt: '2026-06-17T09:15:00Z', message: 'feat(gear): specimen plate + 3D gear card', repository: 'website2', type: 'PushEvent' },
]

const PROJECT = {
  title: 'Threads',
  slug: 'threads',
  date: '2025-11-02',
  html: '<p>A force-directed graph of every post, scrap, and tag on the site, rendered on canvas across a 350vh scroll.</p>',
  metadata: {
    tags: ['d3', 'canvas', 'visualization'],
    tech: ['D3.js', 'Canvas', 'Vue'],
    type: 'project',
    image: null,
  },
}

const PREDICTION = {
  id: 'pred-2025-0042',
  statement: 'A frontier lab ships a model with a 10M-token context window before 2027.',
  confidence: 65,
  deadline: '2026-12-31',
  status: 'pending',
  resolved: false,
  hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
  gitCommit: '9b6b0314',
  updates: [],
}

// REAL repos from data/github-repos-list.json — real names, stars, languages,
// disk sizes, and dates so every github visualization (histogram, parallel
// coords, radial timeline, ridgeline, force layout) shows the actual shape of
// EJ's GitHub. Field shape matches what the components read (top-level `stars`
// + `color` + `stats.*` + `languages` + `diskUsage` + created/pushedAt).
const mkRepo = (o) => ({ id: o.name, fork: false, stats: { stars: o.stars, forks: o.forks, commits: o.commits }, ...o })
const REPOS = [
  mkRepo({ name: 'tributary', language: 'JavaScript', color: '#f1e05a', stars: 595, forks: 70, commits: 612, diskUsage: 9722, createdAt: '2012-03-17T02:42:38Z', pushedAt: '2017-05-03T17:22:42Z', languages: { JavaScript: 142000, CSS: 18000, HTML: 9000 } }),
  mkRepo({ name: 'sStory', language: 'CSS', color: '#563d7c', stars: 91, forks: 29, commits: 184, diskUsage: 5033, createdAt: '2012-05-12T01:16:31Z', pushedAt: '2014-05-11T05:28:31Z', languages: { CSS: 53711, CoffeeScript: 9333, JavaScript: 1073 } }),
  mkRepo({ name: 'bart', language: 'JavaScript', color: '#f1e05a', stars: 78, forks: 29, commits: 96, diskUsage: 30654, createdAt: '2013-08-03T22:20:05Z', pushedAt: '2017-05-03T17:21:43Z', languages: { JavaScript: 41000, HTML: 3000 } }),
  mkRepo({ name: 'twitter-artbot', language: 'JavaScript', color: '#f1e05a', stars: 6, forks: 1, commits: 240, diskUsage: 8459, createdAt: '2017-06-11T20:47:18Z', pushedAt: '2022-12-09T04:48:59Z', languages: { JavaScript: 1107516, CoffeeScript: 297001, HTML: 1409 } }),
  mkRepo({ name: 'website', language: 'JavaScript', color: '#f1e05a', stars: 4, forks: 2, commits: 1820, diskUsage: 215512, createdAt: '2018-05-12T03:01:13Z', pushedAt: '2024-11-23T00:09:54Z', languages: { JavaScript: 166462, Vue: 121990, TypeScript: 13460 } }),
  mkRepo({ name: 'hand-midi-controller', language: 'Python', color: '#3572A5', stars: 4, forks: 1, commits: 88, diskUsage: 109, createdAt: '2025-07-26T18:58:06Z', pushedAt: '2026-01-11T04:21:37Z', languages: { Python: 148411, Shell: 1553 } }),
  mkRepo({ name: 'ascii_webcam', language: 'Python', color: '#3572A5', stars: 5, forks: 0, commits: 14, diskUsage: 12, createdAt: '2024-09-03T19:59:50Z', pushedAt: '2024-09-03T20:01:50Z', languages: { Python: 10363 } }),
  mkRepo({ name: 'subway-builder-mods', language: 'JavaScript', color: '#f1e05a', stars: 5, forks: 1, commits: 47, diskUsage: 34, createdAt: '2025-12-17T00:02:45Z', pushedAt: '2026-01-30T17:21:45Z', languages: { JavaScript: 79695 } }),
]

// REAL commits from data/github-commits.json (Dec 2025) — real sha/message/repo/date.
const COMMITS = [
  { sha: 'b4ac7dd', repo: 'vulpes-theme-lab', message: 'Release v0.3.0 - MapLibre + Vulpes Monthly Theme Line', date: '2025-12-04T03:55:53Z', commit: { message: 'Release v0.3.0 - MapLibre + Vulpes Monthly Theme Line' } },
  { sha: 'f2070a9', repo: 'dotfiles', message: 'feat(mcp): add tmux control server with current pane detection', date: '2025-12-04T03:45:02Z', commit: { message: 'feat(mcp): add tmux control server' } },
  { sha: '28817a3', repo: 'website2', message: 'fix: resolve all production build issues', date: '2025-12-03T21:26:02Z', commit: { message: 'fix: resolve all production build issues' } },
  { sha: '571366b', repo: 'website2', message: 'perf: optimize CommitMatrix animation performance', date: '2025-12-03T20:07:37Z', commit: { message: 'perf: optimize CommitMatrix animation performance' } },
  { sha: '212af1d', repo: 'website2', message: 'feat: animate commit matrix with Perlin noise + boid flocking', date: '2025-12-03T20:02:28Z', commit: { message: 'feat: animate commit matrix' } },
  { sha: 'a38c889', repo: 'website2', message: 'feat(stats): add 7777px WebGL commit matrix art piece', date: '2025-12-03T19:58:09Z', commit: { message: 'feat(stats): WebGL commit matrix' } },
  { sha: '592426f', repo: 'website2', message: 'feat(seo): add comprehensive structured data and metadata', date: '2025-12-03T19:45:45Z', commit: { message: 'feat(seo): structured data' } },
  { sha: 'd19dfbf', repo: 'scrapbook-cli', message: 'fix: switch YouTube enrichment to Gemini 2.5 Flash for speed/cost', date: '2025-12-03T19:57:55Z', commit: { message: 'fix: YouTube enrichment to Gemini 2.5 Flash' } },
  { sha: '6a8129e', repo: 'website2', message: 'feat(on-this-day): add last updated timestamp display', date: '2025-12-03T19:48:09Z', commit: { message: 'feat(on-this-day): last updated timestamp' } },
  { sha: 'eade513', repo: 'dotfiles', message: 'feat(nvim): workflow improvements, hardtime training, auto-validation', date: '2025-12-03T23:38:33Z', commit: { message: 'feat(nvim): workflow improvements' } },
]

const SPARK = [3, 7, 2, 8, 5, 9, 4, 6, 8, 10, 6, 4]

// CommitMatrix draws ONE canvas cell per commit (coloured by recency), so it
// needs hundreds of commits to read as a matrix. Spread ~280 commits back from
// a fixed recent date so the recency gradient (bright → dim) shows.
const MATRIX_BASE = Date.parse('2026-06-20T12:00:00Z')
const MATRIX_REPOS = ['website2', 'coach-artie', 'connectology', 'vulpes-theme-lab', 'dgen']
const MATRIX_COMMITS = Array.from({ length: 280 }, (_, i) => {
  const date = new Date(MATRIX_BASE - i * 2.4 * 86400000).toISOString()
  return { sha: `c${1000 + i}`, repo: MATRIX_REPOS[i % MATRIX_REPOS.length], message: `commit ${i}`, date, commit: { message: `commit ${i}` } }
})

// CommitHeatmap wants a FLAT list of weeks keyed by {year, week}, each with a
// `commits` count + `topRepoLang` (drives the cell colour). One row per year.
const HEATMAP_LANGS = ['JavaScript', 'Vue', 'TypeScript', 'Python', 'CSS']
const HEATMAP_WEEKS = [2025, 2026].flatMap((year, yi) =>
  Array.from({ length: 53 }, (_, week) => {
    // deterministic-but-varied pattern, with some quiet (0-commit) weeks
    const base = Math.round(7 * Math.abs(Math.sin((week + yi * 4) / 5.5)))
    const commits = week % 7 === 0 ? 0 : Math.max(0, base - (week % 3))
    return {
      year,
      week,
      commits,
      topRepo: 'website2',
      topRepoLang: HEATMAP_LANGS[(week + yi) % HEATMAP_LANGS.length],
      weekStart: `${year}-W${String(week).padStart(2, '0')}`,
    }
  })
)

export const stories = {
  // ── blog ───────────────────────────────────────────────────────────────────
  BlogPostContent: [
    {
      name: 'default',
      props: {
        content:
          '<h2>A section heading</h2><p>Markdown rendered to HTML, with a <a href="#">link</a>, <strong>bold</strong>, and <em>emphasis</em>.</p><blockquote>A pulled quote.</blockquote>',
      },
    },
  ],
  BlogSparkline: [
    { name: 'bars', props: { value: 1400, max: 2400, type: 'bars', metric: 'words', columns: 8 } },
    { name: 'grid', props: { value: 6, max: 12, type: 'grid', metric: 'images', columns: 6 } },
  ],
  PasswordGate: [
    { name: 'default', props: { passwordHash: 'd41d8cd98f00b204e9800998ecf8427e', postTitle: 'A Protected Post' } },
  ],
  PostFooter: [
    {
      name: 'default',
      props: {
        prevPost: { slug: 'projects/MorningRadio', title: 'MorningRadio', date: '2025-08-10' },
        nextPost: { slug: '2025/using-radios', title: 'How To Use Radios', date: '2025-11-08' },
        relatedPosts: RELATED_POSTS,
      },
    },
  ],
  PostMetadataBar: [
    {
      name: 'default',
      props: {
        date: '2025-11-02',
        slug: 'the-kitchen-sink',
        stats: { readingTime: 12, words: 2400, images: 6, links: 18 },
      },
    },
  ],
  PostNav: [
    {
      name: 'default',
      props: {
        prevPost: { slug: 'projects/MorningRadio', title: 'MorningRadio', date: '2025-08-10' },
        nextPost: { slug: '2025/using-radios', title: 'How To Use Radios', date: '2025-11-08' },
      },
    },
  ],
  PostRelated: [{ name: 'default', props: { relatedPosts: RELATED_POSTS } }],
  PostTOC: [{ name: 'default', props: { tocChildren: TOC_CHILDREN, activeSection: 'method' } }],
  PostMetadata: [
    {
      name: 'default',
      props: {
        doc: {
          metadata: { date: '2025-11-02', words: 2400, images: 6, links: 18, slug: 'the-kitchen-sink', draft: false },
        },
      },
    },
  ],
  PredictionCard: [
    { name: 'pending', props: { payload: PREDICTION } },
    {
      name: 'resolved',
      props: {
        payload: { ...PREDICTION, status: 'correct', resolved: true, resolution: 'correct', resolved_date: '2026-06-01' },
      },
    },
  ],
  PredictionRef: [{ name: 'default', props: { payload: PREDICTION } }],
  // Real URLs with rich OpenGraph (the /api/og endpoint returns full title/desc/
  // favicon for these) so the card previews with real content, not a bare domain.
  ReplyContext: [{ name: 'default', props: { replyTo: 'https://gothamist.com/news/mapping-clusters-nypd-officers-repeatedly-accused-misconduct' } }],
  ReplyContextItem: [
    { name: 'default', props: { url: 'https://gothamist.com/news/mapping-clusters-nypd-officers-repeatedly-accused-misconduct', showLabel: true } },
  ],
  // mock injected because ejfox.com has no live webmentions yet — previews the
  // likes / reposts / replies UI with realistic indieweb engagement.
  Webmentions: [
    {
      name: 'with engagement',
      props: {
        url: 'https://ejfox.com/blog/2025/the-kitchen-sink',
        mock: [
          { 'wm-id': 1, 'wm-property': 'like-of', url: 'https://simonwillison.net', author: { name: 'Simon Willison', url: 'https://simonwillison.net' } },
          { 'wm-id': 2, 'wm-property': 'like-of', url: 'https://maggieappleton.com', author: { name: 'Maggie Appleton', url: 'https://maggieappleton.com' } },
          { 'wm-id': 3, 'wm-property': 'repost-of', url: 'https://interconnected.org', author: { name: 'Matt Webb', url: 'https://interconnected.org' } },
          { 'wm-id': 4, 'wm-property': 'in-reply-to', url: 'https://tomcritchlow.com/reply', author: { name: 'Tom Critchlow', url: 'https://tomcritchlow.com' }, content: { text: 'The Parquet-in-the-browser trick is clever — stealing this for my own archive.' }, published: '2025-03-10T14:22:00Z' },
          { 'wm-id': 5, 'wm-property': 'in-reply-to', url: 'https://robinsloan.com/reply', author: { name: 'Robin Sloan', url: 'https://robinsloan.com' }, content: { text: 'Love seeing the whole pipeline laid out like this.' }, published: '2025-03-11T09:05:00Z' },
        ],
      },
    },
  ],

  // ── consulting ───────────────────────────────────────────────────────────────
  // mock injected because cal.com isn't configured in dev ("Calendar not
  // configured") — previews the inline "(next slot)" booking link.
  NextAvailableSlot: [{ name: 'default', props: { mock: { slots: [{ naturalTime: 'Tuesday at 2:30pm', bookingUrl: 'https://cal.com/ejfox/30min' }] } } }],

  // ── flashcards ───────────────────────────────────────────────────────────────
  FlashcardCard: [
    {
      name: 'front',
      props: {
        front: 'What is the data-ink ratio?',
        back: 'The proportion of ink used for actual data vs total ink in a graphic.',
        flipped: false,
        deck: 'Tufte',
        hints: ['Coined by Edward Tufte'],
      },
    },
    {
      name: 'flipped',
      props: {
        front: 'What is the data-ink ratio?',
        back: 'The proportion of ink used for actual data vs total ink in a graphic.',
        flipped: true,
        deck: 'Tufte',
      },
    },
  ],

  // ── gear ─────────────────────────────────────────────────────────────────────
  Gear3DGallery: [{ name: 'default', props: { items: GEAR_ITEMS } }],
  GearCard3D: [{ name: 'default', props: { gearItem: GEAR_ITEM } }],
  GearItem: [
    { name: 'metric', props: { item: GEAR_ITEM, weightUnit: 'metric' }, wrapper: 'table' },
    { name: 'imperial', props: { item: GEAR_ITEM, weightUnit: 'imperial' }, wrapper: 'table' },
  ],
  GearModelViewer: [
    { name: 'default', props: { modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', autoRotate: true, height: '280px' } },
  ],
  GearSpecimenPlate: [{ name: 'default', props: { items: GEAR_ITEMS } }],
  GearCardInline: [{ name: 'default', props: { gearSlug: 'wlf-enduro-pack-vest' } }],

  // ── root-level hand-drawn marks ──────────────────────────────────────────────
  HandDrawn: [
    { name: 'circled-3', props: { name: 'circled-3', size: '3rem', title: 'three' } },
    { name: 'arrow', props: { name: 'arrow-right-long', size: '3rem' } },
  ],
  HandDrawnAnnotation: [
    { name: 'default', props: { name: 'arrow-bend-down-right', size: '3rem', label: 'look here', x: '40%', y: '20%' } },
  ],
  HandDrawnMark: [
    { name: 'around', props: { placement: 'around', tone: '#fde047' }, slot: 'highlighted phrase' },
    { name: 'under', props: { placement: 'under', tone: '#f43f5e' }, slot: 'underlined' },
  ],
  HandDrawnUnitChart: [
    { name: 'default', props: { value: 65, total: 100, columns: 10 } },
  ],

  // ── github ───────────────────────────────────────────────────────────────────
  CodeNetwork: (() => {
    const files = [
      'pages/index.vue', 'app/App.vue', 'utils/format.ts', 'utils/api.ts',
      'components/Card.vue', 'components/List.vue', 'composables/useData.ts',
      'server/api/stats.ts', 'server/api/gear.ts', 'utils/date.ts',
      'components/Chart.vue', 'composables/useChart.ts',
    ]
    const nodes = files.map((p, i) => ({
      id: `n${i}`,
      file: p.split('/').pop(),
      filePath: p,
      filePaths: [p],
      depthRatio: (p.split('/').length - 1) / 3,
    }))
    // a loose dependency tree + a couple cross-links
    const edges = [
      [0, 1], [1, 4], [1, 5], [4, 6], [5, 6], [6, 2], [6, 3],
      [3, 7], [3, 8], [2, 9], [4, 10], [10, 11], [11, 6], [0, 4],
    ].map(([s, t]) => ({ source: `n${s}`, target: `n${t}` }))
    return [{ name: 'default', props: { nodes, edges } }]
  })(),
  CommitCard: [
    { name: 'default', props: { ...COMMITS[0] } },
    { name: 'website2', props: { ...COMMITS[2] } },
  ],
  CommitHeatmap: [
    { name: 'default', props: { years: [2025, 2026], weeks: HEATMAP_WEEKS, totalCommits: 1840, totalRepos: 42 } },
  ],
  CommitMatrix: [{ name: 'default', props: { commits: MATRIX_COMMITS } }],
  GistPreview: [
    {
      name: 'default',
      props: {
        gist: { id: 'abc', description: 'A handy snippet', content: "console.log('hello world')\nconst x = 42", files: { 'snippet.js': {} } },
        file: { filename: 'snippet.js', language: 'JavaScript' },
        expanded: true,
      },
    },
  ],
  GithubForceLayout: [{ name: 'default', props: { repos: REPOS } }],
  GitHubHistogramGrid: [{ name: 'default', props: { repos: REPOS } }],
  GitHubParallelCoords: [{ name: 'default', props: { repos: REPOS, width: 720, height: 360 } }],
  GitHubRadialTimeline: [{ name: 'default', props: { repos: REPOS, size: 520 } }],
  GithubRepoCard: [
    {
      name: 'default',
      props: { name: 'website2', description: 'Personal website + publishing system built with Nuxt 3.', language: 'Vue', stars: 128, forks: 14 },
    },
  ],
  GitHubRidgeline: [{ name: 'default', props: { repos: REPOS, height: 420 } }],
  LanguageBar: [
    { name: 'labels', props: { languages: { Vue: 52, TypeScript: 28, JavaScript: 14, CSS: 6 }, height: 6, showLabels: true } },
    { name: 'bare', props: { languages: { Vue: 52, TypeScript: 28, JavaScript: 14, CSS: 6 }, height: 4 } },
  ],
  RepoMetrics: [{ name: 'default', props: { repo: REPOS[0] } }],
  RepoSparkline: [
    { name: 'default', props: { data: SPARK, width: 80, height: 20, color: '#71717a', showDot: true } },
  ],

  // ── photos ───────────────────────────────────────────────────────────────────
  PhotoStack: [
    {
      name: 'default',
      props: {
        post: {
          slug: 'street-late-summer-2015',
          title: 'Street, late summer',
          dek: 'A run of frames from a Fuji walking the city, August into September',
          year: 2015,
          imageCount: 4,
          images: [
            'https://res.cloudinary.com/ejf/image/upload/v1526532463/20150829-untitled-20150829-DSCF8510.jpg',
            'https://res.cloudinary.com/ejf/image/upload/v1526532463/20150905-untitled-20150905-DSCF8684.jpg',
            'https://res.cloudinary.com/ejf/image/upload/v1526532463/20150909-untitled-20150909-DSCF8698.jpg',
            'https://res.cloudinary.com/ejf/image/upload/v1526532464/20150912-untitled-20150912-DSCF8745.jpg',
          ],
        },
      },
    },
  ],

  // ── projects ─────────────────────────────────────────────────────────────────
  ProjectCard: [{ name: 'default', props: { project: PROJECT, index: 0 } }],
  ProjectRow: [
    { name: 'default', props: { project: PROJECT, featured: false } },
    { name: 'featured', props: { project: PROJECT, featured: true } },
  ],

  // ── reading ──────────────────────────────────────────────────────────────────
  ReadingSparklines: [
    {
      name: 'default',
      props: {
        width: 560,
        books: [
          { metadata: { title: 'Designing Data-Intensive Applications', 'kindle-sync': { lastAnnotatedDate: '2024-01-12', highlightsCount: 84 } } },
          { metadata: { title: 'The Visual Display of Quantitative Information', 'kindle-sync': { lastAnnotatedDate: '2024-03-02', highlightsCount: 41 } } },
          { metadata: { title: 'A Pattern Language', 'kindle-sync': { lastAnnotatedDate: '2025-05-20', highlightsCount: 120 } } },
          { metadata: { title: 'The Timeless Way of Building', 'kindle-sync': { lastAnnotatedDate: '2025-09-08', highlightsCount: 63 } } },
          { metadata: { title: 'Thinking in Systems', 'kindle-sync': { lastAnnotatedDate: '2026-02-14', highlightsCount: 97 } } },
        ],
      },
    },
  ],

  // ── root SitemapLink (same shape as ui/SitemapLink) ──────────────────────────
  SitemapLink: [
    { name: 'internal', props: { to: '/gear', title: 'Gear', description: 'CSV-based inventory with weight calculations', external: false } },
    { name: 'external', props: { to: 'https://github.com/ejfox', title: 'GitHub', description: 'Open-source work', external: true } },
  ],

  // ── stats ────────────────────────────────────────────────────────────────────
  ActivityCalendar: [
    {
      name: 'default',
      props: {
        days: 30,
        title: 'ACTIVITY',
        activeDates: ['2026-06-01', '2026-06-03', '2026-06-04', '2026-06-09', '2026-06-12', '2026-06-18', '2026-06-20', '2026-06-21'],
      },
    },
  ],
  BlogStats: [
    {
      name: 'default',
      props: {
        stats: {
          month: 'June',
          year: 2026,
          posts: { thisMonth: 4, total: 142 },
          words: { thisMonth: 8200, avgPerPost: 1640 },
          recentPosts: [
            { title: 'The Kitchen Sink', slug: 'kitchen-sink', date: '2026-06-20', words: 2400 },
            { title: 'Threads', slug: 'threads', date: '2025-11-02', words: 1800 },
          ],
        },
      },
    },
  ],
  ChessStats: [
    {
      name: 'default',
      props: {
        stats: {
          currentRating: 1480,
          bestRating: 1602,
          gamesPlayed: 2140,
          winRate: 53, // whole percentage — component does Math.round(winRate) + '%'
          puzzleStats: { rating: 1850, totalSolved: 4200 },
          recentGames: [
            { id: 'g1', rating: 1480, ratingDiff: 8, result: 'win', timeControl: '10+0', timestamp: 1718900000, url: 'https://chess.com' },
            { id: 'g2', rating: 1472, ratingDiff: -6, result: 'loss', timeControl: '5+0', timestamp: 1718800000, url: 'https://chess.com' },
          ],
        },
      },
    },
  ],
  DiscogsStats: [
    {
      name: 'default',
      props: {
        stats: {
          stats: { totalItems: 184, totalValue: 4280, averageValue: 24.6 },
          randomRecord: { title: 'Kind of Blue', artist: 'Miles Davis', year: 1959, format: 'LP', price: 32, genres: ['Jazz', 'Modal'] },
        },
      },
    },
  ],
  DuolingoStats: [
    {
      name: 'default',
      props: {
        stats: {
          duolingo: {
            username: 'EJFox2',
            streak: 0,
            totalXp: 3307,
            currentCourse: { title: 'Arabic', level: 0, xp: 2384 },
            courses: [
              { title: 'Arabic', xp: 2384 },
              { title: 'Spanish', xp: 851 },
              { title: 'Japanese', xp: 72 },
            ],
          },
        },
      },
    },
  ],
  GearStats: [{ name: 'default', props: {} }],
  GistStats: [
    {
      name: 'default',
      props: {
        gistStats: {
          stats: {
            totalGists: 84,
            totalFiles: 132,
            averageFilesPerGist: 1.6,
            topLanguages: [
              { name: 'JavaScript', count: 40 },
              { name: 'Shell', count: 22 },
              { name: 'Python', count: 14 },
            ],
          },
        },
      },
    },
  ],
  GitHubStats: [
    {
      name: 'default',
      props: {
        stats: {
          stats: { totalRepos: 195, totalContributions: 3432 },
          detail: { commits: GH_EVENTS },
        },
      },
    },
  ],
  GoodreadsStats: [
    {
      name: 'default',
      props: {
        goodreadsStats: {
          error: null,
          stats: { totalRead: 100, currentlyReading: 3, pagesReadThisYear: 598, averageRating: 3.7, profileUrl: 'https://www.goodreads.com/user/show/9273959' },
          currentlyReading: [
            { id: '234802898', title: 'Muskism: A Guide for the Perplexed', author: 'Quinn Slobodian', rating: 0, numPages: 256, imageUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1755719567l/234802898._SX98_.jpg', goodreadsUrl: 'https://www.goodreads.com/review/show/8633279281' },
            { id: '204927599', title: 'Nexus: A Brief History of Information Networks', author: 'Yuval Noah Harari', rating: 0, numPages: 528, imageUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1709986452l/204927599._SX98_.jpg', goodreadsUrl: 'https://www.goodreads.com/review/show/7755658751' },
          ],
          recentlyRead: [
            { id: '139183078', title: 'The Eye of the Master', author: 'Matteo Pasquinelli', rating: 5, numPages: 256, imageUrl: '', goodreadsUrl: 'https://www.goodreads.com/review/show/8591777368' },
            { id: '25387807', title: 'Inventing the Future', author: 'Nick Srnicek', rating: 5, numPages: 256, imageUrl: '', goodreadsUrl: 'https://www.goodreads.com/review/show/8477820792' },
          ],
        },
      },
    },
  ],
  LastFmStats: [
    {
      name: 'default',
      props: {
        stats: {
          totalScrobbles: 147827,
          recentTracks: {
            tracks: [
              { name: 'The World is Still', artist: { name: 'Bill Callahan' }, playcount: 1, date: { uts: 1782069184 } },
              { name: 'Lake Winnebago', artist: { name: 'Bill Callahan' }, playcount: 1, date: { uts: 1782068397 } },
            ],
          },
          topArtists: [
            { name: 'Smino', playcount: 38 },
            { name: 'Bill Callahan', playcount: 9 },
            { name: 'okvsho', playcount: 8 },
            { name: 'Hiatus Kaiyote', playcount: 7 },
            { name: 'Noname', playcount: 7 },
          ],
          topTracks: [
            { name: 'Bis', artist: { name: 'Arthur Verocai' }, playcount: 2 },
            { name: 'Sofa', artist: { name: 'Collard' }, playcount: 2 },
          ],
          topGenres: [
            { name: 'neo-soul', count: 38 },
            { name: 'indie-folk', count: 9 },
          ],
        },
      },
    },
  ],
  LeetCodeStats: [
    {
      name: 'default',
      props: {
        stats: {
          submissionStats: { easy: { count: 6 }, medium: { count: 2 }, hard: { count: 0 } },
          recentSubmissions: [
            { title: 'Ransom Note', titleSlug: 'ransom-note', lang: 'javascript', timestamp: 1756236938, statusDisplay: 'Accepted' },
            { title: 'Number of Steps to Reduce a Number to Zero', titleSlug: 'number-of-steps-to-reduce-a-number-to-zero', lang: 'javascript', timestamp: 1756042676, statusDisplay: 'Accepted' },
          ],
        },
      },
    },
  ],
  LetterboxdStats: [
    {
      name: 'default',
      props: {
        letterboxdStats: {
          stats: {
            totalFilms: 8,
            averageRating: 3.7,
            thisMonth: 0,
            thisYear: 6,
            rewatches: 0,
            topRatedFilms: [
              { title: 'Poor Things', slug: 'poor-things-2023', rating: 4.5, watchedDate: '2026-03-30', isRewatch: false, letterboxdUrl: 'https://letterboxd.com/ejfox/film/poor-things-2023/' },
              { title: 'The Fall Guy', slug: 'the-fall-guy-2024', rating: 4, watchedDate: '2026-03-21', isRewatch: false, letterboxdUrl: 'https://letterboxd.com/ejfox/film/the-fall-guy-2024/' },
            ],
          },
        },
      },
    },
  ],
  MonkeyTypeStats: [
    {
      name: 'default',
      props: {
        stats: {
          typingStats: {
            averageWPM: 104,
            bestWPM: 138,
            bestAccuracy: 98.2,
            bestConsistency: 86,
            testsCompleted: 1840,
            recentTests: [
              { wpm: 112, accuracy: 97, duration: 30, mode: 'Time', wordCount: 56, timestamp: 1718900000 },
              { wpm: 99, accuracy: 95, duration: 60, mode: 'Words', wordCount: 100, timestamp: 1718800000 },
            ],
          },
        },
      },
    },
  ],
  RescueTimeStats: [
    {
      name: 'default',
      props: {
        stats: {
          rescueTime: {
            week: {
              summary: { total: { hoursDecimal: 38.4 }, productive: { percentage: 72 }, distracting: { percentage: 14 } },
            },
            month: {
              summary: { total: { hoursDecimal: 162 }, productive: { percentage: 70 }, distracting: { percentage: 16 } },
            },
          },
        },
      },
    },
  ],
  StatRow: [
    { name: 'number', props: { label: 'Posts', value: 142, format: 'number' } },
    { name: 'percentage', props: { label: 'Accuracy', value: 87.3, format: 'percentage', decimals: 1 } },
  ],
  StatsDataState: [
    { name: 'unavailable', props: { message: 'No data available', type: 'unavailable' } },
    { name: 'loading', props: { message: 'Loading…', type: 'loading' } },
    { name: 'error', props: { message: 'Failed to load', type: 'error' } },
  ],
  StatSection: [
    { name: 'default', props: { title: 'GITHUB', grid: true }, slot: 'Section content goes here' },
  ],
  StatsSectionHeader: [{ name: 'default', props: { title: 'ACTIVITY' } }],
  StatsSectionSkeleton: [{ name: 'default', props: { title: 'LOADING', rows: 4 } }],
  TopStats: [
    {
      name: 'default',
      props: {
        blogStats: { totalPosts: 142, totalWords: 232000, averageWords: 1640 },
        stats: {
          chess: { currentRating: { blitz: 1480 }, winRate: { overall: 53 } },
          github: { stats: { totalRepos: 195, totalContributions: 3432 } },
          leetcode: { submissionStats: { easy: { count: 140 }, medium: { count: 96 }, hard: { count: 21 } } },
          monkeyType: { typingStats: { averageWPM: 104, bestWPM: 138 } },
        },
      },
    },
  ],
  UmamiStats: [
    {
      name: 'default',
      props: {
        umamiStats: {
          lastUpdated: '2026-06-22T10:00:00Z',
          stats: {
            pageviews: { value: 18400, prev: 16100 },
            visitors: { value: 7200, prev: 6600 },
            visits: { value: 9100, prev: 8400 },
            bounces: { value: 3100, prev: 3300 },
            totaltime: { value: 540000, prev: 500000 },
          },
        },
      },
    },
  ],

  // ── ui ───────────────────────────────────────────────────────────────────────
  AnimatedNumber: [
    { name: 'commas', props: { value: 1284302, format: 'commas', class: 'text-3xl font-light' } },
    { name: 'currency', props: { value: 4200, format: 'currency', class: 'text-3xl font-light' } },
    { name: 'percent', props: { value: 0.873, format: 'percent', decimals: 1, class: 'text-3xl font-light' } },
    { name: 'compact', props: { value: 9400000, format: 'compact', class: 'text-3xl font-light' } },
  ],
  Breadcrumb: [
    {
      name: 'nested',
      props: {
        breadcrumbs: [
          { label: 'Blog', href: '/blog' },
          { label: '2025', href: '/blog/2025' },
          { label: 'This Post', href: null },
        ],
      },
    },
  ],
  CommandPalette: [{ name: 'default', props: {} }],
  DataTable: [
    {
      name: 'default',
      props: {
        columns: [
          { key: 'name', label: 'Name', type: 'text', sortable: true },
          { key: 'count', label: 'Count', type: 'numeric', align: 'right' },
          { key: 'date', label: 'Date', type: 'date' },
        ],
        rows: [
          { name: 'Threads', count: 1240, date: '2025-11-02' },
          { name: 'Gear', count: 318, date: '2026-06-18' },
          { name: 'Predictions', count: 42, date: '2026-05-14' },
        ],
        dense: true,
      },
    },
  ],
  DebugGrid: [{ name: 'default', props: {} }],
  Footer: [{ name: 'default', props: {} }],
  NewsletterSignup: [{ name: 'default', props: {} }],
  // ui/SitemapLink shares base name with root SitemapLink — handled above.
  SparklineScaled: [
    { name: 'squares', props: { values: SPARK, type: 'squares', width: 120, height: 24 } },
    { name: 'line', props: { values: SPARK, type: 'line', width: 120, height: 24, color: '#10b981' } },
    { name: 'bars', props: { values: SPARK, type: 'bars', width: 120, height: 24, color: '#f59e0b' } },
  ],
  StaticContent: [
    { name: 'default', props: { html: '<p class="prose">Server-rendered static HTML content.</p>' } },
  ],
  SupportLinks: [
    { name: 'sidebar', props: { variant: 'sidebar' } },
    { name: 'inline', props: { variant: 'inline' } },
  ],
  WebVitalsReporter: [{ name: 'default', props: {} }],

  // ── visualizations ───────────────────────────────────────────────────────────
  RhythmicSparklines: [
    { name: 'header', props: { data: SPARK, variant: 'header', baseline: 3, showPeak: true } },
    { name: 'inline', props: { data: SPARK, variant: 'inline', showPeak: false } },
  ],

  // ── widgets ──────────────────────────────────────────────────────────────────
  PullQuote: [
    { name: 'left', props: { text: 'When the system hangs, delete code until it works.', align: 'left' } },
    { name: 'center', props: { text: 'Simple beats complex. Working beats perfect.', align: 'center' } },
  ],
  ScrollIndicator: [{ name: 'default', props: { color: 'rgba(120,120,120,0.4)' } }],
}

// base name (no dir, no .client/.server, no .vue) -> stories[]
export function storiesFor(baseName) {
  return stories[baseName] || null
}
