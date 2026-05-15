'use client';

import { useState } from 'react';
import { Trash2, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { proxyUrl } from '@/lib/gdrive';
import type { CombatAlly } from '@/store/types';

interface Props {
  ally: CombatAlly;
}

const allyBg     = '#151e1a';
const allyBorder = '#2a4a3a';
const allyMuted  = '#5a8a70';
const allyText   = '#c8e8d8';

export default function AllyCard({ ally }: Props) {
  const [notes,     setNotes]     = useState(ally.notes ?? '');
  const [editingHp, setEditingHp] = useState(false);
  const [hpDraft,   setHpDraft]   = useState('');
  const [expanded,  setExpanded]  = useState(false);

  const hpPct = Math.max(0, Math.min(100, (ally.hpCurrent / ally.hpMax) * 100));

  function adjustHp(delta: number) {
    api.put(`/combat/allies/${ally.id}/hp`, { delta }).catch(() => {});
  }

  function startEditHp() { setHpDraft(String(ally.hpCurrent)); setEditingHp(true); }

  function commitHp() {
    const parsed = parseInt(hpDraft, 10);
    if (!isNaN(parsed)) {
      const delta = Math.max(0, Math.min(ally.hpMax, parsed)) - ally.hpCurrent;
      if (delta !== 0) adjustHp(delta);
    }
    setEditingHp(false);
  }

  function saveNotes() {
    api.put(`/combat/allies/${ally.id}/notes`, { notes }).catch(() => {});
  }

  function removeAlly() {
    api.delete(`/combat/allies/${ally.id}`).catch(() => {});
  }

  return (
    <div className="rounded-lg border flex flex-col gap-2 p-3"
      style={{ background: allyBg, borderColor: allyBorder, color: allyText }}>

      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: '#1a2e24' }}>
          {ally.portraitUrl ? (
            <img src={proxyUrl(ally.portraitUrl)} alt={ally.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <UserRound size={16} style={{ color: allyMuted }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{ally.name}</p>
          <p className="text-xs mt-0.5" style={{ color: allyMuted }}>{ally.type || 'Aliado'}</p>
        </div>
        <button onClick={removeAlly} className="opacity-40 hover:opacity-80 transition-opacity shrink-0" title="Remover">
          <Trash2 size={13} />
        </button>
      </div>

      {/* HP bar */}
      <div className="flex items-center gap-2">
        <button onClick={() => adjustHp(-1)} className="text-xs px-1.5 py-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
          style={{ background: '#1a2e24' }}>−</button>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#1a2e24' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#facc15' : '#f87171' }} />
        </div>
        <button onClick={() => adjustHp(1)} className="text-xs px-1.5 py-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
          style={{ background: '#1a2e24' }}>+</button>
        {editingHp ? (
          <input autoFocus value={hpDraft} onChange={(e) => setHpDraft(e.target.value)}
            onBlur={commitHp}
            onKeyDown={(e) => { if (e.key === 'Enter') commitHp(); if (e.key === 'Escape') setEditingHp(false); }}
            className="w-12 text-xs text-center rounded px-1 py-0.5 outline-none"
            style={{ background: '#1a2e24', border: `1px solid ${allyBorder}` }} />
        ) : (
          <button onClick={startEditHp} className="text-xs font-mono opacity-80 hover:opacity-100 min-w-[40px] text-right">
            {ally.hpCurrent}/{ally.hpMax}
          </button>
        )}
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
        {[['FOR', ally.attributes?.strength ?? '—'], ['AGI', ally.attributes?.agility ?? '—'], ['INT', ally.attributes?.intelligence ?? '—'], ['DEF', ally.attributes?.defense ?? '—']].map(([l, v]) => (
          <div key={l} className="rounded py-0.5" style={{ background: '#1a2e24' }}>
            <p style={{ color: allyMuted }}>{l}</p>
            <p className="font-bold text-xs">{v}</p>
          </div>
        ))}
      </div>

      {/* Attacks */}
      {(ally.attacks?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-0.5">
          {(ally.attacks ?? []).map((a, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="truncate" style={{ color: '#8abaa0' }}>{a.name}</span>
              <span className="font-mono ml-2 shrink-0" style={{ color: allyMuted }}>{a.damage}</span>
            </div>
          ))}
        </div>
      )}

      {/* Desc (collapsible) */}
      {ally.desc && (
        <div>
          <button onClick={() => setExpanded((v) => !v)}
            className="text-[10px] opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: allyMuted }}>
            {expanded ? '▲ descrição' : '▼ descrição'}
          </button>
          {expanded && <p className="text-xs mt-1 leading-relaxed" style={{ color: allyMuted }}>{ally.desc}</p>}
        </div>
      )}

      {/* Notes */}
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={2}
        className="w-full text-xs rounded px-2 py-1 resize-none outline-none placeholder:opacity-30"
        style={{ background: '#1a2e24', border: `1px solid ${allyBorder}`, color: allyText }}
        placeholder="Observações…" />
    </div>
  );
}
