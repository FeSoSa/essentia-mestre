import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Race } from '@/store/types';

const CHAVE = 'essentia.mesa.tabuleiro';

export interface Casa { x: number; y: number }

/** Parede bloqueia a casa; terreno difícil custa o dobro com a regra de movimento. */
export type Terreno = 'parede' | 'dificil';

interface Salvo {
  colunas: number;
  linhas: number;
  posicoes: Record<string, Casa>;      // canto de cima à esquerda da peça
  tamanhos: Record<string, number>;    // lado da peça em casas; sem valor usa o padrão do tipo
  terreno: Record<string, Terreno>;    // chave "x,y"
  marcas: Record<string, string>;      // chave "x,y" -> cor; desenho do mestre, só visual
  regraMovimento: boolean;
  deslocamentos: Record<string, number>; // casas por turno de quem não tem raça (inimigo, boss, aliado)
  visivel: boolean;                      // jogadores veem o tabuleiro no app
}

const PADRAO: Salvo = { colunas: 16, linhas: 10, posicoes: {}, tamanhos: {}, terreno: {}, marcas: {}, regraMovimento: false, deslocamentos: {}, visivel: false };

function ler(): Salvo {
  try { return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) ?? '{}') }; } catch { return PADRAO; }
}

function gravar(s: Salvo) {
  try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch {}
}

/** Tabuleiro da Mesa: grade, casa e tamanho de cada combatente, terreno e regra de movimento. Fica no navegador do mestre e é espelhado na API para o app. */
export const useTabuleiroStore = create<Salvo & {
  carregado: boolean;
  racas: Race[];
  /** Quanto a peça da vez já andou nesta vez (mantido pela API, indo e voltando conta). */
  movimento: { id: string; turno: number; gasto: number } | null;
  carregar: () => void;
  carregarRacas: () => void;
  /** Move a peça; com `trocarCom`, a outra peça vai para a casa de origem (ou sai do campo). */
  mover: (id: string, casa: Casa, trocarCom?: string) => void;
  tirar: (id: string) => void;
  limpar: () => void;
  posicionarVarios: (posicoes: Record<string, Casa>) => void;
  definirTamanho: (id: string, lado: number) => void;
  pintar: (chave: string, terreno: Terreno | null) => void;
  limparTerreno: () => void;
  marcar: (chave: string, cor: string | null) => void;
  marcarVarias: (chaves: string[], cor: string) => void;
  limparMarcas: () => void;
  redimensionar: (colunas: number, linhas: number, tamanhoDe: (id: string) => number) => void;
  alternarRegra: () => void;
  definirDeslocamento: (id: string, casas: number) => void;
  receberMovimento: (m: { id: string; turno: number; gasto: number } | null) => void;
  alternarVisivel: () => void;
}>((set, get) => {
  const salvar = (parcial: Partial<Salvo>) => {
    const { colunas, linhas, posicoes, tamanhos, terreno, marcas, regraMovimento, deslocamentos, visivel } = { ...get(), ...parcial };
    gravar({ colunas, linhas, posicoes, tamanhos, terreno, marcas, regraMovimento, deslocamentos, visivel });
    set(parcial);
  };
  return {
    ...PADRAO,
    carregado: false,
    racas: [],
    movimento: null,
    carregar: () => { if (!get().carregado) set({ ...ler(), carregado: true }); },
    carregarRacas: () => {
      api.get<Race[]>('/master/races').then((r) => set({ racas: r.data })).catch(() => {});
      api.get<{ movimento: { id: string; turno: number; gasto: number } | null }>('/tabuleiro')
        .then((r) => get().receberMovimento(r.data.movimento)).catch(() => {});
    },
    mover: (id, casa, trocarCom) => {
      const posicoes = { ...get().posicoes };
      if (trocarCom) {
        if (posicoes[id]) posicoes[trocarCom] = posicoes[id];
        else delete posicoes[trocarCom];
      }
      posicoes[id] = casa;
      salvar({ posicoes });
    },
    tirar: (id) => {
      const posicoes = { ...get().posicoes };
      delete posicoes[id];
      salvar({ posicoes });
    },
    limpar: () => salvar({ posicoes: {} }),
    posicionarVarios: (novas) => salvar({ posicoes: { ...get().posicoes, ...novas } }),
    definirTamanho: (id, lado) => salvar({ tamanhos: { ...get().tamanhos, [id]: lado } }),
    pintar: (chave, t) => {
      const terreno = { ...get().terreno };
      if (t) terreno[chave] = t;
      else delete terreno[chave];
      salvar({ terreno });
    },
    limparTerreno: () => salvar({ terreno: {} }),
    marcar: (chave, cor) => {
      const marcas = { ...get().marcas };
      if (cor) marcas[chave] = cor;
      else delete marcas[chave];
      salvar({ marcas });
    },
    marcarVarias: (chaves, cor) => salvar({ marcas: { ...get().marcas, ...Object.fromEntries(chaves.map((k) => [k, cor])) } }),
    limparMarcas: () => salvar({ marcas: {} }),
    redimensionar: (colunas, linhas, tamanhoDe) => {
      // Peça que não cabe mais volta para a reserva; terreno fora da grade some
      const posicoes = Object.fromEntries(Object.entries(get().posicoes)
        .filter(([id, c]) => c.x + tamanhoDe(id) <= colunas && c.y + tamanhoDe(id) <= linhas));
      const dentro = ([k]: [string, unknown]) => {
        const [x, y] = k.split(',').map(Number);
        return x < colunas && y < linhas;
      };
      const terreno = Object.fromEntries(Object.entries(get().terreno).filter(dentro));
      const marcas = Object.fromEntries(Object.entries(get().marcas).filter(dentro));
      salvar({ colunas, linhas, posicoes, terreno, marcas });
    },
    alternarRegra: () => {
      if (!get().regraMovimento) get().carregarRacas();
      salvar({ regraMovimento: !get().regraMovimento });
    },
    definirDeslocamento: (id, casas) => salvar({ deslocamentos: { ...get().deslocamentos, [id]: casas } }),
    receberMovimento: (movimento) => set({ movimento }),
    alternarVisivel: () => salvar({ visivel: !get().visivel }),
  };
});

// Duas abas do painel abertas: sem isto, a aba parada reenviava o retrato antigo para a API
// (por exemplo, com "No app" desligado) assim que recebia um movimento de jogador.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CHAVE && useTabuleiroStore.getState().carregado) useTabuleiroStore.setState(ler());
  });
}
