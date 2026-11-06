# DIGITAL ME
### An Interactive 2D Personal Universe

**Project:** DIGITAL ME  
**Creator:** Aastha  
**Experience:** Interactive 2D side-scrolling personal portfolio  
**Development:** GitHub + Claude Code  
**Deployment:** Vercel

---

# 1. PROJECT VISION

DIGITAL ME is an interactive digital universe representing my personality, interests, creativity, ambitions, experiences and work.

It should not look or behave like a conventional portfolio website.

Visitors should feel as though they are entering a small interactive world where they can explore different spaces, interact with objects, discover information and meet my digital character.

The experience should combine:

- A personal portfolio.
- A 2D adventure-game environment.
- Character-led storytelling.
- Interactive objects and environments.
- Playful animations and hidden details.

The experience should be visually memorable while remaining easy to navigate.

# 2. PERSONALITY AND CHARACTER

The main character represents my digital identity.

Personality traits:
- Fun-loving.
- Bubbly and expressive.
- Curious.
- Creative.
- Ambitious.
- Playful.
- Interested in technology and experimentation.

## Character reference

Use the supplied Aastha Digital Avatar Character Board as the visual identity reference.

Important identifying features:
- Long, dark hair.
- Black rectangular glasses.
- Small nose ring.
- Warm complexion.
- Expressive facial features.

Maintain visual consistency across all character artwork and animations.

The character should feel like a stylized illustrated version of me, not a generic cartoon character.

## Character animations

Plan for the following animations:

- Idle.
- Walking left.
- Walking right.
- Jumping.
- Waving.
- Thinking.
- Sitting.
- Working.
- Laughing.
- Celebrating.
- Interacting with objects.

Use sprite sheets or equivalent 2D animation assets.

Do not substitute the final character with basic geometric shapes.

# 3. VISUAL DIRECTION

The visual direction should be:

- 2D illustrated.
- Cozy and imaginative.
- Playful but sophisticated.
- Colorful without becoming visually overwhelming.
- Premium, polished and expressive.

## Color palette

Primary:
- Lavender.
- Soft pink.
- Cream.
- Mint green.
- Butter yellow.

Supporting:
- Warm beige.
- Muted peach.
- Dark brown.
- Charcoal.

Use layered environments, decorative details, subtle shadows, parallax backgrounds and smooth transitions.

Avoid:
- Generic corporate portfolio layouts.
- Excessive text.
- Childish cartoon aesthetics.
- Overly dark environments.
- Unnecessary visual clutter.

# 4. WORLD STRUCTURE

The world consists of five interconnected spaces.

## ROOM 01 — MY ROOM

Purpose: Introduction and personality.

Content:
- Who I am.
- My personality.
- My background.
- My interests.
- A short personal introduction.

Interactive objects:
- Mirror: About me.
- Photographs: Personal memories.
- Bookshelf: Interests and learning.
- Window: Transition to another environment.

## ROOM 02 — CREATIVE STUDIO

Purpose: Showcase my work and projects.

Projects to include:

1. The Lost Inn
   - Luxury vacation rental website.
   - Website and CMS development in progress.

2. ResolveAI
   - AI-assisted complaint intake and triage prototype.
   - Human review and reliability-focused workflow.

3. ReviewSetu
   - Functional prototype.
   - Not publicly launched.

4. Dispute SLA Analytics
   - Completed analytical project.
   - Analysis of synthetic dispute data using Excel and SQL.

Interactive objects:
- Laptop: Project showcase.
- Desk: Skills and tools.
- Screens: Project demonstrations.
- Notebook: Ideas and experiments.

Do not invent project results or claim unfinished projects are completed.

## ROOM 03 — CURIOSITY CORNER

Purpose: Showcase learning and exploration.

Possible content:
- Artificial intelligence.
- AI engineering.
- Automation.
- Finance and analytics.
- Technology.
- Creative experimentation.
- Personal learning journey.

Interactive objects:
- Bookshelf.
- Computer.
- Research notes.
- Learning board.

## ROOM 04 — DREAM

> **Note (Phase 2):** the original document ends at the heading above. Everything from here down records decisions made and implemented in Phases 1 and 2; nothing below is a planned or speculative feature. The original text above is unchanged.

## ROOM 04 — DREAM SPACE (implemented)

Purpose: ambitions, future plans and ideas.

Environment: an open night sky in lavender and plum, with stars, drifting clouds and sparkles. There are no walls. Three floating clouds are platforms the character can climb.

Interactive objects:
- Star map: Ambitions.
- Paper planes: Future plans.
- The moon: Ideas. It can only be reached by climbing the clouds.

Content: each object opens an editable list (`DREAMS` in `src/content/content.js`). No goals have been supplied yet, so every list shows labelled "to be added" slots. Personal goals are never invented.

## ROOM 05 — MEMORY WALL (implemented)

Purpose: photographs, small moments and milestones.

Environment: a warm peach-striped gallery wall with frames, a polaroid string, a pin board and a bench.

Interactive objects:
- Framed moments: photo gallery (6 slots).
- Polaroid string: small moments (5 slots).
- Pin board: milestones timeline (4 slots).
- Bench: the character sits down.

Content: only supplied photos and milestones appear (`MEMORIES` in `src/content/content.js`). Missing items stay as clearly labelled pending frames and timeline entries. Memories are never invented.

# 5. CHARACTER (as implemented)

- The official character sheet (`docs/character/aastha-character-sheet.webp`) is the permanent visual source of truth.
- The playable character is currently an interim layered 2D rig with ten animation states: idle, walking, jumping, waving, thinking, interacting, sitting, working, laughing, celebrating.
- A sprite-sheet pipeline (`public/character/sprites/manifest.json`) lets final illustrated frames replace the rig one clip at a time, with no change to movement or collisions. The frame contract and the list of missing frames are in `docs/CHARACTER_ASSET_PLAN.md`.
- Where each animation is used: waving at the start and at the mirror; thinking when an object's content is still pending; sitting and working at the studio laptop while the project showcase is open; sitting on the Memory Wall bench; laughing when the character is clicked twice; celebrating on the hidden bed bounce and after opening everything.
- The sheet's nine expressions and five outfits are shown in the mirror panel, cropped directly from the sheet.

# 6. CONTENT RULES (as implemented)

- All visitor-facing text lives in `src/content/content.js`.
- Project descriptions state only what the walkthrough videos, the workflow screenshot and the Dispute SLA case study show. Technologies are listed only where the evidence shows them; otherwise the panel says "Not listed in the evidence yet".
- Every project panel has: name, status, description, evidence, "What the evidence shows", technologies, and "What it demonstrates".
- Project statuses: The Lost Inn in progress; ResolveAI prototype; ReviewSetu functional prototype, not publicly launched; Dispute SLA Analytics completed analysis (synthetic data).
- Original evidence files are never moved, renamed, re-encoded or replaced. The build copies them unchanged, and the test suite verifies byte-for-byte that the served files match the originals.
- The Curiosity Corner topics are this document's "possible content" list. Each topic links only to projects whose evidence already shows that area.
- Missing personal content (background, interests, memories, goals, research notes, learning journey) is shown as labelled pending slots, not filled with generic text.

# 7. TECHNICAL ARCHITECTURE (as implemented)

- Vite 6, Phaser 3.90 (Arcade physics), GSAP 3, plain JavaScript modules.
- One Phaser scene, re-created per room. One-way platforms, a camera that follows the player and zooms to fit any screen, parallax sky behind real window cut-outs, a curtain transition between rooms.
- DOM overlays for panels, HUD, map, prompts, speech bubbles and touch controls, so text stays sharp and accessible.
- Accessibility: keyboard controls, touch controls, click or tap to walk to an object, Calm mode (follows the OS reduced-motion setting and can be toggled), focus-trapped dialogs, a skip link, a full list view at `/#list`, and `<noscript>` evidence links.
- Deployment: Vercel, Vite preset, build `npm run build`, output `dist`, root directory = repository root. The Vercel production branch must contain the app.
