'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useStore, usePlayers } from '@/store';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import { getStatusIcon } from '@/lib/statusIcons';
import type { Player } from '@/store/types';
import AddEffectModal from './AddEffectModal';

export default function StatusEffects() {
  const players = usePlayers();
  const { setPlayer } = useStore();
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [removing, setRemoving]   = useState<string | null>(null);

  async function handleRemove(playerId: string, effectId: string) {
    setRemoving(effectId);
    try {
      // DELETE /api/master/status-effect/{effectId} com body { playerId }
      const res = await api.delete<Player>(`/master/status-effect/${effectId}`, {
        data: { playerId },
      });
      setPlayer(res.data);
    } catch {}
    finally { setRemoving(null); }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <SectionHeader title="Status Effects" subtitle="Efeitos ativos em cada jogador" />

      {players.length === 0 ? (
        <div className="flex items-center justify-center py-32 text-e-faint text-sm">
          Nenhum jogador na mesa.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {players.map((player) => (
            <div key={player.id} className="bg-e-surface border border-e-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-e-text">{player.char.name}</p>
                  <p className="text-xs text-e-sub mt-0.5">{player.char.skillClass}</p>
                </div>
                <Button variant="subtle" size="sm" onClick={() => setAddingFor(player.id)}>
                  + Adicionar
                </Button>
              </div>

              {(player.statusEffects ?? []).length === 0 ? (
                <p className="text-sm text-e-faint">Nenhum efeito ativo.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {(player.statusEffects ?? []).map((effect) => (
                    <div key={effect.id}
                      className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 bg-e-card border border-e-border rounded-xl px-4 py-3">
                      {(() => { const I = getStatusIcon(effect.icon); return I ? <I size={15} className="text-e-sub shrink-0" /> : effect.icon ? <span className="text-base leading-none">{effect.icon}</span> : null; })()}
                      <span className="text-sm font-medium text-e-text">{effect.name}</span>
                      <span className="text-sm font-mono text-e-sub">
                        {effect.durationTurns === -1 ? '∞' : `${effect.durationTurns}t`}
                      </span>
                      {effect.effects.length > 0 && (
                        <span className="text-[10px] bg-e-accent/10 border border-e-accent/15 text-e-accent px-2 py-0.5 rounded-lg">
                          {effect.effects.length}×
                        </span>
                      )}
                      <Button
                        variant="danger" size="sm"
                        disabled={removing === effect.id}
                        onClick={() => handleRemove(player.id, effect.id)}
                      >
                        {removing === effect.id ? '…' : 'Remover'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {addingFor && <AddEffectModal playerId={addingFor} onClose={() => setAddingFor(null)} />}
    </div>
  );
}
