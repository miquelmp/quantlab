/**
 * Da vida a un gráfico en el navegador: deslizadores, semilla, información emergente,
 * descripción accesible, tabla de datos y enlace compartible.
 * El HTML de partida (controles e imagen estática) ya viene generado en la compilación.
 */
import { loadChart } from '../registry';
import type { ChartCtx, ChartDef } from '../types';
import { randomSeed } from '../rng';
import { esc } from '../svg';

export interface ChartApi {
  root: HTMLElement;
  def: ChartDef<any, any>;
  ctx: ChartCtx;
  state: Record<string, number>;
  data: any;
  renderPanels(ids?: string[]): void;
  panelEl(id: string): HTMLElement | null;
  /** Cambia una clave del estado y vuelve a calcular (para extensiones con arrastre). */
  set(key: string, value: number): void;
}

export interface ChartExt {
  afterCompute?(api: ChartApi, changed: Set<string>): void;
  afterRender?(api: ChartApi, ids: string[]): void;
}

async function loadExt(id: string): Promise<ChartExt | null> {
  if (id === 'montecarlo') return (await import('./ext-montecarlo')).ext;
  if (id === 'campana') return (await import('./ext-galton')).ext;
  if (id === 'sharpe') return (await import('./ext-sharpe')).ext;
  if (id === 'frontera') return (await import('./ext-frontera')).ext;
  return null;
}

function readUrlState(id: string): Record<string, number> {
  try {
    const raw = new URLSearchParams(location.search).get(id);
    if (!raw) return {};
    const out: Record<string, number> = {};
    for (const pair of raw.split(',')) {
      const [k, v] = pair.split(':');
      const n = Number(v);
      if (k && Number.isFinite(n)) out[k] = n;
    }
    return out;
  } catch { return {}; }
}

export async function mountChart(root: HTMLElement): Promise<void> {
  if (root.dataset.mounted) return;
  root.dataset.mounted = '1';
  const id = root.dataset.chart!;
  const [def, ext] = await Promise.all([loadChart(id), loadExt(id)]);
  const i18n: Record<string, string> = JSON.parse(root.querySelector('script[data-i18n]')!.textContent || '{}');
  const fmt = JSON.parse(root.dataset.fmt || '{"decimal":",","group":"."}');
  const tr = (key: string, vars: Record<string, string | number> = {}) => {
    let s = i18n[key] ?? key;
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
  const ctx: ChartCtx = { tr, fmt };

  const state: Record<string, number> = { ...def.defaults };
  const fromUrl = readUrlState(id);
  for (const sl of def.sliders) {
    if (fromUrl[sl.key] !== undefined) state[sl.key] = Math.min(sl.max, Math.max(sl.min, fromUrl[sl.key]));
  }
  if (def.simulated && fromUrl.seed !== undefined) state.seed = Math.max(0, Math.round(fromUrl.seed));
  for (const k of def.extraKeys ?? []) if (fromUrl[k] !== undefined) state[k] = fromUrl[k];

  const panels = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-panel]').forEach((el) => panels.set(el.dataset.panel!, el));
  const statsEl = root.querySelector<HTMLElement>('[data-stats]');
  const descEl = root.querySelector<HTMLElement>('[data-describe]');
  const tableEl = root.querySelector<HTMLDetailsElement>('[data-table]');
  const seedInput = root.querySelector<HTMLInputElement>('[data-seed]');

  const api: ChartApi = {
    root, def, ctx, state, data: null,
    renderPanels: (ids) => renderPanels(ids),
    panelEl: (pid) => panels.get(pid) ?? null,
    set: (key, value) => { state[key] = value; schedule(key); },
  };

  let changed = new Set<string>(Object.keys(state));
  let raf = 0;
  let descTimer: ReturnType<typeof setTimeout> | undefined;

  function syncControls() {
    for (const sl of def.sliders) {
      const input = root.querySelector<HTMLInputElement>(`input[data-key="${sl.key}"]`);
      const out = root.querySelector<HTMLOutputElement>(`output[data-for="${sl.key}"]`);
      if (input) {
        input.value = String(state[sl.key]);
        input.setAttribute('aria-valuetext', sl.format(state[sl.key], ctx));
      }
      if (out) out.textContent = sl.format(state[sl.key], ctx);
    }
    if (seedInput) seedInput.value = String(state.seed);
  }

  function renderPanels(ids?: string[]) {
    const list = ids ?? def.panels.map((p) => p.id);
    for (const pid of list) {
      const p = def.panels.find((x) => x.id === pid);
      const el = panels.get(pid);
      if (!p || !el) continue;
      const host = el.querySelector<HTMLElement>('.panel-svg')!;
      const w = Math.max(260, Math.floor(host.clientWidth || el.clientWidth));
      host.innerHTML = p.render(api.data, state, w, ctx);
    }
    ext?.afterRender?.(api, list);
  }

  function renderStats() {
    if (!statsEl) return;
    statsEl.innerHTML = def.stats(api.data, state, ctx).map((s) =>
      `<div class="stat"><dt>${esc(s.label)}</dt><dd>${esc(s.value)}${s.note ? `<span class="stat-note">${esc(s.note)}</span>` : ''}</dd></div>`).join('');
  }

  function renderTable() {
    if (!tableEl || !tableEl.open) return;
    const t = def.table(api.data, state, ctx);
    const body = tableEl.querySelector('.table-body')!;
    body.innerHTML = `<div class="table-wrap" tabindex="0"><table><caption>${esc(t.caption)}</caption><thead><tr>${t.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function update() {
    raf = 0;
    try {
      api.data = def.compute(state);
    } catch (e) {
      console.error(e);
      return;
    }
    ext?.afterCompute?.(api, changed);
    changed = new Set();
    renderPanels();
    renderStats();
    renderTable();
    clearTimeout(descTimer);
    descTimer = setTimeout(() => { if (descEl) descEl.textContent = def.describe(api.data, state, ctx); }, 450);
  }

  function schedule(key?: string) {
    if (key) changed.add(key);
    if (!raf) raf = requestAnimationFrame(update);
  }

  // Deslizadores
  for (const sl of def.sliders) {
    const input = root.querySelector<HTMLInputElement>(`input[data-key="${sl.key}"]`);
    if (!input) continue;
    input.disabled = false;
    input.addEventListener('input', () => {
      state[sl.key] = Number(input.value);
      syncControls();
      schedule(sl.key);
    });
  }

  // Semilla
  if (seedInput) {
    seedInput.disabled = false;
    seedInput.addEventListener('change', () => {
      const v = Math.round(Number(seedInput.value));
      if (Number.isFinite(v) && v >= 0) { state.seed = v; schedule('seed'); } else seedInput.value = String(state.seed);
    });
  }
  root.querySelector<HTMLButtonElement>('[data-act="reseed"]')?.addEventListener('click', () => {
    state.seed = randomSeed();
    syncControls();
    schedule('seed');
  });
  root.querySelector<HTMLButtonElement>('[data-act="reset"]')?.addEventListener('click', () => {
    Object.assign(state, def.defaults);
    for (const k of Object.keys(state)) changed.add(k);
    syncControls();
    schedule();
  });
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-act="share"]');
  shareBtn?.addEventListener('click', async () => {
    const keys = [...def.sliders.map((s) => s.key), ...(def.extraKeys ?? []), ...(def.simulated ? ['seed'] : [])];
    const value = keys.map((k) => `${k}:${+state[k].toFixed(6)}`).join(',');
    const u = new URL(location.href);
    u.searchParams.set(id, value);
    u.hash = root.id || '';
    const link = u.toString();
    try {
      await navigator.clipboard.writeText(link);
      shareBtn.textContent = tr('chart.linkCopied');
    } catch {
      window.prompt(tr('chart.copyLink'), link);
    }
    setTimeout(() => { shareBtn.textContent = tr('chart.copyLink'); }, 2000);
  });
  root.querySelectorAll<HTMLButtonElement>('.chart-controls button').forEach((b) => (b.disabled = false));
  tableEl?.addEventListener('toggle', renderTable);

  // Información emergente al pasar el cursor o tocar (RF-GRA-06)
  for (const p of def.panels) {
    if (!p.hover) continue;
    const el = panels.get(p.id);
    if (!el) continue;
    const host = el.querySelector<HTMLElement>('.panel-svg')!;
    const tip = el.querySelector<HTMLElement>('.tooltip')!;
    const line = el.querySelector<HTMLElement>('.crosshair')!;
    const show = (ev: PointerEvent) => {
      if (!api.data) return;
      const rect = host.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const info = p.hover!(api.data, state, rect.width, x, ctx);
      if (!info) { tip.hidden = true; line.hidden = true; return; }
      tip.innerHTML = info.lines.map((l, i) => (i === 0 ? `<strong>${esc(l)}</strong>` : `<span>${esc(l)}</span>`)).join('');
      tip.hidden = false;
      line.hidden = false;
      line.style.left = `${info.x}px`;
      const tw = tip.offsetWidth;
      const left = info.x + 12 + tw > rect.width ? info.x - 12 - tw : info.x + 12;
      tip.style.left = `${Math.max(0, left)}px`;
    };
    host.addEventListener('pointermove', show);
    host.addEventListener('pointerdown', show);
    host.addEventListener('pointerleave', () => { tip.hidden = true; line.hidden = true; });
  }

  // Redibujar al cambiar el ancho
  let lastW = 0;
  const ro = new ResizeObserver(() => {
    const w = root.clientWidth;
    if (Math.abs(w - lastW) > 2 && api.data) { lastW = w; renderPanels(); }
  });
  ro.observe(root);

  root.classList.add('is-live');
  syncControls();
  update();
  lastW = root.clientWidth;
}
