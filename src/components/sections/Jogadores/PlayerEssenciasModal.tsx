'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import Button from '@/components/ui/Button';
import type { Essencia, Player } from '@/store/types';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Grande:  { bg: '#d4a84e22', text: '#d4a84e' },
  Mitica:  { bg: '#a855f722', text: '#a855f7' },
  Derivada:{ bg: '#4ade8022', text: '#4ade80' },
};

interface Props {
  player: Player;
  essencias: Essencia[];
  onClose: () => void;
}

export default function PlayerEssenciasModal({ player, essencias, onClose }: Props) {
  const { setPlayer } = useStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');

  const obtidas = player.essenciasObtidas ?? [];
  const obtidaIds = new Set(obtidas.map((o) => o.essenciaId));
  const available = essencias.filter((e) => !obtidaIds.has(e.id));

  async function handleGrant() {
    if (!selectedId) return;
    setLoading('grant');
    try {
      const res = await api.post<Player>(`/master/players/${player.id}/essencias`, { essenciaId: selectedId });
      setPlayer(res.data);
      setSelectedId('');
    } catch {}
    finally { setLoading(null); }
  }

  async function handleRemove(essenciaId: string) {
    setLoading(essenciaId);
    try {
      const res = await api.delete<Player>(`/master/players/${player.id}/essencias/${essenciaId}`);
      setPlayer(res.data);
    } catch {}
    finally { setLoading(null); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <div>
            <h3 className="font-semibold text-e-text">Essências de {player.char.name}</h3>
            <p className="text-xs text-e-faint mt-0.5">{obtidas.length} essência{obtidas.length !== 1 ? 's' : ''} obtida{obtidas.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-4 flex-1">
          {/* Conceder essência */}
          {available.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-2">Conceder essência</p>
              <div className="flex gap-2">
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="flex-1 rounded-xl px-3 py-2 bg-e-bg border border-e-border text-sm text-e-text outline-none focus:border-e-border2 transition-colors cursor-pointer"
                >
                  <option value="">Selecionar essência…</option>
                  {available.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                  ))}
                </select>
                <Button
                  variant="primary" size="sm"
                  disabled={!selectedId || loading === 'grant'}
                  onClick={handleGrant}
                  className="gap-1.5 shrink-0"
                >
                  <Plus size={13} /> Dar
                </Button>
              </div>
            </div>
          )}

          {/* Lista das essências obtidas */}
          {obtidas.length === 0 ? (
            <p className="text-e-faint text-sm text-center py-6">
              Nenhuma essência obtida.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Essências obtidas</p>
              {obtidas.map((o) => {
                const ess = essencias.find((e) => e.id === o.essenciaId);
                if (!ess) return null;
                const color = TYPE_COLORS[ess.type] ?? { bg: '#71717a22', text: '#71717a' };
                const bonuses = Object.entries(ess.attributeBonus ?? {}).filter(([, v]) => v !== 0);
                return (
                  <div key={o.essenciaId}
                    className="flex items-start gap-3 rounded-xl border p-3 bg-e-bg"
                    style={{ borderColor: color.text + '44' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-e-text">{ess.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                          style={{ background: color.bg, color: color.text }}>
                          {ess.type}
                        </span>
                      </div>
                      {bonuses.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {bonuses.map(([attr, val]) => (
                            <span key={attr} className="px-1.5 py-0.5 rounded text-[10px] bg-e-card text-e-text">
                              {attr.slice(0, 3).toUpperCase()} {val > 0 ? '+' : ''}{val}
                            </span>
                          ))}
                        </div>
                      )}
                      {o.unlockedSkillIds.length > 0 && (
                        <p className="text-[10px] text-e-faint mt-1">
                          {o.unlockedSkillIds.length} habilidade{o.unlockedSkillIds.length !== 1 ? 's' : ''} desbloqueada{o.unlockedSkillIds.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(o.essenciaId)}
                      disabled={loading === o.essenciaId}
                      className="p-1.5 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-danger/10 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
