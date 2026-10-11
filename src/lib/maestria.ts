import { create } from 'zustand';
import { api } from '@/lib/api';
import type { MaestriaConfig, MaestriaGrupoInfo, NivelMaestriaGrupo } from '@/store/types';

/** Padrões iguais aos da MaestriaConfig do servidor (usados até a API responder). */
export const MAESTRIA_PADRAO: MaestriaConfig = {
  niveis: [
    { nivel: 1, usos: 0, danoPct: 0, custoPct: 0 },
    { nivel: 2, usos: 5, danoPct: 10, custoPct: 10 },
    { nivel: 3, usos: 12, danoPct: 20, custoPct: 15 },
    { nivel: 4, usos: 22, danoPct: 30, custoPct: 20 },
  ],
};

/** Config antiga (por skill, com modelos) ou incompleta volta para a tabela padrão. */
function normalizar(cfg: Partial<MaestriaConfig> | null | undefined): MaestriaConfig {
  return { niveis: cfg?.niveis?.length === 4 ? cfg.niveis : MAESTRIA_PADRAO.niveis };
}

export const useMaestriaStore = create<{
  cfg: MaestriaConfig;
  setCfg: (cfg: MaestriaConfig) => void;
  carregar: () => Promise<void>;
}>((set) => ({
  cfg: MAESTRIA_PADRAO,
  setCfg: (cfg) => set({ cfg: normalizar(cfg) }),
  carregar: async () => {
    try { set({ cfg: normalizar((await api.get<MaestriaConfig>('/config/maestria')).data) }); } catch {}
  },
}));

/** Texto curto dos bônus de um nível, ex: "+20% dano · -15% custo". */
export function descreverNivel(n: Pick<NivelMaestriaGrupo, 'danoPct' | 'custoPct'> | null | undefined): string {
  if (!n || (!n.danoPct && !n.custoPct)) return 'sem bônus';
  return [n.danoPct ? `+${n.danoPct}% dano` : '', n.custoPct ? `-${n.custoPct}% custo` : ''].filter(Boolean).join(' · ');
}

/** Resumo de uma maestria de grupo, ex: "Espadas Nv3 · +20% dano · -15% custo". */
export function maestriaResumo(m: MaestriaGrupoInfo): string {
  return `${m.nome} Nv${m.nivel} · ${descreverNivel(m)}${m.disponivel ? ' · nível disponível' : ''}${m.ativa ? '' : ' · sem proficiência'}`;
}
