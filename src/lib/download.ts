/**
 * Descargas del código (RF-PY-08): los fragmentos de Python de una página como guion `.py`
 * (celdas «# %%», que entienden VS Code, Spyder o PyCharm) y como cuaderno Jupyter `.ipynb`.
 */
/** `license`: texto completo de la licencia MIT del repositorio (fichero LICENSE). */
export interface CodeBundle { title: string; url: string; blocks: string[]; license: string; lang?: string }

/** Textos de los ficheros descargados, por idioma (español por defecto). */
const TXT: Record<string, { license: string; full: string; order: string; snippet: string; codeFrom: string; fullEnd: string; mit: string }> = {
  es: { license: 'Licencia', full: 'Licencia MIT (texto completo al final)', order: 'Los fragmentos comparten variables: ejecútalos en orden.', snippet: 'Fragmento', codeFrom: 'Código de', fullEnd: 'texto completo al final', mit: 'Licencia MIT' },
  en: { license: 'Licence', full: 'MIT licence (full text at the end)', order: 'The snippets share variables: run them in order.', snippet: 'Snippet', codeFrom: 'Code from', fullEnd: 'full text at the end', mit: 'MIT licence' },
};
const txt = (b: CodeBundle) => TXT[b.lang ?? 'es'] ?? TXT.es;

const LICENSE_URL = 'https://github.com/miquelmp/quantlab/blob/main/LICENSE';
const copyright = (b: CodeBundle) => b.license.split('\n').find((l) => /^Copyright/i.test(l.trim()))?.trim() ?? '';

export function toPy(b: CodeBundle): string {
  const T = txt(b);
  const head = `# ${b.title}\n# ${b.url}\n# ${copyright(b)}. ${T.full}: ${LICENSE_URL}\n# ${T.order}\n`;
  const lic = `\n# %% ${T.license}\n` + b.license.trimEnd().split('\n').map((l) => (l ? `# ${l}` : '#')).join('\n') + '\n';
  return head + b.blocks.map((c, i) => `\n# %% ${T.snippet} ${i + 1}\n${c.trimEnd()}\n`).join('') + lic;
}

const lines = (s: string) => s.split('\n').map((l, i, a) => (i < a.length - 1 ? l + '\n' : l));

export function toIpynb(b: CodeBundle): string {
  const T = txt(b);
  const nb = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { name: 'python3', display_name: 'Python 3', language: 'python' },
      language_info: { name: 'python' },
    },
    cells: [
      { cell_type: 'markdown', id: 'intro', metadata: {}, source: lines(`# ${b.title}\n\n${T.codeFrom} [${b.url}](${b.url}). ${copyright(b)}. [${T.mit}](${LICENSE_URL}), ${T.fullEnd}.\n\n${T.order}`) },
      ...b.blocks.map((c, i) => ({ cell_type: 'code', id: `f${i + 1}`, metadata: {}, execution_count: null, outputs: [], source: lines(c.trimEnd()) })),
      { cell_type: 'markdown', id: 'licencia', metadata: {}, source: lines(`## ${T.license}\n\n` + '```text\n' + b.license.trimEnd() + '\n```') },
    ],
  };
  return JSON.stringify(nb, null, 1) + '\n';
}
