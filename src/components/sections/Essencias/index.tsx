'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Essencia } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import EssenciaCard from '@/components/sections/Itens/EssenciaCard';
import EssenciaModal from '@/components/sections/Itens/EssenciaModal';

export default function Essencias() {
  const [essencias, setEssencias] = useState<Essencia[]>([]);
  const [skills,    setSkills]    = useState<Skill[]>([]);
  const [editing,   setEditing]   = useState<Essencia | undefined>();
  const [showNew,   setShowNew]   = useState(false);

  useEffect(() => {
    api.get<Essencia[]>('/master/essencias').then((r) => setEssencias(r.data)).catch(() => {});
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
  }, []);

  function handleSaved(e: Essencia) {
    setEssencias((prev) => {
      const idx = prev.findIndex((x) => x.id === e.id);
      return idx >= 0 ? prev.map((x, j) => (j === idx ? e : x)) : [...prev, e];
    });
  }

  async function handleDelete(e: Essencia) {
    if (!confirm(`Deletar "${e.name}"?`)) return;
    await api.delete(`/master/essencias/${e.id}`).catch(() => {});
    setEssencias((prev) => prev.filter((x) => x.id !== e.id));
  }

  const TYPE_ORDER = ['Grande', 'Mitica', 'Derivada'];
  const sorted = [...essencias].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <SectionHeader
        title="Essências"
        subtitle="Catálogo de essências — concedem atributos e desbloqueiam habilidades"
        action={
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus size={14} /> Nova essência
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-16">
          Nenhuma essência cadastrada. Clique em "Nova essência" para criar.
        </p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {sorted.map((e) => (
            <EssenciaCard
              key={e.id}
              essencia={e}
              skills={skills.filter((s) => s.essenciaId === e.id)}
              onEdit={() => setEditing(e)}
              onDelete={() => handleDelete(e)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <EssenciaModal
          skills={skills}
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <EssenciaModal
          essencia={editing}
          skills={skills}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
