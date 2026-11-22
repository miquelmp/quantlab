/**
 * Tabla editable del capítulo 12: medias, volatilidades y correlaciones de los tres activos.
 * Los valores se escriben en %, salvo las correlaciones (entre −1 y 1).
 */
import type { ChartExt, ChartApi } from './mount';
import { NAMES } from '../ch12-frontera';

let built = false;

function field(api: ChartApi, key: string, label: string, pct: boolean, min: number, max: number, step: number) {
  const id = `${api.root.id}-${key}`;
  const v = pct ? +(api.state[key] * 100).toFixed(2) : api.state[key];
  return `<td><label class="sr-only" for="${id}">${label}</label><input id="${id}" type="number" inputmode="decimal" data-edit="${key}" data-pct="${pct ? 1 : 0}" min="${min}" max="${max}" step="${step}" value="${v}"></td>`;
}

function build(api: ChartApi) {
  const tr = api.ctx.tr;
  const rows = NAMES.map((n, i) =>
    `<tr><th scope="row">${n}</th>${field(api, `m${i + 1}`, tr('c12.editMu', { a: n }), true, -20, 40, 0.5)}${field(api, `s${i + 1}`, tr('c12.editSigma', { a: n }), true, 1, 80, 0.5)}</tr>`).join('');
  const corr = [['r12', 'A', 'B'], ['r13', 'A', 'C'], ['r23', 'B', 'C']].map(([k, a, b]) =>
    `<tr><th scope="row">${a}–${b}</th>${field(api, k, tr('c12.editRho', { a, b }), false, -0.95, 0.95, 0.05)}</tr>`).join('');
  const wrap = document.createElement('div');
  wrap.className = 'chart-edit';
  wrap.innerHTML = `<p class="chart-edit-title">${tr('c12.editTitle')}</p><div class="chart-edit-tables">` +
    `<table><thead><tr><th scope="col">${tr('c12.colAsset')}</th><th scope="col">${tr('c12.colMu')} (%)</th><th scope="col">${tr('c12.axisSigma')} (%)</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<table><thead><tr><th scope="col">${tr('c12.colPair')}</th><th scope="col">${tr('c12.colRho')}</th></tr></thead><tbody>${corr}</tbody></table></div>`;
  api.root.querySelector('.chart-controls')?.insertAdjacentElement('afterend', wrap);
  wrap.addEventListener('input', (ev) => {
    const el = ev.target as HTMLInputElement;
    const key = el.dataset.edit;
    if (!key) return;
    let v = Number(el.value.replace(',', '.'));
    if (!Number.isFinite(v)) return;
    v = Math.min(Number(el.max), Math.max(Number(el.min), v));
    api.set(key, el.dataset.pct === '1' ? v / 100 : v);
  });
  api.root.querySelector('[data-act="reset"]')?.addEventListener('click', () => {
    setTimeout(() => wrap.querySelectorAll<HTMLInputElement>('input[data-edit]').forEach((el) => {
      const k = el.dataset.edit!;
      el.value = String(el.dataset.pct === '1' ? +(api.state[k] * 100).toFixed(2) : api.state[k]);
    }), 0);
  });
}

export const ext: ChartExt = {
  afterCompute(api) {
    if (!built) { built = true; build(api); }
  },
};
