'use client';

import type React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ClassKit } from '@/store/types';

interface Props {
  kit: ClassKit;
  skillNames: Map<string, string>;
  itemNames: Map<string, string>;
  onEdit: () => void;
  onDelete: () => void;
}

const ATTR_SHORT: Record<string, string> = {
  strength: 'FOR', agility: 'AGI', intelligence: 'INT', resistance: 'RES',
  flow: 'FLX', wisdom: 'SAB', presence: 'PRE', defense: 'DEF',
};

function PerkBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ background: color + '22', color }}>
      {children}
    </span>
  );
}

export default function ClassKitCard({ kit, skillNames, itemNames, onEdit, onDelete }: Props) {
  const attrs  = kit.starterAttributes as Record<string, number>;
  const perks  = kit.perks ?? { hasPressureBar: false };
  const hasPerks = perks.hasPressureBar;

  return (
    <div className="rounded-lg border border-e-border bg-e-surface p-4 flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-e-text">{kit.skillClass}</h3>
          {hasPerks && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {perks.hasPressureBar && <PerkBadge color="#f97316">Barra de Pressão</PerkBadge>}
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit}
            className="w-7 h-7 rounded flex items-center justify-center text-e-sub hover:text-e-text hover:bg-e-card transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete}
            className="w-7 h-7 rounded flex items-center justify-center text-e-sub hover:text-e-danger hover:bg-e-card transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Atributos */}
      <div className="grid grid-cols-4 gap-1.5">
        {Object.entries(attrs).map(([key, val]) => (
          <div key={key} className="bg-e-card rounded-lg px-2 py-1.5 text-center">
            <p className="text-[9px] font-bold text-e-faint uppercase tracking-wider">{ATTR_SHORT[key] ?? key}</p>
            <p className="text-sm font-bold text-e-text">{val}</p>
          </div>
        ))}
      </div>

      {/* Skills iniciais */}
      {kit.starterSkillIds.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-e-faint mb-1">Habilidades iniciais</p>
          <div className="flex flex-wrap gap-1">
            {kit.starterSkillIds.map((id) => (
              <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-e-card text-e-text">
                {skillNames.get(id) ?? id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Itens iniciais */}
      {kit.starterItems.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-e-faint mb-1">Itens iniciais</p>
          <div className="flex flex-wrap gap-1">
            {kit.starterItems.map((item, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-e-card text-e-text">
                {item.qty > 1 ? `${item.qty}× ` : ''}{itemNames.get(item.id) ?? item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
