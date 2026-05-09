'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import ClassKitCard from './ClassKitCard';
import ClassKitModal from './ClassKitModal';
import type { ClassKit, ItemCatalog } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';

export default function Classes() {
  const [kits,    setKits]    = useState<ClassKit[]>([]);
  const [skills,  setSkills]  = useState<Skill[]>([]);
  const [items,   setItems]   = useState<ItemCatalog[]>([]);
  const [editing, setEditing] = useState<ClassKit | undefined>();
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.get<ClassKit[]>('/master/kits').then((r) => setKits(r.data)).catch(() => {});
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
    api.get<ItemCatalog[]>('/items').then((r) => setItems(r.data)).catch(() => {});
  }, []);

  function handleSaved(k: ClassKit) {
    setKits((prev) => {
      const idx = prev.findIndex((x) => x.id === k.id);
      return idx >= 0 ? prev.map((x, i) => (i === idx ? k : x)) : [...prev, k];
    });
  }

  async function handleDelete(k: ClassKit) {
    if (!confirm(`Deletar classe "${k.skillClass}"? Isso não remove jogadores já criados.`)) return;
    await api.delete(`/master/kits/${k.id}`).catch(() => {});
    setKits((prev) => prev.filter((x) => x.id !== k.id));
  }

  const skillNames = new Map(skills.map((s) => [s.id, s.name]));
  const itemNames  = new Map(items.map((i) => [i.id, i.name]));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <SectionHeader
        title="Classes"
        subtitle="Kits iniciais de cada classe — atributos, slots, habilidades e itens de partida"
        action={
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus size={14} /> Nova classe
          </Button>
        }
      />

      {kits.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-16">
          Nenhuma classe cadastrada. Clique em "Nova classe" para começar.
        </p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {kits.map((k) => (
            <ClassKitCard
              key={k.id}
              kit={k}
              skillNames={skillNames}
              itemNames={itemNames}
              onEdit={() => setEditing(k)}
              onDelete={() => handleDelete(k)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <ClassKitModal
          skills={skills}
          items={items}
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <ClassKitModal
          kit={editing}
          skills={skills}
          items={items}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
