import { PROJECTS, PANELS, PENDING_COPY } from '../content/content.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const PROJECT_BY_ID = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));

export function pendingHTML(label) {
  return `<div class="pending" role="note">
    <span class="pending__icon" aria-hidden="true">✎</span>
    <div><strong>${esc(label || PENDING_COPY.title)}</strong><p>${esc(PENDING_COPY.text)}</p></div>
  </div>`;
}

export function statusBadge(status) {
  return `<span class="badge badge--${esc(status.tone)}">${esc(status.text)}</span>`;
}

/** Render content blocks to HTML. `ctx.projectLinks` makes project cards buttons. */
export function blocksHTML(blocks, ctx = {}) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'p':
          return `<p>${esc(b.text)}</p>`;
        case 'tags':
          return `<ul class="tags">${b.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
        case 'list':
          return `<ul class="list">${b.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
        case 'stat':
          return `<div class="stat"><span class="stat__value">${esc(b.value)}</span><span class="stat__label">${esc(b.label)}</span></div>`;
        case 'status':
          return `<p class="status-line">${statusBadge(b)}</p>`;
        case 'note':
          return `<p class="note">${esc(b.text)}</p>`;
        case 'video':
          return `<figure class="evidence">
            <video controls preload="none" playsinline poster="${esc(b.poster)}" src="${esc(b.src)}">
              <a href="${esc(b.src)}">Download the video</a>
            </video>
            <figcaption>${esc(b.caption)}</figcaption>
          </figure>`;
        case 'image':
          return `<figure class="evidence">
            <a class="evidence__zoom" href="${esc(b.src)}" target="_blank" rel="noopener">
              <img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy" />
              <span class="evidence__hint">Open full size ↗</span>
            </a>
            <figcaption>${esc(b.caption)}</figcaption>
          </figure>`;
        case 'pendingText':
          return pendingHTML(b.label);
        case 'projects':
          return `<div class="projects">${PROJECTS.map(
            (p) => `
            ${ctx.projectLinks ? `<button type="button" class="project-card" data-project="${esc(p.id)}">` : `<a class="project-card" href="#project-${esc(p.id)}">`}
              <span class="project-card__kicker">${esc(p.kicker)}</span>
              <span class="project-card__title">${esc(p.title)}</span>
              ${statusBadge(p.status)}
            ${ctx.projectLinks ? '</button>' : '</a>'}`,
          ).join('')}</div>`;
        default:
          return '';
      }
    })
    .join('');
}

/** Resolve a panel id to { title, kicker, html, portrait }. */
export function resolvePanel(id, ctx = {}) {
  const panel = PANELS[id];
  if (!panel) return { title: 'Not found', kicker: '', html: pendingHTML() };
  if (panel.project) return resolveProject(panel.project);
  return {
    title: panel.title,
    kicker: panel.kicker,
    portrait: panel.portrait,
    html: panel.pending ? pendingHTML() : blocksHTML(panel.blocks, ctx),
  };
}

export function resolveProject(pid) {
  const p = PROJECT_BY_ID[pid];
  return { title: p.title, kicker: p.kicker, html: blocksHTML(p.blocks), project: pid };
}
