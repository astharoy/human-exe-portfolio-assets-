import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Existing project evidence lives in "human.exe porfolio/" with spaces and
 * a "#" in the file names. The originals are left exactly where they are.
 * This plugin exposes them under clean URLs (/evidence/<name>) — streamed
 * from the originals in dev, copied into dist/ at build time.
 */
const EVIDENCE_DIR = 'human.exe porfolio';
export const EVIDENCE = {
  'lostinn-cms-walkthrough.mp4': 'lostinn cms walkthrough.mp4',
  'reviewsetu-walkthrough.mp4': 'reviewsetu walkthrough.mp4',
  'resolveai-automation-workflow.png': 'automation workflow.png',
};

function evidencePlugin() {
  const types = { '.mp4': 'video/mp4', '.png': 'image/png' };
  return {
    name: 'digital-me-evidence',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url && req.url.match(/^\/evidence\/([^?#]+)/);
        if (!m || !EVIDENCE[m[1]]) return next();
        const file = path.resolve(EVIDENCE_DIR, EVIDENCE[m[1]]);
        const { size } = fs.statSync(file);
        const type = types[path.extname(file)] || 'application/octet-stream';
        const range = req.headers.range;
        if (range) {
          // Range support so <video> can seek in dev.
          const [s, e] = range.replace(/bytes=/, '').split('-');
          const start = Number(s);
          const end = e ? Number(e) : size - 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Content-Type': type,
          });
          fs.createReadStream(file, { start, end }).pipe(res);
        } else {
          res.writeHead(200, { 'Content-Length': size, 'Content-Type': type, 'Accept-Ranges': 'bytes' });
          fs.createReadStream(file).pipe(res);
        }
      });
    },
    writeBundle(options) {
      const out = path.resolve(options.dir || 'dist', 'evidence');
      fs.mkdirSync(out, { recursive: true });
      for (const [clean, original] of Object.entries(EVIDENCE)) {
        fs.copyFileSync(path.resolve(EVIDENCE_DIR, original), path.join(out, clean));
      }
    },
  };
}

export default defineConfig({
  plugins: [evidencePlugin()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600, // Phaser alone is ~1.2 MB minified
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'], gsap: ['gsap'] } },
    },
  },
});
