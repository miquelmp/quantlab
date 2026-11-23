import { describe, it, expect } from 'vitest';
import { toPy, toIpynb } from '../src/lib/download';

const b = { title: 'Capítulo 7 · Volatilidad', url: 'https://example.org/c7/', blocks: ['import numpy as np\nx = 1', 'print(x)\n'] };

describe('descargas del código', () => {
  it('.py con una celda «# %%» por fragmento', () => {
    const py = toPy(b);
    expect(py.startsWith('# Capítulo 7 · Volatilidad\n# https://example.org/c7/')).toBe(true);
    expect(py.match(/^# %% Fragmento \d+$/gm)).toHaveLength(2);
    expect(py).toContain('x = 1\n');
  });
  it('.ipynb válido en formato 4, con el código línea a línea', () => {
    const nb = JSON.parse(toIpynb(b));
    expect(nb.nbformat).toBe(4);
    expect(nb.cells.map((c: any) => c.cell_type)).toEqual(['markdown', 'code', 'code']);
    expect(nb.cells[1].source).toEqual(['import numpy as np\n', 'x = 1']);
    expect(nb.cells[2].source.join('')).toBe('print(x)');
    expect(nb.cells[1].outputs).toEqual([]);
  });
});
