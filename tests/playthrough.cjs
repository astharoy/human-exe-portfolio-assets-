/**
 * End-to-end playthrough of DIGITAL ME.
 * Usage: start the site (npm run dev, or npm run build && npm run preview), then
 *   node tests/playthrough.cjs <screenshot-dir> <url>
 * Requires Playwright with Chromium available to Node (not a project dependency).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2] || 'test-results';
fs.mkdirSync(OUT, { recursive: true });
const URL = process.argv[3] || 'http://localhost:5173/';
const log = [];
const check = (name, ok, extra = '') => log.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('requestfailed', (r) => { const f = r.failure()?.errorText; if (!(f === 'net::ERR_ABORTED' && r.url().endsWith('.mp4'))) errs.push('requestfailed: ' + r.url() + ' ' + f); });
  await p.goto(URL);
  await p.waitForTimeout(1000);
  await p.click('#start-btn');
  await p.waitForTimeout(800);
  const px = () => p.evaluate(() => window.__digitalMe.game.scene.getScene('world').player.x);
  const room = () => p.evaluate(() => window.__digitalMe.state.room);
  const hold = async (key, ms) => { await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); await p.waitForTimeout(150); };
  const walkTo = (x) => p.evaluate((tx) => new Promise((res) => {
    const pl = window.__digitalMe.game.scene.getScene('world').player;
    if (Math.abs(pl.x - tx) < 10) return res();
    pl.walkTo(tx, res);
    setTimeout(res, 12000);
  }), x).then(() => p.waitForTimeout(150));
  const openAt = async (x, shot) => {
    await walkTo(x);
    await p.keyboard.press('e');
    await p.waitForTimeout(900);
    const title = await p.evaluate(() => !document.getElementById('panel').hidden && document.getElementById('panel-title').textContent);
    if (shot) await p.screenshot({ path: `${OUT}/${shot}.png` });
    await p.keyboard.press('Escape');
    await p.waitForTimeout(450);
    return title;
  };

  const x0 = await px();
  await hold('ArrowRight', 500);
  check('walks right', (await px()) > x0 + 60, `${x0.toFixed(0)} -> ${(await px()).toFixed(0)}`);
  await p.keyboard.press('Space');
  await p.waitForTimeout(250);
  await p.screenshot({ path: `${OUT}/a-jump.png` });
  await p.waitForTimeout(700);

  check('mirror opens About me', (await openAt(300, 'b-mirror')) === 'Hi, I’m Aastha');
  check('photos open (pending)', (await openAt(1060)) === 'Photographs');
  check('bookshelf opens', (await openAt(1460)) === 'Bookshelf');

  // door to studio
  await walkTo(1880);
  await p.keyboard.press('e');
  await p.waitForTimeout(1300);
  check('door → studio', (await room()) === 'studio');
  await p.screenshot({ path: `${OUT}/c-studio.png` });

  check('desk opens skills', (await openAt(450)) === 'Skills and tools');
  // laptop → project index → project detail with video
  await walkTo(650);
  await p.keyboard.press('e');
  await p.waitForTimeout(900);
  const cards = await p.$$eval('.project-card', (els) => els.map((e) => e.querySelector('.project-card__title').textContent));
  check('laptop lists 4 projects', cards.length === 4, cards.join(', '));
  await p.screenshot({ path: `${OUT}/d-laptop.png` });
  await p.click('[data-project="lostinn"]');
  await p.waitForTimeout(500);
  const vid = await p.$eval('.panel__body video', (v) => v.getAttribute('src'));
  check('Lost Inn shows video', vid === '/evidence/lostinn-cms-walkthrough.mp4');
  const playable = await p.evaluate(async () => {
    const v = document.querySelector('.panel__body video');
    v.muted = true;
    try { await v.play(); await new Promise((r) => setTimeout(r, 800)); return v.currentTime > 0; } catch (e) { return 'err ' + e.message; }
  });
  check('Lost Inn video plays', playable === true, String(playable));
  await p.screenshot({ path: `${OUT}/e-lostinn.png` });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(450);

  for (const [x, t] of [[1176, 'The Lost Inn'], [1406, 'ResolveAI'], [1636, 'ReviewSetu'], [1866, 'Dispute SLA Analytics']]) {
    check(`screen opens ${t}`, (await openAt(x, t === 'ResolveAI' ? 'f-resolve' : t === 'Dispute SLA Analytics' ? 'g-sla' : null)) === t);
  }
  check('notebook opens', (await openAt(2130)) === 'Notebook');

  // map travel
  await p.keyboard.press('m');
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/h-map.png` });
  await p.click('[data-room="dream"]');
  await p.waitForTimeout(1300);
  check('map → dream', (await room()) === 'dream');
  await p.screenshot({ path: `${OUT}/i-dream.png` });
  // climb clouds to the moon: jump, steer right until above the next cloud, release
  const px2 = () => p.evaluate(() => window.__digitalMe.game.scene.getScene('world').player.x);
  await walkTo(730);
  for (const landX of [830, 1070, 1300]) {
    await p.keyboard.down('Space');
    await p.keyboard.down('ArrowRight');
    for (let i = 0; i < 60 && (await px2()) < landX; i++) await p.waitForTimeout(20);
    await p.keyboard.up('ArrowRight');
    await p.keyboard.up('Space');
    await p.waitForTimeout(700);
  }
  const py = await p.evaluate(() => window.__digitalMe.game.scene.getScene('world').player.y);
  check('stands on high cloud', py < 400, `y=${py.toFixed(0)}`);
  await p.screenshot({ path: `${OUT}/j-cloud.png` });
  await p.keyboard.press('e');
  await p.waitForTimeout(900);
  check('moon opens from cloud', await p.evaluate(() => document.getElementById('panel-title').textContent) === 'The moon');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);

  for (const r of ['curiosity', 'memory']) {
    await p.keyboard.press('m');
    await p.waitForTimeout(300);
    await p.click(`[data-room="${r}"]`);
    await p.waitForTimeout(1300);
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/k-${r}.png` });
    check(`map → ${r}`, (await room()) === r);
  }
  // list view
  await p.click('a[href="#list"].hud-btn');
  await p.waitForTimeout(500);
  const lv = await p.evaluate(() => ({ rooms: document.querySelectorAll('.lv-room').length, videos: document.querySelectorAll('.list-view video').length, imgs: document.querySelectorAll('.list-view .evidence img').length }));
  check('list view renders', lv.rooms === 5 && lv.videos === 2 && lv.imgs === 1, JSON.stringify(lv));
  await p.screenshot({ path: `${OUT}/l-list.png`, fullPage: true });

  check('no console errors', errs.length === 0, JSON.stringify(errs));
  console.log(log.join('\n'));
  await b.close();
  if (log.some((l) => l.startsWith('FAIL'))) process.exit(1);
})();
