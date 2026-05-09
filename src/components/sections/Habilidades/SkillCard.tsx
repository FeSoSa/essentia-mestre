'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { ItemCatalog } from '@/store/types';

export interface Essencia { id: string; name: string; type: string; }

export interface Skill {
  id: string;
  name: string;
  desc: string;
  type: string;
  skillClass?: string;
  weaponType?: string;
  essenciaId?: string;
  costs: { type: string; value?: number; percentual?: number }[];
  damage?: {
    formula: string;
    baseFixed: number;
    baseDice?: { quantity: number; die: string };
    attribute?: string;
  };
  cooldownTurns: number;
  ultimate: boolean;
  toggle: boolean;
  requirements?: {
    level?: number;
    attributes?: Record<string, number>;
    weaponRequired?: string;
  };
}

interface Props {
  skill: Skill;
  essencias: Essencia[];
  weapons: ItemCatalog[];
  onEdit: () => void;
  onDelete: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  class:    '#a3e635',
  weapon:   '#e05050',
  essencia: '#a855f7',
};

const COST_LABEL: Record<string, string> = {
  flow: 'FLX', hp: 'HP', ether: 'ÉTER', charge: 'Carga',
  percentual_flow: 'FLX%', percentual_hp: 'HP%',
};

const ATTR_SHORT: Record<string, string> = {
  strength: 'FOR', agility: 'AGI', intelligence: 'INT', resistance: 'RES',
  flow: 'FLX', wisdom: 'SAB', presence: 'PRE', defense: 'DEF',
};

const WEAPON_LABEL: Record<string, string> = {
  curta: 'Curta', média: 'Média', pesada: 'Pesada', ranged: 'Ranged', unarmed: 'Desarmado',
};

function categoryLabel(skill: Skill, essencias: Essencia[]): string {
  if (skill.type === 'class')    return skill.skillClass || 'Geral';
  if (skill.type === 'weapon')   return WEAPON_LABEL[skill.weaponType ?? ''] ?? skill.weaponType ?? '—';
  if (skill.type === 'essencia') return essencias.find((e) => e.id === skill.essenciaId)?.name ?? skill.essenciaId ?? '—';
  return '—';
}

function dmgDisplay(d: NonNullable<Skill['damage']>): string {
  const parts: string[] = [];
  if (d.baseFixed) parts.push(String(d.baseFixed));
  if (d.baseDice)  parts.push(`${d.baseDice.quantity > 1 ? d.baseDice.quantity : ''}${d.baseDice.die}`);
  return parts.join(' + ') || '—';
}

export default function SkillCard({ skill, essencias, weapons, onEdit, onDelete }: Props) {
  const color    = TYPE_COLOR[skill.type] ?? '#71717a';
  const catLabel = categoryLabel(skill, essencias);
  const req      = skill.requirements;
  const hasReqs  = req && (req.level != null || (req.attributes && Object.keys(req.attributes).length > 0) || req.weaponRequired);

  return (
    <div className="rounded-lg border border-e-border bg-e-surface p-3 flex flex-col gap-2.5">

      {/* ── Header ── */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <p className="font-semibold text-sm leading-tight">{skill.name}</p>
            {skill.ultimate && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-400/20 text-amber-400 shrink-0">ult</span>
            )}
            {skill.toggle && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-sky-400/20 text-sky-400 shrink-0">por turno</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: color + '22', color }}>
              {skill.type === 'class' ? 'Classe' : skill.type === 'weapon' ? 'Arma' : 'Essência'}
            </span>
            <span className="text-[10px] text-e-sub font-medium">· {catLabel}</span>
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

      {/* ── Stats ── */}
      <div className="flex gap-1.5 flex-wrap text-[11px]">
        {skill.damage && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-e-card text-e-text font-mono">
            ⚔ {dmgDisplay(skill.damage)}
          </span>
        )}
        {skill.costs.map((c, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-e-card text-e-sub">
            {c.value != null ? c.value : c.percentual != null ? `${c.percentual}%` : '—'} {COST_LABEL[c.type] ?? c.type}
          </span>
        ))}
        {skill.cooldownTurns > 0 && (
          <span className="px-2 py-0.5 rounded bg-e-card text-e-sub">CD {skill.cooldownTurns}t</span>
        )}
      </div>

      {/* ── Pré-requisitos ── */}
      {hasReqs && (
        <div className="text-[10px] border-t border-e-border pt-2 flex flex-col gap-0.5">
          <span className="font-bold uppercase tracking-wider text-e-sub mb-0.5">Req.</span>
          {req!.level != null && <span className="text-e-faint">Nível {req!.level}+</span>}
          {req!.weaponRequired && (
            <span className="text-e-faint">
              Arma: {weapons.find((w) => w.id === req!.weaponRequired)?.name ?? req!.weaponRequired}
            </span>
          )}
          {req!.attributes && Object.entries(req!.attributes).map(([a, v]) => (
            <span key={a} className="text-e-faint">{ATTR_SHORT[a] ?? a} {v}+</span>
          ))}
        </div>
      )}

      {skill.desc && (
        <p className="text-[11px] text-e-faint line-clamp-2 leading-relaxed">{skill.desc}</p>
      )}
    </div>
  );
}
