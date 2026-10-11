'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { DocumentEntry } from './types';

interface DocumentsStore {
  documents: DocumentEntry[];
  loading: boolean;
  fetchDocuments: () => Promise<void>;
  addDocument: (d: { url: string; title: string }) => Promise<void>;
  updateDocument: (id: string, d: { url: string; title: string }) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  toggleDocument: (id: string) => Promise<void>;
}

export const useDocumentsStore = create<DocumentsStore>()((set) => ({
  documents: [],
  loading: false,

  fetchDocuments: async () => {
    set({ loading: true });
    try {
      const res = await api.get<DocumentEntry[]>('/documents');
      set({ documents: res.data });
    } catch {
    } finally {
      set({ loading: false });
    }
  },

  addDocument: async (d) => {
    const res = await api.post<DocumentEntry>('/documents', d);
    set((s) => ({ documents: [...s.documents, res.data] }));
  },

  updateDocument: async (id, d) => {
    const res = await api.put<DocumentEntry>(`/documents/${id}`, d);
    set((s) => ({ documents: s.documents.map((x) => x.id === id ? res.data : x) }));
  },

  removeDocument: async (id) => {
    await api.delete(`/documents/${id}`);
    set((s) => ({ documents: s.documents.filter((x) => x.id !== id) }));
  },

  toggleDocument: async (id) => {
    const res = await api.put<DocumentEntry[]>(`/documents/${id}/toggle`);
    set({ documents: res.data });
  },
}));
