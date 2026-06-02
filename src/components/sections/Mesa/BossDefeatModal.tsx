'use client';

import { useState } from 'react';
import { Coins } from 'lucide-react';
import { api } from '@/lib/api';
import { ItemIcon } from '@/components/sections/Itens/ItemCard';
import type { BossInstance, Player } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  boss: BossInstance;
  players: Player[];
  onClose: () => void;
}

export default function BossDefeatModal({ boss, players, onClose }: Props) {
  const [selectedDrops, setSelectedDrops]     = useState<Set<number>>(new Set());
  const [dropAssignments, setDropAssignments] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    boss.drops.forEach((drop, i) => {
      if (!drop.goldDrop && drop.targetPlayerId) init[i] = drop.targetPlayerId;
    });
    return init;
  });
  const [goldAssignment, setGoldAssignment]   = useState<string>(() => {
    const gd = boss.drops.find((d) => d.goldDrop);
    return gd?.targetPlayerId ?? '';
  });
  const [rewardPlayerId, setRewardPlayerId]   = useState('');
  const [distributeXp, setDistributeXp]       = useState(true);
  const [loading, setLoading]                 = useState(false);

  const itemDrops = boss.drops.map((d, i) => ({ drop: d, idx: i })).filter(({ drop }) => !drop.goldDrop);
  const goldDrop  = boss.drops.find((d) => d.goldDrop);

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

  function rollGold(): number {
    const g = goldDrop!.goldDrop!;
    return Math.floor(Math.random() * (g.max - g.min + 1)) + g.min;
  }

  async function confirm() {
    setLoading(true);
    try {
      const goldAmount = goldDrop ? rollGold() : 0;
      await api.post(`/combat/bosses/${boss.instanceId}/defeat`, {
        drops: [...selectedDrops].map((i) => ({
          name: boss.drops[i].name,
          icon: boss.drops[i].icon,
          playerId: dropAssignments[i] ?? '',
        })),
        goldDrop: goldDrop && goldAssignment
          ? { amount: goldAmount, playerId: goldAssignment }
          : null,
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

        {/* Item Drops */}
        {itemDrops.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Drops de item</p>
            {itemDrops.map(({ drop, idx }) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="checkbox" id={`bdrop-${idx}`} checked={selectedDrops.has(idx)}
                  onChange={() => toggleDrop(idx)} className="accent-[#c8a050]" />
                <label htmlFor={`bdrop-${idx}`} className="flex-1 text-sm flex items-center gap-1.5 cursor-pointer">
                  <span className="opacity-60"><ItemIcon name={drop.icon || 'Package'} size={13} /></span>
                  {drop.name}
                </label>
                {selectedDrops.has(idx) && (
                  <select
                    value={dropAssignments[idx] ?? ''}
                    onChange={(e) => setDropAssignments((a) => ({ ...a, [idx]: e.target.value }))}
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

        {/* Gold Drop */}
        {goldDrop && (
          <div className="flex flex-col gap-2 rounded-lg p-3 border" style={{ background: 'rgba(200,160,80,0.08)', borderColor: '#6a5a20' }}>
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <Coins size={13} />
              <span className="font-semibold">Drop de gold</span>
              <span className="opacity-60 ml-1">
                {goldDrop.goldDrop!.min}–{goldDrop.goldDrop!.max} 🪙
                <span className="ml-1 capitalize">({goldDrop.goldDrop!.tier})</span>
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Enviar para</p>
              <select
                value={goldAssignment}
                onChange={(e) => setGoldAssignment(e.target.value)}
                className="w-full text-xs rounded px-2 py-1.5 outline-none"
                style={selStyle}
              >
                <option value="">Selecionar jogador…</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.char.name}</option>
                ))}
              </select>
            </div>
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
            <input type="checkbox" id="boss-xp" checked={distributeXp}
              onChange={(e) => setDistributeXp(e.target.checked)} className="accent-[#3aaa60]" />
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
