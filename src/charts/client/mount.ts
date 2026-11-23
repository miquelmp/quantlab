/**
 * Da vida a un gráfico en el navegador: deslizadores, semilla, información emergente,
 * descripción accesible, tabla de datos y enlace compartible.
 * El HTML de partida (controles e imagen estática) ya viene generado en la compilación.
 */
import { loadChart } from '../registry';
import type { ChartCtx, ChartDef } from '../types';
import { randomSeed } from '../rng';
import { esc, setCompact, setPresent } from '../svg';

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

const compactMq = typeof matchMedia === 'function' ? matchMedia('(max-width: 759px)') : null;
setCompact(!!compactMq?.matches);
compactMq?.addEventListener?.('change', () => setCompact(compactMq.matches));

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
  let activePanel: string | null = null;   // pestaña visible en el móvil (null: se ven todos)
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
    // Los paneles ocultos por las pestañas del móvil se dibujan al mostrarlos.
    const list = (ids ?? def.panels.map((p) => p.id)).filter((pid) => !panels.get(pid)?.hidden);
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
    statsEl.innerHTML = def.stats(api.data, state, ctx).filter((s) => !activePanel || !s.panels || s.panels.includes(activePanel)).map((s) =>
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
  const shareHtml = shareBtn?.innerHTML ?? '';
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
    setTimeout(() => { shareBtn.innerHTML = shareHtml; }, 2000);
  });
  // Modo presentación (RF-GRA-08): el gráfico ocupa toda la pantalla, con mandos y textos grandes.
  const presentBtn = root.querySelector<HTMLButtonElement>('[data-act="present"]');
  const presentHtml = presentBtn?.innerHTML ?? '';
  const setPresenting = (on: boolean) => {
    if (root.classList.contains('presenting') === on) return;
    root.classList.toggle('presenting', on);
    document.documentElement.classList.toggle('chart-presenting', on);
    setPresent(on);
    if (presentBtn) {
      presentBtn.setAttribute('aria-pressed', String(on));
      if (on) presentBtn.textContent = tr('chart.presentExit');
      else presentBtn.innerHTML = presentHtml;
    }
    renderPanels();
    if (!on) { root.scrollIntoView({ block: 'start' }); presentBtn?.focus({ preventScroll: true }); }
  };
  presentBtn?.addEventListener('click', async () => {
    const on = !root.classList.contains('presenting');
    if (on) {
      setPresenting(true);
      try { await root.requestFullscreen?.(); } catch { /* sin pantalla completa: se queda a toda la ventana */ }
    } else {
      if (document.fullscreenElement === root) { try { await document.exitFullscreen(); } catch { /* nada */ } }
      setPresenting(false);
    }
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && root.classList.contains('presenting')) setPresenting(false);
  });
  // Sin pantalla completa (modo de respaldo), Esc debe funcionar aunque el foco haya salido del gráfico.
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && root.classList.contains('presenting') && !document.fullscreenElement) setPresenting(false);
  });

  // Descargar imagen o datos (RF-GRA-09): el código se carga solo al usarlo.
  const exportMenu = root.querySelector<HTMLDetailsElement>('[data-export-menu]');
  root.querySelectorAll<HTMLButtonElement>('[data-export]').forEach((b) => b.addEventListener('click', async () => {
    const m = await import('./export');
    await m.exportChart(api, b.dataset.export as 'svg' | 'png' | 'csv');
    if (exportMenu) exportMenu.open = false;
  }));
  root.querySelectorAll<HTMLButtonElement>('.chart-controls button').forEach((b) => (b.disabled = false));
  // «Más ajustes»: abierto en pantallas anchas; plegado en el móvil para que todo quepa.
  const more = root.querySelector<HTMLDetailsElement>('[data-more]');
  if (more && 'matchMedia' in window && !matchMedia('(max-width: 759px)').matches) more.open = true;

  // Pestañas en el móvil cuando hay varios paneles: se ve uno cada vez, de modo que mandos,
  // gráfico y resultados caben juntos en la pantalla.
  if (panels.size > 1 && 'matchMedia' in window) {
    const mq = matchMedia('(max-width: 759px)');
    const wrap = root.querySelector<HTMLElement>('.chart-panels')!;
    const bar = document.createElement('div');
    bar.className = 'panel-tabs';
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', tr('chart.panels'));
    const tabs: HTMLButtonElement[] = [];
    def.panels.forEach((p, i) => {
      const el = panels.get(p.id);
      if (!el) return;
      el.id ||= `${root.id}-p-${p.id}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.id = `${el.id}-tab`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', el.id);
      b.textContent = p.title(ctx);
      b.title = p.title(ctx);
      b.dataset.panel = p.id;
      b.addEventListener('click', () => select(i, true));
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        select(n, true);
        tabs[n].focus();
      });
      tabs.push(b);
      bar.appendChild(b);
    });
    wrap.before(bar);
    let active = 0;
    const select = (i: number, draw: boolean) => {
      active = i;
      tabs.forEach((b, k) => {
        const el = panels.get(b.dataset.panel!)!;
        const on = k === i;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (mq.matches) { el.hidden = !on; el.setAttribute('role', 'tabpanel'); el.setAttribute('aria-labelledby', b.id); }
      });
      activePanel = mq.matches ? tabs[i].dataset.panel! : null;
      if (draw) { renderPanels([tabs[i].dataset.panel!]); renderStats(); }
    };
    const apply = () => {
      root.classList.toggle('tabbed', mq.matches);
      if (mq.matches) select(active, false);
      else { activePanel = null; panels.forEach((el) => { el.hidden = false; el.removeAttribute('role'); el.removeAttribute('aria-labelledby'); }); }
    };
    apply();
    mq.addEventListener?.('change', () => { apply(); renderPanels(); renderStats(); });
  }
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
