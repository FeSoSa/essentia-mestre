import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Achado, CampanhaRef, CampanhaSnapshot, MesaEntrada, PosicaoGrafo, Ponto } from './types';

interface CampanhaState {
  snap: CampanhaSnapshot | null;
  carregado: boolean;
  fetch: () => Promise<void>;
  aplicar: (s: CampanhaSnapshot) => void;

  criarPonto: (p: Partial<Ponto>) => Promise<Ponto | undefined>;
  /** Recusa com 409 se o arquivo mudou fora do painel desde que `p.hash` foi lido. */
  salvarPonto: (p: Ponto) => Promise<void>;
  moverPonto: (id: string, mapa: CampanhaRef | null, x?: number, y?: number) => Promise<void>;
  removerPonto: (id: string) => Promise<void>;

  criarCapitulo: (titulo: string) => Promise<void>;
  atualizarCapitulo: (id: string, titulo: string, resumo: string, ordem?: number) => Promise<void>;
  removerCapitulo: (id: string) => Promise<void>;

  ativar: (id: string) => Promise<void>;
  concluir: (id: string) => Promise<void>;
  reabrir: (id: string) => Promise<void>;
  registrarMesa: (id: string, entradas: MesaEntrada[]) => Promise<void>;
  registrarAchado: (id: string, achado: Achado) => Promise<void>;

  /** Prende nós no grafo (null solta de volta para a física). */
  posicionarGrafo: (posicoes: Record<string, PosicaoGrafo | null>) => Promise<void>;
  soltarGrafo: () => Promise<void>;
}

export const useCampanhaStore = create<CampanhaState>()((set, get) => {
  // Toda rota da API devolve o snapshot inteiro
  const enviar = async (req: Promise<{ data: CampanhaSnapshot }>) => {
    const r = await req;
    set({ snap: r.data, carregado: true });
    return r.data;
  };

  return {
    snap: null,
    carregado: false,

    fetch: async () => { await enviar(api.get<CampanhaSnapshot>('/campanha')); },
    aplicar: (s) => set({ snap: s, carregado: true }),

    criarPonto: async (p) => {
      const antes = new Set(get().snap?.pontos.map((x) => x.id));
      const s = await enviar(api.post<CampanhaSnapshot>('/campanha/pontos', { tipo: 'narrativo', revelado: false, ligadoA: [], extras: {}, corpo: '', ...p }));
      return s.pontos.find((x) => !antes.has(x.id));
    },
    salvarPonto: async (p) => { await enviar(api.put<CampanhaSnapshot>(`/campanha/pontos/${p.id}`, p)); },
    moverPonto: async (id, mapa, x, y) => { await enviar(api.put<CampanhaSnapshot>(`/campanha/pontos/${id}/posicao`, { mapa, x, y })); },
    removerPonto: async (id) => { await enviar(api.delete<CampanhaSnapshot>(`/campanha/pontos/${id}`)); },

    criarCapitulo: async (titulo) => { await enviar(api.post<CampanhaSnapshot>('/campanha/capitulos', { titulo, resumo: '' })); },
    atualizarCapitulo: async (id, titulo, resumo, ordem) => { await enviar(api.put<CampanhaSnapshot>(`/campanha/capitulos/${id}`, { titulo, resumo, ordem })); },
    removerCapitulo: async (id) => { await enviar(api.delete<CampanhaSnapshot>(`/campanha/capitulos/${id}`)); },

    ativar: async (id) => { await enviar(api.post<CampanhaSnapshot>(`/campanha/pontos/${id}/ativar`)); },
    concluir: async (id) => { await enviar(api.post<CampanhaSnapshot>(`/campanha/pontos/${id}/concluir`)); },
    reabrir: async (id) => { await enviar(api.post<CampanhaSnapshot>(`/campanha/pontos/${id}/reabrir`)); },
    registrarMesa: async (id, entradas) => { await enviar(api.post<CampanhaSnapshot>(`/campanha/pontos/${id}/mesa`, { entradas })); },
    registrarAchado: async (id, achado) => { await enviar(api.post<CampanhaSnapshot>(`/campanha/pontos/${id}/achado`, achado)); },

    posicionarGrafo: async (posicoes) => { await enviar(api.put<CampanhaSnapshot>('/campanha/grafo/posicoes', { posicoes })); },
    soltarGrafo: async () => { await enviar(api.delete<CampanhaSnapshot>('/campanha/grafo/posicoes')); },
  };
});
