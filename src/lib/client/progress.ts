/**
 * Página «Mi progreso» (RF-PRO-02, 04, 05). Lee el progreso de localStorage (clave quantlab:v1, la
 * misma que usa site.ts), lo resume por parte y capítulo, y permite exportarlo, importarlo y borrarlo.
 * Las acciones que borran datos piden una segunda pulsación en lugar de un diálogo del navegador.
 */
const KEY = 'quantlab:v1';

export interface Store { read: Record<string, string[]>; ex: Record<string, 'ok'>; last?: { url: string; title: string; section?: string; ts: number }; advancedOpen?: boolean }

function storageOk(): boolean {
  try { localStorage.setItem(KEY + ':t', '1'); localStorage.removeItem(KEY + ':t'); return true; } catch { return false; }
}
function load(): Store {
  try { const raw = localStorage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)) ?? { read: {}, ex: {} }; } catch { /* nada */ }
  return { read: {}, ex: {} };
}
function save(s: Store): boolean { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; } }

/** Valida y limpia un progreso leído de un fichero o del almacenamiento; null si no lo es. */
export function normalize(x: unknown): Store | null {
  if (!x || typeof x !== 'object') return null;
  const o = (x as { app?: string; data?: unknown }).app === 'quantlab' ? (x as { data: unknown }).data : x;
  if (!o || typeof o !== 'object') return null;
  const r = o as Record<string, unknown>;
  if (typeof r.read !== 'object' || typeof r.ex !== 'object' || !r.read || !r.ex) return null;
  const read: Store['read'] = {};
  for (const [k, v] of Object.entries(r.read as Record<string, unknown>)) {
    if (/^[a-z]{2}\/\d+$/.test(k) && Array.isArray(v)) read[k] = v.filter((s): s is string => typeof s === 'string' && s.length < 100).slice(0, 50);
  }
  const ex: Store['ex'] = {};
  for (const [k, v] of Object.entries(r.ex as Record<string, unknown>)) if (/^\d+\.\d+$/.test(k) && v === 'ok') ex[k] = 'ok';
  const out: Store = { read, ex };
  const last = r.last as Store['last'];
  if (last && typeof last.url === 'string' && last.url.startsWith('/') && typeof last.title === 'string') {
    out.last = { url: last.url, title: last.title.slice(0, 200), section: typeof last.section === 'string' ? last.section.slice(0, 200) : undefined, ts: Number(last.ts) || 0 };
  }
  if (typeof r.advancedOpen === 'boolean') out.advancedOpen = r.advancedOpen;
  return out;
}

export function initProgress() {
  const cfg = JSON.parse(document.getElementById('progress-cfg')!.textContent!) as { lang: string; strings: Record<string, string> };
  const tr = (k: string, p: Record<string, string | number> = {}) => (cfg.strings[`progress.${k}`] ?? k).replace(/\{(\w+)\}/g, (_, n) => String(p[n] ?? ''));
  const msg = document.querySelector<HTMLElement>('.progress-msg')!;
  const ok = storageOk();
  if (!ok) {
    document.querySelector<HTMLElement>('.progress-nostore')!.hidden = false;
    document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('.progress-buttons button, .progress-buttons input').forEach((b) => { b.disabled = true; });
  }

  function render() {
    const s = load();
    let secRead = 0; let secTotal = 0; let chRead = 0; let chTotal = 0; let exOk = 0; let exTotal = 0;
    const parts = new Map<string, { r: number; t: number }>();
    document.querySelectorAll<HTMLElement>('.progress-ch[data-published="1"]').forEach((li) => {
      const total = Number(li.dataset.total);
      const n = Math.min(total, (s.read[li.dataset.ch!] ?? []).length);
      const exIds = (li.dataset.ex || '').split(' ').filter(Boolean);
      const exN = exIds.filter((id) => s.ex[id]).length;
      secRead += n; secTotal += total; chTotal++; if (n >= total) chRead++;
      exOk += exN; exTotal += exIds.length;
      const pt = parts.get(li.dataset.part!) ?? { r: 0, t: 0 };
      pt.r += n; pt.t += total; parts.set(li.dataset.part!, pt);
      const bar = li.querySelector<HTMLElement>('.bar')!;
      bar.setAttribute('aria-valuenow', String(n));
      bar.setAttribute('aria-valuetext', tr('barText', { n, t: total }));
      bar.querySelector('span')!.style.width = `${(100 * n) / total}%`;
      li.classList.toggle('done', n >= total);
      li.querySelector<HTMLElement>('[data-detail]')!.textContent =
        (n >= total ? tr('chRead') : n ? tr('chPartial', { n, t: total }) : tr('chNone')) +
        (exIds.length ? ' · ' + tr('chEx', { n: exN, t: exIds.length }) : '');
    });
    parts.forEach((v, k) => {
      const el = document.querySelector<HTMLElement>(`[data-part-pct="${k}"]`);
      if (el) el.textContent = v.t ? `${Math.round((100 * v.r) / v.t)} %` : '';
    });
    const set = (k: string, v: string) => { const el = document.querySelector<HTMLElement>(`[data-sum="${k}"]`); if (el) el.textContent = v; };
    set('sections', `${secRead} / ${secTotal}`);
    set('chapters', `${chRead} / ${chTotal}`);
    set('exercises', `${exOk} / ${exTotal}`);
    const resume = document.querySelector<HTMLAnchorElement>('[data-resume]')!;
    if (s.last) {
      resume.href = s.last.url;
      resume.querySelector('[data-resume-label]')!.textContent = s.last.section ? `${s.last.title} · ${s.last.section}` : s.last.title;
      resume.hidden = false;
    } else resume.hidden = true;
  }

  // Segunda pulsación para confirmar, sin diálogos del navegador.
  const armed = new WeakMap<HTMLElement, number>();
  function confirmTwice(el: HTMLElement, label: string, confirmLabel: string): boolean {
    if (armed.has(el)) { clearTimeout(armed.get(el)); armed.delete(el); el.textContent = label; return true; }
    el.textContent = confirmLabel;
    armed.set(el, window.setTimeout(() => { armed.delete(el); el.textContent = label; }, 5000));
    return false;
  }

  document.querySelector<HTMLButtonElement>('[data-act="export"]')!.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'quantlab', version: 1, exported: new Date().toISOString(), data: load() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `quantlab-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    msg.textContent = tr('exported');
  });

  const fileInput = document.querySelector<HTMLInputElement>('[data-act="import"]')!;
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    fileInput.value = '';
    if (!f) return;
    let data: Store | null = null;
    try { data = f.size < 1_000_000 ? normalize(JSON.parse(await f.text())) : null; } catch { data = null; }
    if (!data) { msg.textContent = tr('importBad'); return; }
    // Se suma a lo que ya hay: no se pierde nada de este dispositivo.
    const cur = load();
    for (const [k, v] of Object.entries(data.read)) cur.read[k] = [...new Set([...(cur.read[k] ?? []), ...v])];
    Object.assign(cur.ex, data.ex);
    if (data.last && (!cur.last || data.last.ts > cur.last.ts)) cur.last = data.last;
    msg.textContent = save(cur) ? tr('imported') : tr('noStorage');
    render();
  });

  const clearBtn = document.querySelector<HTMLButtonElement>('[data-act="clear"]')!;
  clearBtn.addEventListener('click', () => {
    if (!confirmTwice(clearBtn, tr('clear'), tr('clearConfirm'))) { msg.textContent = tr('clearHint'); return; }
    try { localStorage.removeItem(KEY); } catch { /* nada */ }
    msg.textContent = tr('cleared');
    render();
  });

  render();
}
