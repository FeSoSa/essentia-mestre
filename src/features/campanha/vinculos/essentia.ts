import { useMemo } from 'react';
import { create } from 'zustand';
import { api } from '@/lib/api';
import { useStore, useActivePlayers, useAllies } from '@/store';
import { useMesaStore } from '@/store/mesaStore';
import { useCombateStore } from '@/store/combateStore';
import { ENCONTRO_PADRAO, normalizarEncontro, simular, membroDeAliado, membroDeJogador, type Inimigo } from '@/lib/encontro';
import type { BossInstance, BossTemplate, EncontroConfig, EnemyAttributes, EnemyTemplate, ItemCatalog } from '@/store/types';
import type { CampanhaRef } from '../types';

/**
 * Ligações da campanha com o Essentia (Bestiário, catálogo de itens, Mesa).
 * O núcleo da campanha não importa nada daqui; só os blocos de Encontro e Item.
 */

interface CatalogoState {
  enemies: EnemyTemplate[];
  bosses: BossTemplate[];
  items: ItemCatalog[];
  config: EncontroConfig;
  carregado: boolean;
  carregar: () => Promise<void>;
}

export const useCatalogoCampanha = create<CatalogoState>()((set) => ({
  enemies: [], bosses: [], items: [], config: ENCONTRO_PADRAO, carregado: false,
  carregar: async () => {
    const [e, b, i, c] = await Promise.allSettled([
      api.get<EnemyTemplate[]>('/enemies'),
      api.get<BossTemplate[]>('/bosses'),
      api.get<ItemCatalog[]>('/items'),
      api.get<EncontroConfig>('/config/encontro'),
    ]);
    set({
      enemies: e.status === 'fulfilled' ? e.value.data : [],
      bosses: b.status === 'fulfilled' ? b.value.data : [],
      items: i.status === 'fulfilled' ? i.value.data : [],
      config: c.status === 'fulfilled' ? normalizarEncontro(c.value.data) : ENCONTRO_PADRAO,
      carregado: true,
    });
  },
}));

/** Quem enfrenta o encontro: a mesma regra do Gerador de encontros. */
export function useGrupoEncontro() {
  const players = useActivePlayers();
  const allies = useAllies();
  const initiative = useStore((s) => s.initiative);
  const foraDoCombate = useMesaStore((s) => s.foraDoCombate);
  const cfgCombate = useCombateStore((s) => s.cfg);
  return useMemo(() => {
    const emCombate = initiative.length > 0;
    const ids = new Set(initiative.map((e) => e.playerId));
    const js = players.filter((p) => p.hp.current > 0 && (emCombate ? ids.has(p.id) : !foraDoCombate.includes(p.id)));
    const als = allies.filter((a) => a.hpCurrent > 0 && (!emCombate || ids.has(a.id)));
    return { grupo: [...js.map((p) => membroDeJogador(p, cfgCombate)), ...als.map(membroDeAliado)], cfgCombate };
  }, [players, allies, initiative, foraDoCombate, cfgCombate]);
}

/** Chefe entra na simulação como um inimigo com o PV de todas as fases e os golpes da primeira. */
export function chefeComoInimigo(b: BossTemplate): EnemyTemplate | null {
  const f = b.phases[0];
  if (!f) return null;
  return {
    id: b.id, name: b.name, type: b.type, icon: b.icon,
    hpMax: Math.max(1, b.phases.reduce((s, p) => s + p.hpMax, 0)),
    attributes: f.attributes as unknown as EnemyAttributes, attacks: f.attacks ?? [],
    drops: [], xp: b.xp, desc: '', notes: '', defesa: f.defesa, modAcerto: f.modAcerto,
  };
}

export const comoInimigo = (template: EnemyTemplate): Inimigo => ({ template, inventado: false, escala: 1, escalaDano: 1 });

/** Lista de Inimigo para simular, a partir das referências do ponto. Referências sem modelo ficam de fora. */
export function inimigosParaSimular(inimigos: CampanhaRef[], chefes: CampanhaRef[], cat: Pick<CatalogoState, 'enemies' | 'bosses'>): Inimigo[] {
  const lista: Inimigo[] = [];
  for (const r of inimigos) {
    const t = cat.enemies.find((e) => e.id === r.id);
    if (t) for (let k = 0; k < (r.qtd ?? 1); k++) lista.push(comoInimigo(t));
  }
  for (const r of chefes) {
    const b = cat.bosses.find((x) => x.id === r.id);
    const t = b && chefeComoInimigo(b);
    if (t) for (let k = 0; k < (r.qtd ?? 1); k++) lista.push(comoInimigo(t));
  }
  return lista;
}

/** Dificuldade cuja meta de perigo fica mais perto do perigo simulado. */
export function dificuldadeDe(perigo: number, config: EncontroConfig) {
  const pct = perigo * 100;
  return [...config.dificuldades].sort((a, b) => Math.abs(a.perigo - pct) - Math.abs(b.perigo - pct))[0];
}

export function simularDificuldade(inimigos: Inimigo[], grupo: ReturnType<typeof useGrupoEncontro>, config: EncontroConfig) {
  if (inimigos.length === 0 || grupo.grupo.length === 0) return null;
  const sim = simular(grupo.grupo, inimigos, grupo.cfgCombate);
  return { sim, dif: dificuldadeDe(sim.perigo, config) };
}

/** Mesma montagem do AddBossModal. */
export function instanciaDeChefe(t: BossTemplate): BossInstance {
  return {
    instanceId: '', templateId: t.id, name: t.name, icon: t.icon, imageUrl: t.imageUrl,
    phases: t.phases, currentPhase: 0, hpCurrent: t.phases[0]?.hpMax ?? 0,
    immunities: t.immunities, resistances: t.resistances, drops: t.drops, xp: t.xp,
    specialReward: t.specialReward, notes: '',
  };
}
