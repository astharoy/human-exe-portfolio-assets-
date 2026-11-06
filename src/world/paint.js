/**
 * Canvas painters for room backgrounds and interactive objects.
 * Everything is drawn procedurally into textures at load time, so there are
 * no stock images and nothing to download besides the real evidence.
 */
import { C } from '../palette.js';

export const FLOOR_Y = 640;
export const WORLD_H = 720;

/** Create (or replace) a canvas texture painted at resolution R. */
export function paintTexture(scene, key, w, h, R, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * R);
  canvas.height = Math.ceil(h * R);
  const ctx = canvas.getContext('2d');
  ctx.scale(R, R);
  draw(ctx, w, h);
  scene.textures.addCanvas(key, canvas);
  return key;
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
export function rr(ctx, x, y, w, h, r) {
  const q = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.arcTo(x + w, y, x + w, y + h, q);
  ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q);
  ctx.arcTo(x, y, x + w, y, q);
  ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
}
function shadow(ctx, blur = 14, oy = 6, a = 0.18) {
  ctx.shadowColor = `rgba(58,39,32,${a})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = oy;
}
function noShadow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}
function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}
// deterministic pseudo-random so rooms look identical on every visit
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* ------------------------------------------------------------------ */
/* Sky (parallax layer, scrollFactor < 1)                              */
/* ------------------------------------------------------------------ */
export function paintSky(ctx, w, h, room) {
  const s = room.sky;
  ctx.fillStyle = vgrad(ctx, 0, h, s.colors);
  ctx.fillRect(0, 0, w, h);
  const r = rng(room.seed);
  if (s.stars) {
    for (let i = 0; i < w / 6; i++) {
      const a = 0.35 + r() * 0.65;
      ctx.fillStyle = `rgba(255,248,230,${a})`;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h * 0.75, r() * 1.6 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (s.sun) {
    const g = ctx.createRadialGradient(s.sun[0], s.sun[1], 0, s.sun[0], s.sun[1], 160);
    g.addColorStop(0, 'rgba(255,240,200,0.95)');
    g.addColorStop(0.25, 'rgba(255,226,170,0.6)');
    g.addColorStop(1, 'rgba(255,226,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  // soft clouds
  for (let i = 0; i < w / 260; i++) {
    const cx = r() * w;
    const cy = 60 + r() * 260;
    const sc = 0.6 + r() * 0.9;
    ctx.fillStyle = s.cloud;
    ctx.globalAlpha = 0.55 + r() * 0.35;
    cloud(ctx, cx, cy, 70 * sc, 22 * sc);
    ctx.globalAlpha = 1;
  }
  // distant hills / rooftops
  if (s.hills) {
    s.hills.forEach((col, layer) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, h);
      const base = h * (0.62 + layer * 0.08);
      for (let x = 0; x <= w + 40; x += 40) {
        ctx.lineTo(x, base - Math.sin(x / (180 + layer * 70) + layer * 2) * (30 - layer * 8) - r() * 6);
      }
      ctx.lineTo(w, h);
      ctx.fill();
    });
  }
}

export function cloud(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.ellipse(x - rx * 0.45, y - ry * 0.55, rx * 0.5, ry * 1.05, 0, 0, Math.PI * 2);
  ctx.ellipse(x + rx * 0.25, y - ry * 0.85, rx * 0.45, ry * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ------------------------------------------------------------------ */
/* Wall + floor (main room layer, with window cut-outs)                */
/* ------------------------------------------------------------------ */
export function paintRoom(ctx, w, h, room) {
  const p = room.paint;
  if (p.open) {
    // Dream Space: no walls, a soft cloud bank as the ground
    ctx.fillStyle = vgrad(ctx, FLOOR_Y - 40, h, ['rgba(244,236,255,0)', p.floorHi, p.floor]);
    ctx.fillRect(0, FLOOR_Y - 40, w, h);
    ctx.fillStyle = p.floorHi;
    for (let x = -40; x < w + 80; x += 90) cloud(ctx, x, FLOOR_Y + 14 + Math.sin(x) * 6, 70, 24);
    ctx.fillStyle = p.floor;
    ctx.fillRect(0, FLOOR_Y + 22, w, h);
    return;
  }
  // wall
  ctx.fillStyle = vgrad(ctx, 0, FLOOR_Y, [p.wallTop, p.wall]);
  ctx.fillRect(0, 0, w, FLOOR_Y);
  // wallpaper motif
  const r = rng(room.seed + 7);
  ctx.fillStyle = p.motif;
  if (p.pattern === 'dots') {
    for (let y = 30; y < FLOOR_Y - 150; y += 44)
      for (let x = (y / 44) % 2 ? 22 : 0; x < w; x += 44) {
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
  } else if (p.pattern === 'stripes') {
    for (let x = 0; x < w; x += 56) ctx.fillRect(x, 0, 18, FLOOR_Y - 150);
  } else if (p.pattern === 'grid') {
    ctx.globalAlpha = 0.5;
    for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 1.5, FLOOR_Y - 150);
    for (let y = 0; y < FLOOR_Y - 150; y += 64) ctx.fillRect(0, y, w, 1.5);
    ctx.globalAlpha = 1;
  } else if (p.pattern === 'sprigs') {
    for (let i = 0; i < w / 40; i++) {
      const x = r() * w;
      const y = 20 + r() * (FLOOR_Y - 200);
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 6, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // wainscot panelling
  const wy = FLOOR_Y - 150;
  ctx.fillStyle = p.wainscot;
  ctx.fillRect(0, wy, w, 150);
  ctx.fillStyle = p.trim;
  ctx.fillRect(0, wy - 8, w, 10);
  ctx.strokeStyle = p.wainscotLine;
  ctx.lineWidth = 2;
  for (let x = 30; x < w - 60; x += 140) {
    rr(ctx, x, wy + 20, 110, 100, 6);
    ctx.stroke();
  }
  // skirting
  ctx.fillStyle = p.trim;
  ctx.fillRect(0, FLOOR_Y - 14, w, 14);
  // floor planks
  ctx.fillStyle = vgrad(ctx, FLOOR_Y, h, [p.floorHi, p.floor]);
  ctx.fillRect(0, FLOOR_Y, w, h - FLOOR_Y);
  ctx.strokeStyle = p.floorLine;
  ctx.lineWidth = 1.5;
  for (let y = FLOOR_Y + 18; y < h; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    const off = (y * 7) % 160;
    for (let x = off; x < w; x += 160 + ((y * 3) % 60)) {
      ctx.beginPath();
      ctx.moveTo(x, y - 22);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  // rugs
  (room.rugs || []).forEach(([x, rw, col, col2]) => {
    ctx.fillStyle = 'rgba(58,39,32,0.12)';
    ctx.beginPath();
    ctx.ellipse(x, FLOOR_Y + 32, rw / 2 + 6, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(x, FLOOR_Y + 28, rw / 2, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = col2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, FLOOR_Y + 28, rw / 2 - 14, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  // window cut-outs reveal the parallax sky behind
  ctx.globalCompositeOperation = 'destination-out';
  (room.windows || []).forEach(({ x, y, w: ww, h: wh }) => {
    rr(ctx, x - ww / 2 + 12, y + 12, ww - 24, wh - 24, room.windowArch ? (ww - 24) / 2 : 6);
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
  // ambient corner vignette
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  g.addColorStop(0, 'rgba(58,39,32,0.10)');
  g.addColorStop(0.4, 'rgba(58,39,32,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, FLOOR_Y);
}

/* ------------------------------------------------------------------ */
/* Objects. Each returns its logical size [w, h]; drawn bottom-centred. */
/* ------------------------------------------------------------------ */
const BOOK_COLS = [C.lavender, C.pink, C.mint, C.butter, C.peach, C.lavenderDeep, C.pinkDeep, C.mintDeep, C.beigeDeep, C.cream];

export const OBJECTS = {
  window: {
    size: [240, 230],
    draw(ctx, w, h, o) {
      const arch = o.arch;
      // frame
      ctx.lineWidth = 12;
      ctx.strokeStyle = C.cream;
      shadow(ctx, 10, 4, 0.15);
      rr(ctx, 16, 6, w - 32, h - 40, arch ? (w - 32) / 2 : 8);
      ctx.stroke();
      noShadow(ctx);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w / 2, 10);
      ctx.lineTo(w / 2, h - 36);
      ctx.moveTo(22, (h - 34) * 0.55);
      ctx.lineTo(w - 22, (h - 34) * 0.55);
      ctx.stroke();
      // glass sheen
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(40, h * 0.42);
      ctx.lineTo(70, h * 0.2);
      ctx.stroke();
      // curtains
      ctx.fillStyle = o.curtain || C.pink;
      [[4, 1], [w - 4, -1]].forEach(([x, d]) => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + d * 40, h * 0.4, x + d * 24, h - 30);
        ctx.lineTo(x, h - 30);
        ctx.fill();
      });
      ctx.fillStyle = C.brown;
      fillRR(ctx, 0, -2, w, 8, 4, C.brown);
      // sill
      fillRR(ctx, 6, h - 34, w - 12, 12, 4, C.creamDeep);
      // tiny plant on sill
      ctx.fillStyle = C.peachDeep;
      rr(ctx, w - 62, h - 56, 26, 22, 5);
      ctx.fill();
      ctx.fillStyle = C.mintDeep;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(w - 49 + (i - 2) * 6, h - 64 - (i % 2) * 6, 4, 11, (i - 2) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },

  door: {
    size: [130, 250],
    draw(ctx, w, h, o) {
      shadow(ctx, 16, 6, 0.2);
      fillRR(ctx, 6, 6, w - 12, h - 6, 60, C.cream);
      noShadow(ctx);
      ctx.fillStyle = o.color || C.lavenderDeep;
      rr(ctx, 18, 18, w - 36, h - 18, 48);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 3;
      rr(ctx, 30, 40, w - 60, 80, 34);
      ctx.stroke();
      rr(ctx, 30, 140, w - 60, 80, 8);
      ctx.stroke();
      ctx.fillStyle = C.butter;
      ctx.beginPath();
      ctx.arc(w - 36, h * 0.58, 6, 0, Math.PI * 2);
      ctx.fill();
      // number plaque
      fillRR(ctx, w / 2 - 22, 52, 44, 26, 13, C.cream);
      ctx.fillStyle = C.brownDeep;
      ctx.font = '600 15px "Fraunces", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.plaque || '', w / 2, 66);
    },
  },

  mirror: {
    size: [110, 220],
    draw(ctx, w, h) {
      // stand legs
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 30, h - 2);
      ctx.lineTo(w / 2 - 12, h - 60);
      ctx.moveTo(w / 2 + 30, h - 2);
      ctx.lineTo(w / 2 + 12, h - 60);
      ctx.stroke();
      shadow(ctx, 14, 6, 0.2);
      ctx.fillStyle = C.butter;
      ctx.beginPath();
      ctx.ellipse(w / 2, 82, 48, 78, 0, 0, Math.PI * 2);
      ctx.fill();
      noShadow(ctx);
      const g = ctx.createLinearGradient(10, 10, w, 160);
      g.addColorStop(0, '#f3effa');
      g.addColorStop(0.5, '#d6cfe6');
      g.addColorStop(1, '#bfb6d6');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(w / 2, 82, 40, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 18, 50);
      ctx.lineTo(w / 2 - 4, 30);
      ctx.moveTo(w / 2 - 20, 70);
      ctx.lineTo(w / 2 + 6, 36);
      ctx.stroke();
      // little heart sticker
      ctx.fillStyle = C.pinkDeep;
      ctx.beginPath();
      const hx = w / 2 + 22;
      const hy = 120;
      ctx.moveTo(hx, hy + 6);
      ctx.bezierCurveTo(hx - 10, hy - 2, hx - 5, hy - 9, hx, hy - 3);
      ctx.bezierCurveTo(hx + 5, hy - 9, hx + 10, hy - 2, hx, hy + 6);
      ctx.fill();
    },
  },

  photos: {
    size: [230, 150],
    draw(ctx, w, h) {
      // string of three frames; contents are soft abstract fills until real photos are added
      const frames = [[10, 20, 70, 90, -0.06, C.peach], [92, 6, 64, 64, 0.04, C.lavenderSoft], [168, 26, 56, 76, 0.08, C.mintSoft], [96, 82, 60, 50, -0.03, C.butterSoft]];
      frames.forEach(([x, y, fw, fh, rot, fill]) => {
        ctx.save();
        ctx.translate(x + fw / 2, y + fh / 2);
        ctx.rotate(rot);
        shadow(ctx, 10, 4, 0.18);
        fillRR(ctx, -fw / 2, -fh / 2, fw, fh, 4, C.brown);
        noShadow(ctx);
        fillRR(ctx, -fw / 2 + 6, -fh / 2 + 6, fw - 12, fh - 12, 2, C.cream);
        ctx.fillStyle = fill;
        rr(ctx, -fw / 2 + 11, -fh / 2 + 11, fw - 22, fh - 22, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-fw / 2 + 22, -fh / 2 + 22, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    },
  },

  bookshelf: {
    size: [180, 250],
    draw(ctx, w, h, o) {
      const r = rng(o.seed || 3);
      shadow(ctx, 16, 6, 0.2);
      fillRR(ctx, 0, 0, w, h, 8, o.wood || C.beigeDeep);
      noShadow(ctx);
      fillRR(ctx, 10, 10, w - 20, h - 20, 4, C.brown);
      const shelves = 4;
      const sh = (h - 20) / shelves;
      for (let s = 0; s < shelves; s++) {
        const y0 = 10 + s * sh;
        ctx.fillStyle = o.wood || C.beigeDeep;
        ctx.fillRect(10, y0 + sh - 7, w - 20, 7);
        let x = 16;
        while (x < w - 26) {
          const bw = 9 + r() * 10;
          const bh = sh * (0.55 + r() * 0.35);
          if (r() < 0.12 && x < w - 60) {
            // a small plant or keepsake instead of a book
            ctx.fillStyle = C.peachDeep;
            rr(ctx, x, y0 + sh - 26, 20, 19, 4);
            ctx.fill();
            ctx.fillStyle = C.mintDeep;
            ctx.beginPath();
            ctx.ellipse(x + 10, y0 + sh - 34, 9, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            x += 28;
            continue;
          }
          const tilt = r() < 0.12 ? 0.15 : 0;
          ctx.save();
          ctx.translate(x, y0 + sh - 7);
          ctx.rotate(tilt);
          ctx.fillStyle = BOOK_COLS[Math.floor(r() * BOOK_COLS.length)];
          rr(ctx, 0, -bh, bw, bh, 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(2, -bh + 6, bw - 4, 2);
          ctx.restore();
          x += bw + 1.5;
        }
      }
    },
  },

  bed: {
    size: [320, 130],
    draw(ctx, w, h) {
      shadow(ctx, 16, 6, 0.18);
      fillRR(ctx, 0, 10, 30, h - 10, 10, C.brown); // headboard
      noShadow(ctx);
      fillRR(ctx, 20, 52, w - 24, 52, 14, C.cream); // mattress
      fillRR(ctx, 20, 92, w - 24, 26, 8, C.beigeDeep); // base
      ctx.fillStyle = C.brown;
      ctx.fillRect(28, h - 12, 12, 12);
      ctx.fillRect(w - 24, h - 12, 12, 12);
      // duvet
      ctx.fillStyle = C.lavender;
      ctx.beginPath();
      ctx.moveTo(110, 48);
      ctx.quadraticCurveTo(200, 38, w - 6, 50);
      ctx.lineTo(w - 6, 100);
      ctx.quadraticCurveTo(200, 108, 100, 100);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.lavenderSoft;
      ctx.lineWidth = 3;
      for (let x = 140; x < w - 20; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 48);
        ctx.lineTo(x + 4, 102);
        ctx.stroke();
      }
      // pillows
      fillRR(ctx, 34, 32, 70, 30, 14, C.pinkSoft);
      fillRR(ctx, 70, 38, 52, 24, 12, C.butterSoft);
    },
  },

  plant: {
    size: [80, 150],
    draw(ctx, w, h) {
      shadow(ctx, 10, 4, 0.18);
      ctx.fillStyle = C.peach;
      ctx.beginPath();
      ctx.moveTo(14, h - 52);
      ctx.lineTo(w - 14, h - 52);
      ctx.lineTo(w - 22, h);
      ctx.lineTo(22, h);
      ctx.fill();
      noShadow(ctx);
      ctx.fillStyle = C.peachDeep;
      ctx.fillRect(12, h - 56, w - 24, 8);
      const leaves = [[-0.9, 60], [-0.5, 80], [-0.15, 92], [0.25, 84], [0.6, 70], [0.95, 52]];
      leaves.forEach(([a, len], i) => {
        ctx.save();
        ctx.translate(w / 2, h - 54);
        ctx.rotate(a);
        ctx.fillStyle = i % 2 ? C.mintDeep : '#8fc4a5';
        ctx.beginPath();
        ctx.ellipse(0, -len / 2, 11, len / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -len + 6);
        ctx.stroke();
        ctx.restore();
      });
    },
  },

  lamp: {
    size: [80, 230],
    draw(ctx, w, h) {
      const g = ctx.createRadialGradient(w / 2, 46, 4, w / 2, 46, w / 2);
      g.addColorStop(0, 'rgba(255,236,180,0.55)');
      g.addColorStop(1, 'rgba(255,236,180,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, 120);
      ctx.fillStyle = C.charcoal;
      ctx.fillRect(w / 2 - 2, 50, 4, h - 58);
      fillRR(ctx, w / 2 - 22, h - 10, 44, 10, 5, C.charcoal);
      ctx.fillStyle = C.butter;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 16, 16);
      ctx.lineTo(w / 2 + 16, 16);
      ctx.lineTo(w / 2 + 30, 56);
      ctx.lineTo(w / 2 - 30, 56);
      ctx.fill();
    },
  },

  desk: {
    size: [380, 130],
    draw(ctx, w, h) {
      shadow(ctx, 14, 6, 0.18);
      fillRR(ctx, 0, 0, w, 18, 6, C.beige);
      noShadow(ctx);
      ctx.fillStyle = C.beigeDeep;
      ctx.fillRect(0, 14, w, 6);
      // drawer unit (left) — the "tools" side
      fillRR(ctx, 14, 20, 110, h - 20, 6, C.cream);
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = C.beigeDeep;
        ctx.lineWidth = 2;
        rr(ctx, 22, 28 + i * 33, 94, 27, 4);
        ctx.stroke();
        fillRR(ctx, 58, 38 + i * 33, 22, 6, 3, C.lavenderDeep);
      }
      ctx.fillStyle = C.beigeDeep;
      ctx.fillRect(w - 24, 20, 12, h - 20);
      // pen cup + ruler on top-left
      fillRR(ctx, 30, -34, 26, 34, 5, C.mint);
      ctx.strokeStyle = C.charcoal;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(36, -34);
      ctx.lineTo(32, -52);
      ctx.moveTo(44, -34);
      ctx.lineTo(46, -56);
      ctx.moveTo(50, -34);
      ctx.lineTo(56, -48);
      ctx.stroke();
    },
    // the pen cup draws above the desktop
    padTop: 60,
  },

  laptop: {
    size: [120, 80],
    draw(ctx, w, h) {
      shadow(ctx, 10, 4, 0.2);
      // screen
      fillRR(ctx, 14, 0, w - 28, h - 14, 6, C.charcoal);
      noShadow(ctx);
      const g = ctx.createLinearGradient(0, 6, 0, h - 20);
      g.addColorStop(0, C.lavenderSoft);
      g.addColorStop(1, C.pinkSoft);
      ctx.fillStyle = g;
      rr(ctx, 20, 6, w - 40, h - 26, 3);
      ctx.fill();
      // four tiles = four projects
      const tiles = [C.butter, C.mint, C.pink, C.lavender];
      tiles.forEach((c, i) => fillRR(ctx, 28 + (i % 2) * 34, 12 + Math.floor(i / 2) * 22, 28, 16, 3, c));
      // base
      fillRR(ctx, 0, h - 14, w, 10, 5, '#c9c2cf');
      ctx.fillStyle = '#a9a2b0';
      ctx.fillRect(w / 2 - 12, h - 14, 24, 3);
    },
  },

  monitor: {
    size: [190, 150],
    draw(ctx, w, h, o) {
      // wall-mounted screen + console shelf; the evidence image is placed on top by the scene
      shadow(ctx, 14, 6, 0.22);
      fillRR(ctx, 0, 0, w, 116, 10, C.charcoal);
      noShadow(ctx);
      fillRR(ctx, 8, 8, w - 16, 100, 5, o.screen || C.lavenderSoft);
      ctx.fillStyle = C.charcoal;
      ctx.fillRect(w / 2 - 5, 116, 10, 18);
      fillRR(ctx, w / 2 - 34, 132, 68, 8, 4, C.charcoal);
      // status lamp
      ctx.fillStyle = o.led || C.mint;
      ctx.beginPath();
      ctx.arc(w - 14, 112, 2.6, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  console: {
    size: [900, 120],
    draw(ctx, w, h) {
      shadow(ctx, 14, 6, 0.18);
      fillRR(ctx, 0, 0, w, 16, 6, C.lavenderDeep);
      noShadow(ctx);
      fillRR(ctx, 16, 16, w - 32, h - 16, 8, C.lavender);
      for (let x = 40; x < w - 80; x += 216) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        rr(ctx, x, 32, 180, h - 48, 8);
        ctx.stroke();
      }
    },
  },

  sidetable: {
    size: [110, 150],
    draw(ctx, w, h) {
      shadow(ctx, 12, 5, 0.18);
      fillRR(ctx, 0, 48, w, 12, 6, C.peach);
      noShadow(ctx);
      ctx.fillStyle = C.peachDeep;
      ctx.fillRect(14, 60, 8, h - 60);
      ctx.fillRect(w - 22, 60, 8, h - 60);
      // notebook with elastic band and a pencil
      ctx.save();
      ctx.translate(w / 2, 40);
      ctx.rotate(-0.08);
      fillRR(ctx, -34, -10, 68, 18, 3, C.butter);
      fillRR(ctx, -34, -14, 68, 6, 3, '#fbf3e4');
      ctx.fillStyle = C.pinkDeep;
      ctx.fillRect(16, -14, 4, 22);
      ctx.restore();
      ctx.save();
      ctx.translate(w / 2 + 6, 22);
      ctx.rotate(0.3);
      ctx.fillStyle = C.butter;
      ctx.fillRect(-26, -2, 46, 4);
      ctx.fillStyle = C.charcoal;
      ctx.fillRect(20, -2, 5, 4);
      ctx.restore();
    },
  },

  pcdesk: {
    size: [220, 220],
    draw(ctx, w, h) {
      // a rounded retro computer on a small desk
      shadow(ctx, 14, 6, 0.18);
      fillRR(ctx, 0, 110, w, 14, 6, C.beige);
      noShadow(ctx);
      ctx.fillStyle = C.beigeDeep;
      ctx.fillRect(16, 124, 10, h - 124);
      ctx.fillRect(w - 26, 124, 10, h - 124);
      shadow(ctx, 10, 4, 0.2);
      fillRR(ctx, 40, 10, 140, 100, 18, C.cream);
      noShadow(ctx);
      fillRR(ctx, 54, 22, 112, 70, 10, '#28323a');
      ctx.fillStyle = C.mint;
      ctx.font = '600 12px ui-monospace, Menlo, monospace';
      ctx.fillText('> hello_', 64, 46);
      ctx.fillStyle = 'rgba(181,220,196,0.5)';
      ctx.fillRect(64, 56, 60, 4);
      ctx.fillRect(64, 66, 82, 4);
      fillRR(ctx, 60, 96, 100, 10, 4, C.creamDeep);
      // keyboard
      fillRR(ctx, 50, 100, 120, 10, 4, '#ddd2c0');
    },
  },

  lectern: {
    size: [120, 190],
    draw(ctx, w, h) {
      // research notes: papers clipped to a slanted stand
      ctx.fillStyle = C.brown;
      ctx.fillRect(w / 2 - 5, 70, 10, h - 78);
      fillRR(ctx, w / 2 - 34, h - 10, 68, 10, 5, C.brown);
      ctx.save();
      ctx.translate(w / 2, 56);
      ctx.rotate(-0.12);
      shadow(ctx, 10, 4, 0.2);
      fillRR(ctx, -50, -40, 100, 70, 6, C.beigeDeep);
      noShadow(ctx);
      [[-6, C.cream, -0.06], [4, '#fffaf0', 0.04], [0, C.butterSoft, 0]].forEach(([dx, c, r]) => {
        ctx.save();
        ctx.rotate(r);
        fillRR(ctx, -38 + dx, -46, 72, 66, 2, c);
        ctx.fillStyle = 'rgba(90,61,49,0.25)';
        for (let i = 0; i < 6; i++) ctx.fillRect(-30 + dx, -36 + i * 9, 40 + ((i * 13) % 18), 2);
        ctx.restore();
      });
      fillRR(ctx, -12, -50, 24, 10, 3, C.charcoal);
      ctx.restore();
    },
  },

  board: {
    size: [260, 170],
    draw(ctx, w, h, o) {
      shadow(ctx, 14, 6, 0.2);
      fillRR(ctx, 0, 0, w, h, 10, C.brown);
      noShadow(ctx);
      fillRR(ctx, 10, 10, w - 20, h - 20, 6, o.surface || '#d7b48c');
      const r = rng(o.seed || 11);
      const notes = [C.butter, C.pink, C.mint, C.lavenderSoft, C.peach];
      for (let i = 0; i < 9; i++) {
        const x = 24 + (i % 4) * 56 + r() * 10;
        const y = 22 + Math.floor(i / 4) * 46 + r() * 8;
        ctx.save();
        ctx.translate(x + 20, y + 18);
        ctx.rotate((r() - 0.5) * 0.25);
        shadow(ctx, 4, 2, 0.15);
        fillRR(ctx, -20, -18, 40, 36, 2, notes[i % notes.length]);
        noShadow(ctx);
        ctx.fillStyle = C.pinkDeep;
        ctx.beginPath();
        ctx.arc(0, -13, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // a string connecting a few notes, detective style
      ctx.strokeStyle = C.pinkDeep;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, 28);
      ctx.lineTo(160, 76);
      ctx.lineTo(220, 32);
      ctx.stroke();
    },
  },

  easel: {
    size: [150, 230],
    draw(ctx, w, h) {
      // star map on an easel
      ctx.strokeStyle = C.beige;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w / 2, 10);
      ctx.lineTo(18, h);
      ctx.moveTo(w / 2, 10);
      ctx.lineTo(w - 18, h);
      ctx.moveTo(w / 2, 40);
      ctx.lineTo(w / 2, h - 10);
      ctx.stroke();
      shadow(ctx, 14, 6, 0.3);
      fillRR(ctx, 6, 30, w - 12, 120, 6, C.nightDeep);
      noShadow(ctx);
      const pts = [[30, 60], [56, 82], [84, 70], [110, 96], [124, 64], [70, 120]];
      ctx.strokeStyle = 'rgba(246,223,160,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.fillStyle = C.butter;
      pts.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
      fillRR(ctx, 0, 146, w, 8, 4, C.beigeDeep);
    },
  },

  mobile: {
    size: [200, 260],
    draw(ctx, w, h) {
      // paper planes hanging from a branch
      ctx.strokeStyle = C.cream;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(10, 20);
      ctx.quadraticCurveTo(w / 2, 4, w - 10, 24);
      ctx.stroke();
      const planes = [[40, 120, C.pinkSoft], [100, 190, C.butterSoft], [160, 140, C.mintSoft]];
      planes.forEach(([x, y, c]) => {
        ctx.strokeStyle = 'rgba(251,243,228,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 16);
        ctx.lineTo(x, y - 12);
        ctx.stroke();
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x - 28, y);
        ctx.lineTo(x + 30, y - 10);
        ctx.lineTo(x - 6, y + 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 14);
        ctx.lineTo(x + 30, y - 10);
        ctx.lineTo(x - 2, y + 2);
        ctx.fill();
      });
    },
  },

  moon: {
    size: [190, 190],
    draw(ctx, w) {
      const g = ctx.createRadialGradient(w / 2, w / 2, 40, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,244,214,0.5)');
      g.addColorStop(1, 'rgba(255,244,214,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
      ctx.fillStyle = '#fbefc9';
      ctx.beginPath();
      ctx.arc(w / 2, w / 2, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(214,190,140,0.45)';
      [[-18, -14, 12], [16, 10, 9], [-6, 24, 7], [22, -22, 6]].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(w / 2 + dx, w / 2 + dy, r, 0, Math.PI * 2);
        ctx.fill();
      });
    },
  },

  cloudPlatform: {
    size: [200, 70],
    draw(ctx, w, h) {
      ctx.fillStyle = 'rgba(42,36,64,0.18)';
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 6, w / 2 - 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4eefc';
      cloud(ctx, w / 2, h - 26, w / 2 - 20, 20);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6;
      cloud(ctx, w / 2 - 10, h - 32, w / 3, 12);
      ctx.globalAlpha = 1;
    },
  },

  frames: {
    size: [300, 190],
    draw(ctx, w, h) {
      const fr = [[0, 10, 110, 80, C.butter], [124, 0, 76, 100, C.pink], [214, 20, 86, 70, C.mint], [30, 104, 80, 80, C.lavender], [124, 114, 120, 70, C.peach]];
      fr.forEach(([x, y, fw, fh, c]) => {
        shadow(ctx, 10, 4, 0.18);
        fillRR(ctx, x, y, fw, fh, 4, c);
        noShadow(ctx);
        fillRR(ctx, x + 8, y + 8, fw - 16, fh - 16, 2, C.cream);
        ctx.fillStyle = 'rgba(185,167,214,0.25)';
        ctx.beginPath();
        ctx.moveTo(x + 8, y + fh - 8);
        ctx.lineTo(x + fw * 0.4, y + fh * 0.5);
        ctx.lineTo(x + fw * 0.6, y + fh * 0.66);
        ctx.lineTo(x + fw * 0.75, y + fh * 0.45);
        ctx.lineTo(x + fw - 8, y + fh - 8);
        ctx.fill();
      });
    },
  },

  polaroids: {
    size: [360, 130],
    draw(ctx, w, h) {
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.quadraticCurveTo(w / 2, 50, w, 10);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * 70;
        const t = (x / w) * 2 - 1;
        const y = 10 + (1 - t * t) * 40 * 0.98;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((i % 2 ? 1 : -1) * 0.08);
        shadow(ctx, 8, 3, 0.18);
        fillRR(ctx, -26, 2, 52, 62, 2, '#fffdf8');
        noShadow(ctx);
        ctx.fillStyle = [C.lavenderSoft, C.pinkSoft, C.mintSoft, C.butterSoft, C.peach][i];
        ctx.fillRect(-21, 7, 42, 40);
        ctx.fillStyle = C.butter;
        ctx.fillRect(-4, -4, 8, 12);
        ctx.restore();
      }
    },
  },

  bench: {
    size: [240, 80],
    draw(ctx, w, h) {
      shadow(ctx, 12, 5, 0.18);
      fillRR(ctx, 0, 0, w, 22, 10, C.pink);
      noShadow(ctx);
      fillRR(ctx, 0, 18, w, 12, 6, C.beigeDeep);
      ctx.fillStyle = C.brown;
      ctx.fillRect(20, 30, 10, h - 30);
      ctx.fillRect(w - 30, 30, 10, h - 30);
    },
  },

  rugPlant: {
    size: [100, 60],
    draw(ctx, w, h) {
      ctx.fillStyle = C.mintDeep;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.ellipse(w / 2 + (i - 3) * 12, h - 18, 8, 22, (i - 3) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
};
