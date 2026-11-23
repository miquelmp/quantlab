/**
 * JavaScript común a todas las páginas: ajustes de lectura, menú, progreso del lector,
 * índice lateral, Ampliación plegable, ejercicios, carga diferida de gráficos y Python.
 * Todo funciona aunque el navegador no permita guardar datos (RF-PRO-06).
 */
import { checkAnswer } from '../format';
import { isLocalPath } from './progress';

const KEY = 'quantlab:v1';

interface Store {
  read: Record<string, string[]>;          // «es/1» → secciones leídas
  ex: Record<string, 'ok'>;                // ejercicios comprobados
  last?: { url: string; title: string; section?: string; ts: number };
  advancedOpen?: boolean;
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { read: {}, ex: {}, ...JSON.parse(raw) };
  } catch { /* sin almacenamiento */ }
  return { read: {}, ex: {} };
}
function save(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
}
function getPref(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function setPref(k: string, v: string | null) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* nada */ } }

const T: Record<string, string> = JSON.parse(document.getElementById('ui-strings')?.textContent || '{}');
const tr = (k: string) => T[k] ?? k;

/* ---------- Ajustes de lectura ---------- */
function initSettings() {
  const root = document.documentElement;
  document.querySelectorAll<HTMLButtonElement>('[data-theme-set]').forEach((b) => {
    const v = b.dataset.themeSet!;
    const cur = getPref('quantlab:theme') ?? 'auto';
    b.setAttribute('aria-pressed', String(cur === v));
    b.addEventListener('click', () => {
      if (v === 'auto') { root.removeAttribute('data-theme'); setPref('quantlab:theme', null); }
      else { root.setAttribute('data-theme', v); setPref('quantlab:theme', v); }
      document.querySelectorAll<HTMLButtonElement>('[data-theme-set]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-fs-step]').forEach((b) => {
    b.addEventListener('click', () => {
      const cur = Number(root.dataset.fs || 0);
      const next = Math.max(-1, Math.min(2, cur + Number(b.dataset.fsStep)));
      if (next === 0) { delete root.dataset.fs; setPref('quantlab:fs', null); } else { root.dataset.fs = String(next); setPref('quantlab:fs', String(next)); }
    });
  });
  const navBtn = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const nav = document.querySelector<HTMLElement>('.main-nav');
  navBtn?.addEventListener('click', () => {
    const open = nav!.classList.toggle('open');
    navBtn.setAttribute('aria-expanded', String(open));
  });
  // Cerrar el panel de ajustes con Escape o al hacer clic fuera
  const settings = document.querySelector<HTMLDetailsElement>('.settings');
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && settings?.open) { settings.open = false; settings.querySelector('summary')?.focus(); } });
  document.addEventListener('click', (e) => { if (settings?.open && !settings.contains(e.target as Node)) settings.open = false; });
}

/* ---------- Capítulo: progreso, índice lateral y Ampliación ---------- */
function initChapter() {
  const article = document.querySelector<HTMLElement>('[data-chapter]');
  if (!article) return;
  const chKey = article.dataset.chapter!;
  const store = load();
  const readSet = new Set(store.read[chKey] ?? []);
  const sections = [...article.querySelectorAll<HTMLElement>('[data-section]')];

  const refreshToc = () => {
    document.querySelectorAll<HTMLAnchorElement>('.toc a[data-target]').forEach((a) => a.classList.toggle('done', readSet.has(a.dataset.target!)));
    document.querySelectorAll<HTMLButtonElement>('[data-mark]').forEach((b) => {
      const on = readSet.has(b.dataset.mark!);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? `✓ ${tr('chapter.read')}` : tr('chapter.markRead');
    });
  };
  const persist = () => { const s = load(); s.read[chKey] = [...readSet]; save(s); refreshToc(); };

  document.querySelectorAll<HTMLButtonElement>('[data-mark]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.mark!;
    if (readSet.has(id)) readSet.delete(id); else readSet.add(id);
    persist();
  }));

  // Marca automática al llegar al final de una sección (RF-PRO-01)
  const endObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        const id = (e.target as HTMLElement).dataset.end!;
        if (!readSet.has(id)) { readSet.add(id); persist(); }
        endObs.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -15% 0px' });
  article.querySelectorAll<HTMLElement>('[data-end]').forEach((el) => { if (!readSet.has(el.dataset.end!)) endObs.observe(el); });

  // Índice que resalta la sección visible (RF-NAV-03) y «Seguir donde lo dejé»
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc-side a[data-target]')];
  let current = '';
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) current = (e.target as HTMLElement).id;
    links.forEach((a) => { const on = a.dataset.target === current; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    if (current) {
      const s = load();
      s.last = { url: location.pathname + '#' + current, title: article.dataset.title!, section: document.getElementById(current)?.dataset.title, ts: Date.now() };
      save(s);
    }
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach((s) => spy.observe(s));
  refreshToc();

  // «Avisar de un error» precarga la sección que se estaba leyendo (CU-12)
  const report = document.querySelector<HTMLAnchorElement>('[data-report]');
  report?.addEventListener('click', () => {
    let sec = document.getElementById(current)?.dataset.title;
    if (!sec) { const s = load(); sec = s.last?.url.startsWith(location.pathname) ? s.last.section : undefined; }
    if (!sec) return;
    const u = new URL(report.href);
    u.searchParams.set('body', (u.searchParams.get('body') ?? '').replace(/^(Sección:)\n/m, `$1 ${sec}\n`));
    report.href = u.toString();
  });

  // Ampliación: plegada por defecto; se recuerda la preferencia (RF-NAV-08, D-12)
  const adv = document.querySelector<HTMLDetailsElement>('details.advanced');
  if (adv) {
    if (load().advancedOpen || location.hash && adv.querySelector(location.hash.replace(/[^#\w-]/g, ''))) adv.open = true;
    adv.addEventListener('toggle', () => { const s = load(); s.advancedOpen = adv.open; save(s); });
  }
}

/* ---------- Ejercicios con comprobación (RF-EJ-03) ---------- */
function initExercises() {
  const store = load();
  document.querySelectorAll<HTMLElement>('[data-exercise]').forEach((ex) => {
    const id = ex.dataset.exercise!;
    const rows = [...ex.querySelectorAll<HTMLElement>('.check-row')];
    const results = new Map<HTMLElement, boolean>();
    rows.forEach((row) => {
      const input = row.querySelector('input')!;
      const btn = row.querySelector<HTMLButtonElement>('[data-check]')!;
      const out = row.querySelector<HTMLElement>('.check-result')!;
      btn.disabled = false;
      input.disabled = false;
      const run = () => {
        const v = input.value;
        if (!v.trim()) { out.className = 'check-result'; out.textContent = tr('ex.empty'); return; }
        const r = checkAnswer(v, Number(row.dataset.value), row.dataset.tipo as any, row.dataset.tol ? Number(row.dataset.tol) : undefined);
        input.setAttribute('aria-invalid', String(r === false || r === null));
        if (r === null) { out.className = 'check-result bad'; out.textContent = tr('ex.invalid'); return; }
        out.className = 'check-result ' + (r ? 'ok' : 'bad');
        out.textContent = r ? tr('ex.correct') : tr('ex.incorrect');
        results.set(row, r);
        if (rows.every((x) => results.get(x))) {
          const s = load(); s.ex[id] = 'ok'; save(s);
          ex.classList.add('solved');
        }
      };
      btn.addEventListener('click', run);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    });
    if (store.ex[id]) ex.classList.add('solved');
  });
}

/* ---------- Índice y portada: estado de lectura ---------- */
function initIndex() {
  const store = load();
  document.querySelectorAll<HTMLElement>('[data-progress-of]').forEach((el) => {
    const key = el.dataset.progressOf!;
    const total = Number(el.dataset.total || 0);
    const n = (store.read[key] ?? []).length;
    if (!n) return;
    el.textContent = n >= total ? `✓ ${tr('index.status.read')}` : `${tr('index.status.partial')} (${n}/${total})`;
    el.hidden = false;
  });
  const resume = document.querySelector<HTMLAnchorElement>('[data-resume]');
  if (resume && store.last && isLocalPath(store.last.url)) {
    resume.href = store.last.url;
    resume.hidden = false;
    const label = resume.querySelector('[data-resume-label]');
    if (label) label.textContent = store.last.section ? `${store.last.title} · ${store.last.section}` : store.last.title;
  }
}

/* ---------- Gráficos: se cargan al acercarse (RF-GRA-15) ---------- */
function initCharts() {
  const charts = document.querySelectorAll<HTMLElement>('[data-chart]');
  if (!charts.length) return;
  const mount = (el: HTMLElement) => import('../../charts/client/mount').then((m) => m.mountChart(el)).catch((e) => console.error(e));
  if (!('IntersectionObserver' in window)) { charts.forEach(mount); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); mount(e.target as HTMLElement); }
  }, { rootMargin: '600px 0px' });
  charts.forEach((c) => io.observe(c));
}

/* ---------- Python: el intérprete solo se descarga al pulsar «Ejecutar» ---------- */
function initPython() {
  if (!document.querySelector('[data-py]')) return;
  import('../../python/client').then((m) => m.initPython(tr));
}

/* ---------- Atajo «/» para abrir el buscador (RF-BUS-04) ---------- */
function initSearchShortcut() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
    const q = document.getElementById('q') as HTMLInputElement | null;
    e.preventDefault();
    if (q) { q.focus(); q.select(); return; }
    const link = document.querySelector<HTMLAnchorElement>('.main-nav a[href$="/buscar/"]');
    if (link) location.href = link.href;
  });
}

/* ---------- Cabecera que se esconde al bajar en el móvil ---------- */
function initHeaderAutoHide() {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header || !('matchMedia' in window)) return;
  const mq = matchMedia('(max-width: 759px)');
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      const menuOpen = header.querySelector('.main-nav.open, details[open]');
      if (!mq.matches || menuOpen || y < 80) header.classList.remove('away');
      else if (y > lastY + 6) header.classList.add('away');
      else if (y < lastY - 6) header.classList.remove('away');
      lastY = y;
    });
  }, { passive: true });
  // Si el foco entra en la cabecera (teclado), se muestra.
  header.addEventListener('focusin', () => header.classList.remove('away'));
}

/** Fórmulas destacadas más anchas que la pantalla: se pueden desplazar también con el teclado. */
function initWideFormulas() {
  const els = [...document.querySelectorAll<HTMLElement>('.katex-display')];
  if (!els.length) return;
  const update = () => {
    for (const el of els) {
      if (el.scrollWidth > el.clientWidth + 1) {
        el.tabIndex = 0;
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', tr('chapter.wideFormula'));
      } else {
        el.removeAttribute('tabindex');
        el.removeAttribute('role');
        el.removeAttribute('aria-label');
      }
    }
  };
  update();
  document.fonts?.ready.then(update).catch(() => {});
  window.addEventListener('load', update);
  let raf = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); });
}

initSettings();
initWideFormulas();
initHeaderAutoHide();
initSearchShortcut();
initChapter();
initExercises();
initIndex();
initCharts();
initPython();

/* ---------- App instalable y lectura sin conexión (sw.js lo genera scripts/pwa.mjs) ---------- */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(base + 'sw.js', { scope: base }).catch(() => { /* sin app: la web funciona igual */ });
  });
}
