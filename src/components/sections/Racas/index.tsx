'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useTabuleiroStore } from '@/store/tabuleiroStore';
import SectionHeader, { Page } from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import RaceModal from './RaceModal';
import { TracosDanoChips } from '@/components/shared/TracosDanoEditor';
import type { Race, PlayerAttributes } from '@/store/types';

// 10 é a base: acima destaca em verde, abaixo em vermelho
const corAtributo = (v: number) => (v > 10 ? 'text-e-accent' : v < 10 ? 'text-red-400' : 'text-e-text');

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
    // Deslocamento novo já vale no tabuleiro da Mesa
    useTabuleiroStore.getState().carregarRacas();
  }

  async function handleDelete(r: Race) {
    if (!confirm(`Deletar raça "${r.name}"?`)) return;
    await api.delete(`/master/races/${r.id}`).catch(() => {});
    setRaces((prev) => prev.filter((x) => x.id !== r.id));
    useTabuleiroStore.getState().carregarRacas();
  }

  return (
    <Page>
      <SectionHeader
        title="Raças"
        count={races.length}
        subtitle="Atributos iniciais de cada raça, usados no cadastro de personagem. Verde fica acima de 10, vermelho abaixo."
        action={
          <Button variant="primary" onClick={() => setShowNew(true)}>
            <Plus size={15} /> Nova raça
          </Button>
        }
      />

      {races.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-16">
          Nenhuma raça cadastrada ainda.
        </p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {races.map((r) => (
            <div key={r.id} onClick={() => setEditing(r)} className="group bg-e-surface border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-colors hover:border-white/20 hover:bg-[#1c1c20]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-e-text">{r.name}</span>
                <span className="ml-2 mr-auto text-[11px] text-e-faint tabular-nums" title="Casas por turno no tabuleiro">{r.deslocamento ?? 6} casas</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button type="button" title="Editar" onClick={() => setEditing(r)}
                    className="p-1.5 cursor-pointer rounded-lg text-e-faint hover:text-e-text hover:bg-e-card transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button type="button" title="Excluir" onClick={() => handleDelete(r)}
                    className="p-1.5 cursor-pointer rounded-lg text-e-faint hover:text-e-danger hover:bg-e-card transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {ATTR_LABELS.map(([key, short]) => (
                  <div key={key} className="bg-white/[0.04] rounded-lg px-2 py-1.5 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-e-faint">{short}</span>
                    <span className={`text-sm font-bold tabular-nums ${corAtributo(r.starterAttributes[key])}`}>{r.starterAttributes[key]}</span>
                  </div>
                ))}
              </div>
              <TracosDanoChips value={r.tracosDano} />
            </div>
          ))}
        </div>
      )}

      {showNew && <RaceModal onClose={() => setShowNew(false)} onSaved={handleSaved} />}
      {editing  && <RaceModal race={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />}
    </Page>
  );
}
