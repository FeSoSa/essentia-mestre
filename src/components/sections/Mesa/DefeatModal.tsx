'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { EnemyInstance, Player } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  enemy: EnemyInstance;
  players: Player[];
  onClose: () => void;
}

export default function DefeatModal({ enemy, players, onClose }: Props) {
  const [selectedDrops, setSelectedDrops] = useState<Set<number>>(new Set());
  const [dropAssignments, setDropAssignments] = useState<Record<number, string>>({});
  const [distributeXp, setDistributeXp] = useState(true);
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
      });
      onClose();
    } catch {
      setLoading(false);
    }
  }

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
                <input
                  type="checkbox"
                  id={`drop-${i}`}
                  checked={selectedDrops.has(i)}
                  onChange={() => toggleDrop(i)}
                  className="accent-[#c04040]"
                />
                <label htmlFor={`drop-${i}`} className="flex-1 text-sm flex items-center gap-1.5 cursor-pointer">
                  {drop.icon} {drop.name}
                </label>
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
        {enemy.xp > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="xp-check"
              checked={distributeXp}
              onChange={(e) => setDistributeXp(e.target.checked)}
              className="accent-[#3aaa60]"
            />
            <label htmlFor="xp-check" className="text-sm cursor-pointer">
              Distribuir <span style={{ color: '#3aaa60' }}>⭐ {enemy.xp} XP</span> para todos os jogadores
            </label>
          </div>
        )}

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
