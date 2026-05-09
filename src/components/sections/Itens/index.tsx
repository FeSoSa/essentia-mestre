'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { ItemCatalog } from '@/store/types';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import ItemCard from './ItemCard';
import ItemModal from './ItemModal';
import SendItemModal from './SendItemModal';

type Tab = 'armas' | 'armaduras' | 'itens';

const TAB_FILTER: Record<Tab, (i: ItemCatalog) => boolean> = {
  armas:     (i) => i.type === 'weapon',
  armaduras: (i) => i.type === 'armor' || i.type === 'accessory',
  itens:     (i) => i.type === 'normal' || i.type === 'chave',
};

const TAB_DEFAULT_TYPE: Record<Tab, string> = {
  armas:     'weapon',
  armaduras: 'armor',
  itens:     'normal',
};

const TAB_LABELS: Record<Tab, string> = {
  armas: 'Armas', armaduras: 'Armaduras', itens: 'Itens',
};

export default function Itens() {
  const [items,   setItems]   = useState<ItemCatalog[]>([]);
  const [tab,     setTab]     = useState<Tab>('armas');
  const [editing, setEditing] = useState<ItemCatalog | undefined>();
  const [sending, setSending] = useState<ItemCatalog | undefined>();
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.get<ItemCatalog[]>('/items').then((r) => setItems(r.data)).catch(() => {});
  }, []);

  function handleSaved(i: ItemCatalog) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === i.id);
      return idx >= 0 ? prev.map((x, j) => (j === idx ? i : x)) : [...prev, i];
    });
  }

  async function handleDelete(i: ItemCatalog) {
    if (!confirm(`Deletar "${i.name}"?`)) return;
    await api.delete(`/items/${i.id}`).catch(() => {});
    setItems((prev) => prev.filter((x) => x.id !== i.id));
  }

  const visible = items.filter(TAB_FILTER[tab]);

  const tabCls = (t: Tab) =>
    `px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
      tab === t ? 'bg-e-card text-e-text' : 'text-e-sub hover:text-e-text'
    }`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <SectionHeader
        title="Itens"
        subtitle="Catálogo de armas, armaduras e itens"
        action={
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus size={14} /> Novo item
          </Button>
        }
      />

      <div className="flex gap-1 rounded-lg p-1 mb-6 w-fit bg-e-surface">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tabCls(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-16">
          Nenhum item nesta categoria. Clique em "Novo item" para criar.
        </p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {visible.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onDelete={() => handleDelete(item)}
              onSend={() => setSending(item)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <ItemModal
          defaultType={TAB_DEFAULT_TYPE[tab]}
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <ItemModal item={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />
      )}
      {sending && (
        <SendItemModal item={sending} onClose={() => setSending(undefined)} />
      )}
    </div>
  );
}
