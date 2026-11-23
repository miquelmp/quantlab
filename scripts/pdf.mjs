/**
 * Libro en PDF: después de `npm run build`, abre la página «Libro completo» de cada idioma con
 * Chromium (Playwright) y la guarda como `dist/<idioma>/quantlab-libro.pdf`.
 * Uso: npm run pdf   (en GitHub se ejecuta antes de comprobar los enlaces y de publicar)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = path.resolve('dist');
const BASE = '/quantlab/';
const SITE = 'https://miquelmp.github.io';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

const langs = fs.readdirSync(DIST).filter((d) => fs.existsSync(path.join(DIST, d, 'libro-completo', 'index.html')));
if (!langs.length) { console.error('✗ No hay ninguna página «libro-completo»: ejecuta antes npm run build.'); process.exit(1); }

// Servidor mínimo de dist/ bajo /quantlab/, como en GitHub Pages.
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!u.startsWith(BASE)) { res.writeHead(404); res.end(); return; }
  let f = path.join(DIST, u.slice(BASE.length));
  if (!f.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
try {
  for (const lang of langs) {
    const page = await browser.newPage();
    // Sin analítica ni service worker al generar el PDF.
    await page.route(/goatcounter|gc\.zgo\.at/, (r) => r.abort());
    await page.goto(`${origin}${BASE}${lang}/libro-completo/`, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    // Enlaces relativos → direcciones de la web publicada (las anclas internas se quedan como están).
    await page.evaluate(([o, s]) => {
      for (const a of document.querySelectorAll('a[href]')) {
        const h = a.getAttribute('href');
        if (h.startsWith('#')) continue;
        const abs = new URL(h, location.href).toString();
        a.setAttribute('href', abs.startsWith(o) ? s + abs.slice(o.length) : abs);
      }
    }, [origin, SITE]);
    const title = (await page.textContent('.pb-cover h1'))?.trim() ?? await page.title();
    const out = path.join(DIST, lang, 'quantlab-libro.pdf');
    await page.pdf({
      path: out, format: 'A4', printBackground: false, outline: true, tagged: true,
      margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font-size:8px;color:#666;padding:0 16mm;display:flex;justify-content:space-between"><span>${title.replace(/</g, '&lt;')}</span><span class="pageNumber"></span></div>`,
    });
    console.log(`✓ ${path.relative(process.cwd(), out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
