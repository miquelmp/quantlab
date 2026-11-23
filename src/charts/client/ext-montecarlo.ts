/**
 * Animación de la estimación de π (capítulo 6): los puntos van apareciendo sobre el
 * cuadrado. Se puede pausar y respeta la preferencia «reducir movimiento» (RF-GRA-13).
 */
import { panelH } from '../svg';
import type { ChartExt, ChartApi } from './mount';

const DURATION = 3500; // ms para dibujar todos los puntos

let shown = 0;
let target = 0;
let running = false;
let paused = false;
let lastTs = 0;
let canvas: HTMLCanvasElement | null = null;
let drawn = 0;
let geomKey = '';

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function geometry(w: number) {
  const size = Math.min(w, panelH(w, 340) < 340 ? 250 : 340);   // igual que scatterPanel (ch06)
  const ox = (w - size) / 2 + 30;
  const inner = size - 52;
  return { size, ox, inner, top: 10 };
}

function ensureCanvas(api: ChartApi): CanvasRenderingContext2D | null {
  const el = api.panelEl('pi');
  if (!el) return null;
  const host = el.querySelector<HTMLElement>('.panel-svg')!;
  const w = Math.max(260, Math.floor(host.clientWidth || el.clientWidth));
  const g = geometry(w);
  const key = `${w}`;
  if (!canvas || !host.contains(canvas) || key !== geomKey) {
    canvas?.remove();
    canvas = document.createElement('canvas');
    canvas.className = 'pi-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(g.inner * dpr);
    canvas.height = Math.round(g.inner * dpr);
    canvas.style.width = `${g.inner}px`;
    canvas.style.height = `${g.inner}px`;
    canvas.style.left = `${g.ox}px`;
    canvas.style.top = `${g.top}px`;
    host.style.position = 'relative';
    host.appendChild(canvas);
    geomKey = key;
    drawn = 0;
  }
  const c = canvas.getContext('2d');
  if (c) { const dpr = window.devicePixelRatio || 1; c.setTransform(dpr, 0, 0, dpr, 0, 0); }
  return c;
}

function drawPoints(api: ChartApi, upTo: number) {
  const c = ensureCanvas(api);
  if (!c || !canvas) return;
  const b = api.data.base;
  const inner = parseFloat(canvas.style.width);
  const css = getComputedStyle(api.root);
  const cin = css.getPropertyValue('--series-1').trim() || '#2a78d6';
  const cout = css.getPropertyValue('--series-2').trim() || '#eb6834';
  if (upTo < drawn) { c.clearRect(0, 0, inner, inner); drawn = 0; }
  const sz = b.M > 5000 ? 1.4 : 2;
  for (let i = drawn; i < upTo; i++) {
    c.fillStyle = b.piIn[i] ? cin : cout;
    c.fillRect(b.piX[i] * inner - sz / 2, (1 - b.piY[i]) * inner - sz / 2, sz, sz);
  }
  drawn = upTo;
}

function tick(api: ChartApi, ts: number) {
  if (!running) return;
  if (paused) { lastTs = ts; requestAnimationFrame((t) => tick(api, t)); return; }
  const dt = lastTs ? ts - lastTs : 16;
  lastTs = ts;
  shown = Math.min(target, shown + Math.max(1, Math.round((target * dt) / DURATION)));
  api.data.piShown = shown;
  drawPoints(api, shown);
  api.renderPanels(['pi-est']);
  if (shown >= target) { running = false; updateButton(api); return; }
  requestAnimationFrame((t) => tick(api, t));
}

function updateButton(api: ChartApi) {
  const btn = api.root.querySelector<HTMLButtonElement>('[data-act="pause"]');
  if (!btn) return;
  btn.hidden = !running;
  btn.textContent = api.ctx.tr(paused ? 'chart.play' : 'chart.pause');
}

let wired = false;

export const ext: ChartExt = {
  afterCompute(api, changed) {
    api.data.useCanvas = true;
    const restart = changed.has('seed') || changed.has('M') || target === 0;
    target = api.data.base.M;
    if (restart) {
      drawn = 0;
      if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      if (reducedMotion()) { shown = target; running = false; }
      else { shown = 0; paused = false; lastTs = 0; if (!running) { running = true; requestAnimationFrame((t) => tick(api, t)); } }
    }
    api.data.piShown = shown;
    if (!wired) {
      wired = true;
      api.root.querySelector<HTMLButtonElement>('[data-act="pause"]')?.addEventListener('click', () => {
        paused = !paused;
        updateButton(api);
      });
    }
    updateButton(api);
  },
  afterRender(api, ids) {
    if (ids.includes('pi')) { drawn = 0; geomKey = ''; drawPoints(api, shown); }
  },
};
