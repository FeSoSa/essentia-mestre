'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { EnemyTemplate, EnemyAttack, EnemyDrop } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  template?: EnemyTemplate;
  onClose: () => void;
  onSaved: (t: EnemyTemplate) => void;
}

export default function EnemyTemplateModal({ template, onClose, onSaved }: Props) {
  const editing = !!template;

  const [name,  setName]  = useState(template?.name  ?? '');
  const [icon,  setIcon]  = useState(template?.icon  ?? '👹');
  const [type,  setType]  = useState(template?.type  ?? '');
  const [hpMax, setHpMax] = useState(template?.hpMax ?? 20);
  const [str,   setStr]   = useState(template?.attributes.strength     ?? 10);
  const [agi,   setAgi]   = useState(template?.attributes.agility      ?? 10);
  const [int,   setInt]   = useState(template?.attributes.intelligence  ?? 10);
  const [def,   setDef]   = useState(template?.attributes.defense       ?? 5);
  const [xp,    setXp]    = useState(template?.xp    ?? 50);
  const [desc,  setDesc]  = useState(template?.desc  ?? '');
  const [notes, setNotes] = useState(template?.notes ?? '');
  const [attacks, setAttacks] = useState<EnemyAttack[]>(template?.attacks ?? [{ name: '', damage: '' }]);
  const [drops,   setDrops]   = useState<EnemyDrop[]>(template?.drops ?? []);
  const [loading, setLoading] = useState(false);

  function addAttack() { setAttacks((a) => [...a, { name: '', damage: '' }]); }
  function updateAttack(i: number, f: keyof EnemyAttack, v: string) {
    setAttacks((a) => a.map((x, j) => j === i ? { ...x, [f]: v } : x));
  }
  function removeAttack(i: number) { setAttacks((a) => a.filter((_, j) => j !== i)); }

  function addDrop() { if (drops.length < 2) setDrops((d) => [...d, { name: '', icon: '🎁' }]); }
  function updateDrop(i: number, f: keyof EnemyDrop, v: string) {
    setDrops((d) => d.map((x, j) => j === i ? { ...x, [f]: v } : x));
  }
  function removeDrop(i: number) { setDrops((d) => d.filter((_, j) => j !== i)); }

  async function save() {
    if (!name.trim()) return;
    setLoading(true);
    const body = {
      name: name.trim(), icon, type: type.trim(), hpMax,
      attributes: { strength: str, agility: agi, intelligence: int, defense: def },
      attacks: attacks.filter((a) => a.name.trim()),
      drops: drops.filter((d) => d.name.trim()),
      xp, desc, notes,
    };
    try {
      const res = editing
        ? await api.put<EnemyTemplate>(`/enemies/${template!.id}`, body)
        : await api.post<EnemyTemplate>('/enemies', body);
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
      <div className="w-[420px] max-h-[90vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">{editing ? 'Editar inimigo' : 'Novo inimigo'}</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>

        {/* Icon + name */}
        <div className="flex gap-2">
          <input value={icon} onChange={(e) => setIcon(e.target.value)}
            className="w-12 text-center text-lg rounded outline-none" style={is} maxLength={2} />
          <input value={name} onChange={(e) => setName(e.target.value)}
            className={ic} style={is} placeholder="Nome" />
        </div>

        {/* Type */}
        <input value={type} onChange={(e) => setType(e.target.value)}
          className={ic} style={is} placeholder="Tipo (ex: Besta, Humanoide…)" />

        {/* HP + attrs */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'HP máx', value: hpMax, set: setHpMax },
            { label: 'FOR',    value: str,   set: setStr   },
            { label: 'AGI',    value: agi,   set: setAgi   },
            { label: 'INT',    value: int,   set: setInt   },
            { label: 'DEF',    value: def,   set: setDef   },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5 text-e-faint">{label}</p>
              <input type="number" value={value} onChange={(e) => set(Number(e.target.value))}
                className="w-full text-sm rounded px-2 py-1.5 outline-none text-center" style={is} />
            </div>
          ))}
        </div>

        {/* Attacks */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-e-faint">Ataques</p>
            <button onClick={addAttack} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text">
              <Plus size={12} /> Adicionar
            </button>
          </div>
          {attacks.map((atk, i) => (
            <div key={i} className="flex gap-2">
              <input value={atk.name} onChange={(e) => updateAttack(i, 'name', e.target.value)}
                className={ic} style={is} placeholder="Nome do ataque" />
              <input value={atk.damage} onChange={(e) => updateAttack(i, 'damage', e.target.value)}
                className="w-20 text-sm rounded px-2 py-1.5 outline-none font-mono" style={is} placeholder="1d6+2" />
              <button onClick={() => removeAttack(i)} className="opacity-40 hover:opacity-80 shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Drops */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-e-faint">Drops</p>
            {drops.length < 2 && (
              <button onClick={addDrop} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text">
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
          <p className="text-[10px] uppercase tracking-wider mb-0.5 text-e-faint">XP</p>
          <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))}
            className="w-24 text-sm rounded px-2 py-1.5 outline-none" style={is} />
        </div>

        {/* Desc (visível ao jogador) */}
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-0.5 text-e-faint">Descrição (visível ao jogador)</p>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
            className="w-full text-sm rounded px-2 py-1.5 resize-none outline-none placeholder:opacity-40" style={is}
            placeholder="Aparência, lore, comportamento…" />
        </div>

        {/* Notes (privado do mestre) */}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full text-sm rounded px-2 py-1.5 resize-none outline-none placeholder:opacity-40" style={is}
          placeholder="Observações…" />

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!name.trim() || loading}>
            {loading ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
