'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { BossPhase, BossAbility, BossAttributes, EnemyAttack } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import Checkbox from '@/components/ui/Checkbox';

export const EMPTY_ATTRS: BossAttributes = {
  strength: 10, agility: 10, intelligence: 10, resistance: 10,
  flow: 10, wisdom: 10, presence: 10, defense: 5,
};

export const ATTR_LABELS: [keyof BossAttributes, string][] = [
  ['strength', 'FOR'], ['agility', 'AGI'], ['intelligence', 'INT'], ['resistance', 'RES'],
  ['flow', 'FLX'],     ['wisdom', 'SAB'],  ['presence', 'PRE'],    ['defense', 'DEF'],
];

interface Props {
  phase: BossPhase;
  index: number;
  total: number;
  onChange: (p: BossPhase) => void;
  onRemove: () => void;
}

export default function PhaseEditor({ phase, index, total, onChange, onRemove }: Props) {
  const inputStyle = { background: '#2a2410', color: '#f0e8d0', borderColor: '#6a5a20' };
  const inputCls   = 'text-sm rounded px-2 py-1.5 outline-none';
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
  }, []);

  function setAttr(key: keyof BossAttributes, val: number) {
    onChange({ ...phase, attributes: { ...phase.attributes, [key]: val } });
  }

  function setAttack(i: number, field: keyof EnemyAttack, val: string) {
    onChange({ ...phase, attacks: phase.attacks.map((a, j) => j === i ? { ...a, [field]: val } : a) });
  }

  // attacks[0] = ataque básico, attacks[1..5] = habilidades
  const basicAtk   = phase.attacks[0] ?? { name: 'Ataque Básico', damage: '', damageBase: 0, damageAttribute: 'FOR', equilibrio: 4 };
  const skillAtks  = phase.attacks.slice(1, 6);

  function setBasicField(field: keyof EnemyAttack, val: string | number) {
    const base = { ...basicAtk, [field]: val };
    const formula = [base.damageBase && base.damageBase > 0 ? String(base.damageBase) : null, `d20×${base.damageAttribute}/${base.equilibrio}`].filter(Boolean).join(' + ');
    const updated = { ...base, damage: formula };
    onChange({ ...phase, attacks: [updated, ...skillAtks] });
  }

  function addSkillAtk() {
    if (skillAtks.length < 5) onChange({ ...phase, attacks: [basicAtk, ...skillAtks, { name: '', damage: '' }] });
  }

  function removeSkillAtk(i: number) {
    const next = skillAtks.filter((_, j) => j !== i);
    onChange({ ...phase, attacks: [basicAtk, ...next] });
    setSkillSearch((s) => { const n = { ...s }; delete n[i]; return n; });
  }

  function linkSkill(i: number, skill: Skill) {
    const next = skillAtks.map((a, j) => j === i
      ? { ...a, skillId: skill.id, skillName: skill.name, damage: skill.damage?.formula ?? a.damage, name: skill.name,
          custoEs: skill.costs.filter((c) => c.type === 'flow').reduce((t, c) => t + (c.value ?? 0), 0) }
      : a
    );
    onChange({ ...phase, attacks: [basicAtk, ...next] });
    setSkillSearch((s) => ({ ...s, [i]: '' }));
  }

  function unlinkSkill(i: number) {
    const next = skillAtks.map((a, j) => j === i ? { ...a, skillId: undefined, skillName: undefined, name: '', damage: '' } : a);
    onChange({ ...phase, attacks: [basicAtk, ...next] });
  }

  function setAbility(field: keyof BossAbility, val: string | number) {
    const ability: BossAbility = {
      name: phase.specialAbility?.name ?? '',
      desc: phase.specialAbility?.desc ?? '',
      cooldownTurns: phase.specialAbility?.cooldownTurns ?? 0,
      [field]: val,
    };
    onChange({ ...phase, specialAbility: ability });
  }

  function toggleAbility(on: boolean) {
    onChange({ ...phase, specialAbility: on ? { name: '', desc: '', cooldownTurns: 0 } : undefined });
  }

  return (
    <div className="rounded-lg border flex flex-col gap-3 p-3" style={{ background: '#2a2410', borderColor: '#6a5a20' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#c8a050' }}>
          Fase {index + 1}
        </span>
        {total > 1 && (
          <button onClick={onRemove} className="opacity-40 hover:opacity-80">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Name + HP */}
      <div className="flex gap-2">
        <input
          value={phase.name}
          onChange={(e) => onChange({ ...phase, name: e.target.value })}
          className={`flex-1 ${inputCls}`}
          style={inputStyle}
          placeholder="Nome da fase (ex: Forma Corrompida)"
        />
        <div className="shrink-0">
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#7a7050' }}>HP máx</p>
          <input
            type="number"
            value={phase.hpMax}
            onChange={(e) => onChange({ ...phase, hpMax: Number(e.target.value) })}
            className={`w-20 text-center ${inputCls}`}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Turno automático: vazio = DEF do atributo e mod de FOR/AGI */}
      <div className="flex gap-2">
        {([
          ['defesa', 'DEF (turno auto)', String(phase.attributes.defense)],
          ['modAcerto', 'Mod de acerto', 'FOR/AGI'],
          ['esMax', 'ES máxima', '0'],
        ] as const).map(([campo, label, ph]) => (
          <div key={campo} className="shrink-0">
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#7a7050' }}>{label}</p>
            <input
              type="number"
              value={phase[campo] ?? ''}
              placeholder={ph}
              onChange={(e) => onChange({ ...phase, [campo]: e.target.value === '' ? undefined : Number(e.target.value) })}
              className={`w-24 text-center ${inputCls}`}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* Attributes 4x2 */}
      <div className="grid grid-cols-4 gap-1.5">
        {ATTR_LABELS.map(([key, label]) => {
          const val = phase.attributes[key];
          const mod = Math.floor((val - 10) / 2);
          return (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-center" style={{ color: '#7a7050' }}>{label}</p>
              <input
                type="number"
                value={val}
                onChange={(e) => setAttr(key, Number(e.target.value))}
                className={`w-full text-center ${inputCls}`}
                style={inputStyle}
              />
              <span className="text-[9px] font-bold" style={{ color: mod >= 0 ? '#3dba72' : '#e05050' }}>
                {mod >= 0 ? `+${mod}` : mod}
              </span>
            </div>
          );
        })}
      </div>

      {/* Ataque básico */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Ataque básico</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: '#7a7050' }}>Dano base</p>
            <input type="number" value={basicAtk.damageBase ?? 0}
              onChange={(e) => setBasicField('damageBase', Number(e.target.value))}
              className={`w-full text-center ${inputCls}`} style={inputStyle} min={0} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: '#7a7050' }}>Atributo</p>
            <select value={basicAtk.damageAttribute ?? 'FOR'}
              onChange={(e) => setBasicField('damageAttribute', e.target.value)}
              className={`w-full ${inputCls}`} style={inputStyle}>
              <option value="FOR">FOR</option>
              <option value="AGI">AGI</option>
              <option value="INT">INT</option>
            </select>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: '#7a7050' }}>Equilíbrio</p>
            <input type="number" value={basicAtk.equilibrio ?? 4}
              onChange={(e) => setBasicField('equilibrio', Number(e.target.value))}
              className={`w-full text-center ${inputCls}`} style={inputStyle} min={1} />
          </div>
        </div>
        <p className="text-[10px] font-mono opacity-50">
          ⚔ {[(basicAtk.damageBase ?? 0) > 0 ? String(basicAtk.damageBase) : null, `d20×${basicAtk.damageAttribute ?? 'FOR'}/${basicAtk.equilibrio ?? 4}`].filter(Boolean).join(' + ')}
        </p>
      </div>

      {/* Habilidades */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Habilidades <span className="normal-case font-normal opacity-60">(máx 5)</span></p>
          {skillAtks.length < 5 && (
            <button onClick={addSkillAtk} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        {skillAtks.map((atk, i) => {
          const search = skillSearch[i] ?? '';
          const filtered = search.length > 0
            ? skills.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
            : [];
          return (
            <div key={i}>
              {atk.skillId ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ background: 'rgba(200,160,80,0.08)', borderColor: 'rgba(200,160,80,0.3)' }}>
                  <span style={{ color: '#c8a050' }}>⚡</span>
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: '#f0e8d0' }}>{atk.skillName}</span>
                  {atk.damage && <span className="font-mono text-xs opacity-50">{atk.damage}</span>}
                  <button onClick={() => unlinkSkill(i)} className="text-[10px] opacity-50 hover:opacity-100 transition-opacity shrink-0">Trocar</button>
                  <button onClick={() => removeSkillAtk(i)} className="opacity-40 hover:opacity-80 shrink-0"><Trash2 size={12} /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input value={search}
                      onChange={(e) => setSkillSearch((s) => ({ ...s, [i]: e.target.value }))}
                      className={`w-full ${inputCls}`} style={{ ...inputStyle, fontSize: '12px', padding: '5px 8px' }}
                      placeholder="Buscar habilidade do catálogo…" />
                    {filtered.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg overflow-hidden shadow-lg border"
                        style={{ background: '#1e1a0e', borderColor: '#6a5a20' }}>
                        {filtered.map((sk) => (
                          <button key={sk.id} onClick={() => linkSkill(i, sk)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:opacity-80 transition-opacity flex items-center gap-2"
                            style={{ color: '#f0e8d0' }}>
                            <span style={{ color: '#c8a050' }}>⚡</span>
                            <span>{sk.name}</span>
                            {sk.damage && <span className="font-mono ml-auto opacity-60">{sk.damage.formula}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeSkillAtk(i)} className="opacity-40 hover:opacity-80 shrink-0"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          );
        })}
        {skillAtks.length === 0 && <p className="text-xs opacity-40 italic">Nenhuma habilidade vinculada.</p>}
      </div>

      {/* Special ability */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleAbility(!phase.specialAbility)}>
          <Checkbox checked={!!phase.specialAbility} onChange={toggleAbility} color="amber" />
          <span className="text-xs" style={{ color: '#c8a050' }}>Habilidade especial nesta fase</span>
        </div>
        {phase.specialAbility && (
          <div className="flex flex-col gap-1.5 pl-1">
            <div className="flex gap-2">
              <input
                value={phase.specialAbility.name}
                onChange={(e) => setAbility('name', e.target.value)}
                className={`flex-1 ${inputCls}`}
                style={inputStyle}
                placeholder="Nome da habilidade"
              />
              <div className="shrink-0">
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#7a7050' }}>CD (turnos)</p>
                <input
                  type="number"
                  value={phase.specialAbility.cooldownTurns}
                  onChange={(e) => setAbility('cooldownTurns', Number(e.target.value))}
                  className={`w-16 text-center ${inputCls}`}
                  style={inputStyle}
                />
              </div>
            </div>
            <textarea
              value={phase.specialAbility.desc}
              onChange={(e) => setAbility('desc', e.target.value)}
              rows={2}
              className={`w-full resize-none placeholder:opacity-40 ${inputCls}`}
              style={inputStyle}
              placeholder="Descrição do efeito…"
            />
          </div>
        )}
      </div>
    </div>
  );
}
