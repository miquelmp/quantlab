/**
 * RF-ED-03: comprueba, sobre el sitio ya generado (dist/), que todos los enlaces internos
 * llevan a una página que existe y que las anclas (#seccion) existen en su página.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const BASE = '/quantlab/';
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.html')) files.push(p); } })(DIST);

const idsCache = new Map();
function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath);
  if (!p.startsWith(BASE)) return null;
  p = p.slice(BASE.length);
  const cands = [path.join(DIST, p), path.join(DIST, p, 'index.html')];
  return cands.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null;
}

const errors = [];
let checked = 0;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = '/' + path.relative(DIST, file);
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|data:|javascript:)/.test(raw)) continue;
    checked++;
    const [pathPart, hash] = raw.split('#');
    let target = file;
    if (pathPart) {
      const clean = pathPart.split('?')[0];
      const abs = clean.startsWith('/') ? clean : path.posix.join(path.posix.dirname(BASE + path.relative(DIST, file)), clean);
      target = resolve(abs);
      if (!target) { errors.push(`${rel}: enlace roto → ${raw}`); continue; }
    }
    if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) errors.push(`${rel}: ancla inexistente → ${raw}`);
  }
}
if (errors.length) {
  console.error(`✗ ${errors.length} enlace(s) roto(s):\n- ` + [...new Set(errors)].join('\n- '));
  process.exit(1);
}
console.log(`✓ ${checked} enlaces internos comprobados en ${files.length} páginas.`);
