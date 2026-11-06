/**
 * DIGITAL ME — all visitor-facing content lives here.
 *
 * RULES (from DIGITAL_ME.md and the owner's instructions):
 *  - Only facts that already exist in the repository's evidence or spec.
 *  - Nothing invented: no memories, achievements, interests or outcomes.
 *  - Anything not yet supplied is { pending: true } and renders as a clean
 *    "content pending" card. Fill it in by replacing `pending: true` with
 *    real `blocks`.
 *
 * Block types understood by the panel renderer (src/ui/panel.js):
 *   { type: 'p', text }                       paragraph
 *   { type: 'tags', items: [] }               pill list
 *   { type: 'list', items: [] }               bullet list
 *   { type: 'stat', value, label }            highlighted figure
 *   { type: 'video', src, poster, caption }   evidence video
 *   { type: 'image', src, alt, caption }      evidence image (zoomable)
 *   { type: 'note', text }                    small caveat / disclaimer
 *   { type: 'status', text, tone }            status badge: 'progress' | 'prototype' | 'done'
 *   { type: 'projects' }                      the project index (Creative Studio laptop)
 */

export const OWNER = {
  name: 'Aastha',
  // Source: DIGITAL_ME.md §2 and the character sheet's "Persona" line.
  traits: ['Fun-loving', 'Bubbly', 'Expressive', 'Curious', 'Creative', 'Ambitious', 'Playful'],
};

/* ------------------------------------------------------------------ */
/* PROJECTS — DIGITAL_ME.md §4 Room 02, plus the evidence in the repo. */
/* ------------------------------------------------------------------ */
export const PROJECTS = [
  {
    id: 'lostinn',
    title: 'The Lost Inn',
    kicker: 'Luxury vacation rental website',
    status: { text: 'In progress', tone: 'progress' },
    blocks: [
      { type: 'status', text: 'Website and CMS development in progress', tone: 'progress' },
      { type: 'p', text: 'A luxury vacation rental website with its own content management system.' },
      {
        type: 'video',
        src: '/evidence/lostinn-cms-walkthrough.mp4',
        poster: '/evidence/posters/lostinn-cms.jpg',
        caption: 'CMS walkthrough (30 s screen recording)',
      },
      { type: 'note', text: 'Work in progress. Not presented as a finished product.' },
    ],
  },
  {
    id: 'resolveai',
    title: 'ResolveAI',
    kicker: 'Complaint intake, triage and human review',
    status: { text: 'Prototype', tone: 'prototype' },
    blocks: [
      { type: 'status', text: 'Prototype', tone: 'prototype' },
      { type: 'p', text: 'An AI-assisted complaint intake and triage prototype, built around a human-review and reliability-focused workflow.' },
      {
        type: 'image',
        src: '/evidence/resolveai-automation-workflow.png',
        alt: 'n8n workflow: Complaint Webhook, Normalize + Validate, Valid Input?, Get row(s), duplicate check, OpenAI Classification, Parse + Score + Guardrails, Save Pending Review (Supabase), Acknowledge Receipt, with Reject Invalid Input and Workflow Error Response branches.',
        caption: 'The automation workflow, as built in n8n',
      },
      {
        type: 'list',
        items: [
          'Webhook intake, then input normalisation and validation; invalid input is rejected.',
          'Duplicate check before any AI call; duplicates are returned early.',
          'OpenAI classification, then parsing, scoring and guardrails.',
          'Result saved as a pending review in Supabase, so a person reviews it before anything is final.',
          'Dedicated error response path for failures at each stage.',
        ],
      },
      { type: 'note', text: 'Steps above are read directly from the workflow screenshot.' },
    ],
  },
  {
    id: 'reviewsetu',
    title: 'ReviewSetu',
    kicker: 'Functional prototype',
    status: { text: 'Prototype · not launched', tone: 'prototype' },
    blocks: [
      { type: 'status', text: 'Functional prototype — not publicly launched', tone: 'prototype' },
      {
        type: 'video',
        src: '/evidence/reviewsetu-walkthrough.mp4',
        poster: '/evidence/posters/reviewsetu.jpg',
        caption: 'Prototype walkthrough (25 s screen recording)',
      },
      { type: 'pendingText', label: 'Project description' },
    ],
  },
  {
    id: 'dispute-sla',
    title: 'Dispute SLA Analytics',
    kicker: 'SLA compliance, case ageing and documentation gaps',
    status: { text: 'Completed analysis', tone: 'done' },
    blocks: [
      { type: 'status', text: 'Completed analysis · Excel + SQL', tone: 'done' },
      { type: 'stat', value: '91.2%', label: 'of closed cases were resolved within SLA' },
      { type: 'p', text: 'Evaluated dispute-handling performance across 2,770 cleaned records: are cases resolved within SLA, where do breaches happen, and does documentation completeness matter?' },
      {
        type: 'list',
        items: [
          'Case ageing and status analysis.',
          'SLA breach identification and compliance calculations.',
          'Breach patterns compared by documentation completeness.',
          'Open and closed cases considered separately.',
        ],
      },
      { type: 'p', text: 'Finding: incomplete documentation was associated with a higher SLA breach rate. Open cases need separate monitoring, and overdue cases need further investigation into the reasons for delay.' },
      { type: 'tags', items: ['Microsoft Excel', 'SQL', 'Data cleaning', 'Operational insight'] },
      { type: 'note', text: 'An independent analytics exercise on a synthetic dataset — not a real company’s confidential records.' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* PANELS — one per interactive object. Keyed by panel id.            */
/* ------------------------------------------------------------------ */
export const PANELS = {
  /* ---------- Room 01 · My Room ---------- */
  mirror: {
    title: 'Hi, I’m Aastha',
    kicker: 'The mirror · About me',
    portrait: '/character/portrait.webp',
    blocks: [
      { type: 'tags', items: OWNER.traits },
      { type: 'p', text: 'This little world is my digital self: the rooms are my work, my curiosity and the things I care about. Walk around and open anything that glows.' },
      { type: 'pendingText', label: 'Personal introduction and background' },
    ],
  },
  photos: {
    title: 'Photographs',
    kicker: 'Personal memories',
    pending: true,
  },
  bookshelf: {
    title: 'Bookshelf',
    kicker: 'Interests and learning',
    pending: true,
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
      { type: 'tags', items: ['Microsoft Excel', 'SQL', 'n8n', 'OpenAI API', 'Supabase', 'Webhooks'] },
      { type: 'note', text: 'Only tools visible in the project files are listed. A fuller skills list is pending.' },
    ],
  },
  notebook: {
    title: 'Notebook',
    kicker: 'Ideas and experiments',
    pending: true,
  },
  // Each studio screen opens one project directly.
  'screen-lostinn': { project: 'lostinn' },
  'screen-resolveai': { project: 'resolveai' },
  'screen-reviewsetu': { project: 'reviewsetu' },
  'screen-dispute-sla': { project: 'dispute-sla' },

  /* ---------- Room 03 · Curiosity Corner ---------- */
  'curio-bookshelf': {
    title: 'The big bookshelf',
    kicker: 'What I’m learning',
    blocks: [
      { type: 'p', text: 'Areas listed in the DIGITAL ME plan as possible topics for this corner:' },
      { type: 'tags', items: ['Artificial intelligence', 'AI engineering', 'Automation', 'Finance and analytics', 'Technology', 'Creative experimentation'] },
      { type: 'note', text: 'Draft topics from the project plan, awaiting confirmation.' },
    ],
  },
  'curio-computer': { title: 'Computer', kicker: 'Explorations and experiments', pending: true },
  'curio-notes': { title: 'Research notes', kicker: 'Things I’m digging into', pending: true },
  'curio-board': { title: 'Learning board', kicker: 'My learning journey', pending: true },

  /* ---------- Room 04 · Dream Space ---------- */
  // DIGITAL_ME.md in the repo ends at the "ROOM 04 — DREAM" heading, so
  // this room's purpose and content are not defined yet.
  'dream-stars': { title: 'Star map', kicker: 'Dream Space', pending: true },
  'dream-planes': { title: 'Paper planes', kicker: 'Dream Space', pending: true },
  'dream-moon': { title: 'The moon', kicker: 'Dream Space', pending: true },

  /* ---------- Room 05 · Memory Wall ---------- */
  'memory-frames': { title: 'Framed moments', kicker: 'Memory Wall', pending: true },
  'memory-board': { title: 'Pin board', kicker: 'Memory Wall', pending: true },
  'memory-polaroids': { title: 'Polaroid string', kicker: 'Memory Wall', pending: true },
};

export const PENDING_COPY = {
  title: 'Still being written',
  text: 'Aastha hasn’t filled this one in yet. Come back soon.',
};
