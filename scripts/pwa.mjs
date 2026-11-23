/**
 * Integración de Astro que, al terminar la compilación, escribe dist/sw.js: el trabajador de
 * servicio que hace la web instalable y legible sin conexión (app para Android y otros).
 *
 * - Guarda en el dispositivo todas las páginas y recursos del sitio al instalarse.
 * - Páginas: primero la red (para ver siempre la última versión) y, sin conexión, la copia guardada.
 * - Recursos (CSS, JS, iconos): primero la copia guardada.
 * - Python (Pyodide): se guarda la primera vez que se usa con conexión; después funciona sin ella.
 * La versión cambia con el contenido, así que cada publicación sustituye la copia anterior.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

export default function pwa({ base, pyodide }) {
  const b = base.endsWith('/') ? base : base + '/';
  return {
    name: 'quantlab-pwa',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const root = fileURLToPath(dir);
        const files = walk(root)
          .map((p) => relative(root, p).split(sep).join('/'))
          .filter((f) => !/^(sw\.js|\.nojekyll|robots\.txt|sitemap.*\.xml)$/.test(f) && !/\/vista-previa\//.test(f)) // las imágenes para compartir no hacen falta sin conexión
          .sort();
        const hash = createHash('sha256');
        for (const f of files) hash.update(f).update(readFileSync(join(root, f)));
        const version = hash.digest('hex').slice(0, 12);
        const urls = files.map((f) => b + f.replace(/(^|\/)index\.html$/, '$1'));
        const sw = `/* Generado por scripts/pwa.mjs. No editar a mano. */
const VERSION = ${JSON.stringify(version)};
const BASE = ${JSON.stringify(b)};
const PYODIDE = ${JSON.stringify(pyodide)};
const CORE = 'quantlab-' + VERSION;
const PY = 'quantlab-pyodide';
const PRECACHE = ${JSON.stringify(urls)};

self.addEventListener('install', (e) => {
  // Sin skipWaiting: la versión nueva espera a que se cierren las pestañas abiertas, que aún usan
  // los ficheros de la versión anterior (por ejemplo, el worker de Python al pulsar «Ejecutar»).
  e.waitUntil(caches.open(CORE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('quantlab-') && k !== CORE && k !== PY).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function fromNetworkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) { const c = await caches.open(CORE); c.put(req, res.clone()); }
    return res;
  } catch (err) {
    const hit = await caches.match(req, { ignoreSearch: true, ignoreVary: true });
    if (hit) return hit;
    return (await caches.match(BASE + '404.html')) || Response.error();
  }
}

async function fromCacheFirst(req, cacheName) {
  const hit = await caches.match(req, { ignoreSearch: cacheName === CORE, ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') { const c = await caches.open(cacheName); c.put(req, res.clone()); }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.href.startsWith(PYODIDE)) { e.respondWith(fromCacheFirst(req, PY)); return; }
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (req.mode === 'navigate' || req.destination === 'document') e.respondWith(fromNetworkFirst(req));
  else e.respondWith(fromCacheFirst(req, CORE));
});
`;
        writeFileSync(join(root, 'sw.js'), sw);
        console.log(`[pwa] sw.js: ${urls.length} ficheros para uso sin conexión (versión ${version}).`);
      },
    },
  };
}
