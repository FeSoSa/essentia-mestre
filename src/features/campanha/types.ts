/**
 * Campanha: pontos e capítulos que moram em arquivos markdown na pasta `campanha/`.
 * A API lê e grava os arquivos; o painel só fala com /api/campanha.
 */

/** Referência a algo de fora (mapa, inimigo, item): o id manda, o nome é para quem lê o arquivo. */
export interface CampanhaRef { id?: string; nome?: string; qtd?: number }

export interface Capitulo {
  id: string; titulo: string; ordem: number; resumo: string; pasta: string; hash?: string;
}

export interface Ponto {
  id: string;
  tipo: string;
  titulo: string;
  capitulo: string;
  ordem: number;
  mapa?: CampanhaRef | null;
  x?: number | null;
  y?: number | null;
  revelado: boolean;
  ligadoA: string[];
  /** Campos do cabeçalho que não são base: inimigos, chefes, itens, gatilho, terreno... */
  extras: Record<string, unknown>;
  corpo: string;
  arquivo: string;
  hash?: string;
}

export interface MesaEntrada { instanceId: string; tipo: 'inimigo' | 'chefe'; refId?: string; nome: string; em?: number }
export interface Achado { itemId?: string; nome: string; playerId: string; playerNome?: string; qtd: number; em?: number }

export interface PontoEstado {
  status: 'planejado' | 'ativo' | 'concluido';
  ativadoEm?: number; concluidoEm?: number;
  mesa: MesaEntrada[];
  achados: Achado[];
}

export interface PosicaoGrafo { x: number; y: number }

export interface CampanhaSnapshot {
  pasta: string;
  capitulos: Capitulo[];
  pontos: Ponto[];
  estado: Record<string, PontoEstado>;
  /** Onde cada nó foi preso na visão em grafo (id do ponto ou "mapa:<id>"). */
  grafo: { posicoes: Record<string, PosicaoGrafo> };
  avisos: Record<string, string[]>;
  erros: string[];
}

export const ESTADO_PADRAO: PontoEstado = { status: 'planejado', mesa: [], achados: [] };

/** Lê uma lista de referências de um campo extra (aceita string solta ou objeto). */
export function refsDe(v: unknown): CampanhaRef[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x): CampanhaRef[] => {
    if (typeof x === 'string') return x.trim() ? [{ nome: x.trim(), qtd: 1 }] : [];
    if (x && typeof x === 'object') {
      const o = x as Record<string, unknown>;
      return [{ id: o.id as string | undefined, nome: o.nome as string | undefined, qtd: typeof o.qtd === 'number' ? o.qtd : 1 }];
    }
    return [];
  });
}
