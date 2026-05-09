'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Sword, Shield, Circle } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore, usePlayers } from '@/store';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import type { Player, Equipment, Item } from '@/store/types';
import { rarityColor, RARITY_LABELS, type Rarity } from '@/lib/rarity';

/* ── helpers ─────────────────────────────────────────────────── */
function equipSlots(eq: Equipment) {
  return [
    { key: 'mainHand', label: 'Mão principal', item: eq.mainHand },
    { key: 'offHand',  label: 'Mão secundária', item: eq.offHand  },
    { key: 'armor',    label: 'Armadura',        item: eq.armor   },
    { key: 'amulet',   label: 'Amuleto',         item: eq.amulet  },
    { key: 'ring',     label: 'Anel',            item: eq.ring    },
    { key: 'utility',  label: 'Utilidade',       item: eq.utility },
  ] as const;
}

function slotIcon(key: string) {
  if (key === 'mainHand' || key === 'offHand') return <Sword size={14} className="text-e-faint shrink-0" />;
  if (key === 'armor') return <Shield size={14} className="text-e-faint shrink-0" />;
  return <Circle size={14} className="text-e-faint shrink-0" />;
}

function itemTypeBadge(type: string) {
  const map: Record<string, string> = {
    consumable: 'bg-e-success/10 text-e-success border-e-success/20',
    equipment:  'bg-e-flow/10 text-e-flow border-e-flow/20',
    currency:   'bg-e-gold/10 text-e-gold border-e-gold/20',
  };
  return map[type] ?? 'bg-e-card text-e-sub border-e-border';
}

/* ── component ───────────────────────────────────────────────── */
export default function Inventario() {
  const players = usePlayers();
  const { setPlayer } = useStore();
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleRequest(playerId: string, requestId: string, approve: boolean) {
    setProcessing(requestId);
    try {
      const endpoint = approve ? '/master/approve-item' : '/master/reject-item';
      const res = await api.post<Player>(endpoint, { playerId, requestId });
      setPlayer(res.data);
    } catch {}
    finally { setProcessing(null); }
  }

  const pendingTotal = players.reduce(
    (acc, p) => acc + (p.pendingRequests?.length ?? 0), 0
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <SectionHeader
        title="Inventário"
        subtitle="Equipamentos, itens e solicitações dos jogadores"
        action={
          pendingTotal > 0 ? (
            <span className="text-xs font-semibold text-e-gold bg-e-gold/10 border border-e-gold/20 px-3 py-1.5 rounded-lg">
              {pendingTotal} solicitação{pendingTotal !== 1 ? 'ões' : ''} pendente{pendingTotal !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {players.length === 0 ? (
        <div className="flex items-center justify-center py-32 text-e-faint text-sm">
          Nenhum jogador na mesa.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {players.map((player) => {
            const eq = player.equipment ?? {};
            const slots = equipSlots(eq);
            const equippedSlots = slots.filter((s) => s.item);
            const pending = player.pendingRequests ?? [];

            return (
              <div key={player.id} className="bg-e-surface border border-e-border rounded-xl overflow-hidden">
                {/* Header do jogador */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-e-border">
                  <div>
                    <p className="font-semibold text-e-text">{player.char.name}</p>
                    <p className="text-xs text-e-sub mt-0.5">{player.char.skillClass}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-e-faint">
                    <span>{(player.items ?? []).length} ite{(player.items ?? []).length !== 1 ? 'ns' : 'm'}</span>
                    {pending.length > 0 && (
                      <span className="text-e-gold font-semibold">
                        {pending.length} pendente{pending.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-e-border">

                  {/* Equipamentos */}
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-3">Equipamento</p>
                    {equippedSlots.length === 0 ? (
                      <p className="text-sm text-e-faint">Nenhum item equipado.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {equippedSlots.map(({ key, label, item }) => (
                          <div key={key} className="flex items-start gap-2.5 bg-e-card rounded-lg px-3 py-2.5">
                            {slotIcon(key)}
                            <div className="min-w-0">
                              <p className="text-xs text-e-faint leading-none mb-1">{label}</p>
                              <p className="text-sm font-medium truncate" style={{ color: rarityColor((item as any).rarity) ?? '#fafafa' }}>{item!.name}</p>
                              {'damageBase' in item! && (
                                <p className="text-xs text-e-sub mt-0.5">
                                  {(item as { damageBase: number; damageDice: { quantity: number; die: string } }).damageBase}+{(item as { damageDice: { quantity: number; die: string } }).damageDice.quantity}{(item as { damageDice: { quantity: number; die: string } }).damageDice.die}
                                </p>
                              )}
                              {'damageReduction' in item! && (
                                <p className="text-xs text-e-sub mt-0.5">
                                  -{(item as { damageReduction: number }).damageReduction} dano
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Itens */}
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-3">Itens</p>
                    {(player.items ?? []).length === 0 ? (
                      <p className="text-sm text-e-faint">Nenhum item.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {(player.items ?? []).map((item: Item) => (
                          <div key={item.id} className="flex items-center gap-2.5 bg-e-card rounded-lg px-3 py-2">
                            <span className="text-sm font-medium flex-1 truncate" style={{ color: rarityColor(item.rarity) ?? '#fafafa' }}>{item.name}</span>
                            <span className="text-xs font-mono text-e-sub shrink-0">×{item.qty}</span>
                            {item.rarity && (
                              <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: rarityColor(item.rarity) }}>
                                {RARITY_LABELS[item.rarity as Rarity] ?? item.rarity}
                              </span>
                            )}
                            <span className={`text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded shrink-0 ${itemTypeBadge(item.type)}`}>
                              {item.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Solicitações pendentes */}
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-3">Solicitações</p>
                    {pending.length === 0 ? (
                      <p className="text-sm text-e-faint">Nenhuma solicitação.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {pending.map((req) => {
                          const itemName = (player.items ?? []).find((i: Item) => i.id === req.itemId)?.name ?? req.itemId;
                          return (
                            <div key={req.id} className="bg-e-card border border-e-gold/20 rounded-lg px-3 py-2.5 flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-e-faint leading-none mb-1">{req.type}</p>
                                <p className="text-sm font-medium text-e-text truncate">{itemName}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => handleRequest(player.id, req.id, true)}
                                  disabled={processing === req.id}
                                  className="p-1 rounded-lg hover:bg-e-success/20 text-e-success disabled:opacity-40 cursor-pointer transition-colors"
                                  title="Aprovar"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleRequest(player.id, req.id, false)}
                                  disabled={processing === req.id}
                                  className="p-1 rounded-lg hover:bg-e-danger/20 text-e-danger disabled:opacity-40 cursor-pointer transition-colors"
                                  title="Rejeitar"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
