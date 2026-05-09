'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AutoEffect } from './types';

export interface EffectPreset {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  desc?: string;
  durationTurns: number;
  effects: AutoEffect[];
}

const DEFAULT_PRESETS: EffectPreset[] = [
  {
    id: 'envenenado',
    name: 'Envenenado',
    icon: 'Skull',
    durationTurns: 3,
    effects: [{ trigger: 'on_turn_start', type: 'damage_hp', value: 5 }],
  },
  {
    id: 'queimando',
    name: 'Queimando',
    icon: 'Flame',
    durationTurns: 2,
    effects: [{ trigger: 'on_turn_start', type: 'damage_hp', value: 10 }],
  },
  {
    id: 'sangrando',
    name: 'Sangrando',
    icon: 'HeartCrack',
    durationTurns: 3,
    effects: [{ trigger: 'on_turn_start', type: 'damage_hp', value: 8 }],
  },
  {
    id: 'regenerando',
    name: 'Regenerando',
    icon: 'Leaf',
    durationTurns: 3,
    effects: [{ trigger: 'on_turn_start', type: 'heal_hp', value: 10 }],
  },
  {
    id: 'escudo-fluxo',
    name: 'Escudo de Fluxo',
    icon: 'Shield',
    durationTurns: 2,
    effects: [{ trigger: 'on_damage_received', type: 'modify_damage_received', value: -5 }],
  },
  {
    id: 'atordoado',
    name: 'Atordoado',
    icon: 'Dices',
    durationTurns: 1,
    effects: [],
  },
  {
    id: 'congelado',
    name: 'Congelado',
    icon: 'Snowflake',
    durationTurns: 2,
    effects: [{ trigger: 'on_damage_received', type: 'modify_damage_received', value: 5 }],
  },
  {
    id: 'concentrado',
    name: 'Concentrado',
    icon: 'Eye',
    durationTurns: 3,
    effects: [{ trigger: 'on_skill_use', type: 'modify_damage_dealt', value: 5 }],
  },
  {
    id: 'enfraquecido',
    name: 'Enfraquecido',
    icon: 'Wind',
    durationTurns: 3,
    effects: [{ trigger: 'on_skill_use', type: 'modify_damage_dealt', value: -5 }],
  },
  {
    id: 'amaldicado',
    name: 'Amaldiçoado',
    icon: 'Moon',
    durationTurns: -1,
    effects: [],
  },
];

interface PresetsStore {
  presets: EffectPreset[];
  addPreset: (p: EffectPreset) => void;
  removePreset: (id: string) => void;
}

export const useEffectPresetsStore = create<PresetsStore>()(
  persist(
    (set) => ({
      presets: DEFAULT_PRESETS,
      addPreset: (p) => set((s) => ({ presets: [...s.presets, p] })),
      removePreset: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
    }),
    { name: 'essentia-effect-presets' }
  )
);
