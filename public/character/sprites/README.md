# Character sprite sheets

Drop illustrated sprite sheets here and list them in `manifest.json`.
Any clip listed there replaces the code-drawn rig for that clip only;
clips that aren't listed keep using the rig.

**Frame contract** (must match the rig so collisions and positioning don't change):

- Every frame: **340 × 500 px**, transparent background.
- Character faces **right** (left is mirrored in code).
- Feet rest on **y = 476**, horizontally centred on **x = 170**.
- A sheet is one horizontal row of frames (`frames × 340` px wide).

**Manifest entry:**

```json
"clips": {
  "idle": { "sheet": "idle.png", "frames": 8, "fps": 8, "loop": true },
  "jump": { "sheet": "jump.png", "frames": 3 }
}
```

Clip names: `idle`, `walk`, `jump` (frames: rise, apex, fall), `land`,
`wave`, `think`, `interact`, `celebrate`, `sit`, `work`, `laugh`.
