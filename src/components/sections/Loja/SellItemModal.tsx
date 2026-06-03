"use client";

import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useActivePlayers } from "@/store";
import type { ItemCatalog, Shop } from "@/store/types";
import { ChevronDown, Coins, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { ItemIcon } from "@/components/sections/Itens/ItemCard";

interface Props {
  shop: Shop;
  item: ItemCatalog;
  stockLimit?: number;
  onClose: () => void;
}

export default function SellItemModal({ shop, item, stockLimit, onClose }: Props) {
  const players = useActivePlayers();
  const [playerId, setPlayerId] = useState("");
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlayer = players.find((p) => p.id === playerId);
  const cost = (item.goldValue ?? 0) * qty;
  const canAfford = selectedPlayer ? selectedPlayer.gold >= cost : true;
  const maxQty = stockLimit ?? 99;

  async function sell() {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    try {
      await api.post(`/shops/${shop.id}/purchase`, { playerId, itemId: item.id, qty });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erro ao processar venda");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-80 rounded-xl border border-e-border bg-e-surface flex flex-col gap-4 p-5 text-e-text">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item.icon && (
              <span className="text-e-sub">
                <ItemIcon name={item.icon} size={16} />
              </span>
            )}
            <p className="font-semibold text-sm truncate max-w-[180px]">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-e-faint hover:text-e-text text-sm">✕</button>
        </div>

        {/* Preço por unidade */}
        {item.goldValue != null && (
          <div className="flex items-center gap-1.5 text-xs text-e-sub">
            <Coins size={12} className="text-amber-400" />
            <span>{item.goldValue} Tyd por unidade</span>
          </div>
        )}

        {/* Jogador */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-e-sub mb-1.5 block">
            Jogador
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="w-full flex items-center justify-between bg-e-card border border-e-border rounded-lg px-3 py-2 text-sm text-left"
            >
              <span className={selectedPlayer ? "text-e-text" : "text-e-faint"}>
                {selectedPlayer
                  ? `${selectedPlayer.char.name} (${selectedPlayer.gold} Tyd)`
                  : "Selecionar jogador…"}
              </span>
              <ChevronDown size={14} className="text-e-faint shrink-0" />
            </button>
            {open && (
              <div className="absolute z-10 w-full mt-1 bg-e-card border border-e-border rounded-lg shadow-lg overflow-hidden">
                {players.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPlayerId(p.id); setOpen(false); setError(null); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-e-surface transition-colors"
                  >
                    <span className="text-e-text">{p.char.name}</span>
                    <span className="flex items-center gap-1 text-amber-400 text-xs">
                      <Coins size={10} />
                      {p.gold} Tyd
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quantidade */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-e-sub mb-1.5 block">
            Quantidade {stockLimit != null && <span className="text-e-faint normal-case">(estoque: {stockLimit})</span>}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg bg-e-card border border-e-border flex items-center justify-center text-e-sub hover:text-e-text"
            >
              <Minus size={13} />
            </button>
            <span className="flex-1 text-center font-mono text-lg text-e-text">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              className="w-8 h-8 rounded-lg bg-e-card border border-e-border flex items-center justify-center text-e-sub hover:text-e-text"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Custo total */}
        {item.goldValue != null && (
          <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
            !canAfford && playerId ? "bg-red-900/20 border border-red-500/30" : "bg-e-card"
          }`}>
            <span className="text-e-sub">Total</span>
            <span className={`flex items-center gap-1 font-semibold ${!canAfford && playerId ? "text-red-400" : "text-amber-400"}`}>
              <Coins size={13} />
              {cost} Tyd
              {!canAfford && playerId && (
                <span className="text-xs font-normal text-red-400 ml-1">— saldo insuficiente</span>
              )}
            </span>
          </div>
        )}

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

        {/* Ações */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-sm text-e-sub hover:text-e-text border border-e-border rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <Button
            onClick={sell}
            disabled={!playerId || loading || (!canAfford && item.goldValue != null)}
            className="flex-1"
          >
            {loading ? "Vendendo…" : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

