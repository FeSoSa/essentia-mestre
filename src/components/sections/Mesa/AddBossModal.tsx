'use client';

import { useEffect, useState } from 'react';
import { CheckField } from '@/components/ui/Checkbox';
import { Plus, Crown } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  BossInstance, BossPhase, BossTemplate,
  BossReward, BossAttributes,
} from '@/store/types';
import Button from '@/components/ui/Button';
import PhaseEditor, { EMPTY_ATTRS } from './PhaseEditor';
import TracosDanoEditor from '@/components/shared/TracosDanoEditor';
import type { TracoDano } from '@/lib/tiposDano';

interface Props { onClose: () => void; }

type Tab = 'catalogo' | 'novo';

const inputStyle = { background: '#2a2410', color: '#f0e8d0', borderColor: '#6a5a20' };
const inputCls   = 'text-sm rounded px-2 py-1.5 outline-none';

/* ── Catalog Tab ─────────────────────────────────────────────── */
function BossCatalogTab({ onClose }: { onClose: () => void }) {
  const [templates,  setTemplates]  = useState<BossTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    api.get<BossTemplate[]>('/bosses').then((r) => {
      setTemplates(r.data);
      if (r.data.length > 0) setSelectedId(r.data[0].id);
    }).catch(() => {});
  }, []);

  const selected = templates.find((t) => t.id === selectedId);

  function instanceFromTemplate(t: BossTemplate): BossInstance {
    return {
      instanceId: '',
      templateId: t.id,
      name: t.name,
      icon: t.icon,
      imageUrl: t.imageUrl,
      phases: t.phases,
      currentPhase: 0,
      hpCurrent: t.phases[0]?.hpMax ?? 0,
      immunities: t.immunities,
      tracosDano: t.tracosDano,
      resistances: t.resistances,
      drops: t.drops,
      xp: t.xp,
      specialReward: t.specialReward,
      notes: '',
    };
  }

  async function addToCombat() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post('/combat/bosses', { boss: instanceFromTemplate(selected) });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: '#7a7050' }}>
        Nenhum boss no catálogo. Cadastre na seção Bestiário.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
        {templates.map((t) => (
          <button key={t.id} onClick={() => setSelectedId(t.id)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors"
            style={{
              background: selectedId === t.id ? '#3a3010' : '#2a2410',
              border: `1px solid ${selectedId === t.id ? '#c8a050' : '#6a5a20'}`,
              color: '#f0e8d0',
            }}>
            <span className="text-lg shrink-0">{t.icon || '👑'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.name}</p>
              <p className="text-xs" style={{ color: '#7a7050' }}>
                {t.type || 'Boss'} · {t.phases.length} fase(s) · HP {t.phases[0]?.hpMax ?? 0}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selected?.notes && (
        <p className="text-xs italic px-1" style={{ color: '#7a7050' }}>{selected.notes}</p>
      )}

      <Button variant="primary" size="sm" onClick={addToCombat} disabled={!selected || loading}>
        {loading ? 'Adicionando…' : 'Adicionar ao combate'}
      </Button>
    </div>
  );
}

/* ── Create-new Tab ──────────────────────────────────────────── */
function CreateBossTab({ onClose }: { onClose: () => void }) {
  const [name, setName]   = useState('');
  const [icon, setIcon]   = useState('👑');
  const [xp, setXp]       = useState(500);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [phases, setPhases] = useState<BossPhase[]>([
    { phaseNumber: 1, name: '', hpMax: 100, attributes: { ...EMPTY_ATTRS }, attacks: [], specialAbility: undefined },
  ]);

  const [tracosDano, setTracosDano]   = useState<TracoDano[]>([]);
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

  async function addToCombat() {
    if (!name.trim() || phases.length < 1) return;
    setLoading(true);
    const instance: BossInstance = {
      instanceId: '',
      templateId: undefined,
      name: name.trim(),
      icon,
      phases,
      currentPhase: 0,
      hpCurrent: phases[0].hpMax,
      immunities: [],
      resistances: [],
      tracosDano,
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

  return (
      <div className="flex flex-col gap-4">
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

        {/* Fraquezas e resistências */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7a7050" }}>Fraquezas e resistências</p>
          <TracosDanoEditor value={tracosDano} onChange={setTracosDano} />
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
          <CheckField checked={hasReward} onChange={setHasReward} color="amber"
            label={<span style={{ color: '#c8a050' }}>Recompensa especial ao derrotar</span>} />
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
          disabled={!name.trim() || phases.length < 1 || loading}
        >
          {loading ? 'Adicionando…' : 'Adicionar boss ao combate'}
        </Button>
      </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────── */
export default function AddBossModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('catalogo');

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
              <Crown size={16} style={{ color: '#c8a050' }} /> Adicionar Boss
            </h2>
            <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
          </div>

          <div className="flex gap-1 rounded-lg p-1" style={{ background: '#0f0d08' }}>
            {(['catalogo', 'novo'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-1.5 rounded text-xs font-semibold transition-colors"
                style={tab === t ? { background: '#3a3010', color: '#c8a050' } : { color: '#7a7050' }}>
                {t === 'catalogo' ? 'Catálogo' : 'Criar novo'}
              </button>
            ))}
          </div>

          {tab === 'catalogo' ? <BossCatalogTab onClose={onClose} /> : <CreateBossTab onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}
