import { useTabuleiroStore, type Casa } from '@/store/tabuleiroStore';
import type { Combatente } from './combatentes';

export const chaveCasa = (x: number, y: number) => `${x},${y}`;

export const TAMANHOS = [1, 2, 3, 4] as const;

/** Lado da peça em casas: o que o mestre escolheu ou o padrão do tipo (boss 2×2). */
export function tamanhoPadrao(c: Combatente, tamanhos: Record<string, number>): number {
  return tamanhos[c.id] ?? (c.tipo === 'boss' ? 2 : 1);
}

/** Casas que a peça cobre a partir do canto de cima à esquerda. */
export function casasDe(casa: Casa, lado: number): string[] {
  const r: string[] = [];
  for (let dx = 0; dx < lado; dx++) for (let dy = 0; dy < lado; dy++) r.push(chaveCasa(casa.x + dx, casa.y + dy));
  return r;
}

/**
 * Situação atual do tabuleiro: quem está no campo, que casa cada um ocupa e
 * se uma peça cabe num lugar (dentro da grade, sem parede, sem outra peça).
 */
export function useGrade(lista: Combatente[]) {
  const { colunas, linhas, posicoes, tamanhos, terreno } = useTabuleiroStore();
  const tamanhoDe = (id: string) => {
    const c = lista.find((x) => x.id === id);
    return c ? tamanhoPadrao(c, tamanhos) : tamanhos[id] ?? 1;
  };

  const noCampo: { c: Combatente; casa: Casa; lado: number }[] = [];
  const reserva: Combatente[] = [];
  const ocupacao = new Map<string, string>();
  for (const c of lista) {
    const casa = posicoes[c.id];
    const lado = tamanhoPadrao(c, tamanhos);
    if (casa && casa.x + lado <= colunas && casa.y + lado <= linhas) {
      noCampo.push({ c, casa, lado });
      for (const k of casasDe(casa, lado)) ocupacao.set(k, c.id);
    } else reserva.push(c);
  }

  /** Se `id` cabe com esse lado a partir de `casa`; `ocupantes` são as outras peças no caminho. */
  function cabe(id: string, casa: Casa, lado: number) {
    const ocupantes = new Set<string>();
    if (casa.x < 0 || casa.y < 0 || casa.x + lado > colunas || casa.y + lado > linhas) return { ok: false, ocupantes };
    let parede = false;
    for (const k of casasDe(casa, lado)) {
      if (terreno[k] === 'parede') parede = true;
      const o = ocupacao.get(k);
      if (o && o !== id) ocupantes.add(o);
    }
    return { ok: !parede && ocupantes.size === 0, ocupantes, parede };
  }

  return { colunas, linhas, posicoes, tamanhos, terreno, tamanhoDe, noCampo, reserva, ocupacao, cabe };
}
