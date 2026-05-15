'use client';

import { useState } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import EnemyTemplateList from './EnemyTemplateList';
import BossTemplateList from './BossTemplateList';
import AllyTemplateList from './AllyTemplateList';

type Tab = 'inimigos' | 'bosses' | 'aliados';

const TAB_LABELS: Record<Tab, string> = {
  inimigos: 'Inimigos',
  bosses: 'Bosses',
  aliados: 'Aliados',
};

export default function Bestiario() {
  const [tab, setTab] = useState<Tab>('inimigos');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <SectionHeader
        title="Bestiário"
        subtitle="Gerencie os templates de inimigos, bosses e aliados do catálogo"
      />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg p-1 mb-6 w-fit" style={{ background: '#27272a' }}>
        {(['inimigos', 'bosses', 'aliados'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded text-sm font-semibold transition-colors"
            style={
              tab === t
                ? { background: '#3f3f46', color: '#fafafa' }
                : { color: '#71717a' }
            }
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'inimigos' && <EnemyTemplateList />}
      {tab === 'bosses'   && <BossTemplateList />}
      {tab === 'aliados'  && <AllyTemplateList />}
    </div>
  );
}
