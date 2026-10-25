import { useStore } from '@/store';
import { useTabuleiroStore, type Casa, type Terreno } from '@/store/tabuleiroStore';
import { casasDe, chaveCasa, useGrade } from './grade';
import { useCombatentes, type Combatente, type TipoCombatente } from './combatentes';

export const DESLOCAMENTO_PADRAO = 6;

const VIZINHOS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;

const ladoDaMesa = (t: TipoCombatente) => (t === 'jogador' || t === 'aliado' ? 'grupo' : 'oponentes');

/**
 * Casas que a peça alcança a partir de `inicio` gastando até `maximo`, com o custo de cada uma.
 * Anda nas 8 direções; terreno difícil custa 2; parede bloqueia; passa por quem é do mesmo
 * lado mas não por oponente; diagonal não corta quina de parede. O destino final ainda
 * precisa estar livre de qualquer peça (o chamador confere). Com `anterior`, anota de
 * qual casa se chegou em cada uma, para refazer o caminho.
 */
export function alcance({ inicio, lado, maximo, colunas, linhas, terreno, bloqueia, anterior }: {
  inicio: Casa; lado: number; maximo: number; colunas: number; linhas: number;
  terreno: Record<string, Terreno>; bloqueia: (chave: string) => boolean; anterior?: Map<string, string>;
}): Map<string, number> {
  const passavel = (x: number, y: number) => {
    if (x < 0 || y < 0 || x + lado > colunas || y + lado > linhas) return false;
    return casasDe({ x, y }, lado).every((k) => terreno[k] !== 'parede' && !bloqueia(k));
  };
  const custo = new Map<string, number>([[chaveCasa(inicio.x, inicio.y), 0]]);
  const fila: { x: number; y: number; g: number }[] = [{ ...inicio, g: 0 }];
  while (fila.length) {
    // Grade pequena: tirar o menor da fila linear é suficiente
    let i = 0;
    for (let j = 1; j < fila.length; j++) if (fila[j].g < fila[i].g) i = j;
    const { x, y, g } = fila.splice(i, 1)[0];
    if (g > (custo.get(chaveCasa(x, y)) ?? Infinity)) continue;
    for (const [dx, dy] of VIZINHOS) {
      const nx = x + dx, ny = y + dy;
      if (!passavel(nx, ny)) continue;
      if (dx && dy && (!passavel(x + dx, y) || !passavel(x, y + dy))) continue;
      const dificil = casasDe({ x: nx, y: ny }, lado).some((k) => terreno[k] === 'dificil');
      const ng = g + (dificil ? 2 : 1);
      const k = chaveCasa(nx, ny);
      if (ng <= maximo && ng < (custo.get(k) ?? Infinity)) {
        custo.set(k, ng);
        anterior?.set(k, chaveCasa(x, y));
        fila.push({ x: nx, y: ny, g: ng });
      }
    }
  }
  return custo;
}

/**
 * Regra de movimento ligada: quanto cada peça anda (jogador pela raça, os demais pelo
 * valor do mestre) e quanto ainda sobra. Em combate só a peça da vez anda, e o que ela já
 * andou na vez (a API soma, indo e voltando conta) sai do deslocamento; fora de combate
 * cada arrasto vale o deslocamento inteiro.
 */
export function useMovimento() {
  const { lista, emCombate, vezId } = useCombatentes();
  const { regraMovimento, deslocamentos, racas, movimento } = useTabuleiroStore();
  const turnoAtual = useStore((s) => s.currentTurn);
  const { colunas, linhas, posicoes, terreno, tamanhoDe, ocupacao } = useGrade(lista);
  const porId = new Map(lista.map((c) => [c.id, c]));

  function deslocamentoDe(c: Combatente): { casas: number; fonte: string } {
    if (c.jogador) {
      const raca = racas.find((r) => r.name === c.jogador!.char.race);
      return { casas: raca?.deslocamento ?? DESLOCAMENTO_PADRAO, fonte: raca ? `raça ${raca.name}` : 'padrão (raça não encontrada)' };
    }
    return { casas: deslocamentos[c.id] ?? DESLOCAMENTO_PADRAO, fonte: deslocamentos[c.id] != null ? 'definido pelo mestre' : 'padrão' };
  }

  /** Casas que a peça já andou nesta vez (só em combate). */
  function jaAndou(id: string): number {
    return emCombate && movimento?.id === id && movimento.turno === turnoAtual ? movimento.gasto : 0;
  }

  /** 'livre' quando a regra está desligada ou a peça está na reserva; 'travado' quando não é a vez dela. */
  function regraPara(id: string): 'livre' | 'travado' | { inicio: Casa; maximo: number; total: number } {
    const c = porId.get(id);
    const atual = posicoes[id];
    if (!regraMovimento || !c || !atual) return 'livre';
    if (emCombate && id !== vezId) return 'travado';
    const total = deslocamentoDe(c).casas;
    return { inicio: atual, maximo: Math.max(0, total - jaAndou(id)), total };
  }

  /** Casas de destino possíveis (canto da peça) com o custo; null quando não há limite. */
  function destinosDe(id: string, anterior?: Map<string, string>): Map<string, number> | null {
    const r = regraPara(id);
    const c = porId.get(id);
    if (typeof r === 'string' || !c) return null;
    const meuLado = ladoDaMesa(c.tipo);
    const lado = tamanhoDe(id);
    const custo = alcance({
      inicio: r.inicio, lado, maximo: r.maximo, colunas, linhas, terreno, anterior,
      bloqueia: (k) => {
        const o = ocupacao.get(k);
        const oc = o && o !== id ? porId.get(o) : undefined;
        return !!oc && ladoDaMesa(oc.tipo) !== meuLado;
      },
    });
    // Termina só onde não há outra peça
    for (const k of [...custo.keys()]) {
      const [x, y] = k.split(',').map(Number);
      if (casasDe({ x, y }, lado).some((q) => { const o = ocupacao.get(q); return o && o !== id; })) custo.delete(k);
    }
    return custo;
  }

  /** Casas (canto da peça) por onde ela passa da origem do turno até `destino`, sem a origem. */
  function caminhoAte(id: string, destino: Casa): Casa[] {
    const anterior = new Map<string, string>();
    const custo = destinosDe(id, anterior);
    let k = chaveCasa(destino.x, destino.y);
    if (!custo?.has(k)) return [];
    const r: Casa[] = [];
    while (anterior.has(k)) {
      const [x, y] = k.split(',').map(Number);
      r.unshift({ x, y });
      k = anterior.get(k)!;
    }
    return r;
  }

  /** Quanto a peça já andou na vez e o total (só com a regra valendo para ela). */
  function gastoDe(id: string): { usado: number; maximo: number } | null {
    const r = regraPara(id);
    if (typeof r === 'string') return null;
    return { usado: jaAndou(id), maximo: r.total };
  }

  return { ativo: regraMovimento, deslocamentoDe, regraPara, destinosDe, caminhoAte, gastoDe, jaAndou };
}
