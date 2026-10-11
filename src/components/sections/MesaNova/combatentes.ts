'use client';

import { useStore, useActivePlayers, useEnemies, useBosses, useAllies } from '@/store';
import type { BossInstance, CombatAlly, EnemyInstance, Player } from '@/store/types';

export type TipoCombatente = 'jogador' | 'inimigo' | 'boss' | 'aliado';

export interface Combatente {
  id: string;
  tipo: TipoCombatente;
  nome: string;
  src?: string | null;
  emoji?: string;
  hp: number;
  hpMax: number;
  es?: number;      // Essência atual (jogadores e oponentes com ES)
  esMax?: number;
  jogador?: Player;
  inimigo?: EnemyInstance;
  boss?: BossInstance;
  aliado?: CombatAlly;
}

export const COR_TIPO: Record<TipoCombatente, string> = {
  jogador: '#a3e635',
  inimigo: '#e05050',
  boss: '#d4a84e',
  aliado: '#3dba72',
};

/** Todos os participantes possíveis da mesa, indexados pelo id usado na iniciativa. */
export function useCombatentes() {
  const players = useActivePlayers();
  const enemies = useEnemies();
  const bosses = useBosses();
  const allies = useAllies();
  const { initiative, currentTurn } = useStore();

  const lista: Combatente[] = [
    ...players.map((p): Combatente => ({ id: p.id, tipo: 'jogador', nome: p.char.name, src: p.char.portraitUrl, hp: p.hp.current, hpMax: p.hp.max, es: p.flow.current, esMax: p.flow.max, jogador: p })),
    ...bosses.map((b): Combatente => ({ id: b.instanceId, tipo: 'boss', nome: b.name, src: b.imageUrl, emoji: b.icon, hp: b.hpCurrent, hpMax: b.phases[b.currentPhase]?.hpMax ?? b.hpCurrent, es: b.esCurrent ?? b.phases[b.currentPhase]?.esMax, esMax: b.phases[b.currentPhase]?.esMax, boss: b })),
    ...enemies.map((e): Combatente => ({ id: e.instanceId, tipo: 'inimigo', nome: e.name, src: e.imageUrl, emoji: e.icon, hp: e.hpCurrent, hpMax: e.hpMax, es: e.esCurrent ?? e.esMax, esMax: e.esMax, inimigo: e })),
    ...allies.map((a): Combatente => ({ id: a.id, tipo: 'aliado', nome: a.name, src: a.portraitUrl, hp: a.hpCurrent, hpMax: a.hpMax, aliado: a })),
  ];
  const porId = new Map(lista.map((c) => [c.id, c]));
  const emCombate = initiative.length > 0;
  const idx = emCombate ? currentTurn % initiative.length : -1;
  const vezId = emCombate ? initiative[idx]?.playerId ?? null : null;
  const rodada = emCombate ? Math.floor(currentTurn / initiative.length) + 1 : 0;

  return { lista, porId, emCombate, idx, vezId, rodada, initiative, players, enemies, bosses, allies };
}
