'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import Button from '@/components/ui/Button';
import type { Essencia, Player } from '@/store/types';

const ATTR_PT: Record<string, string> = {
  strength: 'For', agility: 'Agi', intelligence: 'Int',
  resistance: 'Res', flow: 'Flow', wisdom: 'Sab',
  presence: 'Pre', defense: 'Def',
};

const TYPE_CLS: Record<string, string> = {
  Grande:  'bg-e-gold/10 text-e-gold border-e-gold/20',
  Mitica:  'bg-purple-500/10 text-purple-300 border-purple-500/20',
  Derivada: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
};

export default function EssenciaModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const { setPlayer } = useStore();
  const [catalog, setCatalog] = useState<Essencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    api.get<Essencia[]>('/master/essencias')
      .then((r) => setCatalog(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const obtained = new Set((player.essenciasObtidas ?? []).map((e) => e.essenciaId));

  const filtered = catalog.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.type.toLowerCase().includes(search.toLowerCase())
  );

  async function grant(essenciaId: string) {
    setProcessing(essenciaId);
    try {
      const res = await api.post<Player>(`/master/players/${player.id}/essencias`, { essenciaId });
      setPlayer(res.data);
    } catch {}
    finally { setProcessing(null); }
  }

  async function remove(essenciaId: string) {
    setProcessing(essenciaId);
    try {
      const res = await api.delete<Player>(`/master/players/${player.id}/essencias/${essenciaId}`);
      setPlayer(res.data);
    } catch {}
    finally { setProcessing(null); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <div>
            <h3 className="font-semibold text-e-text">{player.char.name} — Essências</h3>
            <p className="text-xs text-e-sub mt-0.5">{obtained.size} concedida{obtained.size !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-e-faint pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar essência…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-2">
          {loading && <p className="text-sm text-e-faint text-center py-8 animate-pulse">Carregando…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-e-faint text-center py-8">
              {catalog.length === 0 ? 'Nenhuma essência cadastrada no banco.' : 'Sem resultados.'}
            </p>
          )}
          {filtered.map((essencia) => {
            const has = obtained.has(essencia.id);
            const busy = processing === essencia.id;
            const bonusEntries = Object.entries(essencia.attributeBonus).filter(([, v]) => v !== 0);
            return (
              <div key={essencia.id}
                className={`flex items-start gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  has ? 'bg-e-accent/5 border-e-accent/20' : 'bg-e-card border-e-border'
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-e-text">{essencia.name}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded ${TYPE_CLS[essencia.type] ?? 'bg-e-card text-e-sub border-e-border'}`}>
                      {essencia.type}
                    </span>
                  </div>
                  {essencia.desc && <p className="text-xs text-e-sub mt-0.5 line-clamp-2">{essencia.desc}</p>}
                  {bonusEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {bonusEntries.map(([attr, val]) => (
                        <span key={attr} className="text-[10px] bg-e-surface border border-e-border rounded px-1.5 py-0.5 text-e-sub">
                          {ATTR_PT[attr] ?? attr} +{val}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 mt-0.5">
                  {has ? (
                    <button onClick={() => remove(essencia.id)} disabled={busy}
                      className="p-1.5 rounded-lg hover:bg-e-danger/20 text-e-danger disabled:opacity-40 cursor-pointer transition-colors" title="Remover">
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <button onClick={() => grant(essencia.id)} disabled={busy}
                      className="p-1.5 rounded-lg hover:bg-e-accent/20 text-e-accent disabled:opacity-40 cursor-pointer transition-colors" title="Conceder">
                      <Plus size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-e-border shrink-0">
          <Button variant="ghost" size="md" className="w-full" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
