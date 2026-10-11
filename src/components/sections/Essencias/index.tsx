'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Essencia } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import SectionHeader, { Page } from '@/components/ui/SectionHeader';
import SearchInput, { Tabs } from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import EssenciaCard, { TYPE_LABEL } from '@/components/sections/Itens/EssenciaCard';
import EssenciaModal from '@/components/sections/Itens/EssenciaModal';

type Filtro = 'todas' | 'Elemental' | 'Mitica' | 'Derivada';

export default function Essencias() {
  const [essencias, setEssencias] = useState<Essencia[]>([]);
  const [skills,    setSkills]    = useState<Skill[]>([]);
  const [editing,   setEditing]   = useState<Essencia | undefined>();
  const [showNew,   setShowNew]   = useState(false);
  const [filtro,    setFiltro]    = useState<Filtro>('todas');
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    api.get<Essencia[]>('/master/essencias').then((r) => setEssencias(r.data)).catch(() => {});
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (editing !== undefined || showNew) {
      api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
    }
  }, [editing?.id, showNew]);

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

  const TYPE_ORDER = ['Elemental', 'Mitica', 'Derivada'];
  // "Grande" é o nome antigo de Elemental (até a migração renomear no banco)
  const tipoDe = (e: Essencia) => (e.type === 'Grande' ? 'Elemental' : e.type);
  const doTipo = (t: Filtro) => (e: Essencia) => t === 'todas' || tipoDe(e) === t;
  const busca = (e: Essencia) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.name.toLowerCase().includes(q)
      || skills.some((s) => s.essenciaId === e.id && s.name.toLowerCase().includes(q));
  };
  const sorted = essencias.filter(doTipo(filtro)).filter(busca).sort(
    (a, b) => TYPE_ORDER.indexOf(tipoDe(a)) - TYPE_ORDER.indexOf(tipoDe(b))
  );

  return (
    <Page>
      <SectionHeader
        title="Essências"
        count={essencias.length}
        subtitle="Concedem atributos e liberam habilidades. A busca também encontra pelo nome da habilidade."
        action={
          <Button variant="primary" onClick={() => setShowNew(true)}>
            <Plus size={15} /> Nova essência
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Tabs value={filtro} onChange={setFiltro}
          tabs={(['todas', ...TYPE_ORDER] as Filtro[]).map((t) => ({
            id: t,
            label: t === 'todas' ? 'Todas' : `${TYPE_LABEL[t]}s`,
            count: essencias.filter(doTipo(t)).filter(busca).length,
          }))} />
        <div className="ml-auto"><SearchInput value={search} onChange={setSearch} placeholder="Essência ou habilidade…" /></div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-16">
          {search ? 'Nada encontrado com essa busca.' : 'Nenhuma essência aqui ainda.'}
        </p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {sorted.map((e) => (
            <EssenciaCard
              key={e.id}
              essencia={e}
              skills={skills.filter((s) => s.essenciaId === e.id)}
              parentName={e.parentId ? essencias.find((x) => x.id === e.parentId)?.name : undefined}
              onEdit={() => setEditing(e)}
              onDelete={() => handleDelete(e)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <EssenciaModal
          essencias={essencias}
          skills={skills}
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <EssenciaModal
          essencia={editing}
          essencias={essencias}
          skills={skills}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
    </Page>
  );
}
