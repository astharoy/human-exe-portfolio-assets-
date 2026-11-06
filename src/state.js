/**
 * Small shared state + event bus between the Phaser world and the DOM UI.
 * Persistence is a per-visitor convenience only (try/catch everywhere).
 */
const KEY = 'digital-me:v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

const saved = load();
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export const state = {
  discovered: new Set(saved.discovered || []),
  visitedRooms: new Set(saved.visitedRooms || []),
  reducedMotion: saved.reducedMotion ?? (mq ? mq.matches : false),
  uiOpen: false,
  room: null,
};

export function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        discovered: [...state.discovered],
        visitedRooms: [...state.visitedRooms],
        reducedMotion: state.reducedMotion,
      }),
    );
  } catch {
    /* storage unavailable: fine */
  }
}

const listeners = {};
export const bus = {
  on(ev, fn) {
    (listeners[ev] ||= new Set()).add(fn);
    return () => listeners[ev].delete(fn);
  },
  emit(ev, data) {
    listeners[ev]?.forEach((fn) => fn(data));
  },
};

/** Shared input flags, written by keyboard (Phaser) and touch buttons (DOM). */
export const touchInput = { left: false, right: false, jump: false, action: false };
