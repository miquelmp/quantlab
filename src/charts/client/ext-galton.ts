/**
 * Animación del tablero de Galton (capítulo 5): las bolas caen una tras otra y las casillas se
 * llenan. Se puede pausar y respeta la preferencia «reducir movimiento» (RF-GRA-13).
 */
import type { ChartExt, ChartApi } from './mount';
import { BALLS } from '../ch05-campana';

const DURATION = 4500; // ms para dejar caer todas las bolas

let shown = 0;
let running = false;
let paused = false;
let lastTs = 0;
let wired = false;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function updateButton(api: ChartApi) {
  const btn = api.root.querySelector<HTMLButtonElement>('[data-act="pause"]');
  if (!btn) return;
  btn.hidden = !running;
  btn.textContent = api.ctx.tr(paused ? 'chart.play' : 'chart.pause');
}

function tick(api: ChartApi, ts: number) {
  if (!running) return;
  if (paused) { lastTs = ts; requestAnimationFrame((t) => tick(api, t)); return; }
  const dt = lastTs ? ts - lastTs : 16;
  lastTs = ts;
  // Empieza despacio (se ven las bolas una a una) y acelera.
  const speed = shown < 30 ? 0.15 : Math.max(1, (BALLS * dt) / DURATION);
  shown = Math.min(BALLS, shown + speed);
  api.data.shown = Math.floor(shown);
  api.renderPanels(['galton']);
  if (shown >= BALLS) { running = false; updateButton(api); return; }
  requestAnimationFrame((t) => tick(api, t));
}

export const ext: ChartExt = {
  afterCompute(api, changed) {
    const restart = changed.has('seed') || changed.has('rows') || !wired;
    if (restart) {
      if (reducedMotion()) { shown = BALLS; running = false; }
      else {
        shown = 0; paused = false; lastTs = 0;
        if (!running) { running = true; requestAnimationFrame((t) => tick(api, t)); }
      }
    }
    api.data.shown = Math.floor(shown);
    if (!wired) {
      wired = true;
      api.root.querySelector<HTMLButtonElement>('[data-act="pause"]')?.addEventListener('click', () => {
        paused = !paused;
        updateButton(api);
      });
    }
    updateButton(api);
  },
};
