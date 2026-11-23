/**
 * Descargas del código (RF-PY-08): los fragmentos de Python de una página como guion `.py`
 * (celdas «# %%», que entienden VS Code, Spyder o PyCharm) y como cuaderno Jupyter `.ipynb`.
 */
/** `license`: texto completo de la licencia MIT del repositorio (fichero LICENSE). */
export interface CodeBundle { title: string; url: string; blocks: string[]; license: string }

const LICENSE_URL = 'https://github.com/miquelmp/quantlab/blob/main/LICENSE';
const copyright = (b: CodeBundle) => b.license.split('\n').find((l) => /^Copyright/i.test(l.trim()))?.trim() ?? '';

export function toPy(b: CodeBundle): string {
  const head = `# ${b.title}\n# ${b.url}\n# ${copyright(b)}. Licencia MIT (texto completo al final): ${LICENSE_URL}\n` +
    '# Los fragmentos comparten variables: ejecútalos en orden.\n';
  const lic = '\n# %% Licencia\n' + b.license.trimEnd().split('\n').map((l) => (l ? `# ${l}` : '#')).join('\n') + '\n';
  return head + b.blocks.map((c, i) => `\n# %% Fragmento ${i + 1}\n${c.trimEnd()}\n`).join('') + lic;
}

const lines = (s: string) => s.split('\n').map((l, i, a) => (i < a.length - 1 ? l + '\n' : l));

export function toIpynb(b: CodeBundle): string {
  const nb = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { name: 'python3', display_name: 'Python 3', language: 'python' },
      language_info: { name: 'python' },
    },
    cells: [
      { cell_type: 'markdown', id: 'intro', metadata: {}, source: lines(`# ${b.title}\n\nCódigo de [${b.url}](${b.url}). ${copyright(b)}. [Licencia MIT](${LICENSE_URL}), texto completo al final.\n\nLos fragmentos comparten variables: ejecútalos en orden.`) },
      ...b.blocks.map((c, i) => ({ cell_type: 'code', id: `f${i + 1}`, metadata: {}, execution_count: null, outputs: [], source: lines(c.trimEnd()) })),
      { cell_type: 'markdown', id: 'licencia', metadata: {}, source: lines('## Licencia\n\n```text\n' + b.license.trimEnd() + '\n```') },
    ],
  };
  return JSON.stringify(nb, null, 1) + '\n';
}
