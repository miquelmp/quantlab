/// <reference lib="webworker" />
/**
 * Ejecuta Python (Pyodide) en un hilo aparte, aislado de la página (RNF-PRI-03).
 * Mensajes de entrada: { type: 'run', id, code, indexURL } | { type: 'reset' }
 * Mensajes de salida: status | stdout | stderr | done | error
 */
let pyodide: any = null;
let ns: any = null;
let loading: Promise<any> | null = null;

/** Espacio global nuevo, como el de un programa: con «__name__ == '__main__'» se ejecuta main(). */
function freshNamespace(py: any) {
  const d = py.globals.get('dict')();
  d.set('__name__', '__main__');
  return d;
}

const post = (m: any) => (self as any).postMessage(m);

async function ensure(indexURL: string, id: string) {
  if (pyodide) return pyodide;
  if (!loading) {
    loading = (async () => {
      post({ type: 'status', id, status: 'loading' });
      const mod = await import(/* @vite-ignore */ indexURL + 'pyodide.mjs');
      const py = await mod.loadPyodide({ indexURL });
      ns = freshNamespace(py);
      pyodide = py;
      return py;
    })();
  }
  return loading;
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === 'reset') {
    if (pyodide && ns) { ns.destroy(); ns = freshNamespace(pyodide); }
    post({ type: 'reset-done' });
    return;
  }
  if (msg.type !== 'run') return;
  const { id, code, indexURL } = msg;
  try {
    const py = await ensure(indexURL, id);
    if (/^\s*(import|from)\s+numpy/m.test(code)) {
      post({ type: 'status', id, status: 'numpy' });
      await py.loadPackagesFromImports(code);
    }
    py.setStdout({ batched: (s: string) => post({ type: 'stdout', id, text: s }) });
    py.setStderr({ batched: (s: string) => post({ type: 'stderr', id, text: s }) });
    post({ type: 'status', id, status: 'running' });
    await py.runPythonAsync(code, { globals: ns });
    post({ type: 'done', id });
  } catch (err: any) {
    const text = String(err?.message ?? err);
    post({ type: 'error', id, text, fatal: !pyodide });
  }
};
