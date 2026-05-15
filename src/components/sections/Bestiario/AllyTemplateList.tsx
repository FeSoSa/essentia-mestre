'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { proxyUrl } from '@/lib/gdrive';
import type { AllyTemplate } from '@/store/types';
import Button from '@/components/ui/Button';
import AllyTemplateModal from './AllyTemplateModal';

export default function AllyTemplateList() {
  const [templates, setTemplates] = useState<AllyTemplate[]>([]);
  const [editing,   setEditing]   = useState<AllyTemplate | undefined>();
  const [showNew,   setShowNew]   = useState(false);

  useEffect(() => {
    api.get<AllyTemplate[]>('/allies').then((r) => setTemplates(r.data)).catch(() => {});
  }, []);

  function handleSaved(t: AllyTemplate) {
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? t : x) : [...prev, t];
    });
  }

  async function remove(t: AllyTemplate) {
    if (!confirm(`Deletar "${t.name}"?`)) return;
    await api.delete(`/allies/${t.id}`).catch(() => {});
    setTemplates((prev) => prev.filter((x) => x.id !== t.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
          <Plus size={14} /> Novo aliado
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-12">Nenhum aliado no catálogo.</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border p-3 flex flex-col gap-2"
              style={{ background: '#151e1a', borderColor: '#2a4a3a', color: '#c8e8d8' }}>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: '#1a2e24' }}>
                  {t.portraitUrl ? (
                    <img src={proxyUrl(t.portraitUrl)} alt={t.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <UserRound size={16} style={{ color: '#5a8a70' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.name}</p>
                  <p className="text-xs" style={{ color: '#5a8a70' }}>
                    {t.type || 'Aliado'} · HP {t.hpMax}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(t)}
                    className="w-6 h-6 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => remove(t)}
                    className="w-6 h-6 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center text-xs">
                {[['FOR', t.attributes?.strength ?? '—'], ['AGI', t.attributes?.agility ?? '—'], ['DEF', t.attributes?.defense ?? '—']].map(([l, v]) => (
                  <div key={l} className="rounded py-1" style={{ background: '#1a2e24' }}>
                    <p style={{ color: '#5a8a70' }}>{l}</p>
                    <p className="font-bold">{v}</p>
                  </div>
                ))}
              </div>

              {t.attacks.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {t.attacks.map((a, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate" style={{ color: '#8abaa0' }}>{a.name}</span>
                      <span className="font-mono ml-2 shrink-0" style={{ color: '#5a8a70' }}>{a.damage}</span>
                    </div>
                  ))}
                </div>
              )}

              {t.desc && (
                <p className="text-xs line-clamp-2" style={{ color: '#5a8a70' }}>{t.desc}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && <AllyTemplateModal onClose={() => setShowNew(false)} onSaved={handleSaved} />}
      {editing  && <AllyTemplateModal template={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />}
    </div>
  );
}
