'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import SectionHeader, { Page } from '@/components/ui/SectionHeader';
import SearchInput, { Tabs } from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import EnemyTemplateList from './EnemyTemplateList';
import BossTemplateList from './BossTemplateList';
import AllyTemplateList from './AllyTemplateList';
import DescobertasList from './DescobertasList';

type Tab = 'inimigos' | 'bosses' | 'aliados' | 'descobertas';

const TAB_LABELS: Record<Tab, string> = {
  inimigos: 'Inimigos',
  bosses: 'Bosses',
  aliados: 'Aliados',
  descobertas: 'Descobertas do grupo',
};

const NOVO: Record<Exclude<Tab, 'descobertas'>, string> = { inimigos: 'Novo inimigo', bosses: 'Novo boss', aliados: 'Novo aliado' };

export default function Bestiario() {
  const [tab, setTab] = useState<Tab>('inimigos');
  const [search, setSearch] = useState('');
  // Cada clique em "Novo" incrementa o contador; a lista da aba abre o modal de criação
  const [novo, setNovo] = useState(0);

  function trocar(t: Tab) { setTab(t); setNovo(0); }

  return (
    <Page>
      <SectionHeader
        title="Bestiário"
        subtitle="Modelos de inimigos, bosses e aliados. Clique num card para editar."
        action={tab !== 'descobertas' && <Button variant="primary" onClick={() => setNovo((n) => n + 1)}><Plus size={15} /> {NOVO[tab]}</Button>}
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Tabs value={tab} onChange={trocar}
          tabs={(Object.keys(TAB_LABELS) as Tab[]).map((t) => ({ id: t, label: TAB_LABELS[t] }))} />
        <div className="ml-auto"><SearchInput value={search} onChange={setSearch} placeholder="Buscar pelo nome…" /></div>
      </div>

      {tab === 'inimigos' && <EnemyTemplateList search={search} novo={novo} onCopied={() => trocar('aliados')} />}
      {tab === 'bosses'   && <BossTemplateList search={search} novo={novo} />}
      {tab === 'aliados'  && <AllyTemplateList search={search} novo={novo} onCopied={() => trocar('inimigos')} />}
      {tab === 'descobertas' && <DescobertasList search={search} />}
    </Page>
  );
}
