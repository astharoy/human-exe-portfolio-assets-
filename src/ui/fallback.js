import { ROOMS } from '../world/rooms.js';
import { PANELS, PROJECTS } from '../content/content.js';
import { blocksHTML, pendingHTML, statusBadge, esc } from './render.js';

/**
 * Accessible list view (#list): every piece of content from the world as a
 * plain, keyboard- and screen-reader-friendly page. Also the no-game path
 * for visitors who would rather not play.
 */
export function renderFallback(root) {
  const projectHTML = PROJECTS.map(
    (p) => `<article class="lv-project" id="project-${esc(p.id)}">
      <header><p class="lv-kicker">${esc(p.kicker)}</p><h3>${esc(p.title)}</h3>${statusBadge(p.status)}</header>
      ${blocksHTML(p.blocks.filter((b) => b.type !== 'status'))}
    </article>`,
  ).join('');

  const rooms = ROOMS.map((room) => {
    const items = room.objects
      .filter((o) => o.panel)
      .map((o) => {
        const panel = PANELS[o.panel];
        if (panel.project) return ''; // projects are listed once, below
        let inner;
        if (panel.pending) inner = pendingHTML();
        else if (panel.blocks.some((b) => b.type === 'projects')) inner = projectHTML;
        else inner = blocksHTML(panel.blocks);
        return `<section class="lv-item"><p class="lv-kicker">${esc(panel.kicker)}</p><h3>${esc(panel.title)}</h3>${inner}</section>`;
      })
      .join('');
    return `<section class="lv-room" aria-labelledby="room-${room.id}">
      <h2 id="room-${room.id}"><span>${esc(room.num)}</span> ${esc(room.name)}</h2>
      <p class="lv-purpose">${esc(room.purpose)}</p>
      ${items}
    </section>`;
  }).join('');

  root.innerHTML = `
    <header class="lv-header">
      <p class="lv-brand">DIGITAL ME</p>
      <h1>Aastha’s world, as a list</h1>
      <p>Everything from the interactive world in one readable page.</p>
      <a class="btn" href="#">← Back to the interactive world</a>
    </header>
    ${rooms}`;
  // project links inside topics jump to the project card on this page
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-scroll]');
    if (!a) return;
    e.preventDefault();
    const el = document.getElementById(a.dataset.scroll);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.setAttribute('tabindex', '-1');
    el?.focus({ preventScroll: true });
  });
}
