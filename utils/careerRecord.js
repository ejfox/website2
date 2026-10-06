// Homepage evidence: third-party "receipts" + an engagements-per-year strip.
//
// Every receipt is VERBATIM from its source (checked 2026-10-06; several
// sources 403 bots, so archive.org copies were used). Never paraphrase a
// receipt and never add one that doesn't name EJ — e.g. Nieman Lab credits
// Gerald Rich as Dataproofer's lead, so Dataproofer is not a receipt.
//
// Timeline: one entry per engagement (role, client, fellowship, own project),
// triangulated from email, Drive, calendar, vault and repos. ALL entries count
// toward a year's bar; only `public: true` names are ever displayed — private
// clients contribute to the volume without being named. Relationship words are
// literal (an org that published or funded the work is never an "employer").

export const RECEIPTS = [
  {
    quote:
      'Hacker-journalist EJ Fox … has started making some awesome data visualizations',
    source: 'Micah Lee',
    year: 2025,
    url: 'https://micahflee.com/step-by-step-guide-to-reading-the-leaked-militia-chats-yourself/',
  },
  {
    quote:
      'cutting-edge software developed by E.J. Fox, Michael Small and the NBC News Digital…',
    source: 'NewscastStudio',
    year: 2018,
    url: 'https://www.newscaststudio.com/2018/11/05/nbc-big-board-update/',
  },
  {
    quote: 'With the help of independent data journalist EJ Fox',
    source: 'Gothamist',
    year: 2021,
    url: 'https://gothamist.com/news/mapping-clusters-nypd-officers-repeatedly-accused-misconduct',
  },
  {
    quote:
      'Automating ad and content layouts for print, specifically targeting efficiencies for hyperlocal papers',
    source: 'Lenfest Institute',
    year: 2026,
    url: 'https://www.lenfestinstitute.org/solutions-resources/welcome-to-context-window/',
  },
  {
    quote:
      '“This American Infographic” Designer EJ Fox Has Ira Glass’s Numbers',
    kind: 'headline', // a headline, not a quote: rendered without quote marks
    source: 'Fast Company',
    year: 2010,
    url: 'https://www.fastcompany.com/1632202/american-infographic-designer-ej-fox-has-ira-glasss-numbers',
  },
]

// rel: employer | client | fellowship | own
const E = (name, rel, isPublic = false) => ({ name, rel, public: isPublic })

export const ENGAGEMENTS = {
  2010: [E('This American Infographic', 'own', true)],
  2011: [E('Visual.ly', 'employer', true)],
  2012: [
    E('Mother Jones', 'client', true),
    E('Mainstem', 'own'),
    E('sStory', 'own'),
  ],
  2013: [
    E('GitHub Octoverse', 'client', true),
    E('Vocativ', 'client'),
    E('Outline', 'client'),
    E('Future Lens', 'own'),
  ],
  2014: [E('Two-N', 'client'), E('Vocativ', 'employer', true)],
  2015: [E('Vocativ', 'employer', true), E('Dataproofer', 'own')],
  2016: [
    E('Vocativ', 'employer'),
    E('Dataproofer', 'own'),
    E('Vocativ', 'client'),
    E('Close to Home', 'own'),
  ],
  2017: [E('NBC News', 'employer', true), E('417am', 'own')],
  2018: [E('NBC News Big Board', 'employer', true), E('NBC News', 'employer')],
  2019: [
    E('NBC News', 'employer'),
    E('OSET', 'client'),
    E('CBS', 'client'),
    E('Washington Post', 'client'),
  ],
  2020: [
    E('CMU COVIDcast', 'client', true),
    E('New York Times', 'client'),
    E('Washington Post', 'client'),
    E('OSET', 'client'),
    E('Stamen', 'client'),
    E('Coding With Fire', 'own'),
  ],
  2021: [
    E('Gothamist', 'client', true),
    E('Stamen', 'client'),
    E('Long Lead', 'client'),
    E('Mintz', 'client'),
    E('Densho', 'client'),
  ],
  2022: [
    E('Climate TRACE', 'client', true),
    E('Earth Genome', 'client'),
    E('Logically', 'client'),
    E('The Margin', 'client'),
    E('The Nation', 'client'),
    E('Baseball Prospectus', 'client'),
    E('Stamen', 'client'),
  ],
  2023: [
    E('Room 302', 'own', true),
    E('Earth Genome', 'client'),
    E('WCS', 'client'),
    E('NOAN', 'client'),
    E('Calico', 'client'),
    E('Latent Scope', 'own'),
    E('Coach Artie', 'own'),
  ],
  2024: [
    E('Associated Press', 'client', true),
    E('Profound', 'client'),
    E('Public Data Works', 'client'),
    E('M2X', 'client'),
    E('Peter Todd', 'own'),
  ],
  2025: [
    E('Lenfest AI fellowship', 'fellowship', true),
    E('Paramilitary Leaks', 'own', true),
    E('Subway Builder', 'client'),
    E('Decision Desk HQ', 'client'),
    E('Global Energy Monitor', 'client'),
    E('VizHub', 'client'),
    E('Hampshire', 'client'),
    E('Outlast', 'client'),
  ],
  2026: [
    E('Subway Builder', 'client', true),
    E('Lenfest AI fellowship', 'fellowship'),
    E('Global Energy Monitor', 'client'),
    E('Outlast', 'client'),
    E('Decision Desk HQ', 'client'),
    E('Paperclip', 'own'),
  ],
}
