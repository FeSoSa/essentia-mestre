'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Region } from './types';

interface RegionsStore {
  regions: Region[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  addRegion: (r: Omit<Region, 'id'>) => Promise<void>;
  updateRegion: (id: string, r: Omit<Region, 'id'>) => Promise<void>;
  removeRegion: (id: string) => Promise<void>;
}

export const useRegionsStore = create<RegionsStore>()((set) => ({
  regions: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const res = await api.get<Region[]>('/regions');
      set({ regions: res.data });
    } catch {
    } finally {
      set({ loading: false });
    }
  },

  addRegion: async (r) => {
    const res = await api.post<Region>('/regions', r);
    set((s) => ({ regions: [...s.regions, res.data] }));
  },

  updateRegion: async (id, r) => {
    const res = await api.put<Region>(`/regions/${id}`, r);
    set((s) => ({ regions: s.regions.map((x) => x.id === id ? res.data : x) }));
  },

  removeRegion: async (id) => {
    await api.delete(`/regions/${id}`);
    set((s) => ({ regions: s.regions.filter((x) => x.id !== id) }));
  },
}));
