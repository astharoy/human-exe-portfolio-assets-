import { gsap } from 'gsap';
import { state, persist, bus, touchInput } from '../state.js';
import { ROOMS, DISCOVERABLES } from '../world/rooms.js';
import { esc } from './render.js';

const $ = (s) => document.querySelector(s);

export function initHud() {
  const dur = (d) => (state.reducedMotion ? 0 : d);
  const roomChip = $('#room-chip');
  const counter = $('#counter');
  const prompt = $('#prompt');
  const bubble = $('#bubble');
  const titleCard = $('#title-card');
  const isTouch = () => document.body.classList.contains('touch');

  /* ---------- discovery counter ---------- */
  const updateCounter = () => {
    counter.textContent = `${state.discovered.size} / ${DISCOVERABLES.length}`;
    counter.parentElement.setAttribute('aria-label', `${state.discovered.size} of ${DISCOVERABLES.length} things discovered`);
  };
  updateCounter();
  bus.on('open-panel', ({ isNew }) => {
    updateCounter();
    if (isNew) gsap.fromTo(counter.parentElement, { scale: 1.18 }, { scale: 1, duration: dur(0.4), ease: 'back.out(3)' });
  });

  /* ---------- room transition curtain ---------- */
  const curtain = $('#curtain');
  bus.on('leaving', ({ room }) => {
    curtain.querySelector('.curtain__label').innerHTML = `<span class="curtain__num">${esc(room.num)}</span><span class="curtain__name">${esc(room.name)}</span>`;
    gsap.killTweensOf(curtain);
    gsap.fromTo(curtain, { opacity: 0 }, { opacity: 1, duration: dur(0.32), ease: 'power2.in' });
    gsap.fromTo(curtain.querySelector('.curtain__label'), { y: 14, scale: 0.96 }, { y: 0, scale: 1, duration: dur(0.4), ease: 'back.out(2)' });
  });

  /* ---------- room arrival ---------- */
  bus.on('room', ({ room, arrivedBy }) => {
    if (Number(getComputedStyle(curtain).opacity) > 0) gsap.to(curtain, { opacity: 0, duration: dur(0.45), delay: 0.12, ease: 'power2.out' });
    roomChip.innerHTML = `<span class="chip__num">${esc(room.num)}</span> ${esc(room.name)}`;
    document.title = `${room.name} · DIGITAL ME`;
    titleCard.innerHTML = `<span class="title-card__num">${esc(room.num)}</span><span class="title-card__name">${esc(room.name)}</span><span class="title-card__purpose">${esc(room.purpose)}</span>`;
    gsap.killTweensOf(titleCard);
    gsap.timeline()
      .fromTo(titleCard, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: dur(0.5), ease: 'power2.out' })
      .to(titleCard, { opacity: 0, y: -8, duration: dur(0.5), delay: state.reducedMotion ? 1.6 : 1.4 });
    renderMap();
  });

  /* ---------- interaction prompt + speech bubble follow the world ---------- */
  let promptId = null;
  let sayTimer = null;
  bus.on('frame', ({ head, prompt: p }) => {
    if (p) {
      if (p.id !== promptId) {
        promptId = p.id;
        prompt.innerHTML = `<kbd>${isTouch() ? 'Tap ✦' : 'E'}</kbd><span>${esc(p.label)}</span>`;
        prompt.hidden = false;
      }
      prompt.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) translate(-50%, -100%)`;
      // step aside while she's speaking so the two labels never overlap
      prompt.style.opacity = bubble.hidden ? '1' : '0';
    } else if (promptId) {
      promptId = null;
      prompt.hidden = true;
    }
    if (!bubble.hidden) bubble.style.transform = `translate(${Math.round(head.x)}px, ${Math.round(head.y)}px) translate(-50%, -100%)`;
  });
  bus.on('prompt-clear', () => {
    promptId = null;
    prompt.hidden = true;
    bubble.hidden = true;
  });
  bus.on('say', ({ text, ms = 3000 }) => {
    bubble.textContent = text;
    bubble.hidden = false;
    gsap.fromTo(bubble, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: dur(0.25), ease: 'back.out(2)' });
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => {
      gsap.to(bubble, { opacity: 0, duration: dur(0.25), onComplete: () => (bubble.hidden = true) });
    }, ms);
  });
  // tapping the prompt acts like pressing E
  prompt.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    touchInput.action = true;
    setTimeout(() => (touchInput.action = false), 80);
  });

  /* ---------- map ---------- */
  const map = $('#map');
  const mapList = $('#map-list');
  function renderMap() {
    mapList.innerHTML = ROOMS.map(
      (r) => `<li><button type="button" class="map-room${r.id === state.room ? ' is-here' : ''}" data-room="${esc(r.id)}" ${r.id === state.room ? 'aria-current="true"' : ''}>
        <span class="map-room__num">${esc(r.num)}</span>
        <span class="map-room__text"><strong>${esc(r.name)}</strong><small>${esc(r.purpose)}</small></span>
        <span class="map-room__state">${r.id === state.room ? 'You are here' : state.visitedRooms.has(r.id) ? 'Visited' : 'Unexplored'}</span>
      </button></li>`,
    ).join('');
  }
  let mapReturn = null;
  const openMap = () => {
    renderMap();
    mapReturn = document.activeElement;
    map.hidden = false;
    state.uiOpen = true;
    gsap.fromTo(map.querySelector('.map__card'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.3), ease: 'power2.out' });
    map.querySelector('.map-room')?.focus();
  };
  const closeMap = () => {
    map.hidden = true;
    state.uiOpen = false;
    mapReturn?.focus?.();
  };
  $('#map-btn').addEventListener('click', openMap);
  map.querySelector('.map__close').addEventListener('click', closeMap);
  map.addEventListener('pointerdown', (e) => e.target === map && closeMap());
  map.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMap();
    e.stopPropagation();
  });
  mapList.addEventListener('click', (e) => {
    const b = e.target.closest('[data-room]');
    if (!b) return;
    closeMap();
    if (b.dataset.room !== state.room) bus.emit('goto', { roomId: b.dataset.room });
  });
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'm' || e.key === 'M') && !state.uiOpen && !e.target.closest?.('input,textarea')) openMap();
  });

  /* ---------- reduced motion toggle ---------- */
  const motionBtn = $('#motion-btn');
  const syncMotion = () => {
    motionBtn.setAttribute('aria-pressed', String(state.reducedMotion));
    document.documentElement.classList.toggle('reduce-motion', state.reducedMotion);
  };
  syncMotion();
  motionBtn.addEventListener('click', () => {
    state.reducedMotion = !state.reducedMotion;
    persist();
    syncMotion();
    bus.emit('reduced-motion');
  });

  /* ---------- touch controls ---------- */
  const enableTouch = () => document.body.classList.add('touch');
  if (matchMedia('(pointer: coarse)').matches) enableTouch();
  window.addEventListener('touchstart', enableTouch, { once: true, passive: true });
  document.querySelectorAll('[data-touch]').forEach((btn) => {
    const k = btn.dataset.touch;
    const on = (e) => {
      e.preventDefault();
      touchInput[k] = true;
      btn.classList.add('is-down');
      btn.setPointerCapture?.(e.pointerId);
    };
    const off = () => {
      touchInput[k] = false;
      btn.classList.remove('is-down');
    };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('lostpointercapture', off);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  /* ---------- intro overlay ---------- */
  const intro = $('#intro');
  const start = () => {
    gsap.to(intro, {
      opacity: 0,
      duration: dur(0.4),
      onComplete: () => {
        intro.hidden = true;
        state.uiOpen = false;
        bus.emit('start');
      },
    });
  };
  state.uiOpen = true;
  $('#start-btn').addEventListener('click', start);
  $('#start-btn').focus({ preventScroll: true });
}
