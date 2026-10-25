import { create } from 'zustand';

const CHAVE = 'essentia.mesa.foraDoCombate';
const CHAVE_MODO = 'essentia.mesa.modo';

export type ModoMesa = 'painel' | 'tabuleiro';

function ler(): string[] {
  try { return JSON.parse(localStorage.getItem(CHAVE) ?? '[]'); } catch { return []; }
}

function gravar(ids: string[]) {
  try { localStorage.setItem(CHAVE, JSON.stringify(ids)); } catch {}
}

/** Preferências da Mesa: jogador selecionado, quem fica fora do combate (iniciativa) e o modo (painel ou tabuleiro). */
export const useMesaStore = create<{
  selecionado: string | null;
  foraDoCombate: string[];
  modo: ModoMesa;
  carregado: boolean;
  selecionar: (id: string | null) => void;
  alternarCombate: (id: string) => void;
  trocarModo: (modo: ModoMesa) => void;
  carregar: () => void;
}>((set, get) => ({
  selecionado: null,
  foraDoCombate: [],
  modo: 'painel',
  carregado: false,
  selecionar: (selecionado) => set({ selecionado }),
  alternarCombate: (id) => {
    const atual = get().foraDoCombate;
    const novo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
    gravar(novo);
    set({ foraDoCombate: novo });
  },
  trocarModo: (modo) => {
    try { localStorage.setItem(CHAVE_MODO, modo); } catch {}
    set({ modo });
  },
  carregar: () => {
    if (get().carregado) return;
    let modo: ModoMesa = 'painel';
    try { if (localStorage.getItem(CHAVE_MODO) === 'tabuleiro') modo = 'tabuleiro'; } catch {}
    set({ foraDoCombate: ler(), modo, carregado: true });
  },
}));
