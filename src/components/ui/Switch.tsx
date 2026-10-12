'use client';

import type { ReactNode } from 'react';

/** Interruptor liga/desliga com título e descrição clicáveis (um botão só). */
export default function Switch({ checked, onChange, label, desc, className = '' }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  desc?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`group w-full flex items-center justify-between gap-3 text-left cursor-pointer select-none ${className}`}
    >
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold text-e-text leading-tight">{label}</span>
        {desc && <span className="text-[11px] text-e-sub leading-snug">{desc}</span>}
      </span>
      <span className={`relative shrink-0 w-9 h-5 rounded-full transition-colors duration-150 ${checked ? 'bg-e-accent' : 'bg-e-border group-hover:bg-e-border2'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform duration-150 ${checked ? 'translate-x-4 bg-black' : 'bg-zinc-300'}`} />
      </span>
    </button>
  );
}
