'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { EnemyInstance, Player } from '@/store/types';
import DefeatModal from './DefeatModal';

interface Props {
  enemy: EnemyInstance;
  players: Player[];
}

export default function EnemyCard({ enemy, players }: Props) {
  const [showDefeat, setShowDefeat] = useState(false);
  const [notes, setNotes] = useState(enemy.notes ?? '');
  const [editingHp, setEditingHp] = useState(false);
  const [hpDraft, setHpDraft] = useState('');

  const hpPct = Math.max(0, Math.min(100, (enemy.hpCurrent / enemy.hpMax) * 100));

  function adjustHp(delta: number) {
    api.put(`/combat/enemies/${enemy.instanceId}/hp`, { delta }).catch(() => {});
  }

  function startEditHp() {
    setHpDraft(String(enemy.hpCurrent));
    setEditingHp(true);
  }

  function commitHp() {
    const parsed = parseInt(hpDraft, 10);
    if (!isNaN(parsed)) {
      const delta = Math.max(0, Math.min(enemy.hpMax, parsed)) - enemy.hpCurrent;
      if (delta !== 0) adjustHp(delta);
    }
    setEditingHp(false);
  }

  function saveNotes() {
    api.put(`/combat/enemies/${enemy.instanceId}/notes`, { notes }).catch(() => {});
  }

  return (
    <>
      <div
        className="rounded-lg border flex flex-col gap-2 p-3 text-e-enemy-text"
        style={{ background: '#1e1616', borderColor: '#4a2a2a' }}
      >
        {/* Header */}
        <div className="flex items-start gap-2">
          <span
            className="text-xl leading-none shrink-0 flex items-center justify-center w-8 h-8 rounded"
            style={{ background: '#2a1818' }}
          >
            {enemy.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{enemy.name}</p>
            <p className="text-xs mt-0.5" style={{ color: '#7a5050' }}>
              {enemy.type}
              {enemy.xp > 0 && (
                <span style={{ color: '#3aaa60' }}> · ⭐ {enemy.xp} XP</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowDefeat(true)}
            className="shrink-0 text-base leading-none opacity-60 hover:opacity-100 transition-opacity"
            title="Derrota"
          >
            💀
          </button>
        </div>

        {/* HP */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a5050' }}>HP</span>
            {editingHp ? (
              <input
                type="number"
                value={hpDraft}
                onChange={(e) => setHpDraft(e.target.value)}
                onBlur={commitHp}
                onKeyDown={(e) => { if (e.key === 'Enter') commitHp(); if (e.key === 'Escape') setEditingHp(false); }}
                autoFocus
                className="w-14 text-xs tabular-nums bg-transparent border-b outline-none"
                style={{ color: '#e8d8d8', borderColor: '#e8d8d8' }}
              />
            ) : (
              <span className="text-xs tabular-nums cursor-text hover:opacity-70" onClick={startEditHp}>
                {enemy.hpCurrent}/{enemy.hpMax}
              </span>
            )}
            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => adjustHp(-1)}
                className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center transition-colors"
                style={{ background: '#2a1818', color: '#e8d8d8' }}
              >
                −
              </button>
              <button
                onClick={() => adjustHp(1)}
                className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center transition-colors"
                style={{ background: '#2a1818', color: '#e8d8d8' }}
              >
                +
              </button>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#2a1010' }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${hpPct}%`, background: '#c04040' }}
            />
          </div>
        </div>

        {/* Attributes */}
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { label: 'FOR', value: enemy.attributes.strength },
            { label: 'AGI', value: enemy.attributes.agility },
            { label: 'INT', value: enemy.attributes.intelligence },
            { label: 'DEF', value: enemy.attributes.defense },
          ].map(({ label, value }) => (
            <div key={label} className="rounded py-1" style={{ background: '#2a1818' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#7a5050' }}>{label}</p>
              <p className="text-sm font-bold leading-tight">{value}</p>
              <p className="text-[8px] font-bold leading-none mt-0.5" style={{ color: Math.floor((value - 10) / 2) >= 0 ? '#3dba72' : '#e05050' }}>
                {Math.floor((value - 10) / 2) >= 0 ? '+' : ''}{Math.floor((value - 10) / 2)}
              </p>
            </div>
          ))}
        </div>

        {/* Attacks */}
        {enemy.attacks.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {enemy.attacks.map((atk, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="truncate">{atk.name}</span>
                <span className="font-mono shrink-0 ml-2" style={{ color: '#7a5050' }}>{atk.damage}</span>
              </div>
            ))}
          </div>
        )}

        {/* Drops */}
        {enemy.drops.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {enemy.drops.slice(0, 2).map((drop, i) => (
              <span
                key={i}
                className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ background: '#2a1818', color: '#e8d8d8' }}
              >
                {drop.icon} {drop.name}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Observações…"
          rows={2}
          className="w-full text-xs rounded px-2 py-1 resize-none outline-none placeholder:opacity-40"
          style={{ background: '#2a1818', color: '#e8d8d8', borderColor: 'transparent' }}
        />
      </div>

      {showDefeat && (
        <DefeatModal
          enemy={enemy}
          players={players}
          onClose={() => setShowDefeat(false)}
        />
      )}
    </>
  );
}
