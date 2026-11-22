/**
 * Bloques de Python ejecutables (RF-PY-01 a RF-PY-07).
 * Todos los bloques de una página comparten un mismo intérprete, de modo que una función
 * definida en un fragmento se puede usar en el siguiente. «Detener» corta la ejecución
 * cerrando el hilo de Python; la siguiente ejecución lo vuelve a preparar (desde la caché).
 */
import { PYODIDE_INDEX_URL } from '../config';

type Tr = (k: string) => string;

let worker: Worker | null = null;
let ready = false;
let busyId: string | null = null;
const handlers = new Map<string, (m: any) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'reset-done') return;
      handlers.get(m.id)?.(m);
    };
  }
  return worker;
}

function killWorker() {
  worker?.terminate();
  worker = null;
  ready = false;
  busyId = null;
}

/** Quita del error las líneas internas de Pyodide y deja lo que interesa al lector. */
function cleanTraceback(text: string): string {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.includes('File "<exec>"'));
  const kept = (start >= 0 ? ['Traceback (most recent call last):', ...lines.slice(start)] : lines)
    .filter((l) => !/\/lib\/python3|_pyodide|pyodide\/|^\s*\^+\s*$/.test(l) || l.includes('<exec>'));
  return kept.join('\n').trim();
}

function setup(block: HTMLElement, tr: Tr) {
  const codeBox = block.querySelector<HTMLElement>('.py-code')!;
  const original = codeBox.querySelector('pre')!.textContent ?? '';
  const out = block.querySelector<HTMLPreElement>('.py-out')!;
  const status = block.querySelector<HTMLElement>('.py-status')!;
  const btn = (act: string) => block.querySelector<HTMLButtonElement>(`[data-act="${act}"]`)!;
  const id = block.id;
  let editor: HTMLTextAreaElement | null = null;
  let highlighted = codeBox.innerHTML;

  const currentCode = () => (editor ? editor.value : original);

  function setRunning(on: boolean) {
    btn('run').disabled = on;
    btn('run').textContent = tr(on ? 'py.running' : 'py.run');
    btn('stop').hidden = !on;
  }

  function append(text: string, cls?: string) {
    out.hidden = false;
    if (cls) {
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = text + '\n';
      out.appendChild(span);
    } else out.appendChild(document.createTextNode(text + '\n'));
  }

  handlers.set(id, (m) => {
    if (m.type === 'status') {
      if (m.status === 'loading') status.textContent = tr('py.loading');
      else if (m.status === 'numpy') status.textContent = tr('py.loadingNumpy');
      else if (m.status === 'running') { ready = true; status.textContent = ''; }
    } else if (m.type === 'stdout') append(m.text);
    else if (m.type === 'stderr') append(m.text, 'py-err');
    else if (m.type === 'done') {
      if (!out.textContent) append(tr('py.noOutput'), 'py-note');
      busyId = null;
      setRunning(false);
      status.textContent = '';
    } else if (m.type === 'error') {
      busyId = null;
      setRunning(false);
      if (m.fatal) { status.textContent = tr('py.loadError'); killWorker(); }
      else { status.textContent = ''; append(cleanTraceback(m.text), 'py-err'); }
    }
  });

  btn('run').addEventListener('click', () => {
    if (busyId) return;
    out.textContent = '';
    out.hidden = true;
    busyId = id;
    setRunning(true);
    if (!ready) status.textContent = tr('py.loading');
    getWorker().postMessage({ type: 'run', id, code: currentCode(), indexURL: PYODIDE_INDEX_URL });
  });

  btn('stop').addEventListener('click', () => {
    killWorker();
    setRunning(false);
    status.textContent = tr('py.stopped');
  });

  btn('copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentCode());
      btn('copy').textContent = tr('py.copied');
      setTimeout(() => (btn('copy').textContent = tr('py.copy')), 1500);
    } catch { /* sin portapapeles: el lector puede seleccionar el texto */ }
  });

  btn('edit').addEventListener('click', () => {
    if (editor) { editor.focus(); return; }
    highlighted = codeBox.innerHTML;
    editor = document.createElement('textarea');
    editor.className = 'py-editor';
    editor.value = original;
    editor.spellcheck = false;
    editor.setAttribute('autocapitalize', 'off');
    editor.setAttribute('autocomplete', 'off');
    editor.setAttribute('aria-label', tr('py.editorLabel'));
    const fit = () => { editor!.style.height = 'auto'; editor!.style.height = editor!.scrollHeight + 4 + 'px'; };
    editor.addEventListener('input', fit);
    editor.addEventListener('keydown', (ev) => {
      // Tab inserta cuatro espacios; Esc devuelve el foco a la página (no atrapa el teclado).
      if (ev.key === 'Tab' && !ev.shiftKey) {
        ev.preventDefault();
        const s = editor!.selectionStart;
        editor!.setRangeText('    ', s, editor!.selectionEnd, 'end');
        fit();
      } else if (ev.key === 'Escape') {
        btn('run').focus();
      } else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        btn('run').click();
      }
    });
    codeBox.innerHTML = '';
    codeBox.appendChild(editor);
    fit();
    editor.focus();
    btn('edit').hidden = true;
    btn('restore').hidden = false;
  });

  btn('restore').addEventListener('click', () => {
    editor = null;
    codeBox.innerHTML = highlighted;
    btn('edit').hidden = false;
    btn('restore').hidden = true;
    btn('edit').focus();
  });
}

export function initPython(tr: Tr) {
  document.querySelectorAll<HTMLElement>('[data-py]').forEach((b) => setup(b, tr));
  document.querySelectorAll<HTMLButtonElement>('[data-py-reset]').forEach((b) =>
    b.addEventListener('click', () => {
      if (busyId) killWorker();
      else worker?.postMessage({ type: 'reset' });
      document.querySelectorAll<HTMLElement>('.py-out').forEach((o) => { o.textContent = ''; o.hidden = true; });
    }));
}
