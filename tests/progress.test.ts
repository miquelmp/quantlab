import { describe, it, expect } from 'vitest';
import { normalize } from '../src/lib/client/progress';

describe('Mi progreso: importar', () => {
  it('acepta el fichero exportado y descarta lo que no encaja', () => {
    const s = normalize({ app: 'quantlab', version: 1, data: { read: { 'es/7': ['idea', 3], 'x': ['y'] }, ex: { '7.1': 'ok', '7.2': 'no', mal: 'ok' }, last: { url: 'javascript:alert(1)', title: 't', ts: 1 } } });
    expect(s).toEqual({ read: { 'es/7': ['idea'] }, ex: { '7.1': 'ok' } });
  });
  it('rechaza ficheros que no son de quantlab', () => {
    expect(normalize({ foo: 1 })).toBeNull();
    expect(normalize('hola')).toBeNull();
  });
});

describe('Mi progreso: enlace «Seguir donde lo dejé»', () => {
  it('solo acepta rutas de esta web', async () => {
    const { isLocalPath } = await import('../src/lib/client/progress');
    expect(isLocalPath('/quantlab/es/capitulos/2-valor-temporal-del-dinero/#formalizacion')).toBe(true);
    for (const bad of ['//attacker.example/login', '/\\attacker.example', 'https://x.y/', 'javascript:alert(1)', '/a b']) expect(isLocalPath(bad)).toBe(false);
  });
});

