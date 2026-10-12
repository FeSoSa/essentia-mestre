import { create } from 'zustand';
import { api } from '@/lib/api';
import type { CombateConfig, EnemyAction } from '@/store/types';

/** Valores usados até a API responder (iguais aos padrões da CombateConfig). */
const PADRAO: CombateConfig = {
  critMultBase: 1.5, critMultDado: 2, equilibrioSemProficiencia: 6, equilibrioComProficiencia: 5,
  esPorAcertoBasico: 3, desviosPorCombate: 3,
  tiers: [
    { tier: 1, equilibrio: 4, custoBase: 8 }, { tier: 2, equilibrio: 3.5, custoBase: 15 },
    { tier: 3, equilibrio: 3, custoBase: 25 }, { tier: 4, equilibrio: 2.5, custoBase: 40 },
    { tier: 5, equilibrio: 2, custoBase: 60 },
  ],
};

/** Completa com os padrões: uma config salva antes da revisão não tem tiers nem os equilíbrios novos. */
function normalizar(cfg: Partial<CombateConfig> | null | undefined): CombateConfig {
  return { ...PADRAO, ...(cfg ?? {}), tiers: cfg?.tiers?.length ? cfg.tiers : PADRAO.tiers };
}

interface CombateStore {
  cfg: CombateConfig;
  /** Ações do turno automático dos inimigos, por id (a mais recente de cada inimigo fica visível no painel). */
  acoes: Record<string, EnemyAction>;
  setCfg: (cfg: CombateConfig) => void;
  carregar: () => Promise<void>;
  upsertAcao: (a: EnemyAction) => void;
  removerAcao: (id: string) => void;
}

export const useCombateStore = create<CombateStore>((set) => ({
  cfg: PADRAO,
  acoes: {},
  setCfg: (cfg) => set({ cfg: normalizar(cfg) }),
  carregar: async () => {
    try { set({ cfg: normalizar((await api.get<CombateConfig>('/config/combate')).data) }); } catch {}
  },
  upsertAcao: (a) => set((s) => ({ acoes: { ...s.acoes, [a.id]: a } })),
  removerAcao: (id) => set((s) => {
    const resto = { ...s.acoes };
    delete resto[id];
    return { acoes: resto };
  }),
}));

/** Regra do tier (1 a 5) da config atual. */
/** Tabela de tiers da config (ou a padrão). */
export function tabelaTiers(cfg: CombateConfig = useCombateStore.getState().cfg) {
  return cfg.tiers?.length ? cfg.tiers : PADRAO.tiers;
}

export function regraTier(tier: number, cfg: CombateConfig = useCombateStore.getState().cfg) {
  return (cfg.tiers ?? []).find((t) => t.tier === tier) ?? PADRAO.tiers[Math.min(5, Math.max(1, tier)) - 1];
}

/** Equilíbrio do ataque básico: 5 com proficiência na categoria da arma, 6 desarmado ou sem proficiência. */
export function equilibrioAtaqueBasico(w?: object | null, proficiencias: string[] = []): number {
  const cfg = useCombateStore.getState().cfg;
  const tipo = (w as { weaponType?: string } | null | undefined)?.weaponType;
  const tem = !!tipo && proficiencias.some((p) => p.toLowerCase() === tipo.toLowerCase());
  return tem ? cfg.equilibrioComProficiencia : cfg.equilibrioSemProficiencia;
}

/** Equilíbrio em texto, com vírgula: 3,5. */
export function fmtEquilibrio(eq: number): string {
  return String(eq).replace('.', ',');
}

/**
 * Divisor do d20 de uma arma no ataque básico, em texto. Com as proficiências do jogador mostra o valor dele;
 * sem jogador (catálogo) mostra os dois: "5 ou 6".
 */
export function divisorArma(w?: object | null, proficiencias?: string[]): string {
  const cfg = useCombateStore.getState().cfg;
  if (!w) return fmtEquilibrio(cfg.equilibrioSemProficiencia);
  if (!proficiencias) return `${fmtEquilibrio(cfg.equilibrioComProficiencia)} ou ${fmtEquilibrio(cfg.equilibrioSemProficiencia)}`;
  return fmtEquilibrio(equilibrioAtaqueBasico(w, proficiencias));
}
