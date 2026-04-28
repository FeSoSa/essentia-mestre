'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { BossInstance, Player } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  boss: BossInstance;
  players: Player[];
  onClose: () => void;
}

export default function BossDefeatModal({ boss, players, onClose }: Props) {
  const [selectedDrops, setSelectedDrops]     = useState<Set<number>>(new Set());
  const [dropAssignments, setDropAssignments] = useState<Record<number, string>>({});
  const [rewardPlayerId, setRewardPlayerId]   = useState('');
  const [distributeXp, setDistributeXp]       = useState(true);
  const [loading, setLoading]                 = useState(false);

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

  async function confirm() {
    setLoading(true);
    try {
      await api.post(`/combat/bosses/${boss.instanceId}/defeat`, {
        drops: [...selectedDrops].map((i) => ({
          name: boss.drops[i].name,
          icon: boss.drops[i].icon,
          playerId: dropAssignments[i] ?? '',
        })),
        specialReward: boss.specialReward && rewardPlayerId
          ? { referenceId: boss.specialReward.referenceId, playerId: rewardPlayerId }
          : null,
        distributeXp,
      });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const selStyle = { background: '#2a2410', color: '#f0e8d0', borderColor: '#6a5a20' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-[420px] max-h-[90vh] overflow-y-auto rounded-xl border flex flex-col gap-4 p-5"
        style={{ background: '#1a1810', borderColor: '#6a5a20', color: '#f0e8d0' }}
      >
        <h2 className="font-bold text-base flex items-center gap-2">
          💀 Derrota —
          <span className="text-xl">{boss.icon}</span>
          {boss.name}
        </h2>

        {/* Drops */}
        {boss.drops.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Drops</p>
            {boss.drops.map((drop, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`bdrop-${i}`}
                  checked={selectedDrops.has(i)}
                  onChange={() => toggleDrop(i)}
                  className="accent-[#c8a050]"
                />
                <label htmlFor={`bdrop-${i}`} className="flex-1 text-sm flex items-center gap-1.5 cursor-pointer">
                  {drop.icon} {drop.name}
                </label>
                {selectedDrops.has(i) && (
                  <select
                    value={dropAssignments[i] ?? ''}
                    onChange={(e) => setDropAssignments((a) => ({ ...a, [i]: e.target.value }))}
                    className="text-xs rounded px-2 py-1 outline-none"
                    style={selStyle}
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

        {/* Special reward */}
        {boss.specialReward && (
          <div className="flex flex-col gap-2 rounded-lg p-3 border" style={{ background: '#2a2410', borderColor: '#6a5a20' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Recompensa especial</p>
            <p className="text-sm font-semibold" style={{ color: '#c8a050' }}>
              {boss.specialReward.type === 'essencia' ? '✨' : boss.specialReward.type === 'item' ? '🎁' : '⚡'}{' '}
              {boss.specialReward.name}
            </p>
            {boss.specialReward.desc && (
              <p className="text-xs" style={{ color: '#7a7050' }}>{boss.specialReward.desc}</p>
            )}
            <select
              value={rewardPlayerId}
              onChange={(e) => setRewardPlayerId(e.target.value)}
              className="text-sm rounded px-2 py-1.5 outline-none w-full"
              style={selStyle}
            >
              <option value="">Selecionar jogador…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.char.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* XP */}
        {boss.xp > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="boss-xp"
              checked={distributeXp}
              onChange={(e) => setDistributeXp(e.target.checked)}
              className="accent-[#3aaa60]"
            />
            <label htmlFor="boss-xp" className="text-sm cursor-pointer">
              Distribuir <span style={{ color: '#3aaa60' }}>⭐ {boss.xp} XP</span> para todos os jogadores
            </label>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={confirm} disabled={loading}>
            {loading ? 'Confirmando…' : 'Confirmar derrota'}
          </Button>
        </div>
      </div>
    </div>
  );
}
