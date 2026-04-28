'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { BossInstance, Player } from '@/store/types';
import BossDefeatModal from './BossDefeatModal';

interface Props {
  boss: BossInstance;
  players: Player[];
}

const ATTR_LABELS = [
  ['FOR', 'strength'], ['AGI', 'agility'], ['INT', 'intelligence'], ['RES', 'resistance'],
  ['FLX', 'flow'],     ['SAB', 'wisdom'],  ['PRE', 'presence'],    ['DEF', 'defense'],
] as const;

export default function BossCard({ boss, players }: Props) {
  const [showDefeat, setShowDefeat] = useState(false);
  const [notes, setNotes] = useState(boss.notes ?? '');
  const [editingHp, setEditingHp] = useState(false);
  const [hpDraft, setHpDraft] = useState('');

  const phase     = boss.phases[boss.currentPhase];
  const totalPhases = boss.phases.length;
  const hpPct     = Math.max(0, Math.min(100, (boss.hpCurrent / phase.hpMax) * 100));

  function adjustHp(delta: number) {
    api.put(`/combat/bosses/${boss.instanceId}/hp`, { delta }).catch(() => {});
  }

  function startEditHp() {
    setHpDraft(String(boss.hpCurrent));
    setEditingHp(true);
  }

  function commitHp() {
    const parsed = parseInt(hpDraft, 10);
    if (!isNaN(parsed)) {
      const delta = Math.max(0, Math.min(phase.hpMax, parsed)) - boss.hpCurrent;
      if (delta !== 0) adjustHp(delta);
    }
    setEditingHp(false);
  }

  function nextPhase() {
    api.post(`/combat/bosses/${boss.instanceId}/next-phase`).catch(() => {});
  }

  function saveNotes() {
    api.put(`/combat/bosses/${boss.instanceId}/notes`, { notes }).catch(() => {});
  }

  const isLastPhase = boss.currentPhase >= totalPhases - 1;

  return (
    <>
      <div
        className="rounded-xl border-2 flex flex-col gap-2.5 p-3"
        style={{ background: '#1a1810', borderColor: '#6a5a20', color: '#f0e8d0' }}
      >
        {/* Header */}
        <div className="flex items-start gap-2">
          <span
            className="text-2xl leading-none shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: '#2a2410' }}
          >
            {boss.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-sm leading-tight truncate">{boss.name}</p>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
                style={{ background: '#c8a05022', color: '#c8a050', border: '1px solid #6a5a20' }}
              >
                Boss
              </span>
            </div>
            <span
              className="text-[10px] font-semibold mt-0.5 inline-block"
              style={{ color: '#c8a050' }}
            >
              Fase {boss.currentPhase + 1}/{totalPhases}
              {phase.name ? ` — ${phase.name}` : ''}
            </span>
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
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>HP</span>
            {editingHp ? (
              <input
                type="number"
                value={hpDraft}
                onChange={(e) => setHpDraft(e.target.value)}
                onBlur={commitHp}
                onKeyDown={(e) => { if (e.key === 'Enter') commitHp(); if (e.key === 'Escape') setEditingHp(false); }}
                autoFocus
                className="w-14 text-xs tabular-nums bg-transparent border-b outline-none"
                style={{ color: '#f0e8d0', borderColor: '#f0e8d0' }}
              />
            ) : (
              <span className="text-xs tabular-nums cursor-text hover:opacity-70" onClick={startEditHp}>
                {boss.hpCurrent}/{phase.hpMax}
              </span>
            )}
            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => adjustHp(-1)}
                className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center"
                style={{ background: '#2a2410', color: '#f0e8d0' }}
              >−</button>
              <button
                onClick={() => adjustHp(1)}
                className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center"
                style={{ background: '#2a2410', color: '#f0e8d0' }}
              >+</button>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2a2410' }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${hpPct}%`, background: '#c8a050' }}
            />
          </div>
        </div>

        {/* Attributes 4x2 */}
        <div className="grid grid-cols-4 gap-1 text-center">
          {ATTR_LABELS.map(([label, key]) => (
            <div key={label} className="rounded py-1" style={{ background: '#2a2410' }}>
              <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>{label}</p>
              <p className="text-xs font-bold leading-tight">{phase.attributes[key]}</p>
            </div>
          ))}
        </div>

        {/* Attacks */}
        {phase.attacks.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#7a7050' }}>Ataques</p>
            {phase.attacks.map((atk, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="truncate">{atk.name}</span>
                <span className="font-mono shrink-0 ml-2" style={{ color: '#7a7050' }}>{atk.damage}</span>
              </div>
            ))}
          </div>
        )}

        {/* Special ability */}
        {phase.specialAbility && (
          <div className="rounded-lg p-2 flex flex-col gap-0.5" style={{ background: '#2a2410' }}>
            <p className="text-xs font-bold" style={{ color: '#c8a050' }}>
              ⚡ {phase.specialAbility.name}
              {phase.specialAbility.cooldownTurns > 0 && (
                <span className="font-normal ml-1" style={{ color: '#7a7050' }}>
                  ({phase.specialAbility.cooldownTurns}t)
                </span>
              )}
            </p>
            <p className="text-[11px] leading-snug" style={{ color: '#7a7050' }}>{phase.specialAbility.desc}</p>
          </div>
        )}

        {/* Immunities */}
        {boss.immunities.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Imunidades</p>
            <div className="flex gap-1 flex-wrap">
              {boss.immunities.map((im, i) => (
                <span
                  key={i}
                  className="text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1"
                  style={{ background: '#2a2410', color: '#f0e8d0' }}
                >
                  {im.icon} {im.type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resistances */}
        {boss.resistances.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Resistências</p>
            <div className="flex gap-1 flex-wrap">
              {boss.resistances.map((r, i) => (
                <span
                  key={i}
                  className="text-[11px] px-1.5 py-0.5 rounded"
                  style={{ background: '#2a2410', color: '#c8a050' }}
                >
                  {r.type} −{r.reduction}%
                </span>
              ))}
            </div>
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
          style={{ background: '#2a2410', color: '#f0e8d0' }}
        />

        {/* Next phase */}
        {!isLastPhase && (
          <button
            onClick={nextPhase}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: '#2a2410', color: '#c8a050', border: '1px solid #6a5a20' }}
          >
            <ChevronRight size={13} />
            Próxima fase
          </button>
        )}
      </div>

      {showDefeat && (
        <BossDefeatModal boss={boss} players={players} onClose={() => setShowDefeat(false)} />
      )}
    </>
  );
}
