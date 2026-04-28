'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { BossPhase, BossAbility, BossAttributes, EnemyAttack } from '@/store/types';

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

  function setAttr(key: keyof BossAttributes, val: number) {
    onChange({ ...phase, attributes: { ...phase.attributes, [key]: val } });
  }

  function setAttack(i: number, field: keyof EnemyAttack, val: string) {
    onChange({ ...phase, attacks: phase.attacks.map((a, j) => j === i ? { ...a, [field]: val } : a) });
  }

  function addAttack() {
    onChange({ ...phase, attacks: [...phase.attacks, { name: '', damage: '' }] });
  }

  function removeAttack(i: number) {
    onChange({ ...phase, attacks: phase.attacks.filter((_, j) => j !== i) });
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
        {total > 2 && (
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

      {/* Attributes 4x2 */}
      <div className="grid grid-cols-4 gap-1.5">
        {ATTR_LABELS.map(([key, label]) => (
          <div key={key}>
            <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-center" style={{ color: '#7a7050' }}>{label}</p>
            <input
              type="number"
              value={phase.attributes[key]}
              onChange={(e) => setAttr(key, Number(e.target.value))}
              className={`w-full text-center ${inputCls}`}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* Attacks */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Ataques</p>
          <button onClick={addAttack} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
            <Plus size={12} /> Adicionar
          </button>
        </div>
        {phase.attacks.map((atk, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={atk.name}
              onChange={(e) => setAttack(i, 'name', e.target.value)}
              className={`flex-1 ${inputCls}`}
              style={inputStyle}
              placeholder="Nome do ataque"
            />
            <input
              value={atk.damage}
              onChange={(e) => setAttack(i, 'damage', e.target.value)}
              className={`w-20 font-mono ${inputCls}`}
              style={inputStyle}
              placeholder="2d8+4"
            />
            <button onClick={() => removeAttack(i)} className="opacity-40 hover:opacity-80 shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Special ability */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={!!phase.specialAbility}
            onChange={(e) => toggleAbility(e.target.checked)}
            className="accent-[#c8a050]"
          />
          <span style={{ color: '#c8a050' }}>Habilidade especial nesta fase</span>
        </label>
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
