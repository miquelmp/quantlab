/**
 * Arrastre accesible de los fondos del capítulo 8 (RF-GRA: «arrastre accesible»): con el ratón o
 * el dedo, o enfocando un fondo con el tabulador y moviéndolo con las flechas
 * (↑↓ rentabilidad, ←→ volatilidad; con Mayúsculas, pasos más grandes).
 */
import type { ChartExt, ChartApi } from './mount';
import { planeScales, legendItems, H, X_MAX, Y_MIN, Y_MAX, MARGIN } from '../ch08-sharpe';
import { legendHeight } from '../svg';
import { fmtPct } from '../../lib/format';

let wired = false;
let focused: string | null = null;
let dragging: string | null = null;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const round = (v: number, step: number) => Math.round(v / step) * step;

function scales(api: ChartApi, host: HTMLElement) {
  const w = host.getBoundingClientRect().width;
  const lh = legendHeight(legendItems(api.ctx), w - MARGIN.left - MARGIN.right);
  return planeScales(w, H, lh);
}

function label(api: ChartApi, f: string) {
  const p = (v: number) => fmtPct(v, 1, api.ctx.fmt);
  return api.ctx.tr('c8.dragLabel', { f, mu: p(api.state[`mu${f}`]), s: p(api.state[`s${f}`]) });
}

export const ext: ChartExt = {
  afterRender(api, ids) {
    if (!ids.includes('plano')) return;
    const el = api.panelEl('plano');
    const host = el?.querySelector<HTMLElement>('.panel-svg');
    if (!host) return;
    host.querySelectorAll<SVGGElement>('g[data-fund]').forEach((g) => {
      const f = g.dataset.fund!;
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', label(api, f));
      g.style.cursor = 'grab';
    });
    if (focused) host.querySelector<SVGGElement>(`g[data-fund="${focused}"]`)?.focus({ preventScroll: true });
    if (wired) return;
    wired = true;
    const move = (ev: PointerEvent) => {
      if (!dragging) return;
      const { sx, sy } = scales(api, host);
      const r = host.getBoundingClientRect();
      const sigma = clamp(round(sx.invert(ev.clientX - r.left), 0.0025), 0.01, X_MAX);
      const mu = clamp(round(sy.invert(ev.clientY - r.top), 0.0025), Y_MIN, Y_MAX);
      api.state[`s${dragging}`] = sigma;
      api.set(`mu${dragging}`, mu);
    };
    host.addEventListener('pointerdown', (ev) => {
      const g = (ev.target as Element).closest?.('g[data-fund]') as SVGGElement | null;
      if (!g) return;
      dragging = g.dataset.fund!;
      focused = dragging;
      host.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    host.addEventListener('pointermove', move);
    const end = () => { dragging = null; };
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
    host.addEventListener('focusin', (ev) => { const g = (ev.target as Element).closest?.('g[data-fund]') as SVGGElement | null; if (g) focused = g.dataset.fund!; });
    host.addEventListener('focusout', (ev) => { if (!host.contains(ev.relatedTarget as Node)) setTimeout(() => { if (!host.contains(document.activeElement)) focused = null; }, 0); });
    host.addEventListener('keydown', (ev) => {
      const g = (ev.target as Element).closest?.('g[data-fund]') as SVGGElement | null;
      if (!g) return;
      const f = g.dataset.fund!;
      const step = ev.shiftKey ? 0.01 : 0.0025;
      let k = '';
      let v = 0;
      if (ev.key === 'ArrowUp') { k = `mu${f}`; v = clamp(api.state[k] + step, Y_MIN, Y_MAX); }
      else if (ev.key === 'ArrowDown') { k = `mu${f}`; v = clamp(api.state[k] - step, Y_MIN, Y_MAX); }
      else if (ev.key === 'ArrowRight') { k = `s${f}`; v = clamp(api.state[k] + step, 0.01, X_MAX); }
      else if (ev.key === 'ArrowLeft') { k = `s${f}`; v = clamp(api.state[k] - step, 0.01, X_MAX); }
      else return;
      ev.preventDefault();
      focused = f;
      api.set(k, +v.toFixed(4));
    });
  },
};
