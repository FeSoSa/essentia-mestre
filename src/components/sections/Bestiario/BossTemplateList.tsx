'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { BossTemplate } from '@/store/types';
import BossTemplateModal from './BossTemplateModal';
import { normalizeGdriveUrl, proxyUrl } from '@/lib/gdrive';
import { TracosDanoChips } from "@/components/shared/TracosDanoEditor";

export default function BossTemplateList({ search = "", novo = 0 }: { search?: string; novo?: number }) {
  const [templates, setTemplates] = useState<BossTemplate[]>([]);
  const [editing,   setEditing]   = useState<BossTemplate | undefined>();
  const [showNew,   setShowNew]   = useState(false);

  useEffect(() => {
    api.get<BossTemplate[]>('/bosses').then((r) => setTemplates(r.data)).catch(() => {});
  }, []);

  // O botão "Novo" fica no cabeçalho da seção: cada clique muda o contador e abre o modal
  const [novoVisto, setNovoVisto] = useState(novo);
  if (novo !== novoVisto) {
    setNovoVisto(novo);
    if (novo) setShowNew(true);
  }

  const visiveis = templates.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()));

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
      {visiveis.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-12">{search ? "Nada encontrado com essa busca." : "Nenhum boss no catálogo."}</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {visiveis.map((t) => (
            <div key={t.id} onClick={() => setEditing(t)}
              className="group rounded-2xl border-2 p-3.5 flex flex-col gap-2.5 cursor-pointer hover:brightness-125 transition"
              style={{ background: '#1a1810', borderColor: '#6a5a20', color: '#f0e8d0' }}
            >
              <div className="flex items-start gap-2">
                {t.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proxyUrl(normalizeGdriveUrl(t.imageUrl))} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                ) : (
                  <span className="text-2xl w-9 h-9 flex items-center justify-center rounded-lg shrink-0" style={{ background: '#2a2410' }}>
                    {t.icon}
                  </span>
                )}
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
                <div className="flex gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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

              <TracosDanoChips value={t.tracosDano} />

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
