'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { Essencia } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import { STATUS_ICONS } from '@/lib/statusIcons';

const TYPE_COLORS: Record<string, string> = {
  Grande:  '#d4a84e',
  Mitica:  '#a855f7',
  Derivada:'#4ade80',
};

export default function EssenciaCard({
  essencia,
  skills = [],
  parentName,
  onEdit,
  onDelete,
}: {
  essencia: Essencia;
  skills?: Skill[];
  parentName?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const accentColor = essencia.color || TYPE_COLORS[essencia.type] || '#71717a';
  const bonuses = Object.entries(essencia.attributeBonus ?? {}).filter(([, v]) => v !== 0);
  const IconEntry = essencia.icon ? STATUS_ICONS.find((i) => i.name === essencia.icon) : null;

  return (
    <div
      className="rounded-lg border bg-e-surface p-3 flex flex-col gap-2"
      style={{ borderColor: accentColor + '55' }}
    >
      <div className="flex items-start gap-2">
        {IconEntry && (
          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: accentColor + '22', color: accentColor }}>
            <IconEntry.Icon size={14} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-e-text">{essencia.name}</p>
          <div className="flex items-center gap-1 flex-wrap">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: accentColor + '22', color: accentColor }}
            >
              {essencia.type}
            </span>
            {parentName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-e-card text-e-faint truncate max-w-[100px]" title={parentName}>
                ↑ {parentName}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit}
            className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-text hover:bg-e-card transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete}
            className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-danger hover:bg-e-card transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {essencia.desc && (
        <p className="text-xs text-e-faint line-clamp-2">{essencia.desc}</p>
      )}

      {bonuses.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {bonuses.map(([attr, val]) => (
            <span key={attr} className="px-1.5 py-0.5 rounded text-[10px] bg-e-card text-e-text">
              {attr.slice(0, 3).toUpperCase()} {val > 0 ? '+' : ''}{val}
            </span>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div className="flex flex-col gap-0.5 pt-1 border-t border-e-border">
          {skills.map((s) => (
            <p key={s.id} className="text-[10px] text-e-faint truncate">
              · {s.name}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
