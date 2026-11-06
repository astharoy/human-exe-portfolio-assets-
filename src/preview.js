import { renderPose, RIG } from './character/rig.js';
import { CLIPS } from './character/poses.js';

const rows = document.getElementById('rows');
const SCALE = 1.2;
const clips = [
  ['idle', {}], ['walk', {}], ['jump', { vy: -500 }], ['jump', { vy: 300 }], ['land', {}],
  ['wave', {}], ['think', {}], ['interact', {}], ['celebrate', {}], ['sit', {}], ['work', {}], ['laugh', {}],
];
const live = [];
for (const [name, opts] of clips) {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `<b>${name}${opts.vy ? (opts.vy < 0 ? ' ↑' : ' ↓') : ''}</b>`;
  for (let i = 0; i < 6; i++) {
    const c = document.createElement('canvas');
    c.width = RIG.width * SCALE; c.height = RIG.height * SCALE;
    const t = name === 'land' ? i * 0.03 : i * 0.13 + 0.05;
    renderPose(c.getContext('2d'), CLIPS[name](t, t + 0.5, opts), { scale: SCALE });
    row.appendChild(c);
  }
  const c = document.createElement('canvas');
  c.id = 'live';
  c.width = RIG.width * SCALE; c.height = RIG.height * SCALE;
  row.appendChild(c);
  live.push([c.getContext('2d'), name, opts]);
  rows.appendChild(row);
}
const t0 = performance.now();
(function loop() {
  const t = (performance.now() - t0) / 1000;
  for (const [ctx, name, opts] of live) renderPose(ctx, CLIPS[name](t % 2, t, opts), { scale: SCALE });
  requestAnimationFrame(loop);
})();
