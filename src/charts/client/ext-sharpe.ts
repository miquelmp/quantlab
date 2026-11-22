/**
 * Arrastre accesible de los fondos del capítulo 8: sobre cada fondo se coloca un botón
 * transparente que se puede arrastrar con el ratón o el dedo, o enfocar con el tabulador y mover
 * con las flechas (↑↓ rentabilidad, ←→ volatilidad; con Mayúsculas, pasos más grandes).
 * Los botones están fuera del SVG para que la imagen siga siendo una imagen accesible.
 */
import type { ChartExt, ChartApi } from './mount';
import { planeScales, legendItems, H, X_MAX, Y_MIN, Y_MAX, MARGIN, FUNDS } from '../ch08-sharpe';
import { legendHeight } from '../svg';
import { fmtPct } from '../../lib/format';

let layer: HTMLElement | null = null;
let dragging: string | null = null;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const round = (v: number, step: number) => Math.round(v / step) * step;

function scales(api: ChartApi, host: HTMLElement) {
  const w = Math.max(260, Math.floor(host.clientWidth));
  const lh = legendHeight(legendItems(api.ctx), w - MARGIN.left - MARGIN.right);
  return planeScales(w, H, lh);
}

function label(api: ChartApi, f: string) {
  const p = (v: number) => fmtPct(v, 1, api.ctx.fmt);
  return api.ctx.tr('c8.dragLabel', { f, mu: p(api.state[`mu${f}`]), s: p(api.state[`s${f}`]) });
}

function build(api: ChartApi, panel: HTMLElement, host: HTMLElement) {
  layer = document.createElement('div');
  layer.className = 'drag-layer';
  for (const f of FUNDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'drag-handle';
    b.dataset.fund = f;
    layer.appendChild(b);
    b.addEventListener('pointerdown', (ev) => {
      dragging = f;
      b.setPointerCapture(ev.pointerId);
      b.focus({ preventScroll: true });
      ev.preventDefault();
    });
    b.addEventListener('pointermove', (ev) => {
      if (dragging !== f) return;
      const { sx, sy } = scales(api, host);
      const r = host.getBoundingClientRect();
      api.state[`s${f}`] = clamp(round(sx.invert(ev.clientX - r.left), 0.0025), 0.01, X_MAX);
      api.set(`mu${f}`, clamp(round(sy.invert(ev.clientY - r.top), 0.0025), Y_MIN, Y_MAX));
    });
    const end = () => { dragging = null; };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
    b.addEventListener('keydown', (ev) => {
      const step = ev.shiftKey ? 0.01 : 0.0025;
      let k = '';
      let v = 0;
      if (ev.key === 'ArrowUp') { k = `mu${f}`; v = clamp(api.state[k] + step, Y_MIN, Y_MAX); }
      else if (ev.key === 'ArrowDown') { k = `mu${f}`; v = clamp(api.state[k] - step, Y_MIN, Y_MAX); }
      else if (ev.key === 'ArrowRight') { k = `s${f}`; v = clamp(api.state[k] + step, 0.01, X_MAX); }
      else if (ev.key === 'ArrowLeft') { k = `s${f}`; v = clamp(api.state[k] - step, 0.01, X_MAX); }
      else return;
      ev.preventDefault();
      api.set(k, +v.toFixed(4));
    });
  }
  panel.style.position = 'relative';
  host.insertAdjacentElement('afterend', layer);
}

export const ext: ChartExt = {
  afterRender(api, ids) {
    if (!ids.includes('plano')) return;
    const panel = api.panelEl('plano');
    const host = panel?.querySelector<HTMLElement>('.panel-svg');
    if (!panel || !host) return;
    if (!layer || !panel.contains(layer)) build(api, panel, host);
    const { sx, sy } = scales(api, host);
    const off = host.offsetTop;
    const offL = host.offsetLeft;
    layer!.querySelectorAll<HTMLButtonElement>('button[data-fund]').forEach((b) => {
      const f = b.dataset.fund!;
      b.style.left = `${offL + sx(api.state[`s${f}`]) - 16}px`;
      b.style.top = `${off + sy(api.state[`mu${f}`]) - 16}px`;
      b.setAttribute('aria-label', label(api, f));
    });
  },
};
