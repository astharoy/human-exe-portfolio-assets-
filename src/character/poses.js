/**
 * Animation clips for the rig. Each clip maps time → joint pose.
 * `t` = seconds since the clip started, `g` = global clock (for blinking
 * and breathing that should not restart between clips).
 */

const base = {
  bodyY: 0, lean: 0, headTilt: 0,
  hipB: -0.04, kneeB: 0, hipF: 0.04, kneeF: 0, footB: 0, footF: 0,
  shB: -0.1, elB: 0.12, shF: 0.08, elF: 0.12,
  eyes: 'open', mouth: 'smile', blink: 0, hairSwing: 0, hairLift: 0, look: [0, 0],
};

const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));

/** Natural blink: ~120 ms closed every 3.2 s, with a double-blink now and then. */
export function blinkAt(g) {
  const c = g % 3.2;
  if (c < 0.12) return 1;
  if (Math.floor(g / 3.2) % 4 === 2 && c > 0.26 && c < 0.36) return 1;
  return 0;
}

export const CLIPS = {
  idle(t, g) {
    const br = Math.sin(g * 2.1);
    return {
      ...base,
      bodyY: br * 0.8,
      shB: -0.1 - br * 0.025,
      shF: 0.08 + br * 0.025,
      headTilt: Math.sin(g * 0.7) * 0.03,
      hairSwing: Math.sin(g * 1.3) * 0.12,
      look: [Math.sin(g * 0.5) > 0.85 ? 0.6 : 0, 0],
      blink: blinkAt(g),
    };
  },

  walk(t, g, { speed = 1 } = {}) {
    const ph = t * 9.5 * speed;
    const s = Math.sin(ph);
    const c = Math.cos(ph);
    // legs swing in opposition; the knee folds while that leg swings forward
    const kneeF = Math.max(0, -c) * 0.75 + 0.05;
    const kneeB = Math.max(0, c) * 0.75 + 0.05;
    return {
      ...base,
      bodyY: -Math.abs(s) * 2.2 + 1,
      lean: 0.06,
      hipF: s * 0.48,
      hipB: -s * 0.48,
      kneeF,
      kneeB,
      footF: s > 0 ? -0.15 : kneeF * 0.5,
      footB: s < 0 ? -0.15 : kneeB * 0.5,
      shF: -s * 0.45,
      elF: 0.35,
      shB: s * 0.45,
      elB: 0.35,
      hairSwing: -0.6 + Math.sin(ph * 2) * 0.12,
      blink: blinkAt(g),
    };
  },

  /** vy < 0 rising, > 0 falling (world units/s). */
  jump(t, g, { vy = 0 } = {}) {
    const rise = vy < 0;
    const k = ease(Math.min(1, Math.abs(vy) / 500));
    return {
      ...base,
      airborne: true,
      lean: 0.05,
      hipF: rise ? 0.75 : 0.35,
      kneeF: rise ? 1.25 : 0.55,
      hipB: rise ? -0.15 : -0.05,
      kneeB: rise ? 0.5 : 0.25,
      footF: rise ? 0.25 : 0.1,
      shF: rise ? 2.5 - (1 - k) * 0.6 : 1.4,
      elF: 0.25,
      shB: rise ? -2.3 + (1 - k) * 0.6 : -1.0,
      elB: -0.2,
      handF: rise,
      eyes: rise ? 'wide' : 'open',
      mouth: rise ? 'o' : 'smile',
      hairLift: rise ? 0.2 : 0.9,
      hairSwing: rise ? 0.2 : -0.3,
    };
  },

  /** Short squash on landing (0.16 s). */
  land(t, g) {
    const k = Math.sin(Math.min(1, t / 0.16) * Math.PI);
    return {
      ...base,
      hipF: 0.04 + k * 0.5,
      kneeF: k * 1.0,
      hipB: -0.04 + k * 0.5,
      kneeB: k * 1.0,
      lean: k * 0.12,
      shF: 0.3 * k,
      shB: -0.4 * k,
      hairLift: 0.6 * (1 - k),
      blink: blinkAt(g),
    };
  },

  wave(t, g) {
    const up = ease(t / 0.25);
    const w = Math.sin(t * 11) * 0.38;
    return {
      ...base,
      bodyY: Math.sin(g * 2.1) * 0.8,
      shF: 0.08 + up * 2.45,
      elF: 0.12 + up * (0.25 + w),
      handF: up > 0.6,
      headTilt: -0.06 * up,
      eyes: 'happy',
      mouth: 'open',
      hairSwing: Math.sin(g * 1.3) * 0.12,
    };
  },

  think(t, g) {
    const k = ease(t / 0.35);
    const tap = t > 0.6 ? Math.max(0, Math.sin(t * 6)) * 0.05 : 0;
    return {
      ...base,
      bodyY: Math.sin(g * 1.6) * 0.6,
      shF: 0.08 + k * 0.22,
      elF: 0.12 + k * 2.83 + tap,
      shB: -0.1 + k * 0.2,
      elB: 0.12 + k * 1.5,
      headTilt: -0.12 * k,
      eyes: k > 0.5 ? 'up' : 'open',
      look: [0.4 * k, -1 * k],
      mouth: 'neutral',
      blink: blinkAt(g),
    };
  },

  interact(t, g) {
    // reach forward, hold, then return
    const k = t < 0.5 ? ease(t / 0.22) : 1 - ease((t - 0.5) / 0.25);
    return {
      ...base,
      lean: 0.1 * k,
      shF: 0.08 + k * 1.45,
      elF: 0.12 - k * 0.1,
      handF: k > 0.7,
      hipF: 0.04 + k * 0.12,
      look: [1 * k, 0],
      eyes: k > 0.5 ? 'wide' : 'open',
      mouth: k > 0.5 ? 'o' : 'smile',
      blink: blinkAt(g),
    };
  },

  celebrate(t, g) {
    const hop = Math.abs(Math.sin(t * 7));
    const up = ease(t / 0.2);
    return {
      ...base,
      bodyY: -hop * 10,
      hipF: hop * 0.35,
      kneeF: hop * 0.7,
      hipB: -hop * 0.1 + 0.2 * hop,
      kneeB: hop * 0.6,
      shF: 0.08 + up * 2.75 + Math.sin(t * 14) * 0.12,
      elF: 0.1,
      shB: -0.1 - up * 2.75 - Math.sin(t * 14) * 0.12,
      elB: -0.1,
      handF: true,
      handB: true,
      eyes: 'happy',
      mouth: 'open',
      hairLift: hop * 0.5,
      hairSwing: Math.sin(t * 7) * 0.3,
    };
  },

  /** Seated on a chair or bench (seat height ≈ SEAT_HEIGHT above the floor). */
  sit(t, g) {
    const k = ease(t / 0.3);
    const br = Math.sin(g * 1.8);
    return {
      ...base,
      seated: k > 0.5,
      bodyY: br * 0.5,
      lean: -0.04 * k,
      hipF: 0.04 + k * 1.46,
      kneeF: k * 1.5,
      hipB: -0.04 + k * 1.5,
      kneeB: k * 1.46,
      footF: -0.05 * k,
      footB: -0.05 * k,
      shF: 0.08 + k * 0.62,
      elF: 0.12 + k * 0.1,
      shB: -0.1 + k * 0.7,
      elB: 0.12 + k * 0.1,
      headTilt: Math.sin(g * 0.6) * 0.03,
      look: [Math.sin(g * 0.4) > 0.7 ? 0.8 : 0, 0],
      blink: blinkAt(g),
      hairSwing: Math.sin(g * 1.1) * 0.1,
    };
  },

  /** Seated, typing at a laptop. */
  work(t, g) {
    const seat = CLIPS.sit(Math.max(t, 0.3), g);
    const k = ease(t / 0.4);
    const tp = Math.sin(t * 17);
    return {
      ...seat,
      lean: 0.06 * k,
      shF: 0.7 + k * 0.4,
      elF: 0.22 + k * 0.38 + tp * 0.06 * k,
      shB: 0.6 + k * 0.5,
      elB: 0.22 + k * 0.36 - tp * 0.06 * k,
      handF: k > 0.5 ? 'type' : 'rest',
      handB: k > 0.5 ? 'type' : 'rest',
      headTilt: 0.1 * k + Math.sin(t * 2.2) * 0.015,
      eyes: k > 0.5 ? 'focus' : 'open',
      look: [0.6, 0.6],
      mouth: 'neutral',
      blink: blinkAt(g + 1.1),
    };
  },

  laugh(t, g) {
    const k = ease(t / 0.18);
    const sh = Math.sin(t * 15);
    return {
      ...base,
      bodyY: -Math.abs(sh) * 1.8 * k,
      lean: (-0.07 + sh * 0.02) * k,
      headTilt: (-0.14 + sh * 0.04) * k,
      shF: 0.08 - k * 0.38,
      elF: 0.12 + k * 1.45,
      shB: -0.1 - k * 0.15,
      elB: 0.12 + k * 1.2,
      eyes: 'happy',
      mouth: 'laugh',
      hairSwing: sh * 0.25 * k,
      hairLift: Math.abs(sh) * 0.2 * k,
    };
  },
};

/** Seat surface height above the floor that the sit/work clips are drawn for. */
export const SEAT_HEIGHT = 40;

/** Duration of one-shot clips; null = loops until changed. */
export const CLIP_LENGTH = {
  idle: null,
  walk: null,
  jump: null,
  land: 0.16,
  wave: 1.6,
  think: null,
  interact: 0.8,
  celebrate: 1.8,
  sit: null,
  work: null,
  laugh: 1.5,
};
