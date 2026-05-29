'use client';

import { useState } from 'react';
import { Star, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import type { EnemyInstance, Player } from '@/store/types';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';

interface Props {
  enemy: EnemyInstance;
  players: Player[];
  onClose: () => void;
}

export default function DefeatModal({ enemy, players, onClose }: Props) {
  const [selectedDrops, setSelectedDrops] = useState<Set<number>>(new Set());
  const [dropAssignments, setDropAssignments] = useState<Record<number, string>>({});
  const [distributeXp, setDistributeXp] = useState(enemy.xp > 0);
  const [xpAmount, setXpAmount] = useState(String(enemy.xp));
  const [loading, setLoading] = useState(false);

  function toggleDrop(i: number) {
    setSelectedDrops((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
        setDropAssignments((a) => { const b = { ...a }; delete b[i]; return b; });
      } else {
        next.add(i);
      }
      return next;
    });
  }

  function assignDrop(i: number, playerId: string) {
    setDropAssignments((a) => ({ ...a, [i]: playerId }));
  }

  async function confirm() {
    setLoading(true);
    try {
      await api.post(`/combat/enemies/${enemy.instanceId}/defeat`, {
        drops: [...selectedDrops].map((i) => ({
          itemName: enemy.drops[i].name,
          icon: enemy.drops[i].icon,
          playerId: dropAssignments[i] ?? '',
        })),
        distributeXp,
        xpAmount: distributeXp ? (parseInt(xpAmount) || 0) : 0,
      });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const xpModified = enemy.xp > 0 && parseInt(xpAmount) !== enemy.xp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-96 rounded-xl border flex flex-col gap-4 p-5"
        style={{ background: '#1e1616', borderColor: '#4a2a2a', color: '#e8d8d8' }}
      >
        <h2 className="font-bold text-base">
          Derrota — {enemy.icon} {enemy.name}
        </h2>

        {/* Drops */}
        {enemy.drops.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a5050' }}>Drops</p>
            {enemy.drops.map((drop, i) => (
              <div key={i} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDrops.has(i)}
                  onChange={() => toggleDrop(i)}
                  color="default"
                />
                <span
                  className="flex-1 text-sm flex items-center gap-1.5 cursor-pointer select-none"
                  onClick={() => toggleDrop(i)}
                >
                  {drop.icon} {drop.name}
                </span>
                {selectedDrops.has(i) && (
                  <select
                    value={dropAssignments[i] ?? ''}
                    onChange={(e) => assignDrop(i, e.target.value)}
                    className="text-xs rounded px-2 py-1 outline-none"
                    style={{ background: '#2a1818', color: '#e8d8d8', borderColor: '#4a2a2a' }}
                  >
                    <option value="">Jogador…</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>{p.char.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        {/* XP */}
        <div className="flex flex-col gap-2.5">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setDistributeXp((v) => !v)}
          >
            <Checkbox checked={distributeXp} onChange={setDistributeXp} color="green" />
            <Star size={13} className="text-green-400 shrink-0" />
            <span className="text-sm text-green-400">Distribuir XP para todos</span>
          </div>

          {distributeXp && (
            <div className="flex items-center gap-2 pl-6">
              <input
                type="number"
                min={0}
                value={xpAmount}
                onChange={(e) => setXpAmount(e.target.value)}
                className="w-24 rounded px-2 py-1 text-sm text-center outline-none tabular-nums"
                style={{ background: '#1a2a1a', color: '#4ade80', border: '1px solid #166534' }}
              />
              <span className="text-xs text-e-faint">XP por jogador</span>
              {xpModified && (
                <button
                  type="button"
                  onClick={() => setXpAmount(String(enemy.xp))}
                  className="ml-auto flex items-center gap-1 text-xs text-e-faint hover:text-e-sub transition-colors cursor-pointer"
                >
                  <RotateCcw size={11} />
                  {enemy.xp}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={confirm} disabled={loading}>
            {loading ? 'Confirmando…' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
