# Character asset plan

**Source of truth:** [`docs/character/aastha-character-sheet.webp`](character/aastha-character-sheet.webp), the official Aastha Digital Avatar board. It is the permanent visual standard. Everything below is measured against it.

## Current state: interim layered rig (Phase 2)

The playable character is a **layered 2D rig** (`src/character/rig.js`). Shaded parts (back hair, both legs with cargo trousers and sneakers, waistband, crop top, neck, head, face, glasses, front hair, headphones, both arms) are attached to a skeleton. Each animation in `src/character/poses.js` moves the joints over time, so every clip is real limb movement. Nothing is a stretched, squashed or rotated still image.

**This is an interim implementation, not the final art standard.** It is flat vector art drawn in code. It matches the sheet's identifying features and outfit, but not its painterly rendering, lighting or facial detail.

![Rig poses](character/rig-poses.png)

### Kept from the sheet
- Long dark wavy hair with a centre part, curtain fringe and warm brown ends (front views)
- Thick black rectangular glasses, small nose ring, stud earrings
- Warm complexion with blush; large warm-brown eyes; thick brows; full coral-rose lips
- Black cap-sleeve crop top, high-waisted wide black cargo trousers with large flap pockets and a stacked hem, chunky white sneakers (side view)
- Black over-ear headphones resting around the neck
- Slim, long-legged proportions (side and front full-body views)

### Animation clips

| # | Clip | Status | Where it's used in the world |
|---|---|---|---|
| 1 | Idle | Rig ✓ | Default: breathing, blinking, hair sway, glances |
| 2 | Walking | Rig ✓ | Movement; left is mirrored |
| 3 | Jumping | Rig ✓ (rise, fall + landing) | Jumping, cloud climbing, bouncy bed |
| 4 | Waving | Rig ✓ | Game start, the mirror, clicking the character |
| 5 | Thinking | Rig ✓ | Opening a room whose content is still pending |
| 6 | Interacting | Rig ✓ | Opening objects, using doors |
| 7 | Sitting | Rig ✓ | Memory Wall bench |
| 8 | Working | Rig ✓ (seated typing) | Studio laptop: she sits at the desk while the project showcase is open |
| 9 | Laughing | Rig ✓ | Clicking the character a second time |
| 10 | Celebrating | Rig ✓ | Hidden bed bounce; opening everything in the world |

The character redraws at 24 fps ("on ones"), which looks like hand-drawn animation and is cheaper than redrawing every frame.

## Asset pipeline for the final illustrated sprites

Final art goes in `public/character/sprites/` and is registered in `public/character/sprites/manifest.json`. **Any clip listed there replaces the rig for that clip only.** Unlisted clips keep using the rig, so illustrated art can arrive one clip at a time. Movement, collisions and interactions don't change.

Frame contract (identical to the rig, so physics and positioning stay the same):

| | |
|---|---|
| Frame size | **340 × 500 px**, transparent PNG |
| Facing | Right (left is mirrored in code) |
| Feet | On **y = 476**, centred on **x = 170** |
| Sheet | One horizontal row of frames |

Manifest entry example:

```json
"clips": {
  "idle": { "sheet": "idle.png", "frames": 8, "fps": 8, "loop": true },
  "jump": { "sheet": "jump.png", "frames": 3 }
}
```

`jump` frames are picked by vertical speed (rise, apex, fall). Every other clip plays at its `fps`, looping unless `"loop": false`. The test suite checks the pipeline by serving a test sheet for `idle` and confirming that `walk` falls back to the rig.

### Missing assets (needed to reach the sheet's quality)

None of the frames below exist yet. They need an illustrator, or image-model generation that is then corrected by hand for frame-to-frame consistency.

| Clip | Frames | Loop | Notes |
|---|---|---|---|
| idle | 6–8 | yes | Breathing, one blink frame |
| walk | 8 | yes | Full contact–passing–contact cycle |
| jump | 3 | no | Rise, apex, fall |
| land | 2 | no | Squash and recover |
| wave | 6 | yes | Hand raised, 4 wave frames |
| think | 4 | hold last | Hand to chin (sheet: "Thinking") |
| interact | 4 | no | Reach out and return |
| sit | 2 | hold | Seat height 40 world units (80 px) above the feet line |
| work | 4 | yes | Seated typing (sheet: "Focused") |
| laugh | 4 | yes | Sheet: "Laughing" |
| celebrate | 6 | yes | Arms up, small hop (sheet: "Excited") |

The sheet's nine expressions and five outfits are already shown to visitors in the mirror panel, using crops of the sheet itself (`public/character/expressions/`, `public/character/outfits.webp`).
