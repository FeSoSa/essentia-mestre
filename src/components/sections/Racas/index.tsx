'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import RaceModal from './RaceModal';
import type { Race, PlayerAttributes } from '@/store/types';

const ATTR_LABELS: [keyof PlayerAttributes, string][] = [
  ['strength', 'FOR'], ['agility', 'AGI'], ['intelligence', 'INT'], ['resistance', 'RES'],
  ['flow', 'FLX'], ['wisdom', 'SAB'], ['presence', 'PRE'], ['defense', 'DEF'],
];

export default function Racas() {
  const [races,   setRaces]   = useState<Race[]>([]);
  const [editing, setEditing] = useState<Race | undefined>();
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.get<Race[]>('/master/races').then((r) => setRaces(r.data)).catch(() => {});
  }, []);

  function handleSaved(r: Race) {
    setRaces((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id);
      return idx >= 0 ? prev.map((x, i) => (i === idx ? r : x)) : [...prev, r];
    });
  }

  async function handleDelete(r: Race) {
    if (!confirm(`Deletar raça "${r.name}"?`)) return;
    await api.delete(`/master/races/${r.id}`).catch(() => {});
    setRaces((prev) => prev.filter((x) => x.id !== r.id));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <SectionHeader
        title="Raças"
        subtitle="Atributos iniciais por raça — preenchidos automaticamente no cadastro de personagem"
        action={
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus size={14} /> Nova raça
          </Button>
        }
      />

      {races.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-16">
          Nenhuma raça cadastrada. Clique em "Nova raça" para começar.
        </p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {races.map((r) => (
            <div key={r.id} className="bg-e-surface border border-e-border rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-e-text">{r.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(r)}
                    className="p-1.5 rounded-lg text-e-faint hover:text-e-text hover:bg-e-card transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(r)}
                    className="p-1.5 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-card transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {ATTR_LABELS.map(([key, short]) => (
                  <div key={key} className="bg-e-card rounded-lg px-2 py-1.5 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-e-faint">{short}</span>
                    <span className="text-sm font-bold text-e-text tabular-nums">{r.starterAttributes[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <RaceModal onClose={() => setShowNew(false)} onSaved={handleSaved} />}
      {editing  && <RaceModal race={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />}
    </div>
  );
}
