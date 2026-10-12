import type { Ponto } from './types';

const CAMPOS = ['tipo', 'titulo', 'capitulo', 'ordem', 'mapa', 'x', 'y', 'revelado', 'ligadoA', 'corpo'] as const;

const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Junta três versões de um ponto: `base` (o que o editor abriu), `local` (o que o
 * mestre mexeu) e `remoto` (o que chegou do arquivo, editado por fora ou por um
 * arraste). Campo mudado só de um lado entra sem perguntar; mudado dos dois lados
 * com valores diferentes vira conflito.
 */
export function juntar(base: Ponto, local: Ponto, remoto: Ponto): { ponto: Ponto; conflitos: string[] } {
  const conflitos: string[] = [];
  const ponto: Ponto = { ...remoto };
  const p = ponto as unknown as Record<string, unknown>;
  const b = base as unknown as Record<string, unknown>;
  const l = local as unknown as Record<string, unknown>;

  for (const k of CAMPOS) {
    const mudouLocal = !igual(b[k], l[k]);
    if (!mudouLocal) continue;
    if (igual(b[k], p[k]) || igual(l[k], p[k])) p[k] = l[k];
    else conflitos.push(k);
  }

  const extras = { ...remoto.extras };
  const chaves = new Set([...Object.keys(base.extras), ...Object.keys(local.extras), ...Object.keys(remoto.extras)]);
  for (const k of chaves) {
    const mudouLocal = !igual(base.extras[k], local.extras[k]);
    if (!mudouLocal) continue;
    if (igual(base.extras[k], remoto.extras[k]) || igual(local.extras[k], remoto.extras[k])) {
      if (local.extras[k] === undefined) delete extras[k]; else extras[k] = local.extras[k];
    } else conflitos.push(k);
  }
  ponto.extras = extras;
  return { ponto, conflitos };
}

/** Compara só o conteúdo (sem hash/arquivo) para saber se há mudança não salva. */
export function mesmoConteudo(a: Ponto, b: Ponto): boolean {
  const limpa = (p: Ponto) => ({ ...p, hash: undefined, arquivo: undefined });
  return igual(limpa(a), limpa(b));
}
