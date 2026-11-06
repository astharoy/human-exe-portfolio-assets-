# Implementation report

## 1. Repository audit (before any changes)

| Item | Finding |
|---|---|
| Architecture | None: no code, no `package.json`, no build config. One commit on `main`. |
| Spec | `human.exe porfolio/digital_me.md`, **cut off after the "## ROOM 04 — DREAM" heading**. The copy pasted in conversation ends at the same line. Dream Space, Memory Wall and any later sections are undefined. |
| Evidence | `lostinn cms walkthrough.mp4` (30.5 s, 1918×876, H.264/AAC) · `reviewsetu walkthrough.mp4` (24.7 s, 1898×938, H.264/AAC) · `automation workflow.png` (ResolveAI n8n workflow) · `# Dispute SLA Analytics.md` (case study) |
| Character | No art in the repo. The official sheet was supplied in conversation and is now in `docs/character/`. |
| Personal content | None (no bio, interests, memories, background). |
| Other | A stray nested `human.exe porfolio/human-exe-portfolio-assets-/README.md` holding only a title. Left untouched. |

**Preservation:** every file in `human.exe porfolio/` is unchanged. Nothing was moved, renamed or re-encoded. The build plugin copies the files into `dist/evidence/` with web-safe names, and the originals stay as they are.

## 2. Architecture

- **Vite 6 + Phaser 3.90 + GSAP 3**, plain JavaScript modules, deployed as a static site (Vercel).
- **World:** one Phaser scene re-created per room (`scene.restart`), Arcade physics, one-way platforms, a camera that follows the player and zooms to fit any screen size.
- **Art:** rooms and objects are painted into canvas textures at load time (`src/world/paint.js`). Layers: a sky that scrolls slower for parallax, then a wall with real window cut-outs, then furniture, then the character. No stock images.
- **Character:** articulated rig, re-rendered into a canvas texture every frame (see [CHARACTER_ASSET_PLAN.md](CHARACTER_ASSET_PLAN.md)).
- **UI:** DOM overlays, so text stays sharp and accessible: modal panels with focus trapping and Esc to close, a HUD, a map, touch buttons, speech bubbles and prompts that follow the world.
- **Content:** a single data file (`src/content/content.js`); panels and the list view render from it.

## 3. What was built and tested

| Feature | Status |
|---|---|
| Movement, jumping, collisions, one-way platforms | Done, tested |
| Five rooms, door transitions both ways, window → Dream Space | Done, tested |
| Map with fast travel, visited/unexplored state | Done, tested |
| Proximity glow + prompt, press E / Enter, click or tap to walk and open | Done, tested |
| Discovery counter (20 objects), saved per visitor | Done |
| Creative Studio: laptop index, 4 project screens showing the real evidence, desk, notebook | Done, tested |
| Lost Inn + ReviewSetu videos play (range requests OK in dev and production) | Done, tested |
| ResolveAI workflow image (zoomable) and step list read from the screenshot | Done, tested |
| Dispute SLA: 91.2%, 2,770 records, Excel + SQL, synthetic-data disclaimer | Done, tested |
| Content-pending cards for every object without real content | Done |
| Hidden details: bouncy bed (bounce 3× → celebrate), cloud climb to the moon, click the character to wave | Done (cloud climb tested) |
| Keyboard, touch controls, Calm mode (reduced motion; follows the OS setting by default) | Done; touch tested on an emulated iPhone 13 |
| Accessible list view (`#list`), skip link, `<noscript>` evidence links | Done, tested |
| Production build + `vercel.json` | Done; full playthrough passes against `vite preview` |

`tests/playthrough.cjs` runs 21 checks against a running dev or preview server. All pass on the production build.

## 4. Content accuracy

- Project statuses follow the spec exactly: Lost Inn in progress, ResolveAI prototype, ReviewSetu functional prototype not launched, Dispute SLA completed analysis.
- ReviewSetu has **no description** in any source, so its panel shows the video plus a pending card.
- The skills on the Desk are only those visible in the evidence (Excel, SQL, n8n, OpenAI API, Supabase, webhooks).
- The Curiosity Corner's topics are the spec's "possible content" list, labelled "Draft topics from the project plan, awaiting confirmation".
- The intro text uses the persona traits from the spec and the character sheet. All other personal content is pending.

## 5. Deployment fix (between phases)

Vercel's first production deployment built `main` (`267e3bc`), which holds only the original assets: no `package.json` or `index.html`, so every URL returned 404. The app lives on `claude/tender-gauss-rgzlpn`. The build, output directory, asset paths and `vercel.json` were verified and needed no change. The README now lists the exact Vercel settings. To fix production, merge the branch into `main` or set Vercel's production branch to it.

## 6. Phase 2: character upgrade, content completion, polish

**Character**
- Rig v2: redrawn with shading and closer proportions to the sheet's side and front full-body views. Same joint API, so movement, collisions and interactions are unchanged.
- New clips: **sit**, **work**, **laugh** (11 clips in total, covering all 10 requested states).
- Sprite pipeline: `public/character/sprites/manifest.json`. Illustrated sheets replace the rig one clip at a time, with a fixed 340 × 500 frame contract. Tested with a served test sheet.
- The rig redraws at 24 fps instead of every frame.
- The character sheet stays the source of truth. The rig is interim (see CHARACTER_ASSET_PLAN.md).

**Rooms and interactions**
- Studio: a lower desk, a chair, and the laptop showcase now has her **sit and work** while it's open. Shelf and poster decor fill the empty wall.
- Memory Wall: the bench is a seat (she sits until you move).
- Clicking the character alternates wave and laugh.
- Pending objects trigger the **think** animation.
- Polish: a curtain transition naming the next room, swaying plants, room-specific ambient particles (dust motes, or falling leaves in the Curiosity Corner), and prompts that step aside while she's speaking.

**Content** (`src/content/content.js`, all editable)
- Every project panel has name, status, description, evidence, "What the evidence shows", technologies, and "What it demonstrates".
  - Lost Inn and ReviewSetu descriptions were written from frames of the walkthrough videos.
  - Technologies are listed only for ResolveAI (screenshot) and Dispute SLA (case study). The other two say "Not listed in the evidence yet".
- My Room mirror: confirmed traits, a summary of what's been built, the sheet's nine expressions and five outfits, and style. Background is still pending.
- Curiosity Corner: an expandable explorer for the seven spec topics, each linking to the project evidence where that area appears. A computer panel covers DIGITAL ME itself. Research notes and learning journey are editable and pending.
- Dream Space: editable Ambitions, Future plans and Ideas lists (empty, shown as pending slots).
- Memory Wall: a photo gallery (6 frames), a polaroid strip (5) and a milestones timeline (4). All pending; no photos or memories have been supplied.

**Bug fixed during testing:** a key tap whose key-down and key-up landed in the same frame was lost (Phaser `JustDown` polling), which could happen on slow devices. Presses are now queued from the key-down event itself.

**Tests** (`tests/playthrough.cjs`, 64 checks), run against the production build served as static files:
- Two consecutive full runs passed 64/64 after the key fix.
- Coverage: all 11 clips; walking and jumping onto a platform; every door and the window; the map; every interactive object in all five rooms; the laptop sit-and-work flow; all four project panels and their sections; both videos playing; the workflow image loading; 91.2% shown; topic → project links; the bench.
- The three served evidence files were verified byte-for-byte (SHA-256) against the originals in `human.exe porfolio/`.
- Also covered: the sprite pipeline and its rig fallback; Calm mode (OS reduced-motion); an emulated iPhone 13 with touch walking and tap-to-open; the list view with in-page project links; zero console errors.
- Earlier runs had intermittent failures. One test wait was too short for a loaded browser (now it polls). The other was the key-tap bug above.

## 7. Remaining work and blockers

1. **Illustrated sprite frames** to replace the interim rig (frame list in CHARACTER_ASSET_PLAN.md).
2. **Personal content:** background and personal story, interests, photos, small moments, milestones, ambitions, plans, ideas, research notes, learning journey. All slots exist and are editable.
3. **Technologies for The Lost Inn and ReviewSetu:** add them once evidence or your confirmation exists.
4. **Vercel production branch** (see section 5).
5. **Not verified:** real iOS/Android devices (only emulated), real screen readers, performance on low-end phones.
