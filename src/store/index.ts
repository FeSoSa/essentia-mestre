'use client';

import { create } from 'zustand';
import type {
  SectionId, Player, InitiativeEntry,
  LogEntry, ImageEntry, FastAction, StatusEffect, EnemyInstance, BossInstance,
  SobrecargaRequest, DamageApprovalRequest,
} from './types';

interface RootState {
  activeSection: SectionId;
  setActiveSection: (s: SectionId) => void;

  players: Player[];
  setPlayers: (p: Player[]) => void;
  setPlayer: (p: Player) => void;
  removePlayer: (id: string) => void;

  currentTurn: number;
  setCurrentTurn: (t: number) => void;
  incrementTurn: () => void;

  initiative: InitiativeEntry[];
  setInitiative: (i: InitiativeEntry[]) => void;
  reorderInitiative: (from: number, to: number) => void;

  log: LogEntry[];
  appendLog: (e: LogEntry) => void;
  setLog: (entries: LogEntry[]) => void;

  images: ImageEntry[];
  setImages: (i: ImageEntry[]) => void;
  addImage: (i: ImageEntry) => void;
  setActiveImage: (id: string) => void;

  fastAction: FastAction | null;
  setFastAction: (a: FastAction | null) => void;

  addStatusEffect: (playerId: string, effect: StatusEffect) => void;
  removeStatusEffect: (playerId: string, effectId: string) => void;

  enemies: EnemyInstance[];
  setEnemies: (e: EnemyInstance[]) => void;
  removeEnemy: (instanceId: string) => void;

  bosses: BossInstance[];
  setBosses: (b: BossInstance[]) => void;
  removeBoss: (instanceId: string) => void;

  sobrecargaRequests: SobrecargaRequest[];
  addSobrecargaRequest: (r: SobrecargaRequest) => void;
  removeSobrecargaRequest: (playerId: string) => void;
  unlockSobrecarga: (playerId: string, unlocked: boolean) => void;

  damageRequests: DamageApprovalRequest[];
  addDamageRequest: (r: DamageApprovalRequest) => void;
  removeDamageRequest: (requestId: string) => void;
}

export const useStore = create<RootState>((set) => ({
  activeSection: 'mesa',
  setActiveSection: (activeSection) => set({ activeSection }),

  players: [],
  setPlayers: (players) => set({ players }),
  setPlayer: (player) =>
    set((s) => ({
      players: s.players.some((p) => p.id === player.id)
        ? s.players.map((p) => (p.id === player.id ? player : p))
        : [...s.players, player],
    })),
  removePlayer: (id) => set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

  currentTurn: 0,
  setCurrentTurn: (currentTurn) => set({ currentTurn }),
  incrementTurn: () => set((s) => ({ currentTurn: s.currentTurn + 1 })),

  initiative: [],
  setInitiative: (initiative) => set({ initiative }),
  reorderInitiative: (from, to) =>
    set((s) => {
      const list = [...s.initiative];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { initiative: list };
    }),

  log: [],
  appendLog: (entry) => set((s) => ({ log: [entry, ...s.log].slice(0, 300) })),
  setLog: (log) => set({ log }),

  images: [],
  setImages: (images) => set({ images }),
  addImage: (image) => set((s) => ({ images: [...s.images, image] })),
  setActiveImage: (id) =>
    set((s) => ({ images: s.images.map((img) => ({ ...img, active: img.id === id })) })),

  fastAction: null,
  setFastAction: (fastAction) => set({ fastAction }),

  addStatusEffect: (playerId, effect) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, statusEffects: [...p.statusEffects, effect] } : p
      ),
    })),
  removeStatusEffect: (playerId, effectId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, statusEffects: p.statusEffects.filter((e) => e.id !== effectId) }
          : p
      ),
    })),

  enemies: [],
  setEnemies: (enemies) => set({ enemies }),
  removeEnemy: (instanceId) =>
    set((s) => ({ enemies: s.enemies.filter((e) => e.instanceId !== instanceId) })),

  bosses: [],
  setBosses: (bosses) => set({ bosses }),
  removeBoss: (instanceId) =>
    set((s) => ({ bosses: s.bosses.filter((b) => b.instanceId !== instanceId) })),

  sobrecargaRequests: [],
  addSobrecargaRequest: (r) =>
    set((s) => ({
      sobrecargaRequests: [
        ...s.sobrecargaRequests.filter((x) => x.playerId !== r.playerId),
        r,
      ],
    })),
  removeSobrecargaRequest: (playerId) =>
    set((s) => ({ sobrecargaRequests: s.sobrecargaRequests.filter((r) => r.playerId !== playerId) })),

  damageRequests: [],
  addDamageRequest: (r) =>
    set((s) => ({ damageRequests: [...s.damageRequests, r] })),
  removeDamageRequest: (requestId) =>
    set((s) => ({ damageRequests: s.damageRequests.filter((r) => r.requestId !== requestId) })),
  unlockSobrecarga: (playerId, unlocked) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, sobrecargaDesbloqueada: unlocked } : p
      ),
    })),
}));

export const usePlayers    = () => useStore((s) => s.players);
export const useInitiative = () => useStore((s) => s.initiative);
export const useLog        = () => useStore((s) => s.log);
export const useImages     = () => useStore((s) => s.images);
export const useFastAction = () => useStore((s) => s.fastAction);
export const useEnemies    = () => useStore((s) => s.enemies);
export const useBosses     = () => useStore((s) => s.bosses);
