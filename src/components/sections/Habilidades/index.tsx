'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import SkillCard, { type Skill, type Essencia } from './SkillCard';
import SkillModal from './SkillModal';
import type { ItemCatalog, ClassKit } from '@/store/types';

type Tab = 'general' | 'class' | 'weapon' | 'essencia';
const TAB_LABELS: Record<Tab, string> = { general: 'Geral', class: 'Classe', weapon: 'Arma', essencia: 'Essência' };

export default function Habilidades() {
  const [skills,    setSkills]    = useState<Skill[]>([]);
  const [essencias, setEssencias] = useState<Essencia[]>([]);
  const [classNames, setClassNames] = useState<string[]>([]);
  const [weapons,   setWeapons]   = useState<ItemCatalog[]>([]);
  const [tab,       setTab]       = useState<Tab>('general');
  const [editing,   setEditing]   = useState<Skill | undefined>();
  const [showNew,   setShowNew]   = useState(false);

  useEffect(() => {
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
    api.get<Essencia[]>('/master/essencias').then((r) => setEssencias(r.data)).catch(() => {});
    api.get<ClassKit[]>('/master/kits').then((r) => setClassNames(r.data.map((k) => k.skillClass))).catch(() => {});
    api.get<ItemCatalog[]>('/items').then((r) =>
      setWeapons(r.data.filter((i) => i.type === 'weapon'))
    ).catch(() => {});
  }, []);

  function handleSaved(s: Skill) {
    setSkills((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      return idx >= 0 ? prev.map((x, i) => (i === idx ? s : x)) : [...prev, s];
    });
  }

  async function handleDelete(s: Skill) {
    if (!confirm(`Deletar "${s.name}"?`)) return;
    await api.delete(`/skills/${s.id}`).catch(() => {});
    setSkills((prev) => prev.filter((x) => x.id !== s.id));
  }

  function filterTab(s: Skill, t: Tab): boolean {
    if (t === 'general') return s.type === 'class' && !s.skillClass;
    if (t === 'class')   return s.type === 'class' && !!s.skillClass;
    return s.type === t;
  }

  const visible = skills.filter((s) => filterTab(s, tab));

  const tabCls = (t: Tab) =>
    `px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
      tab === t ? 'bg-e-card text-e-text' : 'text-e-sub hover:text-e-text'
    }`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <SectionHeader
        title="Habilidades"
        subtitle="Catálogo de habilidades de classe, arma e essência"
        action={
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus size={14} /> Nova habilidade
          </Button>
        }
      />

      <div className="flex gap-1 rounded-lg p-1 mb-6 w-fit bg-e-surface">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tabCls(t)}>
            {TAB_LABELS[t]}
            <span className="ml-1.5 text-[10px] text-e-faint">
              {skills.filter((s) => filterTab(s, t)).length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-16">
          Nenhuma habilidade nesta categoria. Clique em "Nova habilidade" para criar.
        </p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {visible.map((s) => (
            <SkillCard
              key={s.id}
              skill={s}
              essencias={essencias}
              weapons={weapons}
              onEdit={() => setEditing(s)}
              onDelete={() => handleDelete(s)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <SkillModal
          essencias={essencias}
          classes={classNames}
          weapons={weapons}
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <SkillModal
          skill={editing}
          essencias={essencias}
          classes={classNames}
          weapons={weapons}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
