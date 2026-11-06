# DIGITAL ME

An interactive 2D side-scrolling personal universe for Aastha. Visitors walk her character through five connected rooms and open the objects in them to find her real projects, videos and evidence.

Spec: [`human.exe porfolio/digital_me.md`](human.exe%20porfolio/digital_me.md). The original ended at the Room 04 heading; Phase 2 appended the decisions that have since been implemented. Status and testing: [docs/IMPLEMENTATION_REPORT.md](docs/IMPLEMENTATION_REPORT.md). Character: [docs/CHARACTER_ASSET_PLAN.md](docs/CHARACTER_ASSET_PLAN.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve dist/ at http://localhost:4173
node tests/playthrough.cjs test-results http://localhost:4173/   # needs Playwright + Chromium
```

The character rig preview page (a development tool, not in the build): http://localhost:5173/character-preview.html

## Deploy (Vercel)

`vercel.json` is set up for the Vite framework preset (`npm run build` → `dist`). No environment variables are needed.

| Vercel setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | *(empty — the repository root)* |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` (default) |
| Production Branch | the branch that contains the app (see below) |

**Production branch matters.** Vercel builds the project's *production branch* for the main URL. The app (this README, `package.json`, `index.html`, `src/`) currently lives on `claude/tender-gauss-rgzlpn`. `main` holds only the original assets, so deploying `main` has nothing to build or serve and returns a 404. Either merge the app into `main`, or set Vercel → Project → Settings → Environments → Production → Branch to the app branch, then redeploy.

## Where things live

| Path | What |
|---|---|
| `human.exe porfolio/` | **Original evidence. Never moved or renamed.** Videos, workflow screenshot, case study, spec. |
| `vite.config.js` | Serves those originals at clean `/evidence/...` URLs in dev and copies them into `dist/evidence/` at build. |
| `src/content/content.js` | **All visitor-facing text.** Projects, panels, and `pending` slots to fill in. |
| `src/world/rooms.js` | The five rooms: layout, objects, doors, platforms. |
| `src/world/paint.js` | Procedural painters for room backgrounds and objects. |
| `src/character/rig.js`, `poses.js` | Interim layered character rig and its 11 animation clips. |
| `public/character/sprites/` | Sprite-sheet pipeline: add illustrated frames + `manifest.json` entries to replace the rig per clip. |
| `public/character/expressions/`, `outfits.webp` | Moods and outfits cropped from the official character sheet. |
| `src/game/` | Phaser scene and player (physics, camera, interactions, transitions). |
| `src/ui/` | DOM panels, HUD, map, touch controls, accessible list view. |
| `public/evidence/posters/` | Video poster frames extracted from the real walkthrough videos. |
| `public/character/portrait.webp` | Portrait cropped from the official character sheet. |
| `docs/character/` | The official character sheet and the rig pose reference. |
| `tests/playthrough.cjs` | End-to-end Playwright suite (64 checks): rooms, doors, objects, videos, evidence integrity, sprite pipeline, Calm mode, mobile, list view. |

## Filling in pending content

Everything visitors read is in `src/content/content.js`. Empty collections show labelled "to be added" slots; adding entries fills them:

| What | Where in `content.js` | Entry shape |
|---|---|---|
| Ambitions, future plans, ideas (Dream Space) | `DREAMS.ambitions / plans / ideas` | `{ title, text }` |
| Photos, small moments (Memory Wall, My Room) | `MEMORIES.photos / moments` | `{ src, alt, caption, date }` (put images in `public/memories/`) |
| Milestones (Memory Wall) | `MEMORIES.milestones` | `{ date, title, text }` |
| Research notes, learning journey (Curiosity Corner) | `LEARNING.notes / journey` | `{ title, text }` / `{ date, title, text }` |
| Topics and where they appear in projects | `TOPICS` | `{ title, seen: [[projectId, why]] }` |
| Background, interests, notebook ideas | the matching panel in `PANELS` | replace the `pendingText` / empty `entries` block |

Block types are listed at the top of the file.

## Controls

Arrow keys / A·D walk · ↑ / W / Space jump · E / Enter open · M map · Esc close. Click or tap any glowing object to walk to it. On touch devices, on-screen buttons appear. **Calm mode** reduces motion, and **List view** (`/#list`) shows all content as a plain accessible page.
