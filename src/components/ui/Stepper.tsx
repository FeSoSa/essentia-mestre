'use client';

import { Minus, Plus } from 'lucide-react';

/** Contador − / + para quantidades (substitui o input number nativo). */
export default function Stepper({ value, onChange, min = 1, max, label, cor }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  /** Cores opcionais para combinar com o bloco (inimigo, chefe). */
  cor?: { borda: string; texto: string };
}) {
  const limitar = (v: number) => Math.max(min, max != null ? Math.min(max, v) : v);
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-lg border shrink-0"
      style={{ borderColor: cor?.borda ?? 'var(--color-e-border)', color: cor?.texto ?? 'var(--color-e-text)' }}>
      <button type="button" aria-label="Menos um" disabled={value <= min} onClick={() => onChange(limitar(value - 1))}
        className="w-7 h-7 flex items-center justify-center rounded-l-lg cursor-pointer hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed">
        <Minus size={12} />
      </button>
      <span className="min-w-6 px-1 text-center text-sm font-bold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Mais um" disabled={max != null && value >= max} onClick={() => onChange(limitar(value + 1))}
        className="w-7 h-7 flex items-center justify-center rounded-r-lg cursor-pointer hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed">
        <Plus size={12} />
      </button>
    </div>
  );
}
