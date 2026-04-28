'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { BossTemplate } from '@/store/types';
import Button from '@/components/ui/Button';
import BossTemplateModal from './BossTemplateModal';

export default function BossTemplateList() {
  const [templates, setTemplates] = useState<BossTemplate[]>([]);
  const [editing,   setEditing]   = useState<BossTemplate | undefined>();
  const [showNew,   setShowNew]   = useState(false);

  useEffect(() => {
    api.get<BossTemplate[]>('/bosses').then((r) => setTemplates(r.data)).catch(() => {});
  }, []);

  function handleSaved(t: BossTemplate) {
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? t : x) : [...prev, t];
    });
  }

  async function remove(t: BossTemplate) {
    if (!confirm(`Deletar "${t.name}"?`)) return;
    await api.delete(`/bosses/${t.id}`).catch(() => {});
    setTemplates((prev) => prev.filter((x) => x.id !== t.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
          <Plus size={14} /> Novo boss
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-12">Nenhum boss no catálogo.</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {templates.map((t) => (
            <div key={t.id}
              className="rounded-xl border-2 p-3 flex flex-col gap-2"
              style={{ background: '#1a1810', borderColor: '#6a5a20', color: '#f0e8d0' }}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl w-9 h-9 flex items-center justify-center rounded-lg shrink-0" style={{ background: '#2a2410' }}>
                  {t.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-sm truncate">{t.name}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
                      style={{ background: '#c8a05022', color: '#c8a050', border: '1px solid #6a5a20' }}>
                      Boss
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#7a7050' }}>
                    {t.phases.length} fases · ⭐ {t.xp} XP
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(t)}
                    className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                    style={{ color: '#7a7050' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f0e8d0'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#7a7050'; }}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => remove(t)}
                    className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                    style={{ color: '#7a7050' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#c04040'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#7a7050'; }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Phases summary */}
              <div className="flex flex-col gap-1">
                {t.phases.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs rounded px-2 py-1" style={{ background: '#2a2410' }}>
                    <span style={{ color: '#c8a050' }}>Fase {i + 1}{p.name ? ` — ${p.name}` : ''}</span>
                    <span style={{ color: '#7a7050' }}>HP {p.hpMax}</span>
                  </div>
                ))}
              </div>

              {/* Immunities + resistances */}
              {(t.immunities.length > 0 || t.resistances.length > 0) && (
                <div className="flex gap-1 flex-wrap">
                  {t.immunities.map((im, i) => (
                    <span key={`im${i}`} className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#2a2410', color: '#f0e8d0' }}>
                      {im.icon} {im.type}
                    </span>
                  ))}
                  {t.resistances.map((r, i) => (
                    <span key={`r${i}`} className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#2a2410', color: '#c8a050' }}>
                      {r.type} −{r.reduction}%
                    </span>
                  ))}
                </div>
              )}

              {/* Special reward */}
              {t.specialReward && (
                <p className="text-xs" style={{ color: '#c8a050' }}>
                  {t.specialReward.type === 'essencia' ? '✨' : t.specialReward.type === 'item' ? '🎁' : '⚡'}{' '}
                  {t.specialReward.name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <BossTemplateModal onClose={() => setShowNew(false)} onSaved={handleSaved} />
      )}
      {editing && (
        <BossTemplateModal template={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />
      )}
    </div>
  );
}
