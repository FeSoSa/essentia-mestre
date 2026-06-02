'use client';

import { useState } from 'react';
import { Star, RotateCcw, Coins } from 'lucide-react';
import { api } from '@/lib/api';
import type { EnemyInstance, Player } from '@/store/types';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import { ItemIcon } from '@/components/sections/Itens/ItemCard';

interface Props {
  enemy: EnemyInstance;
  players: Player[];
  onClose: () => void;
}

export default function DefeatModal({ enemy, players, onClose }: Props) {
  const [selectedDrops, setSelectedDrops] = useState<Set<number>>(new Set());
  const [dropAssignments, setDropAssignments] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    enemy.drops.forEach((drop, i) => {
      if (!drop.goldDrop && drop.targetPlayerId) init[i] = drop.targetPlayerId;
    });
    return init;
  });
  const [goldAssignment, setGoldAssignment] = useState<string>('');
  const [goldDistribute, setGoldDistribute] = useState(false);
  const [xpMode, setXpMode] = useState<'all' | 'specific' | 'none'>('all');
  const [xpPlayer, setXpPlayer] = useState('');
  const [xpAmount, setXpAmount] = useState(String(enemy.xp));
  const [loading, setLoading] = useState(false);

  const itemDrops = enemy.drops.map((d, i) => ({ drop: d, idx: i })).filter(({ drop }) => !drop.goldDrop);
  const goldDrop  = enemy.drops.find((d) => d.goldDrop);

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

  function rollGold(): number {
    const g = goldDrop!.goldDrop!;
    return Math.floor(Math.random() * (g.max - g.min + 1)) + g.min;
  }

  async function confirm() {
    setLoading(true);
    try {
      const goldAmount = goldDrop ? rollGold() : 0;
      await api.post(`/combat/enemies/${enemy.instanceId}/defeat`, {
        drops: [...selectedDrops].map((i) => ({
          itemName: enemy.drops[i].name,
          icon: enemy.drops[i].icon,
          playerId: dropAssignments[i] ?? '',
        })),
        goldDrop: goldDrop
          ? { amount: goldAmount, distribute: goldDistribute, playerId: goldDistribute ? '' : goldAssignment }
          : null,
        distributeXp: xpMode === 'all',
        xpPlayerId: xpMode === 'specific' ? xpPlayer : null,
        xpAmount: xpMode !== 'none' ? (parseInt(xpAmount) || 0) : 0,
      });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const xpModified = enemy.xp > 0 && parseInt(xpAmount) !== enemy.xp;
  const distributeXp = xpMode === 'all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-96 rounded-xl border flex flex-col gap-4 p-5"
        style={{ background: '#1e1616', borderColor: '#4a2a2a', color: '#e8d8d8' }}
      >
        <h2 className="font-bold text-base">
          Derrota — {enemy.icon} {enemy.name}
        </h2>

        {/* Item Drops */}
        {itemDrops.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a5050' }}>Drops de item</p>
            {itemDrops.map(({ drop, idx }) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectedDrops.has(idx)} onChange={() => toggleDrop(idx)} color="default" />
                  <span className="flex-1 text-sm flex items-center gap-1.5 cursor-pointer select-none" onClick={() => toggleDrop(idx)}>
                    <span className="opacity-60"><ItemIcon name={drop.icon || 'Package'} size={13} /></span>
                    {drop.name}
                  </span>
                </div>
                {selectedDrops.has(idx) && (
                  <div className="ml-6 flex flex-wrap gap-1">
                    {players.map((p) => (
                      <button key={p.id} type="button"
                        onClick={() => assignDrop(idx, p.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer"
                        style={dropAssignments[idx] === p.id
                          ? { borderColor: '#c04040', background: '#2a1818', color: '#e8d8d8' }
                          : { borderColor: '#4a2a2a', background: 'transparent', color: '#7a5050' }}>
                        {p.char.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Gold Drop */}
        {goldDrop && (
          <div className="flex flex-col gap-2.5 rounded-lg p-3" style={{ background: '#2a2010', border: '1px solid #6a5010' }}>
            <div className="flex items-center gap-1.5 text-xs text-yellow-400">
              <Coins size={13} />
              <span className="font-semibold">Drop de gold</span>
              <span className="opacity-60 ml-1">
                {goldDrop.goldDrop!.min}–{goldDrop.goldDrop!.max} 🪙
                <span className="ml-1 capitalize">({goldDrop.goldDrop!.tier})</span>
              </span>
            </div>

            {/* Toggle: distribuir / jogador específico */}
            <div className="flex gap-1.5">
              <button type="button"
                onClick={() => setGoldDistribute(true)}
                className="flex-1 text-xs py-1.5 rounded-lg border transition-colors cursor-pointer"
                style={goldDistribute
                  ? { borderColor: '#c8a050', background: '#3a2e10', color: '#f0d060' }
                  : { borderColor: '#4a3a10', background: 'transparent', color: '#7a6030' }}>
                Distribuir para todos
              </button>
              <button type="button"
                onClick={() => setGoldDistribute(false)}
                className="flex-1 text-xs py-1.5 rounded-lg border transition-colors cursor-pointer"
                style={!goldDistribute
                  ? { borderColor: '#c8a050', background: '#3a2e10', color: '#f0d060' }
                  : { borderColor: '#4a3a10', background: 'transparent', color: '#7a6030' }}>
                Jogador específico
              </button>
            </div>

            {!goldDistribute && (
              <div className="flex flex-wrap gap-1">
                {players.map((p) => (
                  <button key={p.id} type="button"
                    onClick={() => setGoldAssignment(p.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer"
                    style={goldAssignment === p.id
                      ? { borderColor: '#c8a050', background: '#3a2e10', color: '#f0d060' }
                      : { borderColor: '#4a3a10', background: 'transparent', color: '#7a6030' }}>
                    {p.char.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* XP */}
        {enemy.xp > 0 && (
          <div className="flex flex-col gap-2.5 rounded-lg p-3" style={{ background: '#1a2a1a', border: '1px solid #166534' }}>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <Star size={13} />
              <span className="font-semibold">XP</span>
              <span className="opacity-60 ml-1">{enemy.xp} por jogador</span>
            </div>

            <div className="flex gap-1.5">
              {(['all', 'specific', 'none'] as const).map((mode) => (
                <button key={mode} type="button"
                  onClick={() => setXpMode(mode)}
                  className="flex-1 text-xs py-1.5 rounded-lg border transition-colors cursor-pointer"
                  style={xpMode === mode
                    ? { borderColor: '#4ade80', background: '#1a3a1a', color: '#4ade80' }
                    : { borderColor: '#166534', background: 'transparent', color: '#3a6a3a' }}>
                  {mode === 'all' ? 'Todos' : mode === 'specific' ? 'Específico' : 'Não dar'}
                </button>
              ))}
            </div>

            {xpMode === 'specific' && (
              <div className="flex flex-wrap gap-1">
                {players.map((p) => (
                  <button key={p.id} type="button"
                    onClick={() => setXpPlayer(p.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer"
                    style={xpPlayer === p.id
                      ? { borderColor: '#4ade80', background: '#1a3a1a', color: '#4ade80' }
                      : { borderColor: '#166534', background: 'transparent', color: '#3a6a3a' }}>
                    {p.char.name}
                  </button>
                ))}
              </div>
            )}

            {xpMode !== 'none' && (
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value)}
                  className="w-20 rounded-lg px-2 py-1 text-sm text-center outline-none tabular-nums"
                  style={{ background: '#0a1a0a', color: '#4ade80', border: '1px solid #166534' }}
                />
                <span className="text-xs" style={{ color: '#3a6a3a' }}>XP</span>
                {xpModified && (
                  <button type="button" onClick={() => setXpAmount(String(enemy.xp))}
                    className="ml-auto flex items-center gap-1 text-xs cursor-pointer transition-colors"
                    style={{ color: '#3a6a3a' }}>
                    <RotateCcw size={11} />
                    {enemy.xp}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {enemy.xp === 0 && (
          <p className="text-xs text-e-faint italic">Sem XP configurado.</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={confirm} disabled={loading}>
            {loading ? 'Confirmando…' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
