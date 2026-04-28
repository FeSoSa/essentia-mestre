'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { EnemyTemplate } from '@/store/types';
import Button from '@/components/ui/Button';
import EnemyTemplateModal from './EnemyTemplateModal';

export default function EnemyTemplateList() {
  const [templates, setTemplates] = useState<EnemyTemplate[]>([]);
  const [editing,   setEditing]   = useState<EnemyTemplate | undefined>();
  const [showNew,   setShowNew]   = useState(false);

  useEffect(() => {
    api.get<EnemyTemplate[]>('/enemies').then((r) => setTemplates(r.data)).catch(() => {});
  }, []);

  function handleSaved(t: EnemyTemplate) {
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? t : x) : [...prev, t];
    });
  }

  async function remove(t: EnemyTemplate) {
    if (!confirm(`Deletar "${t.name}"?`)) return;
    await api.delete(`/enemies/${t.id}`).catch(() => {});
    setTemplates((prev) => prev.filter((x) => x.id !== t.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
          <Plus size={14} /> Novo inimigo
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-12">Nenhum inimigo no catálogo.</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-e-border bg-e-surface p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="text-xl w-8 h-8 flex items-center justify-center rounded bg-e-card shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.name}</p>
                  <p className="text-xs text-e-sub">{t.type} · HP {t.hpMax} · ⭐ {t.xp} XP</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(t)} className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-text hover:bg-e-card">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => remove(t)} className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-danger hover:bg-e-card">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center text-xs">
                {[['FOR', t.attributes.strength], ['AGI', t.attributes.agility], ['DEF', t.attributes.defense]].map(([l, v]) => (
                  <div key={l} className="rounded py-1 bg-e-card">
                    <p className="text-e-faint">{l}</p>
                    <p className="font-bold">{v}</p>
                  </div>
                ))}
              </div>

              {t.attacks.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {t.attacks.map((a, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate text-e-sub">{a.name}</span>
                      <span className="font-mono text-e-faint shrink-0 ml-2">{a.damage}</span>
                    </div>
                  ))}
                </div>
              )}

              {t.drops.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {t.drops.map((d, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-e-card text-e-sub">
                      {d.icon} {d.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <EnemyTemplateModal onClose={() => setShowNew(false)} onSaved={handleSaved} />
      )}
      {editing && (
        <EnemyTemplateModal template={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />
      )}
    </div>
  );
}
