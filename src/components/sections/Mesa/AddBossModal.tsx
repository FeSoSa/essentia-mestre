'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  BossInstance, BossPhase,
  BossImmunity, BossResistance, BossReward, BossAttributes,
} from '@/store/types';
import Button from '@/components/ui/Button';
import PhaseEditor, { EMPTY_ATTRS } from './PhaseEditor';

interface Props { onClose: () => void; }

/* ── Main modal ───────────────────────────────────────────────── */
export default function AddBossModal({ onClose }: Props) {
  const [name, setName]   = useState('');
  const [icon, setIcon]   = useState('👑');
  const [xp, setXp]       = useState(500);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [phases, setPhases] = useState<BossPhase[]>([
    { phaseNumber: 1, name: '', hpMax: 100, attributes: { ...EMPTY_ATTRS }, attacks: [], specialAbility: undefined },
    { phaseNumber: 2, name: '', hpMax: 80,  attributes: { ...EMPTY_ATTRS }, attacks: [], specialAbility: undefined },
  ]);

  const [immunities, setImmunities]   = useState<BossImmunity[]>([]);
  const [resistances, setResistances] = useState<BossResistance[]>([]);
  const [hasReward, setHasReward]     = useState(false);
  const [reward, setReward]           = useState<BossReward>({ type: 'essencia', referenceId: '', name: '', desc: '' });

  /* phases */
  function updatePhase(i: number, p: BossPhase) {
    setPhases((prev) => prev.map((x, j) => j === i ? { ...p, phaseNumber: i + 1 } : x));
  }
  function addPhase() {
    setPhases((prev) => [...prev, {
      phaseNumber: prev.length + 1, name: '', hpMax: 60,
      attributes: { ...EMPTY_ATTRS }, attacks: [], specialAbility: undefined,
    }]);
  }
  function removePhase(i: number) {
    setPhases((prev) => prev.filter((_, j) => j !== i).map((p, j) => ({ ...p, phaseNumber: j + 1 })));
  }

  /* immunities */
  function addImmunity() {
    setImmunities((p) => [...p, { type: '', icon: '🛡️' }]);
  }
  function updateImmunity(i: number, field: keyof BossImmunity, val: string) {
    setImmunities((p) => p.map((x, j) => j === i ? { ...x, [field]: val } : x));
  }
  function removeImmunity(i: number) {
    setImmunities((p) => p.filter((_, j) => j !== i));
  }

  /* resistances */
  function addResistance() {
    setResistances((p) => [...p, { type: '', reduction: 50 }]);
  }
  function updateResistance(i: number, field: keyof BossResistance, val: string | number) {
    setResistances((p) => p.map((x, j) => j === i ? { ...x, [field]: val } : x));
  }
  function removeResistance(i: number) {
    setResistances((p) => p.filter((_, j) => j !== i));
  }

  async function addToCombat() {
    if (!name.trim() || phases.length < 2) return;
    setLoading(true);
    const instance: BossInstance = {
      instanceId: '',
      templateId: undefined,
      name: name.trim(),
      icon,
      phases,
      currentPhase: 0,
      hpCurrent: phases[0].hpMax,
      immunities,
      resistances,
      drops: [],
      xp,
      specialReward: hasReward && reward.name.trim() ? reward : undefined,
      notes,
    };
    try {
      await api.post('/combat/bosses', { boss: instance });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const inputStyle = { background: '#2a2410', color: '#f0e8d0', borderColor: '#6a5a20' };
  const inputCls   = 'text-sm rounded px-2 py-1.5 outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-[480px] max-h-[90vh] overflow-y-auto rounded-xl border-2"
        style={{ background: '#1a1810', borderColor: '#6a5a20', color: '#f0e8d0' }}
      >
      <div className="flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base flex items-center gap-2">
            <span style={{ color: '#c8a050' }}>★</span> Adicionar Boss
          </h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>

        {/* Name + icon */}
        <div className="flex gap-2">
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-12 text-center text-lg rounded outline-none"
            style={inputStyle}
            maxLength={2}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`flex-1 ${inputCls}`}
            style={inputStyle}
            placeholder="Nome do boss"
          />
        </div>

        {/* Phases */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>
              Fases ({phases.length})
            </p>
            <button onClick={addPhase} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
              <Plus size={12} /> Adicionar fase
            </button>
          </div>
          {phases.map((phase, i) => (
            <PhaseEditor
              key={i}
              phase={phase}
              index={i}
              total={phases.length}
              onChange={(p) => updatePhase(i, p)}
              onRemove={() => removePhase(i)}
            />
          ))}
        </div>

        {/* Immunities */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Imunidades</p>
            <button onClick={addImmunity} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
              <Plus size={12} /> Adicionar
            </button>
          </div>
          {immunities.map((im, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={im.icon}
                onChange={(e) => updateImmunity(i, 'icon', e.target.value)}
                className="w-10 text-center text-base rounded outline-none"
                style={inputStyle}
                maxLength={2}
              />
              <input
                value={im.type}
                onChange={(e) => updateImmunity(i, 'type', e.target.value)}
                className={`flex-1 ${inputCls}`}
                style={inputStyle}
                placeholder="Tipo (ex: Veneno)"
              />
              <button onClick={() => removeImmunity(i)} className="opacity-40 hover:opacity-80 shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Resistances */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Resistências</p>
            <button onClick={addResistance} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
              <Plus size={12} /> Adicionar
            </button>
          </div>
          {resistances.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={r.type}
                onChange={(e) => updateResistance(i, 'type', e.target.value)}
                className={`flex-1 ${inputCls}`}
                style={inputStyle}
                placeholder="Tipo (ex: Fogo)"
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  value={r.reduction}
                  onChange={(e) => updateResistance(i, 'reduction', Number(e.target.value))}
                  className={`w-16 text-center ${inputCls}`}
                  style={inputStyle}
                  min={1} max={100}
                />
                <span className="text-xs" style={{ color: '#7a7050' }}>%</span>
              </div>
              <button onClick={() => removeResistance(i)} className="opacity-40 hover:opacity-80 shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* XP */}
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#7a7050' }}>XP</p>
          <input
            type="number"
            value={xp}
            onChange={(e) => setXp(Number(e.target.value))}
            className={`w-28 ${inputCls}`}
            style={inputStyle}
          />
        </div>

        {/* Special reward */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={hasReward}
              onChange={(e) => setHasReward(e.target.checked)}
              className="accent-[#c8a050]"
            />
            <span style={{ color: '#c8a050' }}>Recompensa especial ao derrotar</span>
          </label>
          {hasReward && (
            <div className="flex flex-col gap-2 pl-1">
              <select
                value={reward.type}
                onChange={(e) => setReward((r) => ({ ...r, type: e.target.value }))}
                className={`w-full ${inputCls}`}
                style={inputStyle}
              >
                <option value="essencia">✨ Essência</option>
                <option value="item">🎁 Item único</option>
                <option value="skill">⚡ Habilidade especial</option>
              </select>
              <input
                value={reward.name}
                onChange={(e) => setReward((r) => ({ ...r, name: e.target.value }))}
                className={`w-full ${inputCls}`}
                style={inputStyle}
                placeholder="Nome da recompensa"
              />
              <textarea
                value={reward.desc}
                onChange={(e) => setReward((r) => ({ ...r, desc: e.target.value }))}
                rows={2}
                className={`w-full resize-none placeholder:opacity-40 ${inputCls}`}
                style={inputStyle}
                placeholder="Descrição…"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={`w-full resize-none placeholder:opacity-40 ${inputCls}`}
          style={inputStyle}
          placeholder="Observações…"
        />

        <Button
          variant="primary"
          size="sm"
          onClick={addToCombat}
          disabled={!name.trim() || phases.length < 2 || loading}
        >
          {loading ? 'Adicionando…' : 'Adicionar boss ao combate'}
        </Button>
      </div>
      </div>
    </div>
  );
}
