'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Swords, Sparkles, X, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import type { EnemyInstance, BossInstance, CombatAlly, Player, StatusEffect, AutoEffect } from '@/store/types';
import EffectBuilder from '@/components/sections/StatusEffects/EffectBuilder';
import EnemyAttackModal from './EnemyAttackModal';
import { getStatusIcon } from '@/lib/statusIcons';

type CombatEntity =
  | { kind: 'enemy'; data: EnemyInstance }
  | { kind: 'boss';  data: BossInstance  }
  | { kind: 'ally';  data: CombatAlly    };

interface Props {
  entity: CombatEntity;
  players: Player[];
  theme?: 'enemy' | 'boss' | 'ally';
}

const THEME = {
  enemy: {
    accent: '#c04040',
    accentBg: '#2a1818',
    accentMuted: '#7a5050',
    border: '#4a2a2a',
    badge: { background: '#2a1818', color: '#e8d8d8', border: '1px solid #4a2a2a' },
  },
  boss: {
    accent: '#c8a050',
    accentBg: '#2a2410',
    accentMuted: '#7a7050',
    border: '#6a5a20',
    badge: { background: '#2a2410', color: '#f0e8d0', border: '1px solid #6a5a20' },
  },
  ally: {
    accent: '#4ade80',
    accentBg: '#152a1e',
    accentMuted: '#5a8a70',
    border: '#2a4a3a',
    badge: { background: '#1a2e24', color: '#c8e8d8', border: '1px solid #2a4a3a' },
  },
};

function getEntityId(entity: CombatEntity): string {
  return entity.kind === 'ally' ? entity.data.id : entity.data.instanceId;
}

function getAttacks(entity: CombatEntity) {
  if (entity.kind === 'boss') {
    const phase = entity.data.phases[entity.data.currentPhase] ?? entity.data.phases[0];
    return phase?.attacks ?? [];
  }
  return entity.data.attacks ?? [];
}

function getEffects(entity: CombatEntity): StatusEffect[] {
  return entity.data.statusEffects ?? [];
}

function getEntityAttributes(entity: CombatEntity): { strength: number; agility: number; intelligence: number } {
  if (entity.kind === 'boss') {
    const phase = entity.data.phases[entity.data.currentPhase] ?? entity.data.phases[0];
    const a = phase?.attributes;
    return { strength: a?.strength ?? 10, agility: a?.agility ?? 10, intelligence: a?.intelligence ?? 10 };
  }
  const a = (entity.data as any).attributes;
  return { strength: a?.strength ?? 10, agility: a?.agility ?? 10, intelligence: a?.intelligence ?? 10 };
}

export default function CombatEntityPanel({ entity, players, theme = 'enemy' }: Props) {
  const [expanded,        setExpanded]      = useState(false);
  const [activeTab,       setActiveTab]     = useState<'attacks' | 'effects'>('attacks');
  const [showAddEffect,   setShowAddEffect] = useState(false);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const { setEnemies, setBosses, setAllies, enemies, bosses, allies } = useStore();

  const t = THEME[theme];
  const attacks = getAttacks(entity);
  const effects = getEffects(entity);
  const entityId = getEntityId(entity);

  async function removeEffect(effectId: string) {
    try {
      await api.delete(`/master/entity-effect/${effectId}`, {
        data: { entityId, entityKind: entity.kind },
      });
      refreshEffects(effects.filter((e) => e.id !== effectId));
    } catch {}
  }

  function refreshEffects(updated: StatusEffect[]) {
    if (entity.kind === 'enemy') {
      setEnemies(enemies.map((e) => e.instanceId === entityId ? { ...e, statusEffects: updated } : e));
    } else if (entity.kind === 'boss') {
      setBosses(bosses.map((b) => b.instanceId === entityId ? { ...b, statusEffects: updated } : b));
    } else {
      setAllies(allies.map((a) => a.id === entityId ? { ...a, statusEffects: updated } : a));
    }
  }

  const tabBtn = (id: 'attacks' | 'effects') => `flex-1 text-[10px] font-semibold uppercase tracking-wider py-1 rounded transition-colors ${
    activeTab === id
      ? 'text-[var(--accent)]'
      : 'opacity-40 hover:opacity-70'
  }`;

  function getEntityName(): string {
    if (entity.kind === 'ally') return entity.data.name;
    return entity.data.name;
  }

  if (!expanded) {
    return (
      <div className="flex items-center gap-1">
        {attacks.length > 0 && (
          <button
            onClick={() => setShowAttackModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer"
            style={{ background: t.accentBg, color: t.accent, border: `1px solid ${t.border}` }}
          >
            <Swords size={11} /> Atacar
          </button>
        )}
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 flex items-center justify-between px-2 py-1 rounded transition-opacity opacity-50 hover:opacity-100 text-xs cursor-pointer"
          style={{ color: t.accentMuted }}
        >
          <div className="flex items-center gap-1">
            {effects.length > 0 && (
              <>
                <Sparkles size={11} />
                <span>{effects.length} ef</span>
              </>
            )}
          </div>
          <ChevronDown size={12} />
        </button>
        {showAttackModal && (
          <EnemyAttackModal
            entityId={entityId}
            entityKind={entity.kind}
            entityName={getEntityName()}
            attacks={attacks}
            entityAttributes={getEntityAttributes(entity)}
            players={players}
            theme={t}
            onClose={() => setShowAttackModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border flex flex-col gap-0 overflow-hidden mt-1"
      style={{ borderColor: t.border, background: t.accentBg }}>

      {/* Panel header */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1">
        <div className="flex flex-1 gap-0">
          <button className={tabBtn('attacks')} style={{ '--accent': t.accent } as React.CSSProperties}
            onClick={() => setActiveTab('attacks')}>
            <Swords size={10} className="inline mr-1" />Ataques
          </button>
          <button className={tabBtn('effects')} style={{ '--accent': t.accent } as React.CSSProperties}
            onClick={() => setActiveTab('effects')}>
            <Sparkles size={10} className="inline mr-1" />Efeitos
            {effects.length > 0 && <span className="ml-1 opacity-70">({effects.length})</span>}
          </button>
        </div>
        <button onClick={() => setExpanded(false)} className="opacity-40 hover:opacity-80 shrink-0">
          <ChevronUp size={12} />
        </button>
      </div>

      {/* Attacks tab */}
      {activeTab === 'attacks' && (
        <div className="flex flex-col gap-1 px-3 pb-3">
          {attacks.length === 0 && (
            <p className="text-xs opacity-40 italic">Nenhum ataque cadastrado.</p>
          )}
          {attacks.map((atk, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#ddd' }}>{atk.name || `Ataque ${i + 1}`}</p>
                {atk.skillName && (
                  <p className="text-[10px] opacity-60">⚡ {atk.skillName}</p>
                )}
              </div>
              <span className="text-xs font-mono shrink-0 opacity-60">{atk.damage}</span>
            </div>
          ))}
          {attacks.length > 0 && (
            <button
              onClick={() => setShowAttackModal(true)}
              className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-colors"
              style={{ background: t.accentBg, color: t.accent, border: `1px solid ${t.border}` }}
            >
              <Swords size={11} /> Abrir modal de combate
            </button>
          )}
        </div>
      )}

      {/* Effects tab */}
      {activeTab === 'effects' && (
        <div className="flex flex-col gap-1.5 px-3 pb-3">
          {effects.map((ef) => {
            const EfIcon = getStatusIcon(ef.icon);
            return (
            <div key={ef.id} className="flex items-center gap-2 rounded px-2 py-1"
              style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${t.border}` }}>
              {EfIcon && <EfIcon size={14} className="shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#ddd' }}>{ef.name}</p>
                <p className="text-[10px] opacity-50">
                  {ef.durationTurns === -1 ? '∞' : `${ef.durationTurns}t`}
                </p>
              </div>
              <button onClick={() => removeEffect(ef.id)} className="opacity-40 hover:opacity-80 shrink-0">
                <X size={11} />
              </button>
            </div>
            );
          })}
          {effects.length === 0 && <p className="text-xs opacity-40 italic">Nenhum efeito ativo.</p>}
          <button
            onClick={() => setShowAddEffect(true)}
            className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity mt-1"
            style={{ color: t.accent }}
          >
            <Plus size={11} /> Aplicar efeito
          </button>
        </div>
      )}

      {showAddEffect && (
        <AddEntityEffectModal
          entityId={entityId}
          entityKind={entity.kind}
          theme={t}
          onClose={() => setShowAddEffect(false)}
          onAdded={(ef) => {
            refreshEffects([...effects, ef]);
            setShowAddEffect(false);
          }}
        />
      )}
      {showAttackModal && (
        <EnemyAttackModal
          entityId={entityId}
          entityKind={entity.kind}
          entityName={getEntityName()}
          attacks={attacks}
          entityAttributes={getEntityAttributes(entity)}
          players={players}
          theme={t}
          onClose={() => setShowAttackModal(false)}
        />
      )}
    </div>
  );
}

/* ── Modal para adicionar efeito em entidade de combate ── */
interface AddEntityEffectModalProps {
  entityId: string;
  entityKind: 'enemy' | 'boss' | 'ally';
  theme: typeof THEME['enemy'];
  onClose: () => void;
  onAdded: (ef: StatusEffect) => void;
}

function AddEntityEffectModal({ entityId, entityKind, theme: t, onClose, onAdded }: AddEntityEffectModalProps) {
  const [name,      setName]      = useState('');
  const [icon,      setIcon]      = useState('');
  const [duration,  setDuration]  = useState(3);
  const [permanent, setPermanent] = useState(false);
  const [effects,   setEffects]   = useState<AutoEffect[]>([]);
  const [saving,    setSaving]    = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<StatusEffect>('/master/entity-effect', {
        entityId,
        entityKind,
        effect: {
          name: name.trim(),
          icon: icon || undefined,
          desc: '',
          durationTurns: permanent ? -1 : duration,
          effects,
        },
      });
      onAdded(res.data);
    } catch {}
    finally { setSaving(false); }
  }

  const inp = 'w-full text-sm rounded-lg px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none';
  const lbl = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <h3 className="font-semibold text-e-text text-sm">Aplicar efeito</h3>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={submit} className="overflow-y-auto p-5 flex flex-col gap-4 flex-1">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={lbl}>Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inp}
                placeholder="Ex: Envenenado" required />
            </div>
            <div className="w-20">
              <label className={lbl}>Ícone</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} className={inp} placeholder="🔥" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className={lbl}>Duração (turnos)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className={inp} min={1} disabled={permanent} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-5">
              <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)}
                className="accent-e-accent" />
              <span className="text-xs text-e-faint">Permanente</span>
            </label>
          </div>

          <EffectBuilder effects={effects} onChange={setEffects} />

          <div className="flex gap-2 justify-end pt-2 border-t border-e-border">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-e-border text-e-faint hover:text-e-text transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={!name.trim() || saving}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
              style={{ background: t.accent, color: '#000' }}>
              {saving ? 'Aplicando…' : 'Aplicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
