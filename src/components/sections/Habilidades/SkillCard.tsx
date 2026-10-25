'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { ItemCatalog } from '@/store/types';
import { regraTier, fmtEquilibrio } from '@/store/combateStore';
import { descreverEfeito } from './EfeitosEditor';

export interface Essencia { id: string; name: string; type: string; }

export interface Skill {
  id: string;
  name: string;
  desc: string;
  type: string;
  skillClass?: string;
  weaponType?: string;
  weaponTypes?: string[];
  essenciaId?: string;
  costs: { type: string; value?: number; percentual?: number }[];
  damage?: {
    formula: string;
    baseFixed: number;
    atributo?: string;
    equilibrio?: number;
  };
  damageSource?: 'formula' | 'weapon';
  weaponSlot?: 'mainHand' | 'offHand';
  weaponDamageModifiers?: {
    type: 'flat' | 'percent' | 'extra_dice';
    value?: number;
    percentual?: number;
    dice?: { quantity: number; die: string };
  }[];
  cooldownTurns: number;
  ultimate: boolean;
  tiposDano?: string[];            // 1 a 2 tipos de dano; vazio = herda da arma só no dano da arma
  bonusAcerto?: number | null;     // +X no acerto desta skill
  exclusivaCom?: string | null;    // id da skill que não equipa junto com esta (uma ou outra)
  ignoraDef?: boolean;             // acerta sempre: o app pula a rolagem de acerto
  contraAtaque?: boolean;          // equipada: inimigo que errar este jogador abre um contra-ataque para o mestre liberar
  passive?: boolean;
  actionType?: string;
  pressaoDice?: boolean;
  tier?: number | null;
  grupoMaestria?: string | null;   // skill de arma: categoria da maestria (vazio = primeira categoria)
  alvo?: 'USUARIO' | 'INIMIGOS' | 'ALIADOS' | null;   // em quem a skill é usada
  efeitos?: import('@/store/types').Efeito[];
  multiTarget?: {
    maxTargets: number;
    damageMode: 'igual' | 'distribuido' | 'especifico';
    specificDamage?: number;
  };
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
  /** Nomes das skills que não equipam junto com esta (nos dois sentidos). */
  exclusivas?: string[];
}

const TYPE_COLOR: Record<string, string> = {
  class:    '#a3e635',
  weapon:   '#e05050',
  essencia: '#a855f7',
  mestre:   '#f59e0b',
  inimigo:  '#71717a',
};

const TYPE_LABEL: Record<string, string> = {
  class:    'Classe',
  weapon:   'Arma',
  essencia: 'Essência',
  mestre:   'Mestre',
  inimigo:  'Inimigos',
};

const COST_LABEL: Record<string, string> = {
  flow: 'FLX', hp: 'HP', ether: 'ÉTER', charge: 'Carga',
  percentual_flow: 'FLX%', percentual_hp: 'HP%', pressao: 'Pressão',
};

const ATTR_SHORT: Record<string, string> = {
  strength: 'FOR', agility: 'AGI', intelligence: 'INT', resistance: 'RES',
  flow: 'FLX', wisdom: 'SAB', presence: 'PRE', defense: 'DEF',
};

const WEAPON_LABEL: Record<string, string> = {
  espadas: 'Espadas', rapieiras: 'Rapieiras', alabardas: 'Alabardas', lancas: 'Lanças',
  'machados-de-guerra': 'Machados de guerra', machadinhas: 'Machadinhas', martelos: 'Martelos', 'armas-colossais': 'Armas colossais',
  adagas: 'Adagas', garras: 'Garras', arcos: 'Arcos', bestas: 'Bestas', pistolas: 'Pistolas',
  'luvas-manoplas': 'Luvas & manoplas', escudos: 'Escudos',
};

function categoryLabel(skill: Skill, essencias: Essencia[]): string {
  if (skill.type === 'class')    return skill.skillClass || 'Geral';
  if (skill.type === 'weapon') {
    const types = skill.weaponTypes ?? (skill.weaponType ? [skill.weaponType] : []);
    return types.map((t) => WEAPON_LABEL[t] ?? t).join(' / ') || '—';
  }
  if (skill.type === 'essencia') return essencias.find((e) => e.id === skill.essenciaId)?.name ?? skill.essenciaId ?? '—';
  return '—';
}

/** Fórmula exibida: equilíbrio do tier (skills de jogador) ou o salvo (inimigo/mestre). */
function dmgDisplay(d: NonNullable<Skill['damage']>, tier?: number | null): string {
  const parts: string[] = [];
  if (d.baseFixed) parts.push(String(d.baseFixed));
  if (d.atributo) {
    const eqNum = tier ? regraTier(tier).equilibrio : d.equilibrio;
    const eq = eqNum != null ? `/${fmtEquilibrio(eqNum)}` : '';
    parts.push(`d20×${d.atributo}${eq}`);
  }
  return parts.join(' + ') || 'sem dano';
}

export default function SkillCard({ skill, essencias, weapons, onEdit, onDelete, exclusivas = [] }: Props) {
  const color    = TYPE_COLOR[skill.type] ?? '#71717a';
  const catLabel = categoryLabel(skill, essencias);
  const req      = skill.requirements;
  const hasReqs  = req && (req.level != null || (req.attributes && Object.keys(req.attributes).length > 0) || req.weaponRequired);

  return (
    <div onClick={onEdit} className="group rounded-2xl border border-white/[0.07] bg-e-surface p-3.5 flex flex-col gap-2.5 cursor-pointer transition-colors hover:border-white/20 hover:bg-[#1c1c20]">

      {/* ── Header ── */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <p className="font-semibold text-sm leading-tight">{skill.name}</p>
            {skill.tier != null && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-sky-500/20 text-sky-300 shrink-0">tier {skill.tier}</span>
            )}
            {skill.tier == null && (skill.type === 'weapon' || skill.type === 'essencia' || (skill.type === 'class' && !!skill.skillClass)) && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-500/20 text-amber-300 shrink-0" title="Abra a skill para escolher o tier">sem tier</span>
            )}
            {skill.ultimate && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-400/20 text-amber-400 shrink-0">ult</span>
            )}
            {skill.contraAtaque && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-yellow-500/20 text-yellow-300 shrink-0">contra-ataque</span>
            )}
            {skill.ignoraDef && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-rose-500/20 text-rose-300 shrink-0">ignora DEF</span>
            )}
            {skill.cooldownTurns >= 99 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-sky-500/20 text-sky-300 shrink-0">1x por combate</span>
            )}
            {skill.pressaoDice && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-orange-500/20 text-orange-400 shrink-0">pressão</span>
            )}
            {skill.multiTarget && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-rose-500/20 text-rose-400 shrink-0">
                {skill.multiTarget.maxTargets} alvos · {skill.multiTarget.damageMode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: color + '22', color }}>
              {TYPE_LABEL[skill.type] ?? skill.type}
            </span>
            <span className="text-[10px] text-e-sub font-medium">· {catLabel}</span>
          </div>
          {exclusivas.length > 0 && (
            <p className="text-[10px] text-violet-300 mt-1">Não equipa junto com {exclusivas.join(', ')}</p>
          )}
        </div>

        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onEdit} title="Editar"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:text-e-text hover:bg-white/[0.08] transition-colors cursor-pointer">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={onDelete} title="Excluir"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:text-e-danger hover:bg-white/[0.08] transition-colors cursor-pointer">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="flex gap-1.5 flex-wrap text-[11px]">
        {skill.damageSource === 'weapon' ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-e-card text-e-text font-mono">
            ⚔ Arma ({skill.weaponSlot === 'offHand' ? 'mão secundária' : 'mão principal'})
          </span>
        ) : skill.damage && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-e-card text-e-text font-mono">
            ⚔ {dmgDisplay(skill.damage, skill.tier)}
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
        {skill.type === 'weapon' && (
          <span className="px-2 py-0.5 rounded bg-e-gold/10 text-e-gold" title="Grupo de maestria">
            ★ {WEAPON_LABEL[skill.grupoMaestria ?? skill.weaponTypes?.[0] ?? skill.weaponType ?? ''] ?? skill.grupoMaestria ?? skill.weaponTypes?.[0] ?? skill.weaponType}
          </span>
        )}
      </div>

      {/* ── Efeitos ── */}
      {(skill.efeitos?.length ?? 0) > 0 && (
        <div className="text-[10px] border-t border-e-border pt-2 flex flex-col gap-0.5">
          <span className="font-bold uppercase tracking-wider text-e-sub mb-0.5">Efeitos</span>
          {skill.efeitos!.map((e, i) => <span key={i} className="text-e-faint">{descreverEfeito(e)}</span>)}
        </div>
      )}

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
        <p className="text-[11px] text-e-faint line-clamp-2 leading-relaxed" title={skill.desc}>{skill.desc}</p>
      )}
    </div>
  );
}
