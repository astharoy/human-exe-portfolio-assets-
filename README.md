# DIGITAL ME

An interactive 2D side-scrolling personal universe for Aastha. Visitors walk her character through five connected rooms and open the objects in them to find her real projects, videos and evidence.

Spec: [`human.exe porfolio/digital_me.md`](human.exe%20porfolio/digital_me.md). The copy in the repo ends at the Room 04 heading; see [docs/IMPLEMENTATION_REPORT.md](docs/IMPLEMENTATION_REPORT.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve dist/ at http://localhost:4173
```

The character rig preview page (a development tool, not in the build): http://localhost:5173/character-preview.html

## Deploy (Vercel)

`vercel.json` is set up for the Vite framework preset (`npm run build` → `dist`). Import the repository in Vercel and deploy; no environment variables are needed.

## Where things live

| Path | What |
|---|---|
| `human.exe porfolio/` | **Original evidence. Never moved or renamed.** Videos, workflow screenshot, case study, spec. |
| `vite.config.js` | Serves those originals at clean `/evidence/...` URLs in dev and copies them into `dist/evidence/` at build. |
| `src/content/content.js` | **All visitor-facing text.** Projects, panels, and `pending` slots to fill in. |
| `src/world/rooms.js` | The five rooms: layout, objects, doors, platforms. |
| `src/world/paint.js` | Procedural painters for room backgrounds and objects. |
| `src/character/rig.js`, `poses.js` | Articulated character rig and its animation clips. |
| `src/game/` | Phaser scene and player (physics, camera, interactions, transitions). |
| `src/ui/` | DOM panels, HUD, map, touch controls, accessible list view. |
| `public/evidence/posters/` | Video poster frames extracted from the real walkthrough videos. |
| `public/character/portrait.webp` | Portrait cropped from the official character sheet. |
| `docs/character/` | The official character sheet and the rig pose reference. |
| `tests/playthrough.cjs` | End-to-end Playwright playthrough (21 checks). |

## Filling in pending content

Every object without real content opens a "Still being written" card. To fill one in, open `src/content/content.js`, find the panel id (for example `photos` or `curio-notes`), replace `pending: true` with `blocks: [...]`, and use the block types listed at the top of that file.

## Controls

Arrow keys / A·D walk · ↑ / W / Space jump · E / Enter open · M map · Esc close. Click or tap any glowing object to walk to it. On touch devices, on-screen buttons appear. **Calm mode** reduces motion, and **List view** (`/#list`) shows all content as a plain accessible page.
