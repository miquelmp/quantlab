/**
 * Buscador del libro (RF-BUS-01 a 05). Usa la API de Pagefind: el índice se crea al compilar
 * (scripts/search.mjs) y el navegador solo descarga los trozos que necesita.
 * - Pagefind no distingue mayúsculas; las tildes se quitan de la consulta para que «volatilidad»,
 *   «Volatilidad» y «déficit»/«deficit» den lo mismo (RF-BUS-02).
 * - Resultados agrupados por tipo de página, con fragmento resaltado y enlace a la sección (RF-BUS-03).
 * - Sinónimos básicos: se busca también la expresión equivalente y se juntan los resultados (RF-BUS-05).
 */
interface Cfg { base: string; lang: string; strings: Record<string, string> }
interface Sub { title: string; url: string; excerpt: string }
interface Data { url: string; excerpt: string; meta: Record<string, string>; sub_results?: Sub[] }
interface Hit { id: string; score: number; data: () => Promise<Data> }
interface Pagefind {
  options: (o: Record<string, unknown>) => Promise<void>;
  init: () => Promise<void>;
  search: (q: string) => Promise<{ results: Hit[] }>;
}

const GROUPS = ['chapter', 'topic', 'term', 'formulas', 'other'];
const PER_GROUP = 8;

/** Parejas de sinónimos (en minúsculas y sin tildes). */
const SYNONYMS: [string, string][] = [
  ['var', 'valor en riesgo'],
  ['es', 'deficit esperado'],
  ['expected shortfall', 'deficit esperado'],
  ['value at risk', 'valor en riesgo'],
  ['cvar', 'deficit esperado'],
  ['capm', 'modelo de valoracion de activos'],
  ['montecarlo', 'monte carlo'],
  ['vp', 'valor presente'],
  ['vf', 'valor futuro'],
];

/** Siglas que también son palabras corrientes («es»): solo cuentan si son toda la consulta. */
const WHOLE_ONLY = new Set(['es', 'vp', 'vf']);

const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'lo', 'en', 'y', 'o', 'a', 'al', 'un', 'una', 'que', 'por', 'con', 'para', 'es', 'se', 'como', 'cual', 'cuanto', 'sobre']);

export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

/** La consulta y sus variantes con sinónimos (la consulta completa o una de sus palabras). */
export function variants(q: string): string[] {
  const f = fold(q);
  const out = new Set<string>([f]);
  for (const [a, b] of SYNONYMS) {
    for (const [x, y] of [[a, b], [b, a]]) {
      if (WHOLE_ONLY.has(y)) continue;   // buscar «es» encontraría cualquier frase
      if (f === x) out.add(y);
      else if (!WHOLE_ONLY.has(x) && new RegExp(`(^| )${x}( |$)`).test(f) && f.split(' ').length > 1) out.add(f.replace(new RegExp(`(^| )${x}( |$)`), `$1${y}$2`));
    }
  }
  return [...out];
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** El fragmento de Pagefind ya viene escapado y con <mark>; se deja pasar solo <mark>. */
const safeExcerpt = (s: string, keep: Set<string>) => s.replace(/<(?!\/?mark>)[^>]*>/g, '')
  // Sin resaltar palabras cortas («de», «en») salvo que sean lo buscado («VaR»): distraen.
  .replace(/<mark>([\p{L}\d]{1,3})<\/mark>/gu, (m, w: string) => (keep.has(fold(w)) ? m : w));

export function initSearch() {
  const cfg: Cfg = JSON.parse(document.getElementById('search-cfg')!.textContent!);
  const tr = (k: string, p: Record<string, string | number> = {}) =>
    (cfg.strings[`search.${k}`] ?? k).replace(/\{(\w+)\}/g, (_, n) => String(p[n] ?? ''));
  const input = document.getElementById('q') as HTMLInputElement;
  const status = document.querySelector<HTMLElement>('.search-status')!;
  const out = document.querySelector<HTMLElement>('.search-results')!;
  const form = document.querySelector<HTMLFormElement>('.search-form')!;
  let pf: Promise<Pagefind> | null = null;
  const load = () => (pf ??= (async () => {
    const m = (await import(/* @vite-ignore */ `${cfg.base}pagefind/pagefind.js`)) as Pagefind;
    await m.options({ baseUrl: cfg.base, excerptLength: 22 });
    await m.init();
    return m;
  })().catch((err) => { pf = null; throw err; }));   // si falla (sin conexión), se reintenta en la siguiente búsqueda
  let seq = 0;

  async function run(q: string) {
    const my = ++seq;
    const url = new URL(location.href);
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    if (!q.trim()) { status.textContent = ''; out.innerHTML = ''; return; }
    status.textContent = tr('loading');
    let m: Pagefind;
    try { m = await load(); } catch { if (my === seq) status.textContent = tr('error'); return; }
    const vs = variants(q);
    // Sin palabras vacías: Pagefind trata la última palabra como prefijo y «de» encontraría «debe».
    const strip = (v: string) => v.split(' ').filter((w) => !STOP.has(w)).join(' ') || v;
    const sets = await Promise.all([...new Set(vs.map(strip))].map((v) => m.search(v)));
    if (my !== seq) return;
    const best = new Map<string, Hit>();
    sets.forEach((s, i) => s.results.forEach((h) => {
      const sc = i === 0 ? h.score : h.score * 0.9;
      const prev = best.get(h.id);
      if (!prev || prev.score < sc) best.set(h.id, { ...h, score: sc });
    }));
    const keep = new Set(vs.flatMap((v) => v.split(' ')).filter((w) => !STOP.has(w)));
    const hits = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 60);
    const datas = await Promise.all(hits.map((h) => h.data()));
    if (my !== seq) return;
    const n = datas.length;
    status.textContent = n === 0 ? tr('none', { q }) : n === 1 ? tr('countOne', { q }) : tr('count', { n, q });
    if (vs.length > 1) status.textContent += ' ' + tr('synonyms', { s: vs.slice(1).map((v) => `«${v}»`).join(', ') });
    const groups = new Map<string, Data[]>();
    for (const d of datas) {
      const g = GROUPS.includes(d.meta.tipo) ? d.meta.tipo : 'other';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(d);
    }
    out.innerHTML = GROUPS.filter((g) => groups.has(g)).map((g) => {
      const list = groups.get(g)!;
      const items = list.map((d, i) => {
        const subs = (d.sub_results ?? []).filter((s) => s.url !== d.url && s.url.includes('#')).slice(0, 3);
        return `<li class="search-hit"${i >= PER_GROUP ? ' hidden' : ''}>` +
          `<a class="search-hit-title" href="${esc(d.url)}">${esc(d.meta.title ?? d.url)}</a>` +
          `<p class="search-excerpt">${safeExcerpt(d.excerpt, keep)}</p>` +
          (subs.length ? `<ul class="search-subs">${subs.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a><span class="search-excerpt"> · ${safeExcerpt(s.excerpt, keep)}</span></li>`).join('')}</ul>` : '') +
          '</li>';
      }).join('');
      const more = list.length > PER_GROUP ? `<button type="button" class="btn search-more">${esc(tr('more'))} (${list.length - PER_GROUP})</button>` : '';
      return `<section class="search-group"><h2>${esc(tr(`type.${g}`))} <span class="search-n">${list.length}</span></h2><ul class="search-list">${items}</ul>${more}</section>`;
    }).join('');
  }

  out.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.search-more');
    if (!b) return;
    b.parentElement!.querySelectorAll<HTMLElement>('.search-hit[hidden]').forEach((li) => { li.hidden = false; });
    b.remove();
  });
  let timer = 0;
  input.addEventListener('input', () => { clearTimeout(timer); timer = window.setTimeout(() => run(input.value), 200); });
  form.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(timer); run(input.value); });
  const q0 = new URL(location.href).searchParams.get('q') ?? '';
  input.value = q0;
  if (q0) run(q0);
  input.focus();
  input.addEventListener('focus', () => { load().catch(() => {}); }, { once: true });
}
