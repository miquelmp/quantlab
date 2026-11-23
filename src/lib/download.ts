/**
 * Descargas del código (RF-PY-08): los fragmentos de Python de una página como guion `.py`
 * (celdas «# %%», que entienden VS Code, Spyder o PyCharm) y como cuaderno Jupyter `.ipynb`.
 */
export interface CodeBundle { title: string; url: string; blocks: string[] }

const LICENSE = 'Licencia CC BY-SA 4.0';

export function toPy(b: CodeBundle): string {
  const head = `# ${b.title}\n# ${b.url}\n# ${LICENSE}. Los fragmentos comparten variables: ejecútalos en orden.\n`;
  return head + b.blocks.map((c, i) => `\n# %% Fragmento ${i + 1}\n${c.trimEnd()}\n`).join('');
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
      { cell_type: 'markdown', id: 'intro', metadata: {}, source: lines(`# ${b.title}\n\nCódigo de [${b.url}](${b.url}). ${LICENSE}.\n\nLos fragmentos comparten variables: ejecútalos en orden.`) },
      ...b.blocks.map((c, i) => ({ cell_type: 'code', id: `f${i + 1}`, metadata: {}, execution_count: null, outputs: [], source: lines(c.trimEnd()) })),
    ],
  };
  return JSON.stringify(nb, null, 1) + '\n';
}
