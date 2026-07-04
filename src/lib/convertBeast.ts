import type { EnemyTemplate, AllyTemplate } from '@/store/types';

export function enemyToAllyTemplate(t: EnemyTemplate): Omit<AllyTemplate, 'id'> {
  return {
    name: t.name,
    type: t.type,
    hpMax: t.hpMax,
    attributes: t.attributes,
    attacks: t.attacks,
    immunities: t.immunities,
    desc: t.desc,
    notes: t.notes,
  };
}

export function allyToEnemyTemplate(t: AllyTemplate): Omit<EnemyTemplate, 'id'> {
  return {
    name: t.name,
    type: t.type,
    icon: '👹',
    hpMax: t.hpMax,
    attributes: t.attributes,
    attacks: t.attacks,
    drops: [],
    immunities: t.immunities,
    xp: 0,
    desc: t.desc,
    notes: t.notes,
  };
}
