'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, Copy } from 'lucide-react';
import { api } from '@/lib/api';
import type { EnemyTemplate, AllyTemplate } from '@/store/types';
import Button from '@/components/ui/Button';
import EnemyTemplateModal from './EnemyTemplateModal';
import { ItemIcon } from '@/components/sections/Itens/ItemCard';
import { enemyToAllyTemplate } from '@/lib/convertBeast';
import { normalizeGdriveUrl, proxyUrl } from '@/lib/gdrive';

interface Props {
  onCopied?: () => void;
}

export default function EnemyTemplateList({ onCopied }: Props) {
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

  async function copyToAlly(t: EnemyTemplate) {
    if (!confirm(`Copiar "${t.name}" para o catálogo de aliados? (drops e XP não são copiados)`)) return;
    await api.post<AllyTemplate>('/allies', enemyToAllyTemplate(t)).catch(() => null);
    onCopied?.();
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
                {t.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proxyUrl(normalizeGdriveUrl(t.imageUrl))} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                ) : (
                  <span className="text-xl w-8 h-8 flex items-center justify-center rounded bg-e-card shrink-0">{t.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.name}</p>
                  <p className="text-xs text-e-sub">{t.type} · HP {t.hpMax} · ⭐ {t.xp} XP</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(t)} className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-text hover:bg-e-card">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => copyToAlly(t)} title="Copiar para aliados" className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-accent hover:bg-e-card">
                    <Copy size={12} />
                  </button>
                  <button onClick={() => remove(t)} className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-danger hover:bg-e-card">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center text-xs">
                {([['FOR', t.attributes.strength], ['AGI', t.attributes.agility], ['DEF', t.attributes.defense]] as [string, number][]).map(([l, v]) => {
                  const mod = Math.floor((v - 10) / 2);
                  return (
                    <div key={l} className="rounded py-1 bg-e-card">
                      <p className="text-e-faint">{l}</p>
                      <p className="font-bold">{v}</p>
                      <p className="text-[10px]" style={{ color: mod >= 0 ? '#3dba72' : '#e05050' }}>
                        {mod >= 0 ? `+${mod}` : mod}
                      </p>
                    </div>
                  );
                })}
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
                  {t.drops.filter((d) => !d.goldDrop).map((d, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-e-card text-e-sub flex items-center gap-1">
                      <ItemIcon name={d.icon || 'Package'} size={11} /> {d.name}
                    </span>
                  ))}
                  {t.drops.some((d) => d.goldDrop) && (
                    <span className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                      style={{ background: '#2a2010', color: '#c8a050' }}>
                      🪙 {t.drops.find((d) => d.goldDrop)?.goldDrop?.tier}
                    </span>
                  )}
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
