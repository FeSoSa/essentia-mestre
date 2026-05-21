'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Race, PlayerAttributes } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  race?: Race;
  onClose: () => void;
  onSaved: (r: Race) => void;
}

const lbl = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';
const inp = 'w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors';

const ATTRS: [keyof PlayerAttributes, string, string][] = [
  ['strength',     'Força',         'FOR'],
  ['agility',      'Agilidade',     'AGI'],
  ['intelligence', 'Inteligência',  'INT'],
  ['resistance',   'Resistência',   'RES'],
  ['flow',         'Flow',          'FLX'],
  ['wisdom',       'Sabedoria',     'SAB'],
  ['presence',     'Presença',      'PRE'],
  ['defense',      'Defesa',        'DEF'],
];

export default function RaceModal({ race, onClose, onSaved }: Props) {
  const editing = !!race;
  const [name, setName] = useState(race?.name ?? '');
  const [attrs, setAttrs] = useState<PlayerAttributes>(
    race?.starterAttributes ?? {
      strength: 0, agility: 0, intelligence: 0, resistance: 0,
      flow: 0, wisdom: 0, presence: 0, defense: 0,
    }
  );
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setLoading(true);
    const body = { name: name.trim(), starterAttributes: attrs };
    try {
      const res = editing
        ? await api.put<Race>(`/master/races/${race!.id}`, body)
        : await api.post<Race>('/master/races', body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] rounded-xl border border-e-border bg-e-surface text-e-text">
        <div className="flex flex-col gap-5 p-5">

          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">{editing ? 'Editar raça' : 'Nova raça'}</h2>
            <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
          </div>

          <div>
            <label className={lbl}>Nome da raça</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className={inp} placeholder="ex: Humano, Elfo, Anão…" />
          </div>

          <div>
            <label className={lbl}>Atributos iniciais</label>
            <div className="grid grid-cols-4 gap-2">
              {ATTRS.map(([key, full, short]) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-e-faint" title={full}>
                    {short}
                  </span>
                  <input
                    type="number" min={0}
                    value={attrs[key]}
                    onChange={(e) => setAttrs((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                    className="w-full text-center text-sm rounded-lg px-1 py-1.5 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1 border-t border-e-border">
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
