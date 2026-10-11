'use client';

import { useState } from 'react';
import { divisorArma } from '@/store/combateStore';
import { Check, X, Sword, Shield, Circle, Gem, CircleDollarSign, Backpack, Hand } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore, useActivePlayers } from '@/store';
import SectionHeader, { Page } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/sections/MesaNova/ui';
import type { Player, Equipment, Item } from '@/store/types';
import { rarityColor, RARITY_LABELS, type Rarity } from '@/lib/rarity';

/* ── helpers ─────────────────────────────────────────────────── */
function equipSlots(eq: Equipment) {
  return [
    { key: 'mainHand', label: 'Mão principal',  item: eq.mainHand },
    { key: 'offHand',  label: 'Mão secundária', item: eq.offHand  },
    { key: 'armor',    label: 'Armadura',       item: eq.armor    },
    { key: 'amulet',   label: 'Amuleto',        item: eq.amulet   },
    { key: 'ring',     label: 'Anel',           item: eq.ring     },
    { key: 'utility',  label: 'Utilidade',      item: eq.utility  },
  ] as const;
}

function slotIcon(key: string) {
  if (key === 'mainHand') return <Sword size={14} />;
  if (key === 'offHand') return <Hand size={14} />;
  if (key === 'armor') return <Shield size={14} />;
  if (key === 'amulet' || key === 'ring') return <Gem size={14} />;
  return <Circle size={14} />;
}

/** Nome em português do tipo do item (o back-end guarda em inglês). */
const TIPO_ITEM: Record<string, string> = {
  weapon: 'Arma', armor: 'Armadura', accessory: 'Acessório', consumable: 'Consumível',
  equipment: 'Equipamento', currency: 'Moeda', normal: 'Item',
};

const PEDIDO: Record<string, string> = { use_item: 'quer usar' };

/* ── component ───────────────────────────────────────────────── */
export default function Inventario() {
  const players = useActivePlayers();
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

  const pedidos = players.flatMap((p) => (p.pendingRequests ?? []).map((req) => ({ p, req })));

  return (
    <Page>
      <SectionHeader
        title="Inventário"
        subtitle="O que cada jogador ativo carrega e o que pediu para usar."
      />

      {pedidos.length > 0 && (
        <section className="mb-8 rounded-2xl border border-e-gold/25 bg-e-gold/[0.04] p-4 flex flex-col gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-e-gold">
            Esperando sua aprovação <span className="tabular-nums ml-1">{pedidos.length}</span>
          </h2>
          {pedidos.map(({ p, req }) => {
            const item = (p.items ?? []).find((i: Item) => i.id === req.itemId);
            const ocupado = processing === req.id;
            return (
              <div key={req.id} className="flex items-center gap-3 rounded-xl bg-e-surface border border-white/[0.07] px-3 py-2.5">
                <Avatar src={p.char.portraitUrl} nome={p.char.name} size={32} />
                <p className="flex-1 min-w-0 text-sm text-e-sub">
                  <span className="font-semibold text-e-text">{p.char.name}</span> {PEDIDO[req.type] ?? req.type}{' '}
                  <span className="font-semibold" style={{ color: rarityColor(item?.rarity) ?? '#fafafa' }}>{item?.name ?? 'item removido'}</span>
                  {item?.desc && <span className="block text-xs text-e-faint truncate mt-0.5">{item.desc}</span>}
                </p>
                <button type="button" onClick={() => handleRequest(p.id, req.id, false)} disabled={ocupado}
                  className="h-8 px-3 rounded-lg border border-white/10 text-xs font-semibold text-e-sub hover:text-e-danger hover:border-e-danger/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
                  <X size={13} /> Recusar
                </button>
                <button type="button" onClick={() => handleRequest(p.id, req.id, true)} disabled={ocupado}
                  className="h-8 px-3 rounded-lg bg-e-success/15 border border-e-success/30 text-xs font-semibold text-e-success hover:bg-e-success/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
                  <Check size={13} /> Aprovar
                </button>
              </div>
            );
          })}
        </section>
      )}

      {players.length === 0 ? (
        <div className="flex items-center justify-center py-28 text-e-faint text-sm text-center">
          Nenhum jogador ativo. Ative personagens na seção Jogadores.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {players.map((player) => {
            const slots = equipSlots(player.equipment ?? {});
            const itens = player.items ?? [];

            return (
              <div key={player.id} className="bg-e-surface border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                  <Avatar src={player.char.portraitUrl} nome={player.char.name} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-e-text truncate">{player.char.name}</p>
                    <p className="text-xs text-e-faint">{player.char.skillClass} · Nv {player.char.level}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-e-gold tabular-nums" title="Ouro">
                    <CircleDollarSign size={13} /> {player.gold ?? 0}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] flex-1">
                  {/* Equipamento: todos os espaços, para ver o que está livre */}
                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint mb-1">Equipado</p>
                    {slots.map(({ key, label, item }) => (
                      <div key={key} className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 ${item ? 'bg-white/[0.03]' : ''}`}>
                        <span className={`mt-0.5 ${item ? 'text-e-sub' : 'text-e-faint/50'}`}>{slotIcon(key)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-e-faint leading-none mb-1">{label}</p>
                          {item ? (
                            <>
                              <p className="text-sm font-medium leading-snug" style={{ color: rarityColor((item as Item).rarity) ?? '#fafafa' }}>{item.name}</p>
                              {'damageBase' in item && (
                                <p className="text-xs text-e-sub mt-0.5 font-mono">
                                  {(item as Item).damageBase}
                                  {(item as Item).damageAttribute ? ` + d20×${(item as Item).damageAttribute}/${divisorArma(item as never)}` : ''}
                                </p>
                              )}
                              {'damageReduction' in item && (
                                <p className="text-xs text-e-sub mt-0.5">-{(item as Item).damageReduction} de dano recebido</p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-e-faint/60 italic">vazio</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mochila */}
                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint mb-1 flex items-center gap-1.5">
                      <Backpack size={11} /> Mochila <span className="tabular-nums">{itens.length}</span>
                    </p>
                    {itens.length === 0 ? (
                      <p className="text-sm text-e-faint">Nada na mochila.</p>
                    ) : itens.map((item: Item) => (
                      <div key={item.id} className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2" title={item.desc}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug" style={{ color: rarityColor(item.rarity) ?? '#fafafa' }}>{item.name}</p>
                          <p className="text-[10px] text-e-faint mt-0.5">
                            {TIPO_ITEM[item.type] ?? item.type}
                            {item.rarity && <> · <span style={{ color: rarityColor(item.rarity) }}>{RARITY_LABELS[item.rarity as Rarity] ?? item.rarity}</span></>}
                          </p>
                        </div>
                        {item.qty > 1 && <span className="text-xs font-bold text-e-sub tabular-nums shrink-0">×{item.qty}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
