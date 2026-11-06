import { gsap } from 'gsap';
import { state, bus } from '../state.js';
import { resolvePanel, resolveProject, esc } from './render.js';

const FOCUSABLE = 'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

/** The information panel: an accessible modal dialog over the world. */
export function initPanel() {
  const root = document.getElementById('panel');
  const card = root.querySelector('.panel__card');
  const body = root.querySelector('.panel__body');
  const title = root.querySelector('#panel-title');
  const kicker = root.querySelector('.panel__kicker');
  const closeBtn = root.querySelector('.panel__close');
  const portrait = root.querySelector('.panel__portrait');
  let current = null;
  let returnFocus = null;

  const dur = (d) => (state.reducedMotion ? 0 : d);

  function fill(view, backTo) {
    title.textContent = view.title;
    kicker.textContent = view.kicker || '';
    if (view.portrait) {
      portrait.hidden = false;
      portrait.querySelector('img').src = view.portrait;
    } else portrait.hidden = true;
    const back = backTo ? `<button type="button" class="panel__back" data-back>← All projects</button>` : '';
    body.innerHTML = back + view.html;
    body.scrollTop = 0;
  }

  function open({ panel }) {
    current = panel;
    returnFocus = document.activeElement;
    fill(resolvePanel(panel, { projectLinks: true }));
    root.hidden = false;
    state.uiOpen = true;
    document.body.classList.add('ui-open');
    gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: dur(0.2) });
    gsap.fromTo(card, { y: 30, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: dur(0.35), ease: 'back.out(1.6)' });
    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    if (root.hidden) return;
    body.querySelectorAll('video').forEach((v) => v.pause());
    const done = () => {
      root.hidden = true;
      body.innerHTML = '';
      state.uiOpen = false;
      document.body.classList.remove('ui-open');
      bus.emit('panel-closed', { panel: current });
      current = null;
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    };
    gsap.to(card, { y: 20, opacity: 0, duration: dur(0.18) });
    gsap.to(root, { opacity: 0, duration: dur(0.2), onComplete: done });
  }

  body.addEventListener('click', (e) => {
    const p = e.target.closest('[data-project]');
    if (p) {
      fill(resolveProject(p.dataset.project), true);
      gsap.fromTo(body, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: dur(0.25) });
      body.querySelector('[data-back]').focus();
      return;
    }
    if (e.target.closest('[data-back]')) {
      body.querySelectorAll('video').forEach((v) => v.pause());
      fill(resolvePanel(current, { projectLinks: true }));
      gsap.fromTo(body, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: dur(0.25) });
      body.querySelector('[data-project]')?.focus();
    }
  });
  closeBtn.addEventListener('click', close);
  root.addEventListener('pointerdown', (e) => {
    if (e.target === root) close();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      const f = [...card.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    e.stopPropagation();
  });
  bus.on('open-panel', open);
  return { open, close };
}

export { esc };
