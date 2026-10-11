'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { MapMarker } from './types';

interface MapMarkersStore {
  markers: MapMarker[];
  loading: boolean;
  fetchByMap: (mapId: string) => Promise<void>;
  addMarker: (m: Omit<MapMarker, 'id'>) => Promise<void>;
  updateMarker: (id: string, m: Omit<MapMarker, 'id'>) => Promise<void>;
  removeMarker: (id: string) => Promise<void>;
  toggleVisible: (id: string, visible: boolean) => Promise<void>;
}

export const useMapMarkersStore = create<MapMarkersStore>()((set) => ({
  markers: [],
  loading: false,

  fetchByMap: async (mapId) => {
    set({ loading: true });
    try {
      const res = await api.get<MapMarker[]>(`/map-markers/by-map/${mapId}`);
      set({ markers: res.data });
    } catch {
    } finally {
      set({ loading: false });
    }
  },

  addMarker: async (m) => {
    const res = await api.post<MapMarker>('/map-markers', m);
    set((s) => ({ markers: [...s.markers, res.data] }));
  },

  updateMarker: async (id, m) => {
    const res = await api.put<MapMarker>(`/map-markers/${id}`, m);
    set((s) => ({ markers: s.markers.map((x) => x.id === id ? res.data : x) }));
  },

  removeMarker: async (id) => {
    await api.delete(`/map-markers/${id}`);
    set((s) => ({ markers: s.markers.filter((x) => x.id !== id) }));
  },

  toggleVisible: async (id, visible) => {
    const res = await api.put<MapMarker>(`/map-markers/${id}/visibility`, { visible });
    set((s) => ({ markers: s.markers.map((x) => x.id === id ? res.data : x) }));
  },
}));
