/**
 * Aastha — articulated 2D character rig.
 *
 * The body is drawn from separate parts (back hair, limbs, torso, head,
 * face, front hair, glasses, accessories) that are positioned by a
 * skeleton. Every animation is a sequence of joint poses (see poses.js),
 * so movement is genuine limb articulation — not a stretched or rotated
 * still image.
 *
 * Coordinates: logical units, origin at the midpoint between the feet,
 * y grows downward, the character faces +x. Facing left is a mirror
 * applied by the caller.
 *
 * Angle convention for limbs: 0 = pointing straight down; positive values
 * swing the limb forward (toward the facing direction). Child angles
 * (elbow, knee) are relative to the parent segment.
 */
import { CH } from '../palette.js';

export const RIG = {
  thigh: 40,
  shin: 39,
  torso: 50,
  upperArm: 25,
  foreArm: 22,
  headR: 17,
  width: 170,
  height: 240,
  // where the feet sit inside the canvas (logical units)
  originX: 85,
  originY: 228,
};

const dir = (a) => [Math.sin(a), Math.cos(a)];

/** Tapered capsule between two points (quad body + round end caps). */
function limb(ctx, x1, y1, x2, y2, w1, w2, fill, endCap = true) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 0.0001;
  const nx = -dy / len;
  const ny = dx / len;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
  ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
  ctx.lineTo(x2 - nx * w2, y2 - ny * w2);
  ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x1, y1, w1, 0, Math.PI * 2);
  ctx.fill();
  if (!endCap) return;
  ctx.beginPath();
  ctx.arc(x2, y2, w2, 0, Math.PI * 2);
  ctx.fill();
}

function solveLeg(hip, hipA, kneeA) {
  const [ux, uy] = dir(hipA);
  const knee = [hip[0] + ux * RIG.thigh, hip[1] + uy * RIG.thigh];
  const shinA = hipA - kneeA; // knees bend backward
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

function drawLeg(ctx, hip, hipA, kneeA, footA, back) {
  const { knee, ankle, shinA } = solveLeg(hip, hipA, kneeA);
  const base = back ? CH.pantsShade : CH.pants;
  // wide cargo trousers: thigh, then a flared shin
  limb(ctx, hip[0], hip[1], knee[0], knee[1], 11.5, 11, base);
  limb(ctx, knee[0], knee[1], ankle[0], ankle[1], 11, 13.5, base, false);
  // cargo pocket on the shin
  ctx.save();
  ctx.translate(knee[0], knee[1]);
  ctx.rotate(-shinA);
  ctx.fillStyle = back ? '#151214' : CH.pantsHi;
  roundRect(ctx, 4, 4, 8.5, 15, 2);
  ctx.fill();
  ctx.fillStyle = back ? '#100e10' : CH.pantsShade;
  ctx.fillRect(4, 4, 8.5, 3);
  ctx.restore();
  // hem fold
  ctx.save();
  ctx.translate(ankle[0], ankle[1]);
  ctx.rotate(-shinA);
  ctx.fillStyle = back ? '#141113' : CH.pantsShade;
  roundRect(ctx, -13.5, -6, 27, 5, 2);
  ctx.fill();
  ctx.restore();
  // sneaker
  ctx.save();
  ctx.translate(ankle[0], ankle[1]);
  ctx.rotate(-(footA ?? 0));
  ctx.fillStyle = back ? CH.shoeShade : CH.shoe;
  ctx.beginPath();
  ctx.moveTo(-9, -3);
  ctx.quadraticCurveTo(-9, -7, -4, -7);
  ctx.lineTo(6, -6);
  ctx.quadraticCurveTo(16, -4, 17, 2);
  ctx.lineTo(17, 5);
  ctx.lineTo(-9, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = back ? '#bdb5ac' : CH.shoeShade;
  ctx.fillRect(-9, 3, 26, 2.6);
  ctx.restore();
}

function drawArm(ctx, sh, shA, elA, back, handOpen) {
  const { elbow, wrist, foreA } = solveArm(sh, shA, elA);
  const skin = back ? CH.skinShade : CH.skin;
  limb(ctx, sh[0], sh[1], elbow[0], elbow[1], 4.8, 4.2, skin);
  limb(ctx, elbow[0], elbow[1], wrist[0], wrist[1], 4.2, 3.4, skin);
  // hand
  ctx.save();
  ctx.translate(wrist[0], wrist[1]);
  ctx.rotate(-foreA);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 4, 4.2, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (handOpen) {
    // spread fingers for waving / celebrating
    for (let i = -2; i <= 1; i++) limb(ctx, i * 1.9, 7, i * 2.6, 12.5, 1.15, 1.0, skin);
    limb(ctx, 3.4, 4, 6.2, 7.5, 1.2, 1.0, skin);
  }
  ctx.restore();
  return { wrist };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Long wavy hair behind the body. `swing` pushes the tips (−1..1). */
function drawBackHair(ctx, hx, hy, swing, lift) {
  const s = swing * 6;
  const l = lift * 10;
  ctx.fillStyle = CH.hair;
  ctx.beginPath();
  ctx.moveTo(hx - 3, hy - 21);
  ctx.bezierCurveTo(hx - 24, hy - 22, hx - 26, hy - 2, hx - 23, hy + 14);
  ctx.bezierCurveTo(hx - 26 - s, hy + 32 - l, hx - 29 - s, hy + 46 - l, hx - 22 - s * 1.4, hy + 62 - l);
  // wavy tips
  ctx.quadraticCurveTo(hx - 18 - s * 1.5, hy + 70 - l, hx - 13 - s * 1.5, hy + 63 - l);
  ctx.quadraticCurveTo(hx - 9 - s * 1.5, hy + 71 - l, hx - 4 - s * 1.4, hy + 64 - l);
  ctx.quadraticCurveTo(hx + 1 - s * 1.2, hy + 70 - l, hx + 5 - s, hy + 60 - l);
  ctx.bezierCurveTo(hx + 8 - s * 0.6, hy + 44 - l, hx + 6, hy + 30, hx + 8, hy + 18);
  ctx.bezierCurveTo(hx + 14, hy + 6, hx + 22, hy - 4, hx + 18, hy - 14);
  ctx.bezierCurveTo(hx + 14, hy - 22, hx + 5, hy - 23, hx - 3, hy - 21);
  ctx.fill();
  // soft strand highlights
  ctx.strokeStyle = CH.hairHi;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(hx - 18, hy - 2);
  ctx.bezierCurveTo(hx - 22, hy + 18, hx - 20 - s, hy + 34 - l, hx - 16 - s * 1.3, hy + 55 - l);
  ctx.moveTo(hx - 10, hy + 6);
  ctx.bezierCurveTo(hx - 12, hy + 26, hx - 8 - s, hy + 40 - l, hx - 8 - s * 1.3, hy + 58 - l);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawHead(ctx, p) {
  const { headX: hx, headY: hy } = p;
  const R = RIG.headR;
  // neck
  limb(ctx, hx - 3, hy + 12, hx - 4, hy + 26, 4.4, 4.8, CH.skinShade);
  // ear (back side of the 3/4 view)
  ctx.fillStyle = CH.skinShade;
  ctx.beginPath();
  ctx.ellipse(hx - 9, hy + 2, 3.6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // earring stud
  ctx.fillStyle = CH.metal;
  ctx.beginPath();
  ctx.arc(hx - 9.5, hy + 7.4, 1.3, 0, Math.PI * 2);
  ctx.fill();
  // face: soft oval with a gentle chin, turned 3/4 toward +x
  ctx.fillStyle = CH.skin;
  ctx.beginPath();
  ctx.moveTo(hx - 12, hy - 12);
  ctx.bezierCurveTo(hx - 6, hy - R - 4, hx + 14, hy - R - 2, hx + 16, hy - 4);
  ctx.bezierCurveTo(hx + 17, hy + 4, hx + 15, hy + 11, hx + 9, hy + 16);
  ctx.bezierCurveTo(hx + 5, hy + 19.5, hx - 1, hy + 19, hx - 6, hy + 14);
  ctx.bezierCurveTo(hx - 11, hy + 9, hx - 13, hy - 2, hx - 12, hy - 12);
  ctx.fill();
  // jaw shade
  ctx.fillStyle = 'rgba(160,90,60,0.18)';
  ctx.beginPath();
  ctx.moveTo(hx - 6, hy + 14);
  ctx.bezierCurveTo(hx - 1, hy + 19, hx + 5, hy + 19.5, hx + 9, hy + 16);
  ctx.bezierCurveTo(hx + 4, hy + 17.5, hx - 1, hy + 17, hx - 6, hy + 14);
  ctx.fill();
  drawFace(ctx, p);
}

function drawFace(ctx, p) {
  const { headX: hx, headY: hy, eyes, mouth, blink, look } = p;
  const lx = (look?.[0] ?? 0) * 1.2;
  const ly = (look?.[1] ?? 0) * 1.2;
  // blush
  ctx.fillStyle = CH.blush;
  ctx.beginPath();
  ctx.ellipse(hx + 12, hy + 7, 3.6, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(hx - 2, hy + 7.5, 3.0, 2.0, 0, 0, Math.PI * 2);
  ctx.fill();

  const eyesAt = [
    [hx + 1.5, hy + 0.5, 3.0], // far eye (smaller in 3/4 view)
    [hx + 10.5, hy + 0.5, 3.4],
  ];
  const closed = blink > 0.5 || eyes === 'closed';
  for (const [ex, ey, r] of eyesAt) {
    if (eyes === 'happy') {
      ctx.strokeStyle = CH.iris;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, ey + 1.6, r * 0.85, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (closed) {
      ctx.strokeStyle = CH.iris;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, ey - 0.6, r * 0.9, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fbf6f0';
      ctx.beginPath();
      ctx.ellipse(ex, ey, r, r * (eyes === 'wide' ? 1.25 : 1.08), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = CH.iris;
      ctx.beginPath();
      ctx.arc(ex + 0.5 + lx, ey + 0.3 + ly, r * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#120b08';
      ctx.beginPath();
      ctx.arc(ex + 0.5 + lx, ey + 0.3 + ly, r * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex + 1.3 + lx, ey - 0.9 + ly, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
      // upper lash line
      ctx.strokeStyle = CH.hair;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(ex, ey + 0.4, r * 1.02, Math.PI * 1.1, Math.PI * 1.95);
      ctx.stroke();
    }
  }
  // brows (raised when thinking/surprised)
  const browLift = eyes === 'up' || eyes === 'wide' ? 1.6 : 0;
  ctx.strokeStyle = CH.hair;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx - 2, hy - 6.5 - browLift);
  ctx.quadraticCurveTo(hx + 1.5, hy - 8.5 - browLift, hx + 4.5, hy - 7.2 - browLift);
  ctx.moveTo(hx + 7.5, hy - 7.4 - browLift * 1.3);
  ctx.quadraticCurveTo(hx + 11, hy - 9 - browLift * 1.3, hx + 14.5, hy - 6.6 - browLift);
  ctx.stroke();

  // glasses: black rectangular frames
  ctx.strokeStyle = CH.glasses;
  ctx.lineWidth = 1.55;
  ctx.lineJoin = 'round';
  roundRect(ctx, hx - 3.4, hy - 4.6, 9.2, 8.6, 2.2);
  ctx.stroke();
  roundRect(ctx, hx + 6.6, hy - 4.8, 10.4, 9, 2.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx + 5.8, hy - 1.6);
  ctx.quadraticCurveTo(hx + 6.2, hy - 2.6, hx + 6.6, hy - 1.6);
  ctx.moveTo(hx - 3.4, hy - 2.6);
  ctx.lineTo(hx - 10, hy - 1);
  ctx.stroke();
  // lens sheen
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(hx + 8.4, hy + 2.2);
  ctx.lineTo(hx + 10.6, hy - 2.6);
  ctx.stroke();

  // nose + small nose ring
  ctx.strokeStyle = CH.skinShade;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx + 12.5, hy + 3);
  ctx.quadraticCurveTo(hx + 15.6, hy + 8.4, hx + 12.6, hy + 9.2);
  ctx.stroke();
  ctx.strokeStyle = CH.metal;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(hx + 13.2, hy + 9.4, 1.25, Math.PI * 0.6, Math.PI * 2.1);
  ctx.stroke();

  // mouth
  const mx = hx + 8.5;
  const my = hy + 13.2;
  ctx.lineCap = 'round';
  switch (mouth) {
    case 'open': // laughing / celebrating
      ctx.fillStyle = CH.lipsDark;
      ctx.beginPath();
      ctx.moveTo(mx - 4.5, my - 0.8);
      ctx.quadraticCurveTo(mx, my - 1.6, mx + 4.5, my - 0.8);
      ctx.quadraticCurveTo(mx + 0.5, my + 6, mx - 4.5, my - 0.8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(mx - 3, my - 0.9, 6, 1.3);
      break;
    case 'o': // surprised / curious
      ctx.fillStyle = CH.lipsDark;
      ctx.beginPath();
      ctx.ellipse(mx, my + 0.5, 1.8, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'neutral': // thinking
      ctx.strokeStyle = CH.lips;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mx - 3, my + 0.6);
      ctx.quadraticCurveTo(mx, my + 0.2, mx + 3, my - 0.4);
      ctx.stroke();
      break;
    default: // smile
      ctx.strokeStyle = CH.lips;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(mx - 4, my - 0.5);
      ctx.quadraticCurveTo(mx, my + 3, mx + 4, my - 0.9);
      ctx.stroke();
  }
}

function drawFrontHair(ctx, hx, hy, swing) {
  const s = swing * 2;
  ctx.fillStyle = CH.hair;
  // crown + curtain fringe
  ctx.beginPath();
  ctx.moveTo(hx - 14, hy + 4);
  ctx.bezierCurveTo(hx - 17, hy - 16, hx - 4, hy - 26, hx + 7, hy - 23);
  ctx.bezierCurveTo(hx + 18, hy - 20, hx + 21, hy - 8, hx + 18.5, hy + 4);
  // right curtain bang sweeping down past the cheek
  ctx.bezierCurveTo(hx + 18, hy - 4, hx + 15, hy - 10, hx + 9, hy - 12);
  ctx.bezierCurveTo(hx + 7, hy - 9, hx + 5, hy - 7, hx + 4, hy - 6);
  ctx.bezierCurveTo(hx + 2, hy - 10, hx - 3, hy - 12, hx - 6, hy - 10);
  ctx.bezierCurveTo(hx - 9, hy - 6, hx - 10, hy - 1, hx - 9, hy + 6);
  ctx.closePath();
  ctx.fill();
  // face-framing lock in front of the near shoulder
  ctx.beginPath();
  ctx.moveTo(hx + 17, hy - 6);
  ctx.bezierCurveTo(hx + 22, hy + 6, hx + 19 + s, hy + 18, hx + 21 + s, hy + 28);
  ctx.quadraticCurveTo(hx + 22 + s, hy + 36, hx + 17 + s, hy + 40);
  ctx.quadraticCurveTo(hx + 19 + s, hy + 30, hx + 15, hy + 20);
  ctx.bezierCurveTo(hx + 14, hy + 10, hx + 16, hy + 2, hx + 14, hy - 4);
  ctx.closePath();
  ctx.fill();
  // shine
  ctx.strokeStyle = CH.hairHi;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hx - 8, hy - 15);
  ctx.quadraticCurveTo(hx + 2, hy - 22, hx + 12, hy - 18);
  ctx.moveTo(hx + 18, hy + 4);
  ctx.quadraticCurveTo(hx + 20, hy + 16, hx + 19 + s, hy + 26);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawTorso(ctx, hip, neck, lean) {
  // midriff (skin) between pants and crop top
  const sx = Math.sin(lean) * 14;
  ctx.fillStyle = CH.skin;
  ctx.beginPath();
  ctx.moveTo(hip[0] - 9, hip[1] - 2);
  ctx.lineTo(hip[0] + 9, hip[1] - 2);
  ctx.quadraticCurveTo(hip[0] + sx * 0.5 + 7, hip[1] - 9, hip[0] + sx + 8.5, hip[1] - 16);
  ctx.lineTo(hip[0] + sx - 8.5, hip[1] - 16);
  ctx.quadraticCurveTo(hip[0] + sx * 0.5 - 7, hip[1] - 9, hip[0] - 9, hip[1] - 2);
  ctx.closePath();
  ctx.fill();
  // waistband
  ctx.save();
  ctx.translate(hip[0], hip[1]);
  ctx.rotate(lean);
  ctx.fillStyle = CH.pants;
  roundRect(ctx, -12.5, -5, 25, 9, 3);
  ctx.fill();
  ctx.fillStyle = CH.pantsShade;
  ctx.fillRect(-12.5, -1.5, 25, 1.4);
  ctx.fillStyle = CH.metal;
  ctx.beginPath();
  ctx.arc(5, -1.2, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // fitted black crop top
  ctx.save();
  ctx.translate(neck[0], neck[1]);
  ctx.rotate(lean);
  ctx.fillStyle = CH.top;
  ctx.beginPath();
  ctx.moveTo(-9, -2);
  ctx.quadraticCurveTo(0, 2, 9, -2);
  ctx.quadraticCurveTo(13, 2, 12.5, 10);
  ctx.quadraticCurveTo(13.5, 22, 11, 30);
  ctx.lineTo(-10.5, 30);
  ctx.quadraticCurveTo(-12.5, 20, -11.5, 9);
  ctx.quadraticCurveTo(-12, 1, -9, -2);
  ctx.fill();
  ctx.fillStyle = CH.topHi;
  ctx.beginPath();
  ctx.ellipse(6, 12, 3.5, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHeadphones(ctx, hx, hy) {
  // resting around the neck, as on the reference sheet
  ctx.strokeStyle = CH.headphones;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.ellipse(hx - 3, hy + 24, 12, 5, 0, Math.PI * 0.05, Math.PI * 0.95);
  ctx.stroke();
  ctx.fillStyle = CH.headphones;
  ctx.beginPath();
  ctx.ellipse(hx + 8, hy + 25, 5.4, 6.2, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CH.headphonesHi;
  ctx.beginPath();
  ctx.ellipse(hx + 9, hy + 24, 2.6, 3.4, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw one pose. `pose` fields (all optional except the angles):
 *  bodyY, lean, headTilt,
 *  hipB, kneeB, hipF, kneeF, footB, footF,
 *  shB, elB, shF, elF, handF, handB,
 *  eyes ('open'|'closed'|'happy'|'up'|'wide'), mouth ('smile'|'open'|'o'|'neutral'),
 *  blink (0..1), hairSwing (−1..1), hairLift (0..1), look [x,y]
 */
export function drawCharacter(ctx, pose) {
  const p = { ...pose };
  const bodyY = p.bodyY || 0;
  const lean = p.lean || 0;
  // pelvis height depends on how bent the legs are, so the feet stay grounded
  const legH = (h, k) => {
    const s = solveLeg([0, 0], h, k);
    return s.ankle[1];
  };
  const stand = p.airborne
    ? RIG.thigh + RIG.shin - 4
    : Math.max(legH(p.hipB, p.kneeB), legH(p.hipF, p.kneeF));
  const hip = [0, -stand - 3 + bodyY];
  const neck = [hip[0] + Math.sin(lean) * RIG.torso, hip[1] - Math.cos(lean) * RIG.torso];
  const tilt = p.headTilt || 0;
  p.headX = neck[0] + Math.sin(lean + tilt) * 20 + 2;
  p.headY = neck[1] - 19;
  const shB = [neck[0] - 7, neck[1] + 4];
  const shF = [neck[0] + 5, neck[1] + 5];

  // soft contact shadow
  ctx.fillStyle = 'rgba(40,25,40,0.18)';
  ctx.beginPath();
  const shadowScale = p.airborne ? 0.6 : 1;
  ctx.ellipse(0, 4, 26 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  drawBackHair(ctx, p.headX, p.headY, p.hairSwing || 0, p.hairLift || 0);
  drawArm(ctx, shB, p.shB, p.elB, true, p.handB);
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
  drawHeadphones(ctx, neck[0] + 2, neck[1] - 19);
  drawArm(ctx, shF, p.shF, p.elF, false, p.handF);
  return { hip, neck, head: [p.headX, p.headY] };
}

/** Render a pose into a 2D context at a given resolution, facing ±1. */
export function renderPose(ctx, pose, { scale = 2, facing = 1 } = {}) {
  ctx.save();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.scale(scale, scale);
  ctx.translate(RIG.originX, RIG.originY);
  if (facing < 0) ctx.scale(-1, 1);
  const out = drawCharacter(ctx, pose);
  ctx.restore();
  return out;
}
