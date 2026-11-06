/**
 * Aastha — layered 2D character rig (v2).
 *
 * The character is built from separately drawn, shaded layers (back hair,
 * far arm, far leg, near leg, waist, top, neck, head, face, glasses, front
 * hair, headphones, near arm) attached to a skeleton. Each animation in
 * poses.js moves the joints over time, so every clip is real limb
 * articulation, not a stretched or rotated still image.
 *
 * Visual reference: docs/character/aastha-character-sheet.webp
 * (side and 3/4 views: long dark wavy hair, thick black rectangular
 * glasses, small nose ring, stud earrings, black cap-sleeve crop top,
 * high-waisted wide black cargo trousers, chunky white sneakers,
 * black headphones resting around the neck).
 *
 * Coordinates: logical units, origin between the feet, y down, facing +x.
 * Limb angles: 0 = straight down, positive = swing forward. Child joints
 * (elbow, knee) are relative to their parent.
 *
 * Any sprite frames delivered later must match RIG.width × RIG.height
 * (at 2×) and put the feet at RIG.originX / RIG.originY — see
 * docs/CHARACTER_ASSET_PLAN.md.
 */
import { CH } from '../palette.js';

export const RIG = {
  thigh: 45,
  shin: 45,
  torso: 52,
  upperArm: 27,
  foreArm: 24,
  width: 170,
  height: 250,
  originX: 85,
  originY: 238,
};

const dir = (a) => [Math.sin(a), Math.cos(a)];

/* ------------------------------------------------------------------ */
/* drawing helpers                                                     */
/* ------------------------------------------------------------------ */

/** Tapered capsule; `fill` may be a colour or a function(ctx, len, w) returning a gradient in local space. */
function limb(ctx, x1, y1, x2, y2, w1, w2, fill, endCap = true) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 0.0001;
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2); // local +y runs along the limb
  ctx.fillStyle = typeof fill === 'function' ? fill(ctx, len, Math.max(w1, w2)) : fill;
  ctx.beginPath();
  ctx.moveTo(-w1, 0);
  ctx.lineTo(-w2, len);
  if (endCap) ctx.arc(0, len, w2, Math.PI, 0, true);
  else ctx.lineTo(w2, len);
  ctx.lineTo(w1, 0);
  ctx.arc(0, 0, w1, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Horizontal (across-the-limb) shading: lit on the +x (front) side. */
const across = (dark, base, light) => (ctx, len, w) => {
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, dark);
  g.addColorStop(0.55, base);
  g.addColorStop(1, light);
  return g;
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function solveLeg(hip, hipA, kneeA) {
  const [ux, uy] = dir(hipA);
  const knee = [hip[0] + ux * RIG.thigh, hip[1] + uy * RIG.thigh];
  const shinA = hipA - kneeA;
  const [sx, sy] = dir(shinA);
  const ankle = [knee[0] + sx * RIG.shin, knee[1] + sy * RIG.shin];
  return { knee, ankle, shinA };
}

function solveArm(sh, shA, elA) {
  const [ux, uy] = dir(shA);
  const elbow = [sh[0] + ux * RIG.upperArm, sh[1] + uy * RIG.upperArm];
  const foreA = shA + elA;
  const [fx, fy] = dir(foreA);
  const wrist = [elbow[0] + fx * RIG.foreArm, elbow[1] + fy * RIG.foreArm];
  return { elbow, wrist, foreA };
}

/* ------------------------------------------------------------------ */
/* legs: wide high-waisted cargo trousers + chunky sneakers            */
/* ------------------------------------------------------------------ */
function drawLeg(ctx, hip, hipA, kneeA, footA, far) {
  const { knee, ankle, shinA } = solveLeg(hip, hipA, kneeA);
  const k = far ? 0.72 : 1; // far leg sits in shadow
  const col = (c) => shade(c, k);
  const fabric = across(col('#17141a'), col(CH.pants), col(CH.pantsHi));

  // sneaker first, so the trouser hem pools over it
  ctx.save();
  ctx.translate(ankle[0], ankle[1]);
  ctx.rotate(-(footA ?? 0));
  // chunky platform sole
  ctx.fillStyle = col('#d9d2ca');
  rr(ctx, -10, 2, 30, 6.5, 3);
  ctx.fill();
  const sg = ctx.createLinearGradient(0, -9, 0, 4);
  sg.addColorStop(0, col('#ffffff'));
  sg.addColorStop(1, col('#e9e3dc'));
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(-10, 3);
  ctx.quadraticCurveTo(-11, -7, -3, -8);
  ctx.lineTo(7, -7);
  ctx.quadraticCurveTo(18, -5, 20, 2);
  ctx.lineTo(20, 4);
  ctx.lineTo(-10, 4);
  ctx.closePath();
  ctx.fill();
  // lace hint + toe line
  ctx.strokeStyle = col('rgba(150,140,130,0.6)');
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(1, -6.5);
  ctx.lineTo(9, -4.5);
  ctx.moveTo(12, 0);
  ctx.quadraticCurveTo(16, -1, 19, 1);
  ctx.stroke();
  ctx.restore();

  // thigh and flared shin
  limb(ctx, hip[0], hip[1], knee[0], knee[1], 12.5, 12, fabric);
  limb(ctx, knee[0], knee[1], ankle[0], ankle[1] - 1, 12, 14.5, fabric, false);

  ctx.save();
  ctx.translate(knee[0], knee[1]);
  ctx.rotate(-shinA);
  // big flap cargo pocket on the outer leg, just below the knee
  ctx.fillStyle = col('#1d191c');
  rr(ctx, -5, -6, 15, 22, 2.5);
  ctx.fill();
  ctx.fillStyle = col(CH.pantsHi);
  rr(ctx, -5.5, -7, 16, 6, 2);
  ctx.fill();
  ctx.fillStyle = col('#4a4344');
  ctx.beginPath();
  ctx.arc(2.5, -4, 0.9, 0, Math.PI * 2);
  ctx.fill();
  // knee crease
  ctx.strokeStyle = col('rgba(0,0,0,0.25)');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-10, -12);
  ctx.quadraticCurveTo(-4, -9, 0, -13);
  ctx.stroke();
  ctx.restore();

  // stacked hem
  ctx.save();
  ctx.translate(ankle[0], ankle[1]);
  ctx.rotate(-shinA);
  ctx.fillStyle = col('#1a171a');
  ctx.beginPath();
  ctx.moveTo(-14.5, -7);
  ctx.quadraticCurveTo(0, -3, 14.5, -7);
  ctx.lineTo(15, -1);
  ctx.quadraticCurveTo(0, 2.5, -15, -1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* arms                                                                */
/* ------------------------------------------------------------------ */
function drawArm(ctx, sh, shA, elA, far, hand = 'rest') {
  const { elbow, wrist, foreA } = solveArm(sh, shA, elA);
  const k = far ? 0.8 : 1;
  const skin = across(shade(CH.skinShade, k), shade(CH.skin, k), shade(CH.skinLight, k));
  limb(ctx, sh[0], sh[1], elbow[0], elbow[1], 4.6, 3.9, skin);
  limb(ctx, elbow[0], elbow[1], wrist[0], wrist[1], 3.9, 3.0, skin);
  // cap sleeve over the shoulder
  ctx.save();
  ctx.translate(sh[0], sh[1]);
  ctx.rotate(-shA);
  ctx.fillStyle = shade(CH.top, k);
  ctx.beginPath();
  ctx.moveTo(-5.4, -1);
  ctx.quadraticCurveTo(0, -4.5, 5.4, -1);
  ctx.lineTo(5.6, 8);
  ctx.quadraticCurveTo(0, 9.6, -5.6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // hand
  ctx.save();
  ctx.translate(wrist[0], wrist[1]);
  ctx.rotate(-foreA);
  const hs = shade(CH.skin, k);
  ctx.fillStyle = hs;
  ctx.beginPath();
  ctx.ellipse(0, 4.2, 3.7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (hand === 'open') {
    for (let i = -2; i <= 1; i++) limb(ctx, i * 1.7, 7.5, i * 2.4, 13, 1.05, 0.95, hs);
    limb(ctx, 3.2, 4, 6, 7.6, 1.1, 0.95, hs);
  } else if (hand === 'type') {
    limb(ctx, -1, 7.5, -0.5, 10.5, 1.4, 1.1, hs);
    limb(ctx, 1.6, 7.5, 2.2, 10.5, 1.3, 1.0, hs);
  }
  ctx.restore();
  return { wrist };
}

/* ------------------------------------------------------------------ */
/* torso: waistband, midriff, cap-sleeve crop top                      */
/* ------------------------------------------------------------------ */
function drawTorso(ctx, hip, neck, lean) {
  const sx = Math.sin(lean);
  // midriff
  const mg = ctx.createLinearGradient(hip[0] - 10, 0, hip[0] + 10, 0);
  mg.addColorStop(0, CH.skinShade);
  mg.addColorStop(0.6, CH.skin);
  mg.addColorStop(1, CH.skinLight);
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.moveTo(hip[0] - 10.5, hip[1] - 3);
  ctx.lineTo(hip[0] + 10.5, hip[1] - 3);
  ctx.quadraticCurveTo(hip[0] + sx * 7 + 8.5, hip[1] - 10, hip[0] + sx * 16 + 9, hip[1] - 17);
  ctx.lineTo(hip[0] + sx * 16 - 9, hip[1] - 17);
  ctx.quadraticCurveTo(hip[0] + sx * 7 - 8, hip[1] - 10, hip[0] - 10.5, hip[1] - 3);
  ctx.fill();
  // navel
  ctx.fillStyle = 'rgba(150,90,60,0.4)';
  ctx.beginPath();
  ctx.ellipse(hip[0] + sx * 9 + 5, hip[1] - 9, 0.8, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // high waistband with belt loops + button
  ctx.save();
  ctx.translate(hip[0], hip[1]);
  ctx.rotate(lean * 0.6);
  const wb = ctx.createLinearGradient(-13, 0, 13, 0);
  wb.addColorStop(0, '#17141a');
  wb.addColorStop(1, CH.pantsHi);
  ctx.fillStyle = wb;
  rr(ctx, -13.5, -6, 27, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#141114';
  ctx.fillRect(-13.5, 1, 27, 1.2);
  ctx.fillStyle = '#3c3537';
  [-8, 1].forEach((x) => ctx.fillRect(x, -6, 2, 8));
  ctx.fillStyle = CH.metal;
  ctx.beginPath();
  ctx.arc(8, -1.6, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // fitted crop top
  ctx.save();
  ctx.translate(neck[0], neck[1]);
  ctx.rotate(lean);
  const tg = ctx.createLinearGradient(-12, 0, 13, 0);
  tg.addColorStop(0, '#141116');
  tg.addColorStop(0.6, CH.top);
  tg.addColorStop(1, CH.topHi);
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(-8, -1);
  ctx.quadraticCurveTo(0, 3.5, 8.5, -1);
  ctx.quadraticCurveTo(13, 2, 12.5, 11);
  ctx.quadraticCurveTo(14.5, 21, 11.5, 33);
  ctx.quadraticCurveTo(0, 35, -11, 33);
  ctx.quadraticCurveTo(-13, 21, -12, 9);
  ctx.quadraticCurveTo(-11.5, 1, -8, -1);
  ctx.fill();
  // soft fabric highlight + hem line
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.ellipse(7, 15, 3.6, 9, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-10.5, 31.5);
  ctx.quadraticCurveTo(0, 33.5, 11, 31.5);
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* hair                                                                */
/* ------------------------------------------------------------------ */
function hairGradient(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, CH.hair);
  g.addColorStop(0.65, CH.hairMid);
  g.addColorStop(1, '#4a3026'); // warm brown at the ends, as on the sheet
  return g;
}

function drawBackHair(ctx, hx, hy, swing, lift) {
  const s = swing * 7;
  const l = lift * 12;
  ctx.fillStyle = hairGradient(ctx, hy - 22, hy + 80);
  ctx.beginPath();
  ctx.moveTo(hx - 2, hy - 23);
  ctx.bezierCurveTo(hx - 24, hy - 24, hx - 28, hy - 4, hx - 25, hy + 14);
  ctx.bezierCurveTo(hx - 29 - s, hy + 32 - l, hx - 31 - s, hy + 52 - l, hx - 25 - s * 1.4, hy + 70 - l);
  // wavy ends
  ctx.quadraticCurveTo(hx - 21 - s * 1.5, hy + 79 - l, hx - 15 - s * 1.5, hy + 71 - l);
  ctx.quadraticCurveTo(hx - 11 - s * 1.5, hy + 80 - l, hx - 5 - s * 1.4, hy + 72 - l);
  ctx.quadraticCurveTo(hx + 1 - s * 1.2, hy + 79 - l, hx + 5 - s, hy + 67 - l);
  ctx.bezierCurveTo(hx + 8 - s * 0.6, hy + 50 - l, hx + 5, hy + 34, hx + 7, hy + 20);
  ctx.bezierCurveTo(hx + 13, hy + 8, hx + 21, hy - 3, hx + 18, hy - 14);
  ctx.bezierCurveTo(hx + 14, hy - 23, hx + 6, hy - 25, hx - 2, hy - 23);
  ctx.fill();
  // wave strands
  ctx.strokeStyle = CH.hairHi;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.2;
  for (const [ox, oy, w] of [[-20, 0, 1], [-13, 6, 0.9], [-6, 12, 0.8]]) {
    ctx.beginPath();
    ctx.moveTo(hx + ox, hy + oy);
    ctx.bezierCurveTo(hx + ox - 5, hy + oy + 18, hx + ox + 3 - s * w, hy + oy + 32 - l, hx + ox - 3 - s * w * 1.3, hy + oy + 52 - l);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawFrontHair(ctx, hx, hy, swing) {
  const s = swing * 2.5;
  ctx.fillStyle = hairGradient(ctx, hy - 26, hy + 46);
  // crown with a centre part and curtain fringe sweeping toward the face
  ctx.beginPath();
  ctx.moveTo(hx - 15, hy + 6);
  ctx.bezierCurveTo(hx - 19, hy - 17, hx - 5, hy - 29, hx + 7, hy - 26);
  ctx.bezierCurveTo(hx + 19, hy - 23, hx + 23, hy - 10, hx + 20, hy + 2);
  ctx.bezierCurveTo(hx + 19, hy - 6, hx + 16, hy - 11, hx + 11, hy - 13.5);
  ctx.bezierCurveTo(hx + 8, hy - 10, hx + 5.5, hy - 8, hx + 4, hy - 7.5);
  ctx.bezierCurveTo(hx + 1.5, hy - 12, hx - 3, hy - 13.5, hx - 6.5, hy - 11);
  ctx.bezierCurveTo(hx - 10, hy - 6, hx - 11, hy - 1, hx - 10, hy + 7);
  ctx.closePath();
  ctx.fill();
  // face-framing wave falling in front of the near shoulder
  ctx.beginPath();
  ctx.moveTo(hx + 18.5, hy - 7);
  ctx.bezierCurveTo(hx + 24, hy + 6, hx + 20 + s, hy + 18, hx + 23 + s, hy + 29);
  ctx.bezierCurveTo(hx + 25 + s, hy + 37, hx + 20 + s, hy + 42, hx + 18 + s, hy + 46);
  ctx.bezierCurveTo(hx + 20 + s, hy + 36, hx + 16, hy + 30, hx + 16, hy + 21);
  ctx.bezierCurveTo(hx + 15, hy + 10, hx + 17, hy + 2, hx + 15.5, hy - 4);
  ctx.closePath();
  ctx.fill();
  // loose strand across the temple
  ctx.strokeStyle = CH.hair;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(hx + 10, hy - 13);
  ctx.bezierCurveTo(hx + 15, hy - 6, hx + 13, hy + 2, hx + 16, hy + 9);
  ctx.stroke();
  // shine band
  ctx.strokeStyle = CH.hairHi;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(hx - 10, hy - 16);
  ctx.quadraticCurveTo(hx + 1, hy - 24, hx + 13, hy - 20);
  ctx.stroke();
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(hx + 20, hy + 4);
  ctx.quadraticCurveTo(hx + 22, hy + 17, hx + 21 + s, hy + 30);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* head + face                                                         */
/* ------------------------------------------------------------------ */
function drawHead(ctx, p) {
  const { headX: hx, headY: hy } = p;
  // neck
  limb(ctx, hx - 2, hy + 12, hx - 3, hy + 27, 4.2, 4.6, across(CH.skinShade, CH.skinShade, CH.skin));
  ctx.fillStyle = 'rgba(120,70,50,0.25)';
  ctx.beginPath();
  ctx.ellipse(hx + 1, hy + 18, 4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // ear + stud
  ctx.fillStyle = CH.skinShade;
  ctx.beginPath();
  ctx.ellipse(hx - 8.5, hy + 2, 3.4, 5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5efe6';
  ctx.beginPath();
  ctx.arc(hx - 9, hy + 7.6, 1.35, 0, Math.PI * 2);
  ctx.fill();
  // face shape (3/4 view toward +x) with a soft jaw
  const fg = ctx.createRadialGradient(hx + 8, hy - 2, 3, hx + 4, hy + 2, 22);
  fg.addColorStop(0, CH.skinLight);
  fg.addColorStop(0.55, CH.skin);
  fg.addColorStop(1, CH.skinShade);
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(hx - 12, hy - 11);
  ctx.bezierCurveTo(hx - 5, hy - 20, hx + 13, hy - 19, hx + 16, hy - 6);
  ctx.bezierCurveTo(hx + 16.5, hy - 2, hx + 16, hy + 1, hx + 17.5, hy + 5.5); // nose bridge to tip
  ctx.quadraticCurveTo(hx + 18.5, hy + 7.5, hx + 15.6, hy + 8.4);
  ctx.quadraticCurveTo(hx + 16.3, hy + 10.5, hx + 15.6, hy + 12.5); // lips
  ctx.bezierCurveTo(hx + 14.5, hy + 16.5, hx + 10, hy + 19.5, hx + 5, hy + 19.5);
  ctx.bezierCurveTo(hx - 1, hy + 19, hx - 8, hy + 12, hx - 11, hy + 4);
  ctx.bezierCurveTo(hx - 13, hy - 2, hx - 13, hy - 7, hx - 12, hy - 11);
  ctx.fill();
  drawFace(ctx, p);
}

function drawFace(ctx, p) {
  const { headX: hx, headY: hy, eyes, mouth, blink, look } = p;
  const lx = (look?.[0] ?? 0) * 1.1;
  const ly = (look?.[1] ?? 0) * 1.1;
  // blush
  ctx.fillStyle = CH.blush;
  ctx.beginPath();
  ctx.ellipse(hx + 11, hy + 8, 3.8, 2.3, 0, 0, Math.PI * 2);
  ctx.ellipse(hx - 1.5, hy + 8.5, 2.8, 1.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // eyes: large, warm brown, with a strong highlight (as on the sheet)
  const eyesAt = [
    [hx + 1.3, hy + 0.6, 2.7, 0.85], // far eye, foreshortened
    [hx + 10.4, hy + 0.4, 3.4, 1],
  ];
  const closed = blink > 0.5 || eyes === 'closed';
  for (const [ex, ey, r, sq] of eyesAt) {
    if (eyes === 'happy') {
      ctx.strokeStyle = CH.iris;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, ey + 1.8, r * 0.9, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
      continue;
    }
    if (closed) {
      ctx.strokeStyle = CH.iris;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, ey - 0.4, r * 0.95, Math.PI * 0.12, Math.PI * 0.88);
      ctx.stroke();
      continue;
    }
    const lid = eyes === 'focus' ? 0.72 : eyes === 'wide' ? 1.22 : 1.04;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, ey, r * sq, r * lid, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fbf6f0';
    ctx.fill();
    ctx.clip();
    const ix = ex + 0.5 + lx;
    const iy = ey + 0.4 + ly + (eyes === 'focus' ? 0.9 : 0);
    const ig = ctx.createRadialGradient(ix, iy + 0.6, 0.2, ix, iy, r * 0.8);
    ig.addColorStop(0, '#8a5634');
    ig.addColorStop(1, CH.iris);
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(ix, iy, r * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#120b08';
    ctx.beginPath();
    ctx.arc(ix, iy, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ix + 0.9, iy - 1, r * 0.27, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // lash line + outer flick
    ctx.strokeStyle = '#1a100c';
    ctx.lineWidth = 1.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(ex, ey, r * sq + 0.2, r * lid + 0.2, 0, Math.PI * 1.08, Math.PI * 1.98);
    ctx.lineTo(ex + r * sq + 1.4, ey - r * lid * 0.55);
    ctx.stroke();
  }

  // thick, expressive brows
  const browLift = eyes === 'up' || eyes === 'wide' ? 1.8 : eyes === 'focus' ? -0.6 : 0;
  ctx.fillStyle = CH.hair;
  const brow = (x0, x1, y, lift, th) => {
    ctx.beginPath();
    ctx.moveTo(x0, y - lift);
    ctx.quadraticCurveTo((x0 + x1) / 2, y - 2.6 - lift * 1.2, x1, y - 0.6 - lift);
    ctx.quadraticCurveTo((x0 + x1) / 2, y - 2.6 - lift * 1.2 + th, x0, y + th - lift);
    ctx.fill();
  };
  brow(hx - 2.5, hx + 4.5, hy - 6.2, browLift, 1.6);
  brow(hx + 7, hx + 15, hy - 6.5, browLift * 1.2, 2);

  // glasses: thick black rectangular frames
  ctx.strokeStyle = CH.glasses;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.9;
  rr(ctx, hx - 3.6, hy - 4.6, 9.2, 8.8, 2.2);
  ctx.stroke();
  rr(ctx, hx + 6.3, hy - 5, 10.6, 9.4, 2.4);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(hx + 5.6, hy - 1.4);
  ctx.quadraticCurveTo(hx + 6, hy - 2.6, hx + 6.3, hy - 1.4);
  ctx.moveTo(hx - 3.6, hy - 2.4);
  ctx.lineTo(hx - 8.5, hy - 1);
  ctx.stroke();
  // lens tint + sheen
  ctx.fillStyle = 'rgba(255,214,190,0.12)';
  rr(ctx, hx + 7.2, hy - 4.1, 8.8, 7.6, 1.8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(hx + 8.6, hy + 2.6);
  ctx.lineTo(hx + 10.8, hy - 2.8);
  ctx.stroke();

  // nostril + small nose ring
  ctx.strokeStyle = 'rgba(150,85,60,0.7)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(hx + 14.6, hy + 7.4, 1.1, Math.PI * 0.2, Math.PI * 1.1);
  ctx.stroke();
  ctx.strokeStyle = CH.metal;
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  ctx.arc(hx + 14.2, hy + 8.6, 1.35, Math.PI * 0.55, Math.PI * 2.05);
  ctx.stroke();

  // mouth: full lips, coral-rose
  const mx = hx + 12.2;
  const my = hy + 12.8;
  ctx.lineCap = 'round';
  switch (mouth) {
    case 'open':
    case 'laugh': {
      const wide = mouth === 'laugh' ? 1.35 : 1;
      ctx.fillStyle = '#7a2f33';
      ctx.beginPath();
      ctx.moveTo(mx - 4.4, my - 1);
      ctx.quadraticCurveTo(mx, my - 2, mx + 3.6, my - 1.2);
      ctx.quadraticCurveTo(mx + 0.4, my + 5.5 * wide, mx - 4.4, my - 1);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(mx - 3.6, my - 1);
      ctx.quadraticCurveTo(mx, my - 1.8, mx + 3, my - 1.1);
      ctx.lineTo(mx + 2.6, my + 0.3);
      ctx.quadraticCurveTo(mx, my - 0.2, mx - 3.3, my + 0.2);
      ctx.fill();
      ctx.fillStyle = '#d27a78';
      ctx.beginPath();
      ctx.ellipse(mx - 0.6, my + 2.4 * wide, 1.8, 1.0, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'o':
      ctx.fillStyle = '#8d3a3d';
      ctx.beginPath();
      ctx.ellipse(mx - 0.4, my + 0.4, 1.7, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = CH.lips;
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    case 'neutral':
      ctx.fillStyle = CH.lips;
      ctx.beginPath();
      ctx.moveTo(mx - 3.6, my);
      ctx.quadraticCurveTo(mx - 0.5, my - 1.6, mx + 2.8, my - 0.5);
      ctx.quadraticCurveTo(mx - 0.4, my + 2.2, mx - 3.6, my);
      ctx.fill();
      break;
    default: {
      // soft closed smile with fuller lower lip
      ctx.fillStyle = CH.lips;
      ctx.beginPath();
      ctx.moveTo(mx - 4.2, my - 0.8);
      ctx.quadraticCurveTo(mx - 1, my - 2.2, mx + 3.2, my - 1.4);
      ctx.quadraticCurveTo(mx + 0.2, my + 3, mx - 4.2, my - 0.8);
      ctx.fill();
      ctx.strokeStyle = CH.lipsDark;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(mx - 4.4, my - 1.1);
      ctx.quadraticCurveTo(mx - 0.6, my + 0.3, mx + 3.4, my - 1.6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(mx - 0.8, my + 0.9, 1.3, 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawHeadphones(ctx, nx, ny) {
  // resting around the neck, as on the reference sheet
  ctx.strokeStyle = CH.headphones;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.ellipse(nx - 3, ny + 2, 12.5, 5, 0, Math.PI * 0.05, Math.PI * 0.95);
  ctx.stroke();
  const g = ctx.createRadialGradient(nx + 9, ny + 1, 1, nx + 8, ny + 3, 7);
  g.addColorStop(0, CH.headphonesHi);
  g.addColorStop(1, CH.headphones);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(nx + 8, ny + 3, 5.6, 6.6, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(nx + 8, ny + 3, 3.4, 4.2, 0.2, 0, Math.PI * 2);
  ctx.stroke();
}

function shade(color, k) {
  if (k === 1 || !color.startsWith('#')) return color;
  const n = parseInt(color.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

/**
 * Draw one pose. Fields:
 *  bodyY, lean, headTilt, seated,
 *  hipB, kneeB, hipF, kneeF, footB, footF,
 *  shB, elB, shF, elF, handF, handB ('rest'|'open'|'type' or boolean open),
 *  eyes ('open'|'closed'|'happy'|'up'|'wide'|'focus'),
 *  mouth ('smile'|'open'|'laugh'|'o'|'neutral'),
 *  blink (0..1), hairSwing (−1..1), hairLift (0..1), look [x,y], airborne
 */
export function drawCharacter(ctx, pose) {
  const p = { ...pose };
  const bodyY = p.bodyY || 0;
  const lean = p.lean || 0;
  const legH = (h, k) => solveLeg([0, 0], h, k).ankle[1];
  const stand = p.airborne ? RIG.thigh + RIG.shin - 4 : Math.max(legH(p.hipB, p.kneeB), legH(p.hipF, p.kneeF));
  const hip = [p.seated ? -6 : 0, -stand - 4 + bodyY];
  const neck = [hip[0] + Math.sin(lean) * RIG.torso, hip[1] - Math.cos(lean) * RIG.torso];
  const tilt = p.headTilt || 0;
  p.headX = neck[0] + Math.sin(lean + tilt) * 20 + 2;
  p.headY = neck[1] - 20;
  const shB = [neck[0] - 6, neck[1] + 5];
  const shF = [neck[0] + 4, neck[1] + 6];
  const hand = (h) => (h === true ? 'open' : h || 'rest');

  if (!p.noShadow) {
    ctx.fillStyle = 'rgba(40,25,40,0.16)';
    ctx.beginPath();
    const ss = p.airborne ? 0.6 : 1;
    ctx.ellipse(0, 6, 28 * ss, 5 * ss, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBackHair(ctx, p.headX, p.headY, p.hairSwing || 0, p.hairLift || 0);
  drawArm(ctx, shB, p.shB, p.elB, true, hand(p.handB));
  drawLeg(ctx, [hip[0] - 3, hip[1]], p.hipB, p.kneeB, p.footB, true);
  drawLeg(ctx, [hip[0] + 3, hip[1]], p.hipF, p.kneeF, p.footF, false);
  drawTorso(ctx, hip, neck, lean);
  ctx.save();
  ctx.translate(p.headX, p.headY);
  ctx.rotate(tilt);
  ctx.translate(-p.headX, -p.headY);
  drawHead(ctx, p);
  drawFrontHair(ctx, p.headX, p.headY, p.hairSwing || 0);
  ctx.restore();
  drawHeadphones(ctx, neck[0] + 1, neck[1] - 1);
  drawArm(ctx, shF, p.shF, p.elF, false, hand(p.handF));
  return { hip, neck, head: [p.headX, p.headY] };
}

/** Render a pose into a 2D context at a given resolution, facing ±1. */
export function renderPose(ctx, pose, { scale = 2, facing = 1 } = {}) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.scale(scale, scale);
  ctx.translate(RIG.originX, RIG.originY);
  if (facing < 0) ctx.scale(-1, 1);
  const out = drawCharacter(ctx, pose);
  ctx.restore();
  return out;
}
