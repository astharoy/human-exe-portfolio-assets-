/**
 * DIGITAL ME — all visitor-facing content lives here.
 *
 * RULES (from DIGITAL_ME.md and the owner's instructions):
 *  - Only facts that already exist in the repository's evidence, the
 *    character sheet, or the spec. Every source is noted next to the text.
 *  - Nothing invented: no memories, achievements, interests, goals or outcomes.
 *  - Missing content stays visible as a labelled pending slot. To fill one,
 *    add entries to the arrays in DREAMS / MEMORIES / LEARNING below, or
 *    replace a `pendingText` block with real blocks.
 *
 * Block types understood by the panel renderer (src/ui/render.js):
 *   { type: 'p', text }                          paragraph
 *   { type: 'lead', text }                       larger intro paragraph
 *   { type: 'tags', items: [] }                  pill list
 *   { type: 'list', items: [] }                  bullet list
 *   { type: 'stat', value, label }               highlighted figure
 *   { type: 'video', src, poster, caption }      evidence video
 *   { type: 'image', src, alt, caption }         evidence image (zoomable)
 *   { type: 'note', text }                       small caveat / source note
 *   { type: 'status', text, tone }               'progress' | 'prototype' | 'done'
 *   { type: 'section', title, blocks }           titled group of blocks
 *   { type: 'facts', items: [[label, value]] }   label/value rows
 *   { type: 'expressions', items: [{src,label}] } character-sheet moods
 *   { type: 'figure', src, alt, caption }        non-evidence illustration
 *   { type: 'topics', items: [...] }             expandable topic explorer
 *   { type: 'entries', items, slots, label }     editable list (dreams, notes)
 *   { type: 'gallery', photos, slots }           photo gallery with pending frames
 *   { type: 'timeline', items, slots }           milestone timeline
 *   { type: 'projects' }                         the project index
 *   { type: 'pendingText', label }               single pending card
 */

export const OWNER = {
  name: 'Aastha',
  // DIGITAL_ME.md §2 + the character sheet's "Persona" line.
  traits: ['Fun-loving', 'Bubbly', 'Expressive', 'Curious', 'Creative', 'Ambitious', 'Playful'],
  // Character sheet, "Style" line.
  style: ['Modern', 'Comfy', 'Functional', 'Versatile'],
};

/* ------------------------------------------------------------------ */
/* PROJECTS — DIGITAL_ME.md §4 Room 02, described only from evidence.  */
/* ------------------------------------------------------------------ */
const NOT_LISTED = 'Not listed in the evidence yet';

function project({ id, title, kicker, status, summary, evidence, shows, tech, demonstrates, notes = [] }) {
  return {
    id,
    title,
    kicker,
    status,
    blocks: [
      { type: 'status', text: status.long || status.text, tone: status.tone },
      { type: 'lead', text: summary },
      ...evidence,
      { type: 'section', title: 'What the evidence shows', blocks: [{ type: 'list', items: shows }] },
      {
        type: 'section',
        title: 'Technologies',
        blocks: tech.length ? [{ type: 'tags', items: tech }] : [{ type: 'p', text: NOT_LISTED + '.' }],
      },
      { type: 'section', title: 'What it demonstrates', blocks: [{ type: 'list', items: demonstrates }] },
      ...notes.map((text) => ({ type: 'note', text })),
    ],
  };
}

export const PROJECTS = [
  project({
    id: 'lostinn',
    title: 'The Lost Inn',
    kicker: 'Luxury vacation rental website',
    status: { text: 'In progress', long: 'Website and CMS development in progress', tone: 'progress' },
    summary:
      'A luxury vacation rental website with its own content management system for running the stays. The walkthrough below shows the CMS on a staging environment with test data.',
    evidence: [
      {
        type: 'video',
        src: '/evidence/lostinn-cms-walkthrough.mp4',
        poster: '/evidence/posters/lostinn-cms.jpg',
        caption: 'CMS walkthrough · 30 s screen recording',
      },
    ],
    // Read from the walkthrough video.
    shows: [
      'A Command Center overview: items needing action, arrivals today, occupancy, pending payments and open maintenance.',
      'Bookings with list, calendar, blocks, money-due-back and payments views, filters, and a manual-booking action.',
      'Housekeeping tasks tracked from “to clean” through cleaning and inspection to “ready”, with a form to create and assign tasks.',
      'Roles & Access: who can sign in, with which role, at which stay.',
      'Modules such as Employees, Payroll and Reviews are labelled “Not built yet” in the menu.',
    ],
    tech: [],
    demonstrates: [
      'Designing an admin system around day-to-day rental operations: bookings, housekeeping and access.',
      'Building in phases, with unfinished modules clearly labelled rather than hidden.',
      'Testing on a staging environment with test data before going live.',
    ],
    notes: ['Work in progress. Not presented as a finished product.'],
  }),
  project({
    id: 'resolveai',
    title: 'ResolveAI',
    kicker: 'Complaint intake, triage and human review',
    status: { text: 'Prototype', tone: 'prototype' },
    summary:
      'An AI-assisted complaint intake and triage prototype, built around a human-review and reliability-focused workflow.',
    evidence: [
      {
        type: 'image',
        src: '/evidence/resolveai-automation-workflow.png',
        alt: 'n8n workflow: Complaint Webhook, Normalize + Validate, Valid Input?, Get row(s), duplicate check, OpenAI Classification, Parse + Score + Guardrails, Save Pending Review (Supabase), Acknowledge Receipt, with Reject Invalid Input and Workflow Error Response branches.',
        caption: 'The automation workflow, as built in n8n',
      },
    ],
    // Read from the workflow screenshot.
    shows: [
      'Webhook intake, then input normalisation and validation; invalid input is rejected.',
      'A duplicate check before any AI call; duplicates are returned early.',
      'OpenAI classification, then parsing, scoring and guardrails.',
      'The result is saved as a pending review in Supabase, so a person reviews it before anything is final.',
      'A dedicated error-response path for failures.',
    ],
    tech: ['n8n', 'OpenAI API', 'Supabase', 'Webhooks'],
    demonstrates: [
      'Putting validation, de-duplication and guardrails around an AI step.',
      'Keeping a person in the loop: AI output is queued for review, not acted on automatically.',
      'Designing explicit error paths instead of assuming the happy path.',
    ],
  }),
  project({
    id: 'reviewsetu',
    title: 'ReviewSetu',
    kicker: 'Customer feedback to Google review',
    status: { text: 'Prototype · not launched', long: 'Functional prototype — not publicly launched', tone: 'prototype' },
    summary:
      'A guided feedback flow (“Your feedback. Our improvement.”) that takes a customer from a quick rating to a review they can post on Google.',
    evidence: [
      {
        type: 'video',
        src: '/evidence/reviewsetu-walkthrough.mp4',
        poster: '/evidence/posters/reviewsetu.jpg',
        caption: 'Prototype walkthrough · 25 s screen recording',
      },
    ],
    // Read from the walkthrough video.
    shows: [
      'The customer rates their experience with stars.',
      'A short set of questions (for example “How was the build quality?”) with a progress indicator.',
      'An editable review draft: “Edit, add, or remove anything you like before posting.”',
      'Step-by-step help to finish posting on Google; the review text is copied so it can be pasted.',
      'A language selector (English shown).',
    ],
    tech: [],
    demonstrates: [
      'Turning a multi-step task into a short, guided flow.',
      'Keeping the customer in control: they can edit the draft, and they do the posting.',
    ],
  }),
  project({
    id: 'dispute-sla',
    title: 'Dispute SLA Analytics',
    kicker: 'SLA compliance, case ageing and documentation gaps',
    status: { text: 'Completed analysis', long: 'Completed analysis · Excel + SQL', tone: 'done' },
    summary:
      'Evaluated dispute-handling performance across 2,770 cleaned records: are cases resolved within SLA, where do breaches happen, and does documentation completeness matter?',
    evidence: [{ type: 'stat', value: '91.2%', label: 'of closed cases were resolved within SLA' }],
    // From "# Dispute SLA Analytics.md".
    shows: [
      'Case ageing and status analysis.',
      'SLA breach identification and compliance calculations.',
      'Breach patterns compared by documentation completeness: incomplete documentation was associated with a higher breach rate.',
      'Open and closed cases considered separately; open cases need separate monitoring.',
    ],
    tech: ['Microsoft Excel', 'SQL'],
    demonstrates: [
      'Cleaning and preparing a dataset before analysis.',
      'Turning case data into operational insight: improving documentation completeness could help reduce delays.',
      'Separating open and closed cases so SLA figures aren’t misleading.',
    ],
    notes: ['An independent analytics exercise on a synthetic dataset — not a real company’s confidential records.'],
  }),
];

/* ------------------------------------------------------------------ */
/* EDITABLE COLLECTIONS — add real entries here; empty means pending.  */
/* ------------------------------------------------------------------ */
// Each entry: { title, text }
export const DREAMS = {
  ambitions: [],
  plans: [],
  ideas: [],
};

// Photos: { src: '/memories/xyz.webp', alt, caption, date }
// Milestones: { date, title, text }
export const MEMORIES = {
  photos: [],
  moments: [],
  milestones: [],
};

// Research notes: { title, text }   Learning journey: { date, title, text }
export const LEARNING = {
  notes: [],
  journey: [],
};

/* Curiosity Corner topics: the spec's "possible content" list, each linked to
   the projects where that area already appears in the evidence. */
export const TOPICS = [
  {
    title: 'Artificial intelligence',
    seen: [['resolveai', 'An OpenAI classification step inside a reviewed workflow.']],
  },
  {
    title: 'AI engineering',
    seen: [['resolveai', 'Validation, de-duplication, guardrails and error paths around the AI call.']],
  },
  {
    title: 'Automation',
    seen: [['resolveai', 'An end-to-end n8n workflow from webhook intake to acknowledgement.']],
  },
  {
    title: 'Finance and analytics',
    seen: [['dispute-sla', 'SLA compliance and case-ageing analysis in Excel and SQL.']],
  },
  {
    title: 'Technology',
    seen: [
      ['lostinn', 'A vacation rental website and its operations CMS.'],
      ['reviewsetu', 'A guided customer-feedback prototype.'],
    ],
  },
  {
    title: 'Creative experimentation',
    seen: [],
    note: 'This world itself — DIGITAL ME — is the creative experiment.',
  },
  {
    title: 'Personal learning journey',
    seen: [],
  },
];

/* ------------------------------------------------------------------ */
/* PANELS — one per interactive object. Keyed by panel id.            */
/* ------------------------------------------------------------------ */
const EXPRESSIONS = ['happy', 'excited', 'curious', 'thinking', 'surprised', 'focused', 'playful', 'laughing', 'relaxed'];

export const PANELS = {
  /* ---------- Room 01 · My Room ---------- */
  mirror: {
    title: 'Hi, I’m Aastha',
    kicker: 'The mirror · About me',
    portrait: '/character/portrait.webp',
    blocks: [
      {
        type: 'lead',
        text: 'This world is my digital self: a little universe you can walk through. The rooms hold my work, my curiosity and the things I care about.',
      },
      { type: 'tags', items: OWNER.traits },
      { type: 'p', text: 'I’m interested in technology and experimentation.' },
      {
        type: 'section',
        title: 'What I’ve been building',
        blocks: [
          {
            type: 'list',
            items: [
              'A luxury vacation rental website and its operations CMS (in progress).',
              'An AI complaint-triage workflow with human review (prototype).',
              'A guided customer-feedback flow (prototype, not launched).',
              'An SLA analysis of 2,770 synthetic dispute records in Excel and SQL (completed).',
            ],
          },
          { type: 'note', text: 'Walk right into the Creative Studio to see each one, with its evidence.' },
        ],
      },
      {
        type: 'section',
        title: 'Many moods',
        blocks: [
          { type: 'expressions', items: EXPRESSIONS.map((e) => ({ src: `/character/expressions/${e}.webp`, label: e[0].toUpperCase() + e.slice(1) })) },
        ],
      },
      {
        type: 'section',
        title: 'Style',
        blocks: [
          { type: 'tags', items: OWNER.style },
          {
            type: 'figure',
            src: '/character/outfits.webp',
            alt: 'Five outfits of Aastha’s avatar: Casual (Home), Work / Studio, Creative, Travel and Chic.',
            caption: 'Casual · Work / Studio · Creative · Travel · Chic',
          },
        ],
      },
      { type: 'note', text: 'Moods, outfits and style are from the official DIGITAL ME character sheet.' },
      { type: 'pendingText', label: 'My background and personal story' },
    ],
  },
  photos: {
    title: 'Photographs',
    kicker: 'Personal memories',
    blocks: [{ type: 'gallery', photos: MEMORIES.photos, slots: 4 }],
  },
  bookshelf: {
    title: 'Bookshelf',
    kicker: 'Interests and learning',
    blocks: [
      { type: 'p', text: 'I’m interested in technology and experimentation. The Curiosity Corner (room 03) maps the areas my projects already touch.' },
      { type: 'entries', items: [], slots: 3, label: 'Interest' },
    ],
  },

  /* ---------- Room 02 · Creative Studio ---------- */
  laptop: {
    title: 'Project showcase',
    kicker: 'The laptop · Everything I’ve built so far',
    blocks: [{ type: 'projects' }],
  },
  desk: {
    title: 'Skills and tools',
    kicker: 'The desk',
    blocks: [
      { type: 'p', text: 'Tools that appear in the project evidence in this world:' },
      {
        type: 'facts',
        items: [
          ['Data & analysis', 'Microsoft Excel · SQL'],
          ['Automation', 'n8n · Webhooks'],
          ['AI', 'OpenAI API'],
          ['Data storage', 'Supabase'],
        ],
      },
      { type: 'note', text: 'Only tools visible in the project files are listed. A fuller skills list is pending.' },
    ],
  },
  notebook: {
    title: 'Notebook',
    kicker: 'Ideas and experiments',
    blocks: [{ type: 'entries', items: [], slots: 3, label: 'Idea' }],
  },
  'screen-lostinn': { project: 'lostinn' },
  'screen-resolveai': { project: 'resolveai' },
  'screen-reviewsetu': { project: 'reviewsetu' },
  'screen-dispute-sla': { project: 'dispute-sla' },

  /* ---------- Room 03 · Curiosity Corner ---------- */
  'curio-bookshelf': {
    title: 'The big bookshelf',
    kicker: 'Topics I explore',
    blocks: [
      { type: 'p', text: 'Open a topic to see where it already shows up in my work.' },
      { type: 'topics', items: TOPICS },
      { type: 'note', text: 'Topics are the “possible content” list from the DIGITAL ME plan; links point only to existing project evidence.' },
    ],
  },
  'curio-computer': {
    title: 'Computer',
    kicker: 'Explorations and experiments',
    blocks: [
      {
        type: 'section',
        title: 'DIGITAL ME',
        blocks: [
          { type: 'p', text: 'You are standing in it: an interactive 2D world with a hand-built animated character, five rooms and real project evidence.' },
          { type: 'tags', items: ['Phaser 3', 'Vite', 'GSAP', 'JavaScript'] },
        ],
      },
      {
        type: 'section',
        title: 'Automation experiment',
        blocks: [{ type: 'p', text: 'ResolveAI started as an automation workflow in n8n.' }, { type: 'projectLink', project: 'resolveai' }],
      },
      { type: 'entries', items: [], slots: 2, label: 'Experiment' },
    ],
  },
  'curio-notes': {
    title: 'Research notes',
    kicker: 'Things I’m digging into',
    blocks: [{ type: 'entries', items: LEARNING.notes, slots: 3, label: 'Research note' }],
  },
  'curio-board': {
    title: 'Learning board',
    kicker: 'My learning journey',
    blocks: [{ type: 'timeline', items: LEARNING.journey, slots: 3 }],
  },

  /* ---------- Room 04 · Dream Space ---------- */
  'dream-stars': {
    title: 'Ambitions',
    kicker: 'The star map',
    blocks: [{ type: 'entries', items: DREAMS.ambitions, slots: 3, label: 'Ambition' }],
  },
  'dream-planes': {
    title: 'Future plans',
    kicker: 'Paper planes',
    blocks: [{ type: 'entries', items: DREAMS.plans, slots: 3, label: 'Plan' }],
  },
  'dream-moon': {
    title: 'Ideas',
    kicker: 'The moon',
    blocks: [{ type: 'entries', items: DREAMS.ideas, slots: 3, label: 'Idea' }],
  },

  /* ---------- Room 05 · Memory Wall ---------- */
  'memory-frames': {
    title: 'Framed moments',
    kicker: 'Photo gallery',
    blocks: [{ type: 'gallery', photos: MEMORIES.photos, slots: 6 }],
  },
  'memory-polaroids': {
    title: 'Polaroid string',
    kicker: 'Little moments',
    blocks: [{ type: 'gallery', photos: MEMORIES.moments, slots: 5, polaroid: true }],
  },
  'memory-board': {
    title: 'Milestones',
    kicker: 'The pin board',
    blocks: [{ type: 'timeline', items: MEMORIES.milestones, slots: 4 }],
  },
};

export const PENDING_COPY = {
  title: 'Still being written',
  text: 'Aastha hasn’t filled this one in yet. Come back soon.',
};
