'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

/** Espelha DegrauRules do backend (essentia-api/.../service/DegrauRules.kt). */

/** ESSENCIA não se cadastra: cada Essência já é o seu tipo (mesmo id e nome). */
export type CategoriaDano = 'ESSENCIA' | 'FISICO' | 'OUTRO';
export type Degrau = 'IMUNE' | 'RESISTENTE' | 'NEUTRO' | 'FRACO';
/** Degraus que viram traço: Neutro é o padrão e não fica salvo. */
export type DegrauTraco = Exclude<Degrau, 'NEUTRO'>;

export interface TipoDano { id: string; nome: string; categoria: CategoriaDano; essenciaId?: string | null; }
export interface TracoDano { tipoDanoId: string; degrau: DegrauTraco; }
/** Fraqueza descoberta pelo grupo acertando; só aparece para os jogadores depois que o mestre libera. */
export interface Descoberta {
  id: string; criaturaChave: string; criaturaNome: string;
  tipoDanoId: string; tipoNome: string; degrau: Degrau;
  playerId: string; playerName: string; descobertoEm: string; liberada: boolean;
}
export interface BestiarioEntrada { criaturaChave: string; nome: string; icon?: string | null; imageUrl?: string | null; descobertas: Descoberta[]; }
export interface DegrauAplicado { degrau: Degrau; tipoDanoId?: string | null; tipoNome?: string | null; origem?: 'raca' | 'armadura' | null; }

export const MAX_TIPOS = 2;

/** Categorias que o mestre cadastra. */
export const CATEGORIAS: { value: CategoriaDano; label: string }[] = [
  { value: 'FISICO', label: 'Físico' },
  { value: 'OUTRO',  label: 'Outros' },
];

export const DEGRAUS: Record<Degrau, { label: string; mult: number; cor: string }> = {
  IMUNE:      { label: 'Imune',      mult: 0,   cor: 'text-sky-300 border-sky-400/40 bg-sky-400/10' },
  RESISTENTE: { label: 'Resistente', mult: 0.5, cor: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
  NEUTRO:     { label: 'Neutro',     mult: 1,   cor: 'text-e-faint border-e-border bg-white/[0.03]' },
  FRACO:      { label: 'Fraco',      mult: 1.5, cor: 'text-red-300 border-red-400/40 bg-red-400/10' },
};
export const DEGRAUS_TRACO: DegrauTraco[] = ['FRACO', 'RESISTENTE', 'IMUNE'];

export const fmtMult = (m: number) => `x${String(m).replace('.', ',')}`;

/** "Fogo: Fraco x1,5" */
export function textoDegrau(d: DegrauAplicado): string {
  const info = DEGRAUS[d.degrau] ?? DEGRAUS.NEUTRO;
  return `${d.tipoNome ?? 'Sem tipo'}: ${info.label} ${fmtMult(info.mult)}`;
}

interface TiposDanoStore {
  tipos: TipoDano[];
  carregado: boolean;
  /** Bestiário do grupo com as pendentes (só o mestre vê); chega pelo socket a cada mudança. */
  descobertas: BestiarioEntrada[];
  setDescobertas: (d: BestiarioEntrada[]) => void;
  carregarDescobertas: () => Promise<void>;
  liberarDescoberta: (id: string, liberada: boolean) => Promise<void>;
  apagarDescoberta: (id: string) => Promise<void>;
  carregar: (forcar?: boolean) => Promise<void>;
  salvar: (t: Omit<TipoDano, 'id'> & { id?: string }) => Promise<TipoDano>;
  remover: (id: string) => Promise<void>;
}

export const useTiposDano = create<TiposDanoStore>()((set, get) => ({
  tipos: [],
  carregado: false,
  descobertas: [],
  setDescobertas: (descobertas) => set({ descobertas }),
  carregarDescobertas: async () => {
    try { set({ descobertas: (await api.get<BestiarioEntrada[]>('/descobertas/todas')).data }); } catch {}
  },
  // O socket devolve a lista nova; o recarregar cobre o caso de o socket estar fora
  liberarDescoberta: async (id, liberada) => { await api.put(`/descobertas/${id}/liberar`, { liberada }); await get().carregarDescobertas(); },
  apagarDescoberta: async (id) => { await api.delete(`/descobertas/${id}`); await get().carregarDescobertas(); },
  carregar: async (forcar = false) => {
    if (get().carregado && !forcar) return;
    try {
      const res = await api.get<TipoDano[]>('/tipos-dano');
      set({ tipos: res.data, carregado: true });
    } catch {}
  },
  salvar: async (t) => {
    const res = t.id ? await api.put<TipoDano>(`/tipos-dano/${t.id}`, t) : await api.post<TipoDano>('/tipos-dano', t);
    await get().carregar(true);
    return res.data;
  },
  remover: async (id) => {
    await api.delete(`/tipos-dano/${id}`);
    set({ tipos: get().tipos.filter((x) => x.id !== id) });
  },
}));

/** Nome do tipo pelo id (referência órfã aparece como "?"). */
export function nomeTipo(tipos: TipoDano[], id: string): string {
  return tipos.find((t) => t.id === id)?.nome ?? '?';
}
