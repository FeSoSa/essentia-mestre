'use client';

import type { FastActionOption } from '@/store/types';

interface Props {
  options: FastActionOption[];
  onChange: (options: FastActionOption[]) => void;
}

export default function OptionBuilder({ options, onChange }: Props) {
  const add = () => onChange([...options, { id: crypto.randomUUID(), text: '', color: '#7c5cbf' }]);
  const update = (id: string, field: keyof FastActionOption, value: string) =>
    onChange(options.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  const remove = (id: string) => onChange(options.filter((o) => o.id !== id));

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2">
          <input
            type="color"
            value={opt.color}
            onChange={(e) => update(opt.id, 'color', e.target.value)}
            className="!w-10 shrink-0"
          />
          <input
            type="text"
            value={opt.text}
            onChange={(e) => update(opt.id, 'text', e.target.value)}
            placeholder="Texto da opção…"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => remove(opt.id)}
            className="text-e-faint hover:text-e-danger transition-colors text-lg cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="py-2.5 rounded-xl border border-dashed border-e-border text-e-faint hover:border-e-border2 hover:text-e-muted text-sm transition-colors cursor-pointer"
      >
        + Adicionar opção
      </button>
    </div>
  );
}
