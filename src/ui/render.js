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
        case 'lead':
          return `<p class="lead">${esc(b.text)}</p>`;
        case 'section':
          return `<section class="psec"><h3 class="psec__title">${esc(b.title)}</h3>${blocksHTML(b.blocks, ctx)}</section>`;
        case 'facts':
          return `<dl class="facts">${b.items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
        case 'figure':
          return `<figure class="figure"><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy" /><figcaption>${esc(b.caption)}</figcaption></figure>`;
        case 'expressions':
          return `<ul class="moods">${b.items
            .map((m) => `<li><img src="${esc(m.src)}" alt="" loading="lazy" width="70" height="70" /><span>${esc(m.label)}</span></li>`)
            .join('')}</ul>`;
        case 'projectLink':
          return projectLinkHTML(b.project, b.why, ctx);
        case 'topics':
          return `<div class="topics">${b.items
            .map(
              (t) => `<details class="topic">
                <summary><span class="topic__title">${esc(t.title)}</span><span class="topic__count">${
                  t.seen.length ? `${t.seen.length} in my work` : t.note ? 'this world' : 'pending'
                }</span></summary>
                <div class="topic__body">
                  ${t.seen.map(([pid, why]) => projectLinkHTML(pid, why, ctx)).join('')}
                  ${t.note ? `<p>${esc(t.note)}</p>` : ''}
                  ${!t.seen.length && !t.note ? pendingHTML('Notes on this topic') : ''}
                </div>
              </details>`,
            )
            .join('')}</div>`;
        case 'entries': {
          const items = b.items || [];
          const filled = items.map((e) => `<li class="entry"><strong>${esc(e.title)}</strong>${e.text ? `<p>${esc(e.text)}</p>` : ''}</li>`);
          const empty = items.length ? [] : Array.from({ length: b.slots || 3 }, (_, i) => `<li class="entry entry--pending"><span aria-hidden="true">✎</span> ${esc(b.label)} ${i + 1} · to be added</li>`);
          return `<ul class="entries">${filled.join('')}${empty.join('')}</ul>${items.length ? '' : `<p class="pending-hint">${esc(PENDING_COPY.text)}</p>`}`;
        }
        case 'gallery': {
          const photos = b.photos || [];
          const pend = Math.max(0, (b.slots || 4) - photos.length);
          return `<ul class="gallery${b.polaroid ? ' gallery--polaroid' : ''}">
            ${photos
              .map(
                (ph) => `<li><a href="${esc(ph.src)}" target="_blank" rel="noopener"><img src="${esc(ph.src)}" alt="${esc(ph.alt)}" loading="lazy" /></a>
                  <span class="gallery__cap">${esc(ph.caption || '')}${ph.date ? ` · ${esc(ph.date)}` : ''}</span></li>`,
              )
              .join('')}
            ${Array.from({ length: pend }, () => `<li class="gallery__pending"><span class="gallery__frame" aria-hidden="true"></span><span class="gallery__cap">Photo pending</span></li>`).join('')}
          </ul>${photos.length ? '' : `<p class="pending-hint">${esc(PENDING_COPY.text)}</p>`}`;
        }
        case 'timeline': {
          const items = b.items || [];
          const rows = items.length
            ? items.map((m) => `<li><span class="tl__date">${esc(m.date)}</span><strong>${esc(m.title)}</strong>${m.text ? `<p>${esc(m.text)}</p>` : ''}</li>`)
            : Array.from({ length: b.slots || 3 }, () => `<li class="tl--pending"><span class="tl__date">—</span><strong>Milestone to be added</strong></li>`);
          return `<ol class="timeline">${rows.join('')}</ol>${items.length ? '' : `<p class="pending-hint">${esc(PENDING_COPY.text)}</p>`}`;
        }
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

/** True when a panel has no real content yet (the character "thinks" instead of reaching). */
export function isPendingPanel(id) {
  const panel = PANELS[id];
  if (!panel || panel.project) return false;
  if (panel.pending) return true;
  const empty = (b) =>
    b.type === 'pendingText' ||
    (b.type === 'entries' && !(b.items || []).length) ||
    (b.type === 'gallery' && !(b.photos || []).length) ||
    (b.type === 'timeline' && !(b.items || []).length);
  const real = panel.blocks.filter((b) => b.type !== 'note' && b.type !== 'p');
  return real.length > 0 && real.every(empty);
}

/** A link to one project: a button inside the world, an in-page jump in list view. */
function projectLinkHTML(pid, why, ctx) {
  const p = PROJECT_BY_ID[pid];
  if (!p) return '';
  const inner = `<span class="plink__title">${esc(p.title)} →</span>${why ? `<span class="plink__why">${esc(why)}</span>` : ''}`;
  return ctx.projectLinks
    ? `<button type="button" class="plink" data-project="${esc(pid)}">${inner}</button>`
    : `<a class="plink" href="#list" data-scroll="project-${esc(pid)}">${inner}</a>`;
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
