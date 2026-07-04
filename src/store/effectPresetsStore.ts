'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { AutoEffect } from './types';

export interface EffectPreset {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  desc?: string;
  durationTurns: number;
  effects: AutoEffect[];
  hitBonus?: number;
  attackBonus?: number;
}

interface PresetsStore {
  presets: EffectPreset[];
  loading: boolean;
  fetchPresets: () => Promise<void>;
  addPreset: (p: Omit<EffectPreset, 'id'>) => Promise<void>;
  updatePreset: (id: string, p: EffectPreset) => Promise<void>;
  removePreset: (id: string) => Promise<void>;
}

export const useEffectPresetsStore = create<PresetsStore>()((set) => ({
  presets: [],
  loading: false,

  fetchPresets: async () => {
    set({ loading: true });
    try {
      const res = await api.get<EffectPreset[]>('/master/effect-presets');
      set({ presets: res.data });
    } catch {
    } finally {
      set({ loading: false });
    }
  },

  addPreset: async (p) => {
    const res = await api.post<EffectPreset>('/master/effect-presets', p);
    set((s) => ({ presets: [...s.presets, res.data] }));
  },

  updatePreset: async (id, p) => {
    const res = await api.put<EffectPreset>(`/master/effect-presets/${id}`, p);
    set((s) => ({ presets: s.presets.map((x) => x.id === id ? res.data : x) }));
  },

  removePreset: async (id) => {
    await api.delete(`/master/effect-presets/${id}`);
    set((s) => ({ presets: s.presets.filter((x) => x.id !== id) }));
  },
}));
