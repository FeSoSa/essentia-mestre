'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  BossTemplate, BossPhase, BossImmunity, BossResistance,
  BossReward, EnemyDrop, BossAttributes,
} from '@/store/types';
import Button from '@/components/ui/Button';
import PhaseEditor, { EMPTY_ATTRS } from '@/components/sections/Mesa/PhaseEditor';

interface Props {
  template?: BossTemplate;
  onClose: () => void;
  onSaved: (t: BossTemplate) => void;
}

export default function BossTemplateModal({ template, onClose, onSaved }: Props) {
  const editing = !!template;

  const [name,  setName]  = useState(template?.name  ?? '');
  const [icon,  setIcon]  = useState(template?.icon  ?? '👑');
  const [xp,    setXp]    = useState(template?.xp    ?? 500);
  const [notes, setNotes] = useState(template?.notes ?? '');

  const initPhase = (n: number, hp: number): BossPhase => ({
    phaseNumber: n, name: '', hpMax: hp,
    attributes: { ...EMPTY_ATTRS } as BossAttributes,
    attacks: [], specialAbility: undefined,
  });

  const [phases, setPhases] = useState<BossPhase[]>(
    template?.phases ?? [initPhase(1, 100), initPhase(2, 80)]
  );
  const [immunities,  setImmunities]  = useState<BossImmunity[]>(template?.immunities  ?? []);
  const [resistances, setResistances] = useState<BossResistance[]>(template?.resistances ?? []);
  const [drops,       setDrops]       = useState<EnemyDrop[]>(template?.drops ?? []);
  const [hasReward,   setHasReward]   = useState(!!template?.specialReward);
  const [reward,      setReward]      = useState<BossReward>(
    template?.specialReward ?? { type: 'essencia', referenceId: '', name: '', desc: '' }
  );
  const [loading, setLoading] = useState(false);

  function updatePhase(i: number, p: BossPhase) {
    setPhases((prev) => prev.map((x, j) => j === i ? { ...p, phaseNumber: i + 1 } : x));
  }
  function addPhase() {
    setPhases((prev) => [...prev, initPhase(prev.length + 1, 60)]);
  }
  function removePhase(i: number) {
    setPhases((prev) => prev.filter((_, j) => j !== i).map((p, j) => ({ ...p, phaseNumber: j + 1 })));
  }

  function addDrop() { if (drops.length < 2) setDrops((d) => [...d, { name: '', icon: '🎁' }]); }
  function updateDrop(i: number, f: keyof EnemyDrop, v: string) {
    setDrops((d) => d.map((x, j) => j === i ? { ...x, [f]: v } : x));
  }
  function removeDrop(i: number) { setDrops((d) => d.filter((_, j) => j !== i)); }

  async function save() {
    if (!name.trim() || phases.length < 2) return;
    setLoading(true);
    const body = {
      name: name.trim(), icon, type: 'Boss',
      phases, immunities, resistances,
      drops: drops.filter((d) => d.name.trim()),
      xp,
      specialReward: hasReward && reward.name.trim() ? reward : null,
      notes,
    };
    try {
      const res = editing
        ? await api.put<BossTemplate>(`/bosses/${template!.id}`, body)
        : await api.post<BossTemplate>('/bosses', body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const is = { background: '#27272a', color: '#fafafa', border: '1px solid #52525b' };
  const ic = 'text-sm rounded px-2 py-1.5 outline-none w-full';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[500px] max-h-[90vh] overflow-y-auto rounded-xl border-2 border-e-boss-border bg-e-boss-bg text-e-boss-text">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base flex items-center gap-2">
            <span style={{ color: '#c8a050' }}>★</span>
            {editing ? 'Editar boss' : 'Novo boss'}
          </h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>

        {/* Icon + name */}
        <div className="flex gap-2">
          <input value={icon} onChange={(e) => setIcon(e.target.value)}
            className="w-12 text-center text-lg rounded outline-none" style={is} maxLength={2} />
          <input value={name} onChange={(e) => setName(e.target.value)}
            className={ic} style={is} placeholder="Nome do boss" />
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
            <PhaseEditor key={i} phase={phase} index={i} total={phases.length}
              onChange={(p) => updatePhase(i, p)} onRemove={() => removePhase(i)} />
          ))}
        </div>

        {/* Immunities */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Imunidades</p>
            <button onClick={() => setImmunities((p) => [...p, { type: '', icon: '🛡️' }])}
              className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
              <Plus size={12} /> Adicionar
            </button>
          </div>
          {immunities.map((im, i) => (
            <div key={i} className="flex gap-2">
              <input value={im.icon} onChange={(e) => setImmunities((p) => p.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
                className="w-10 text-center text-base rounded outline-none" style={is} maxLength={2} />
              <input value={im.type} onChange={(e) => setImmunities((p) => p.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                className={ic} style={is} placeholder="Tipo (ex: Veneno)" />
              <button onClick={() => setImmunities((p) => p.filter((_, j) => j !== i))} className="opacity-40 hover:opacity-80 shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Resistances */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Resistências</p>
            <button onClick={() => setResistances((p) => [...p, { type: '', reduction: 50 }])}
              className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
              <Plus size={12} /> Adicionar
            </button>
          </div>
          {resistances.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={r.type} onChange={(e) => setResistances((p) => p.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                className={ic} style={is} placeholder="Tipo (ex: Fogo)" />
              <input type="number" value={r.reduction}
                onChange={(e) => setResistances((p) => p.map((x, j) => j === i ? { ...x, reduction: Number(e.target.value) } : x))}
                className="w-16 text-center text-sm rounded px-2 py-1.5 outline-none" style={is} min={1} max={100} />
              <span className="text-xs shrink-0" style={{ color: '#7a7050' }}>%</span>
              <button onClick={() => setResistances((p) => p.filter((_, j) => j !== i))} className="opacity-40 hover:opacity-80 shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Drops */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a7050' }}>Drops</p>
            {drops.length < 2 && (
              <button onClick={addDrop} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
                <Plus size={12} /> Adicionar
              </button>
            )}
          </div>
          {drops.map((drop, i) => (
            <div key={i} className="flex gap-2">
              <input value={drop.icon} onChange={(e) => updateDrop(i, 'icon', e.target.value)}
                className="w-10 text-center text-base rounded outline-none" style={is} maxLength={2} />
              <input value={drop.name} onChange={(e) => updateDrop(i, 'name', e.target.value)}
                className={ic} style={is} placeholder="Nome do item" />
              <button onClick={() => removeDrop(i)} className="opacity-40 hover:opacity-80 shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* XP */}
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#7a7050' }}>XP</p>
          <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))}
            className="w-28 text-sm rounded px-2 py-1.5 outline-none" style={is} />
        </div>

        {/* Special reward */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input type="checkbox" checked={hasReward} onChange={(e) => setHasReward(e.target.checked)} className="accent-[#c8a050]" />
            <span style={{ color: '#c8a050' }}>Recompensa especial ao derrotar</span>
          </label>
          {hasReward && (
            <div className="flex flex-col gap-2 pl-1">
              <select value={reward.type} onChange={(e) => setReward((r) => ({ ...r, type: e.target.value }))}
                className={ic} style={is}>
                <option value="essencia">✨ Essência</option>
                <option value="item">🎁 Item único</option>
                <option value="skill">⚡ Habilidade especial</option>
              </select>
              <input value={reward.name} onChange={(e) => setReward((r) => ({ ...r, name: e.target.value }))}
                className={ic} style={is} placeholder="Nome da recompensa" />
              <textarea value={reward.desc} onChange={(e) => setReward((r) => ({ ...r, desc: e.target.value }))}
                rows={2} className={`resize-none placeholder:opacity-40 ${ic}`} style={is} placeholder="Descrição…" />
            </div>
          )}
        </div>

        {/* Notes */}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className={`resize-none placeholder:opacity-40 ${ic}`} style={is} placeholder="Observações…" />

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!name.trim() || phases.length < 2 || loading}>
            {loading ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
