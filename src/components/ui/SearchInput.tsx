'use client';

import { Search, X } from 'lucide-react';

/**
 * Busca padrão das seções. Largura e padding vão por style porque o globals.css
 * aplica width/padding em todo input fora de layer (vence as classes do Tailwind).
 */
export default function SearchInput({ value, onChange, placeholder = 'Buscar…', width = 240 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; width?: number;
}) {
  return (
    <div className="relative shrink-0" style={{ width }}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-e-faint pointer-events-none" />
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onChange(''); }}
        style={{ paddingLeft: 32, paddingRight: value ? 30 : 12, height: 36, fontSize: 13 }} />
      {value && (
        <button type="button" onClick={() => onChange('')} title="Limpar busca"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-e-faint hover:text-e-text cursor-pointer">
          <X size={13} />
        </button>
      )}
    </div>
  );
}

/** Abas padrão das seções, com contador opcional. */
export function Tabs<T extends string>({ tabs, value, onChange }: {
  tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-xl p-1 bg-e-surface border border-white/[0.06] shrink-0">
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button key={t.id} type="button" onClick={() => onChange(t.id)}
            className={`h-8 px-3.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              on ? 'bg-white/[0.08] text-e-text' : 'text-e-faint hover:text-e-text'}`}>
            {t.label}
            {t.count != null && <span className={`text-[11px] tabular-nums ${on ? 'text-e-sub' : 'text-e-faint/70'}`}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
