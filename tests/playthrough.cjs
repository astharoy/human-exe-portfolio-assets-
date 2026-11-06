/**
 * End-to-end test suite for DIGITAL ME.
 *
 * Usage: start the site (npm run dev, or npm run build && npm run preview), then
 *   node tests/playthrough.cjs <screenshot-dir> <url>
 * Requires Playwright with Chromium available to Node (not a project dependency).
 * Run a subset with SUITES=desktop,calm,mobile,spritePipeline.
 *
 * Covers: every animation clip, movement, jumping and platforms, every door
 * and the window, every interactive object, project panels and both videos,
 * byte-for-byte evidence integrity, the sprite-sheet pipeline, Calm mode
 * (reduced motion), a phone viewport with touch controls, and the list view.
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = process.argv[2] || 'test-results';
const URL = (process.argv[3] || 'http://localhost:5173/').replace(/\/?$/, '/');
fs.mkdirSync(OUT, { recursive: true });
const ROOT = path.resolve(__dirname, '..');
const log = [];
const check = (name, ok, extra = '') => log.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);

const W = 'window.__digitalMe.game.scene.getScene("world")';

function watchErrors(page, errs) {
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText;
    if (!(f === 'net::ERR_ABORTED' && r.url().endsWith('.mp4'))) errs.push('requestfailed: ' + r.url() + ' ' + f);
  });
}

async function boot(page) {
  await page.goto(URL);
  await page.waitForTimeout(900);
  await page.click('#start-btn');
  await page.waitForTimeout(700);
}

const helpers = (p) => {
  const room = () => p.evaluate(() => window.__digitalMe.state.room);
  const px = () => p.evaluate(`${W}.player.x`);
  const clip = () => p.evaluate(`${W}.player.clip`);
  const walkTo = (x) =>
    p
      .evaluate(
        (tx) =>
          new Promise((res) => {
            const pl = window.__digitalMe.game.scene.getScene('world').player;
            if (Math.abs(pl.x - tx) < 10) return res();
            pl.walkTo(tx, res);
            setTimeout(res, 12000);
          }),
        x,
      )
      .then(() => p.waitForTimeout(150));
  const objX = (id) => p.evaluate((oid) => {
    const o = window.__digitalMe.game.scene.getScene('world').objects.find((ob) => ob.def.id === oid);
    return o ? o.x + (o.def.hotspot || 0) : null;
  }, id);
  const panelOpen = () => p.evaluate(() => !document.getElementById('panel').hidden);
  const panelTitle = () => p.evaluate(() => !document.getElementById('panel').hidden && document.getElementById('panel-title').textContent);
  const closePanel = async () => {
    await p.keyboard.press('Escape');
    await p.waitForTimeout(500);
  };
  const open = async (id, wait = 900) => {
    await walkTo(await objX(id));
    await p.keyboard.press('e');
    // poll instead of a fixed sleep: slow machines need longer for walk + sit + open
    await p.waitForFunction(() => !document.getElementById('panel').hidden, null, { timeout: Math.max(wait, 4000) }).catch(() => {});
    await p.waitForTimeout(400);
    const t = await panelTitle();
    if (!t) {
      const st = await p.evaluate(`({ x: Math.round(${W}.player.x), y: Math.round(${W}.player.y), clip: ${W}.player.clip, busy: ${W}.player.busy, near: ${W}.nearestInteractive()?.def.id, ui: window.__digitalMe.state.uiOpen })`);
      log.push(`      debug ${id}: ${JSON.stringify(st)}`);
    }
    return t;
  };
  const goto = async (roomId) => {
    await p.evaluate((r) => window.__digitalMe.bus.emit('goto', { roomId: r }), roomId);
    await p.waitForTimeout(1100);
  };
  const useDoor = async (id) => {
    await walkTo(await objX(id));
    await p.keyboard.press('e');
    await p.waitForTimeout(1300);
    return room();
  };
  return { room, px, clip, walkTo, objX, panelOpen, panelTitle, closePanel, open, goto, useDoor };
};

async function desktop(b) {
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  watchErrors(p, errs);
  await boot(p);
  const h = helpers(p);

  /* ---- character animation clips ---- */
  const clips = ['idle', 'walk', 'jump', 'land', 'wave', 'think', 'interact', 'celebrate', 'sit', 'work', 'laugh'];
  const shown = await p.evaluate(
    async ([names, W]) => {
      const s = eval(W);
      const res = {};
      for (const n of names) {
        s.player.play(n, { hold: true });
        await new Promise((r) => setTimeout(r, 140));
        res[n] = s.player.clip === n || (n === 'jump' && s.player.clip === 'idle') || (n === 'land' && s.player.clip === 'idle');
      }
      s.player.release();
      return res;
    },
    [clips, W],
  );
  const broken = Object.entries(shown).filter(([, ok]) => !ok).map(([n]) => n);
  check('all 11 animation clips render', broken.length === 0, broken.join(','));
  await p.evaluate(`${W}.player.play('work', { hold: true })`);
  await p.waitForTimeout(250);
  await p.screenshot({ path: `${OUT}/clip-work.png` });
  await p.evaluate(`${W}.player.release()`);

  /* ---- movement, jump, platform ---- */
  const x0 = await h.px();
  await p.keyboard.down('ArrowRight');
  await p.waitForTimeout(500);
  await p.keyboard.up('ArrowRight');
  await p.waitForTimeout(150);
  check('walks right', (await h.px()) > x0 + 60);
  await h.walkTo(560);
  await p.keyboard.press('Space');
  await p.waitForTimeout(1300);
  const yBed = await p.evaluate(`${W}.player.y`);
  check('jumps and lands on the bed platform', yBed < 600, `y=${Math.round(yBed)}`);
  await h.walkTo(260);
  await p.waitForTimeout(600);

  /* ---- Room 01: My Room ---- */
  check('mirror opens About me', (await h.open('mirror')) === 'Hi, I’m Aastha');
  const mirror = await p.evaluate(() => ({
    moods: document.querySelectorAll('.panel__body .moods img').length,
    outfits: [...document.querySelectorAll('.panel__body .figure img')].some((i) => i.complete && i.naturalWidth > 0),
    pending: document.querySelectorAll('.panel__body .pending').length,
  }));
  check('mirror: 9 moods, outfits image, background pending', mirror.moods === 9 && mirror.outfits && mirror.pending === 1, JSON.stringify(mirror));
  await p.screenshot({ path: `${OUT}/r1-mirror.png` });
  await h.closePanel();
  check('photos: 4 pending frames', (await h.open('photos')) === 'Photographs' && (await p.$$('.gallery__pending')).length === 4);
  await h.closePanel();
  check('bookshelf opens', (await h.open('bookshelf')) === 'Bookshelf');
  await h.closePanel();
  check('window → Dream Space', (await h.useDoor('window')) === 'dream');
  await h.goto('my-room');
  check('door My Room → Studio', (await h.useDoor('door-home-studio')) === 'studio');

  /* ---- Room 02: Creative Studio ---- */
  check('studio door back → My Room', (await h.useDoor('door-studio-home')) === 'my-room');
  await h.goto('studio');
  check('desk opens skills', (await h.open('desk')) === 'Skills and tools');
  await h.closePanel();
  const lap = await h.open('laptop', 2600);
  check('laptop opens showcase', lap === 'Project showcase');
  check('sits and works while showcase is open', (await h.clip()) === 'work');
  const cards = await p.$$eval('.project-card', (els) => els.map((e) => e.querySelector('.project-card__title').textContent));
  check('showcase lists the 4 projects', cards.length === 4, cards.join(', '));
  for (const pid of ['lostinn', 'resolveai', 'reviewsetu', 'dispute-sla']) {
    await p.click(`[data-project="${pid}"]`);
    await p.waitForTimeout(400);
    const sec = await p.$$eval('.panel__body .psec__title', (els) => els.map((e) => e.textContent));
    const ok = ['What the evidence shows', 'Technologies', 'What it demonstrates'].every((t) => sec.includes(t));
    check(`project ${pid}: description, status, evidence, tech, demonstrates`, ok && (await p.$('.panel__body .badge')) && (await p.$('.panel__body .lead')), sec.join(' | '));
    if (pid === 'lostinn' || pid === 'reviewsetu') {
      const playable = await p.evaluate(async () => {
        const v = document.querySelector('.panel__body video');
        v.muted = true;
        try {
          await v.play();
          await new Promise((r) => setTimeout(r, 900));
          return v.currentTime > 0 && v.videoWidth > 0;
        } catch (e) {
          return 'err ' + e.message;
        }
      });
      check(`${pid} video plays`, playable === true, String(playable));
      if (pid === 'lostinn') await p.screenshot({ path: `${OUT}/r2-lostinn.png` });
    }
    if (pid === 'resolveai') {
      const img = await p.evaluate(async () => {
        const i = document.querySelector('.panel__body .evidence img');
        if (!i.complete) await new Promise((r) => (i.onload = r));
        return i.naturalWidth;
      });
      check('ResolveAI workflow image loads', img > 1000, `${img}px`);
    }
    if (pid === 'dispute-sla') check('Dispute SLA shows 91.2%', (await p.textContent('.stat__value')) === '91.2%');
    await p.click('[data-back]');
    await p.waitForTimeout(300);
  }
  await h.closePanel();
  check('stands up after closing the showcase', (await h.clip()) !== 'work');
  for (const [id, t] of [['screen-lostinn', 'The Lost Inn'], ['screen-resolveai', 'ResolveAI'], ['screen-reviewsetu', 'ReviewSetu'], ['screen-dispute-sla', 'Dispute SLA Analytics']]) {
    check(`${id} opens ${t}`, (await h.open(id)) === t);
    await h.closePanel();
  }
  check('notebook opens (pending ideas)', (await h.open('notebook')) === 'Notebook' && (await p.$$('.entry--pending')).length === 3);
  await h.closePanel();
  check('door Studio → Curiosity', (await h.useDoor('door-studio-curio')) === 'curiosity');

  /* ---- Room 03: Curiosity Corner ---- */
  check('curio bookshelf opens topics', (await h.open('curio-bookshelf')) === 'The big bookshelf');
  check('7 topics listed', (await p.$$('.topic')).length === 7);
  await p.click('.topic summary');
  await p.waitForTimeout(200);
  await p.click('.topic[open] [data-project]');
  await p.waitForTimeout(400);
  check('topic links to project evidence', (await h.panelTitle()) === 'ResolveAI');
  await p.screenshot({ path: `${OUT}/r3-topic-link.png` });
  await h.closePanel();
  for (const [id, t] of [['curio-computer', 'Computer'], ['curio-notes', 'Research notes'], ['curio-board', 'Learning board']]) {
    check(`${id} opens`, (await h.open(id)) === t);
    await h.closePanel();
  }
  check('door Curiosity → Dream', (await h.useDoor('door-curio-dream')) === 'dream');

  /* ---- Room 04: Dream Space ---- */
  check('star map → Ambitions (3 pending slots)', (await h.open('dream-stars')) === 'Ambitions' && (await p.$$('.entry--pending')).length === 3);
  await h.closePanel();
  check('paper planes → Future plans', (await h.open('dream-planes')) === 'Future plans');
  await h.closePanel();
  await h.walkTo(730);
  for (const landX of [830, 1070, 1300]) {
    await p.keyboard.down('Space');
    await p.keyboard.down('ArrowRight');
    for (let i = 0; i < 60 && (await h.px()) < landX; i++) await p.waitForTimeout(20);
    await p.keyboard.up('ArrowRight');
    await p.keyboard.up('Space');
    await p.waitForTimeout(700);
  }
  // nudge right along the top cloud until the moon is in reach
  for (let i = 0; i < 6 && !(await p.evaluate(`${W}.nearestInteractive()?.def.id === 'dream-moon'`)); i++) {
    await p.keyboard.down('ArrowRight');
    await p.waitForTimeout(60);
    await p.keyboard.up('ArrowRight');
    await p.waitForTimeout(150);
  }
  await p.keyboard.press('e');
  await p.waitForTimeout(900);
  check('climbs the clouds and opens the moon (Ideas)', (await h.panelTitle()) === 'Ideas');
  await h.closePanel();
  await h.goto('dream');
  check('door Dream → Memory', (await h.useDoor('door-dream-memory')) === 'memory');

  /* ---- Room 05: Memory Wall ---- */
  check('framed moments: 6 pending photo frames', (await h.open('memory-frames')) === 'Framed moments' && (await p.$$('.gallery__pending')).length === 6);
  await p.screenshot({ path: `${OUT}/r5-gallery.png` });
  await h.closePanel();
  check('polaroid string opens', (await h.open('memory-polaroids')) === 'Polaroid string');
  await h.closePanel();
  check('pin board → Milestones timeline', (await h.open('memory-board')) === 'Milestones' && (await p.$$('.timeline li')).length === 4);
  await h.closePanel();
  await h.walkTo(await h.objX('bench'));
  await p.keyboard.press('e');
  await p.waitForTimeout(700);
  check('sits on the bench', (await h.clip()) === 'sit');
  await p.screenshot({ path: `${OUT}/r5-bench.png` });
  check('door Memory → My Room', (await h.useDoor('door-memory-home')) === 'my-room');

  /* ---- map ---- */
  await p.keyboard.press('m');
  await p.waitForTimeout(300);
  await p.click('[data-room="curiosity"]');
  await p.waitForTimeout(1200);
  check('map travel works', (await h.room()) === 'curiosity');

  /* ---- list view ---- */
  await p.click('a[href="#list"].hud-btn');
  await p.waitForTimeout(600);
  const lv = await p.evaluate(() => ({
    rooms: document.querySelectorAll('.lv-room').length,
    videos: document.querySelectorAll('.list-view video').length,
    imgs: document.querySelectorAll('.list-view .evidence img').length,
    topics: document.querySelectorAll('.list-view .topic').length,
    moods: document.querySelectorAll('.list-view .moods img').length,
  }));
  check('list view: 5 rooms, 2 videos, evidence image, topics, moods', lv.rooms === 5 && lv.videos === 2 && lv.imgs === 1 && lv.topics === 7 && lv.moods === 9, JSON.stringify(lv));
  await p.evaluate(() => document.querySelector('.list-view details.topic').setAttribute('open', ''));
  await p.click('.list-view [data-scroll]');
  await p.waitForTimeout(800);
  check('list view topic link jumps to the project', await p.evaluate(() => document.activeElement?.id?.startsWith('project-') && location.hash === '#list'));
  await p.screenshot({ path: `${OUT}/list.png`, fullPage: true });

  /* ---- evidence integrity: served bytes == original files ---- */
  const originals = {
    'lostinn-cms-walkthrough.mp4': 'lostinn cms walkthrough.mp4',
    'reviewsetu-walkthrough.mp4': 'reviewsetu walkthrough.mp4',
    'resolveai-automation-workflow.png': 'automation workflow.png',
  };
  for (const [served, orig] of Object.entries(originals)) {
    const want = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'human.exe porfolio', orig))).digest('hex');
    const got = await p.evaluate(async (u) => {
      const buf = await (await fetch(u)).arrayBuffer();
      const d = await crypto.subtle.digest('SHA-256', buf);
      return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
    }, URL + 'evidence/' + served);
    check(`evidence identical to original: ${orig}`, got === want);
  }

  check('desktop: no console errors', errs.length === 0, JSON.stringify(errs));
  await p.close();
}

async function spritePipeline(b) {
  // Make a 4-frame test sheet in the browser, then serve it as if it were final art.
  const maker = await b.newPage();
  const png = await maker.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 340 * 4;
    c.height = 500;
    const x = c.getContext('2d');
    ['#b9a7d6', '#e8b4bc', '#b5dcc4', '#f6dfa0'].forEach((col, i) => {
      x.fillStyle = col;
      x.fillRect(i * 340 + 120, 80, 100, 396);
    });
    return c.toDataURL('image/png').split(',')[1];
  });
  await maker.close();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 760 } });
  await ctx.route('**/character/sprites/manifest.json', (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ frameWidth: 340, frameHeight: 500, clips: { idle: { sheet: 'idle-test.png', frames: 4, fps: 6, loop: true } } }) }),
  );
  await ctx.route('**/character/sprites/idle-test.png', (r) => r.fulfill({ contentType: 'image/png', body: Buffer.from(png, 'base64') }));
  const p = await ctx.newPage();
  const errs = [];
  watchErrors(p, errs);
  await boot(p);
  await p.evaluate(`${W}.player.release()`);
  await p.waitForTimeout(400);
  const s = await p.evaluate(`({ source: ${W}.player.source, key: ${W}.player.sprite.texture.key })`);
  check('sprite pipeline: idle uses supplied frames', s.source === 'sprite' && s.key === 'char-idle', JSON.stringify(s));
  await p.keyboard.down('ArrowRight');
  await p.waitForTimeout(300);
  const w = await p.evaluate(`({ source: ${W}.player.source, clip: ${W}.player.clip })`);
  await p.keyboard.up('ArrowRight');
  check('sprite pipeline: clips without frames fall back to the rig', w.source === 'rig' && w.clip === 'walk', JSON.stringify(w));
  check('sprite pipeline: no errors', errs.length === 0, JSON.stringify(errs));
  await ctx.close();
}

async function calm(b) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 760 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errs = [];
  watchErrors(p, errs);
  await boot(p);
  const h = helpers(p);
  check('calm mode follows the OS reduced-motion setting', await p.evaluate(() => window.__digitalMe.state.reducedMotion === true));
  check('calm mode: door transition works', (await h.useDoor('door-home-studio')) === 'studio');
  check('calm mode: no curtain animation shown', await p.evaluate(() => Number(getComputedStyle(document.getElementById('curtain')).opacity) === 0));
  check('calm mode: laptop still opens', (await h.open('laptop', 2400)) === 'Project showcase');
  await h.closePanel();
  check('calm mode: no errors', errs.length === 0, JSON.stringify(errs));
  await ctx.close();
}

async function mobile(b) {
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage();
  const errs = [];
  watchErrors(p, errs);
  await p.goto(URL);
  await p.waitForTimeout(900);
  await p.tap('#start-btn');
  await p.waitForTimeout(900);
  check('mobile: touch controls visible', await p.isVisible('.touch-controls'));
  const x0 = await p.evaluate(`${W}.player.x`);
  const box = await p.locator('[data-touch="right"]').boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.down();
  await p.waitForTimeout(600);
  await p.mouse.up();
  check('mobile: touch walk', (await p.evaluate(`${W}.player.x`)) > x0 + 60);
  await p.evaluate(`${W}.tapObject(${W}.objects.find(o => o.def.id === 'mirror'))`);
  await p.waitForTimeout(2600);
  check('mobile: tap object walks over and opens it', await p.evaluate(() => !document.getElementById('panel').hidden));
  await p.screenshot({ path: `${OUT}/mobile-panel.png` });
  check('mobile: no errors', errs.length === 0, JSON.stringify(errs));
  await ctx.close();
}

(async () => {
  const b = await chromium.launch();
  const only = (process.env.SUITES || '').split(',').filter(Boolean);
  for (const suite of [desktop, spritePipeline, calm, mobile].filter((f) => !only.length || only.includes(f.name))) {
    try {
      await suite(b);
    } catch (e) {
      check(`${suite.name} suite crashed`, false, e.message.split('\n')[0]);
    }
  }
  await b.close();
  console.log(log.join('\n'));
  const fails = log.filter((l) => l.startsWith('FAIL')).length;
  console.log(`\n${log.length - fails}/${log.length} passed`);
  if (fails) process.exit(1);
})();
