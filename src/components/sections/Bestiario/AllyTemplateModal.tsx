'use client';

import { useState } from 'react';
import { Plus, Trash2, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { proxyUrl } from '@/lib/gdrive';
import type { AllyAttack, AllyTemplate } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  template?: AllyTemplate;
  onClose: () => void;
  onSaved: (t: AllyTemplate) => void;
}

export default function AllyTemplateModal({ template, onClose, onSaved }: Props) {
  const editing = !!template;

  const [name,        setName]        = useState(template?.name        ?? '');
  const [type,        setType]        = useState(template?.type        ?? '');
  const [hpMax,       setHpMax]       = useState(template?.hpMax       ?? 20);
  const [portraitUrl, setPortraitUrl] = useState(template?.portraitUrl ?? '');
  const [str,         setStr]         = useState(template?.attributes.strength     ?? 10);
  const [agi,         setAgi]         = useState(template?.attributes.agility      ?? 10);
  const [int_,        setInt]         = useState(template?.attributes.intelligence ?? 10);
  const [def,         setDef]         = useState(template?.attributes.defense      ?? 5);
  const [attacks,     setAttacks]     = useState<AllyAttack[]>(template?.attacks ?? [{ name: '', damage: '' }]);
  const [desc,        setDesc]        = useState(template?.desc        ?? '');
  const [notes,       setNotes]       = useState(template?.notes       ?? '');
  const [loading,     setLoading]     = useState(false);

  const is = { background: '#1a2e24', color: '#c8e8d8', border: '1px solid #2a4a3a' };
  const ic = 'text-sm rounded px-2 py-1.5 outline-none w-full';

  function addAttack()  { setAttacks((a) => [...a, { name: '', damage: '' }]); }
  function removeAttack(i: number) { setAttacks((a) => a.filter((_, j) => j !== i)); }
  function updateAttack(i: number, f: keyof AllyAttack, v: string) {
    setAttacks((a) => a.map((x, j) => j === i ? { ...x, [f]: v } : x));
  }

  async function save() {
    if (!name.trim()) return;
    setLoading(true);
    const body = {
      name: name.trim(), type: type.trim(), hpMax,
      portraitUrl: portraitUrl || null,
      attributes: { strength: str, agility: agi, intelligence: int_, defense: def },
      attacks: attacks.filter((a) => a.name.trim()),
      desc, notes,
    };
    try {
      const res = editing
        ? await api.put<AllyTemplate>(`/allies/${template!.id}`, body)
        : await api.post<AllyTemplate>('/allies', body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] max-h-[90vh] overflow-y-auto rounded-xl border p-5 flex flex-col gap-4"
        style={{ background: '#151e1a', borderColor: '#2a4a3a', color: '#c8e8d8' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">{editing ? 'Editar aliado' : 'Novo aliado'}</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>

        {/* Portrait preview + name */}
        <div className="flex gap-3 items-center">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: '#1a2e24', border: '1px solid #2a4a3a' }}>
            {portraitUrl ? (
              <img src={proxyUrl(portraitUrl)} alt="" className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <UserRound size={28} style={{ color: '#5a8a70' }} />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)}
              className={ic} style={is} placeholder="Nome" />
            <input value={portraitUrl} onChange={(e) => setPortraitUrl(e.target.value)}
              className={ic} style={is} placeholder="URL da imagem (opcional)" />
          </div>
        </div>

        {/* Type */}
        <input value={type} onChange={(e) => setType(e.target.value)}
          className={ic} style={is} placeholder="Tipo (ex: Humano, Criatura…)" />

        {/* HP + attrs */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'HP máx', value: hpMax, set: setHpMax },
            { label: 'FOR',    value: str,   set: setStr   },
            { label: 'AGI',    value: agi,   set: setAgi   },
            { label: 'INT',    value: int_,  set: setInt   },
            { label: 'DEF',    value: def,   set: setDef   },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#5a8a70' }}>{label}</p>
              <input type="number" value={value} onChange={(e) => set(Number(e.target.value))}
                className="w-full text-sm rounded px-2 py-1.5 outline-none text-center" style={is} />
            </div>
          ))}
        </div>

        {/* Attacks */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a8a70' }}>Ataques</p>
            <button onClick={addAttack} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
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

        {/* Desc */}
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#5a8a70' }}>Descrição (visível ao jogador)</p>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
            className="w-full text-sm rounded px-2 py-1.5 resize-none outline-none placeholder:opacity-40" style={is}
            placeholder="Aparência, comportamento…" />
        </div>

        {/* Notes */}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full text-sm rounded px-2 py-1.5 resize-none outline-none placeholder:opacity-40" style={is}
          placeholder="Observações (privado)…" />

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!name.trim() || loading}>
            {loading ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
