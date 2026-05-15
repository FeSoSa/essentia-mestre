'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import type { Essencia } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import { STATUS_ICONS } from '@/lib/statusIcons';

const TYPES = ['Grande', 'Mitica', 'Derivada'];

const ATTRS: { key: string; label: string }[] = [
  { key: 'strength',     label: 'FOR' },
  { key: 'agility',      label: 'AGI' },
  { key: 'intelligence', label: 'INT' },
  { key: 'resistance',   label: 'RES' },
  { key: 'flow',         label: 'FLX' },
  { key: 'wisdom',       label: 'SAB' },
  { key: 'presence',     label: 'PRE' },
];

const COLOR_SWATCHES = [
  '#d4a84e', // gold
  '#a855f7', // purple
  '#4ade80', // teal
  '#ef4444', // red
  '#3b82f6', // blue
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#e2e8f0', // white
  '#71717a', // zinc
  '#7c3aed', // violet
];

const lbl = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';

interface Props {
  essencia?: Essencia;
  essencias: Essencia[];
  skills: Skill[];
  onClose: () => void;
  onSaved: (e: Essencia) => void;
}

export default function EssenciaModal({ essencia, essencias, skills, onClose, onSaved }: Props) {
  const [name,     setName]     = useState(essencia?.name ?? '');
  const [type,     setType]     = useState(essencia?.type ?? 'Derivada');
  const [parentId, setParentId] = useState(essencia?.parentId ?? '');
  const [desc,    setDesc]    = useState(essencia?.desc ?? '');
  const [icon,    setIcon]    = useState(essencia?.icon ?? '');
  const [color,   setColor]   = useState(essencia?.color ?? '');
  const [colorInput, setColorInput] = useState(essencia?.color ?? '');
  const [bonuses, setBonuses] = useState<{ key: string; val: number }[]>(
    Object.entries(essencia?.attributeBonus ?? {}).map(([key, val]) => ({ key, val }))
  );
  const [saving, setSaving] = useState(false);

  const linkedSkills = essencia
    ? skills.filter((s) => s.essenciaId === essencia.id)
    : [];

  function addBonus() {
    setBonuses((p) => [...p, { key: 'strength', val: 1 }]);
  }
  function removeBonus(i: number) {
    setBonuses((p) => p.filter((_, idx) => idx !== i));
  }
  function setBonusKey(i: number, key: string) {
    setBonuses((p) => p.map((b, idx) => idx === i ? { ...b, key } : b));
  }
  function setBonusVal(i: number, val: number) {
    setBonuses((p) => p.map((b, idx) => idx === i ? { ...b, val } : b));
  }

  function pickColor(hex: string) {
    setColor(hex);
    setColorInput(hex);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const attributeBonus: Record<string, number> = {};
      for (const b of bonuses) {
        if (b.key) attributeBonus[b.key] = b.val;
      }
      const skillIds = linkedSkills.map((s) => s.id);
      const payload = {
        name, type, desc, attributeBonus, skillIds,
        icon: icon || null, color: color || null,
        parentId: type === 'Derivada' ? parentId || null : null,
      };
      const res = essencia
        ? await api.put<Essencia>(`/master/essencias/${essencia.id}`, payload)
        : await api.post<Essencia>('/master/essencias', payload);
      onSaved(res.data);
      onClose();
    } catch {}
    finally { setSaving(false); }
  }

  const selectedIconEntry = STATUS_ICONS.find((i) => i.name === icon);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <div className="flex items-center gap-3">
            {selectedIconEntry && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: (color || '#71717a') + '22', color: color || '#71717a' }}>
                <selectedIconEntry.Icon size={16} />
              </div>
            )}
            <h3 className="font-semibold text-e-text">{essencia ? 'Editar Essência' : 'Nova Essência'}</h3>
          </div>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-4 flex-1">

          <div>
            <label className={lbl}>Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Essência do Fogo" required />
          </div>

          <div>
            <label className={lbl}>Tipo</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    type === t
                      ? 'bg-e-accent/15 border-e-accent text-e-accent'
                      : 'border-e-border text-e-faint hover:border-e-border2 hover:text-e-sub'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {type === 'Derivada' && (
            <div>
              <label className={lbl}>Essência Grande (origem)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 bg-e-bg border border-e-border text-sm text-e-text outline-none focus:border-e-border2 transition-colors cursor-pointer"
              >
                <option value="">— Nenhuma —</option>
                {essencias
                  .filter((e) => e.type === 'Grande' && e.id !== essencia?.id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))
                }
              </select>
            </div>
          )}

          <div>
            <label className={lbl}>Descrição</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Descrição da essência…" rows={3}
              className="w-full rounded-xl px-3 py-2 bg-e-bg border border-e-border text-sm text-e-text resize-none outline-none focus:border-e-border2 transition-colors placeholder:text-e-faint" />
          </div>

          {/* Ícone */}
          <div>
            <label className={lbl}>Ícone</label>
            <div className="grid grid-cols-9 gap-1.5">
              {/* Sem ícone */}
              <button type="button" onClick={() => setIcon('')}
                className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center text-[9px] font-bold ${
                  !icon ? 'border-e-accent bg-e-accent/10 text-e-accent' : 'border-e-border hover:border-e-border2 text-e-faint'
                }`}>
                —
              </button>
              {STATUS_ICONS.map(({ name: n, Icon }) => (
                <button key={n} type="button" title={n} onClick={() => setIcon(icon === n ? '' : n)}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                    icon === n
                      ? 'border-e-accent bg-e-accent/10 text-e-accent'
                      : 'border-e-border hover:border-e-border2 text-e-faint hover:text-e-sub'
                  }`}
                  style={icon === n && color ? { borderColor: color, backgroundColor: color + '22', color } : {}}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className={lbl}>Cor</label>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-6 gap-1.5">
                {COLOR_SWATCHES.map((c) => (
                  <button key={c} type="button" onClick={() => pickColor(c)}
                    className={`h-7 rounded-lg border-2 transition-all cursor-pointer ${
                      color === c ? 'scale-110 border-white/50' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }} />
                ))}
                {/* Sem cor */}
                <button type="button" onClick={() => pickColor('')}
                  className={`h-7 rounded-lg border transition-colors cursor-pointer flex items-center justify-center text-[9px] font-bold ${
                    !color ? 'border-e-accent text-e-accent' : 'border-e-border text-e-faint hover:border-e-border2'
                  }`}>
                  auto
                </button>
              </div>
              {/* Hex custom */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg border border-e-border shrink-0"
                  style={{ backgroundColor: colorInput || 'transparent' }} />
                <input type="text" value={colorInput}
                  onChange={(e) => {
                    setColorInput(e.target.value);
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColor(e.target.value);
                  }}
                  placeholder="#rrggbb"
                  className="flex-1 rounded-xl px-3 py-1.5 bg-e-bg border border-e-border text-sm text-e-text outline-none focus:border-e-border2 transition-colors placeholder:text-e-faint font-mono" />
              </div>
            </div>
          </div>

          {/* Bônus de atributos */}
          <div>
            <label className={lbl}>Bônus de atributos</label>
            <div className="flex flex-col gap-2">
              {bonuses.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={b.key} onChange={(e) => setBonusKey(i, e.target.value)}
                    className="flex-1 rounded-xl px-3 py-2 bg-e-bg border border-e-border text-sm text-e-text outline-none focus:border-e-border2 transition-colors cursor-pointer">
                    {ATTRS.map((a) => (
                      <option key={a.key} value={a.key}>{a.label} — {a.key}</option>
                    ))}
                  </select>
                  <input type="number" value={b.val} onChange={(e) => setBonusVal(i, Number(e.target.value))}
                    className="!w-20 !text-center" />
                  <button type="button" onClick={() => removeBonus(i)}
                    className="p-1.5 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-danger/10 transition-colors cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addBonus}
                className="flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-e-border text-e-faint hover:border-e-border2 hover:text-e-sub text-sm transition-colors cursor-pointer">
                <Plus size={13} /> Adicionar atributo
              </button>
            </div>
          </div>

          {/* Habilidades vinculadas */}
          <div>
            <label className={lbl}>Habilidades vinculadas</label>
            {linkedSkills.length === 0 ? (
              <p className="text-xs text-e-faint py-2">
                {essencia
                  ? 'Nenhuma habilidade vinculada. Crie habilidades do tipo Essência em Habilidades e selecione esta essência.'
                  : 'Salve a essência e depois vincule habilidades a ela na seção Habilidades.'}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {linkedSkills.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-e-bg border border-e-border">
                    <span className="flex-1 text-sm text-e-text truncate">{s.name}</span>
                    {s.ultimate && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 uppercase tracking-wider">ULT</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-e-border">
            <Button type="button" variant="ghost" size="md" className="w-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={saving}>
              {saving ? 'Salvando…' : essencia ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
