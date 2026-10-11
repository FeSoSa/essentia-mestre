'use client';

import { Pencil, Trash2, CornerLeftUp } from 'lucide-react';
import type { Essencia } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import { STATUS_ICONS } from '@/lib/statusIcons';
import { siglaAtributo } from '@/lib/atributos';

export const TYPE_COLORS: Record<string, string> = {
  Elemental: '#d4a84e',
  Grande:  '#d4a84e',
  Mitica:  '#a855f7',
  Derivada:'#4ade80',
};

/** Rótulo com acento (o tipo é salvo sem acento). */
export const TYPE_LABEL: Record<string, string> = { Elemental: 'Elemental', Grande: 'Elemental', Mitica: 'Mítica', Derivada: 'Derivada' };

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
  const acao = 'w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:bg-white/[0.08] transition-colors cursor-pointer';

  return (
    <div
      onClick={onEdit}
      className="group relative rounded-2xl border bg-e-surface p-4 flex flex-col gap-3 cursor-pointer transition-colors hover:bg-[#1c1c20]"
      style={{ borderColor: accentColor + '40' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentColor + '1c', color: accentColor }}>
          {IconEntry ? <IconEntry.Icon size={18} /> : <span className="font-black">{essencia.name[0]}</span>}
        </div>
        <div className="flex-1 min-w-0 group-hover:pr-14 transition-[padding]">
          <p className="font-semibold text-e-text truncate">{essencia.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5" style={{ color: accentColor }}>
            {TYPE_LABEL[essencia.type] ?? essencia.type}
            {parentName && (
              <span className="normal-case tracking-normal font-medium text-e-faint flex items-center gap-0.5 truncate" title={`Deriva de ${parentName}`}>
                <CornerLeftUp size={10} /> {parentName}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex gap-0.5 rounded-lg bg-[#1c1c20] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onEdit} title="Editar" className={`${acao} hover:text-e-text`}><Pencil size={13} /></button>
        <button type="button" onClick={onDelete} title="Excluir" className={`${acao} hover:text-e-danger`}><Trash2 size={13} /></button>
      </div>

      {essencia.desc && <p className="text-xs text-e-sub leading-relaxed line-clamp-3">{essencia.desc}</p>}

      {bonuses.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {bonuses.map(([attr, val]) => (
            <span key={attr} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/[0.05] text-e-text">
              {siglaAtributo(attr)} <span className={val > 0 ? 'text-e-accent' : 'text-e-danger'}>{val > 0 ? '+' : ''}{val}</span>
            </span>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div className="mt-auto pt-3 border-t border-white/[0.05]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint mb-1.5">Habilidades <span className="tabular-nums">{skills.length}</span></p>
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => (
              <span key={s.id} className="text-[11px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] text-e-sub">{s.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
