import { create } from 'zustand';

const CHAVE = 'essentia.mesa.foraDoCombate';

function ler(): string[] {
  try { return JSON.parse(localStorage.getItem(CHAVE) ?? '[]'); } catch { return []; }
}

function gravar(ids: string[]) {
  try { localStorage.setItem(CHAVE, JSON.stringify(ids)); } catch {}
}

/** Preferências da Mesa: jogador selecionado e quem fica fora do combate (iniciativa). */
export const useMesaStore = create<{
  selecionado: string | null;
  foraDoCombate: string[];
  carregado: boolean;
  selecionar: (id: string | null) => void;
  alternarCombate: (id: string) => void;
  carregar: () => void;
}>((set, get) => ({
  selecionado: null,
  foraDoCombate: [],
  carregado: false,
  selecionar: (selecionado) => set({ selecionado }),
  alternarCombate: (id) => {
    const atual = get().foraDoCombate;
    const novo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
    gravar(novo);
    set({ foraDoCombate: novo });
  },
  carregar: () => { if (!get().carregado) set({ foraDoCombate: ler(), carregado: true }); },
}));
