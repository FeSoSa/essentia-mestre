'use client';

import { useState } from 'react';

interface Props {
  label: string;
  current: number;
  max: number;
  fillClass: string;
  trackClass: string;
  valueClass: string;
  onAdd: () => void;
  onRemove: () => void;
  onSetValue?: (value: number) => void;
}

export default function ResourceBar({ label, current, max, fillClass, trackClass, valueClass, onAdd, onRemove, onSetValue }: Props) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEdit() {
    if (!onSetValue) return;
    setDraft(String(current));
    setEditing(true);
  }

  function commit() {
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && onSetValue) {
      onSetValue(Math.max(0, Math.min(max, parsed)));
    }
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint">{label}</span>
        {editing ? (
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            className={`w-16 text-sm font-semibold tabular-nums text-right bg-transparent border-b border-current outline-none ${valueClass}`}
          />
        ) : (
          <span
            className={`text-sm font-semibold tabular-nums ${valueClass} ${onSetValue ? 'cursor-text hover:opacity-70' : ''}`}
            onClick={startEdit}
          >
            {current}<span className="text-e-faint text-xs font-normal">/{max}</span>
          </span>
        )}
      </div>
      <div className={`h-2 rounded-full ${trackClass} overflow-hidden`}>
        <div className={`h-full rounded-full transition-all duration-500 ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-0.5">
        <button onClick={onAdd}    className="h-7 rounded-lg bg-e-card border border-e-border text-e-sub hover:text-e-text hover:border-e-border2 text-sm font-bold transition-colors cursor-pointer">+</button>
        <button onClick={onRemove} className="h-7 rounded-lg bg-e-card border border-e-border text-e-sub hover:text-e-text hover:border-e-border2 text-sm font-bold transition-colors cursor-pointer">−</button>
      </div>
    </div>
  );
}
