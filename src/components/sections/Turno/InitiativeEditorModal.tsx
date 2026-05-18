'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Player, InitiativeEntry, EnemyInstance, BossInstance, CombatAlly } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  players: Player[];
  enemies: EnemyInstance[];
  bosses:  BossInstance[];
  allies:  CombatAlly[];
  onConfirm: (entries: InitiativeEntry[]) => void;
  onClose: () => void;
}

function agiMod(agility: number) {
  if (agility <= 7)  return -1;
  if (agility <= 11) return 0;
  if (agility <= 15) return 1;
  if (agility <= 19) return 2;
  if (agility <= 23) return 3;
  if (agility <= 27) return 4;
  if (agility <= 31) return 5;
  if (agility <= 35) return 6;
  return 7;
}

function initBonus(agility: number) { return Math.floor(agiMod(agility) / 2); }
function d20() { return Math.ceil(Math.random() * 20); }

function rollAll(players: Player[], enemies: EnemyInstance[], bosses: BossInstance[], allies: CombatAlly[]): InitiativeEntry[] {
  const entries: InitiativeEntry[] = [
    ...players.map(p => ({
      playerId: p.id,
      name: p.char.name,
      value: d20() + initBonus(p.attributes.agility),
    })),
    ...enemies.map(e => ({
      playerId: e.instanceId,
      name: `${e.icon || '⚔'} ${e.name}`,
      value: d20() + initBonus(e.attributes.agility),
    })),
    ...bosses.map(b => {
      const phase = b.phases[b.currentPhase];
      return {
        playerId: b.instanceId,
        name: `${b.icon || '★'} ${b.name}`,
        value: d20() + initBonus(phase?.attributes?.agility ?? 0),
      };
    }),
    ...allies.map(a => ({
      playerId: a.id,
      name: `🛡 ${a.name}`,
      value: d20() + initBonus(a.attributes.agility),
    })),
  ];
  return entries.sort((a, b) => b.value - a.value);
}

export default function InitiativeEditorModal({ players, enemies, bosses, allies, onConfirm, onClose }: Props) {
  const [entries, setEntries] = useState<InitiativeEntry[]>(() =>
    rollAll(players, enemies, bosses, allies)
  );

  function setValue(id: string, value: number) {
    setEntries(prev => prev.map(e => e.playerId === id ? { ...e, value } : e));
  }

  function move(i: number, dir: -1 | 1) {
    setEntries(prev => {
      const list = [...prev];
      const j = i + dir;
      if (j < 0 || j >= list.length) return prev;
      [list[i], list[j]] = [list[j], list[i]];
      return list;
    });
  }

  const isPlayer = (id: string) => players.some(p => p.id === id);
  const isAlly   = (id: string) => allies.some(a => a.id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] max-h-[88vh] flex flex-col rounded-xl border border-e-border bg-e-surface text-e-text shadow-2xl">

        <div className="flex items-center justify-between px-5 py-4 border-b border-e-border shrink-0">
          <div>
            <h2 className="font-bold text-base">Iniciativa</h2>
            <p className="text-[11px] text-e-faint mt-0.5">Resultado do d20 + bônus de AGI · ajuste se precisar</p>
          </div>
          <button onClick={onClose} className="opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1.5">
          {entries.map((entry, i) => {
            const player = isPlayer(entry.playerId);
            return (
              <div key={entry.playerId}
                style={{ display: 'grid', gridTemplateColumns: '24px 1fr 56px 20px', alignItems: 'center', gap: 8 }}
                className="px-3 py-2 rounded-xl bg-e-card border border-e-border">
                <span style={{ fontSize: 11, color: '#71717a', textAlign: 'center', fontFamily: 'monospace' }}>
                  {i + 1}
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 500, overflow: 'hidden',
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  color: player ? '#f4f4f5' : isAlly(entry.playerId) ? '#2dd4bf' : '#fb923c',
                }}>
                  {entry.name}
                </span>
                <input
                  type="number" min={1} value={entry.value}
                  onChange={e => setValue(entry.playerId, Number(e.target.value))}
                  style={{ width: 56, textAlign: 'center', fontSize: 14, fontWeight: 700,
                    background: 'transparent', border: '1px solid #3f3f46', borderRadius: 6,
                    color: '#f4f4f5', padding: '2px 4px', outline: 'none' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {([[-1, '▲'], [1, '▼']] as const).map(([dir, arrow]) => (
                    <button key={arrow} onClick={() => move(i, dir)}
                      disabled={dir < 0 ? i === 0 : i === entries.length - 1}
                      style={{ fontSize: 9, color: '#71717a', lineHeight: 1, cursor: 'pointer', opacity: (dir < 0 ? i === 0 : i === entries.length - 1) ? 0.2 : 1 }}>
                      {arrow}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 justify-end px-5 py-4 border-t border-e-border shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={() => onConfirm(entries)} disabled={entries.length === 0}>
            Confirmar ({entries.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
