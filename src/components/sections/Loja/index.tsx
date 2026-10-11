"use client";

import Button from "@/components/ui/Button";
import SectionHeader, { Page } from "@/components/ui/SectionHeader";
import { api } from "@/lib/api";
import { RARITY_COLORS, RARITY_LABELS, rarityColor, type Rarity } from "@/lib/rarity";
import type { ItemCatalog, Shop, ShopItem } from "@/store/types";
import { Coins, Package, Pencil, Plus, Power, ShoppingCart, Sword, Shield, Zap, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ItemIcon } from "@/components/sections/Itens/ItemCard";
import LojaModal from "./LojaModal";
import SellItemModal from "./SellItemModal";

const TYPE_LABELS: Record<string, string> = {
  weapon: "Arma",
  armor: "Armadura",
  accessory: "Acessório",
  normal: "Item",
  chave: "Chave",
};

const ATTR_ABBREV: Record<string, string> = {
  strength: "FOR", agility: "AGI", intelligence: "INT",
  resistance: "RES", flow: "FLX", wisdom: "SAB", presence: "PRE", defense: "DEF",
};

function weaponDamageFormula(cat: ItemCatalog): string {
  const parts: string[] = [];
  if (cat.damageBase) parts.push(String(cat.damageBase));
  if (cat.damageAttribute) {
    const attr = cat.damageAttribute.includes("/")
      ? cat.damageAttribute
      : (ATTR_ABBREV[cat.damageAttribute] ?? cat.damageAttribute.slice(0, 3).toUpperCase());
    const eq = cat.equilibrio != null ? `/${cat.equilibrio}` : "";
    parts.push(`d20×${attr}${eq}`);
  }
  return parts.join(" + ") || "-";
}

function itemSubtitle(cat: ItemCatalog): string {
  const parts: string[] = [];
  if (cat.weaponType) parts.push(cat.weaponType);
  if (cat.armorWeight) parts.push(cat.armorWeight);
  if (cat.equipSlot && !cat.weaponType && !cat.armorWeight) parts.push(cat.equipSlot);
  return parts.join(" · ") || (TYPE_LABELS[cat.type] ?? cat.type);
}

interface ShopItemCardProps {
  si: ShopItem;
  cat: ItemCatalog;
  onSell: () => void;
}

function ShopItemCard({ si, cat, onSell }: ShopItemCardProps) {
  const color = rarityColor(cat.rarity);
  const label = cat.rarity ? (RARITY_LABELS[cat.rarity as Rarity] ?? cat.rarity) : null;
  const subtitle = itemSubtitle(cat);
  const borderStyle = color ? { borderColor: color + "30" } : undefined;
  const accentStyle = color ? { color } : undefined;

  return (
    <div
      className="flex flex-col gap-3 bg-e-card rounded-xl border border-e-border p-4 relative overflow-hidden"
      style={borderStyle}
    >
      {/* Rarity glow accent */}
      {color && (
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-60"
          style={{ background: color }}
        />
      )}

      {/* Top: icon + name + rarity */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center bg-e-surface border border-e-border shrink-0"
          style={borderStyle}
        >
          {cat.icon ? (
            <span style={accentStyle ?? { color: "#a1a1aa" }}>
              <ItemIcon name={cat.icon} size={22} />
            </span>
          ) : (
            <Package size={20} className="text-e-faint" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-e-text leading-tight truncate">{cat.name}</p>
          <p className="text-[11px] text-e-sub mt-0.5">{subtitle}</p>
          {label && (
            <span
              className="inline-block text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded"
              style={{ color, background: color + "18" }}
            >
              {label}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {cat.desc && (
        <p className="text-[11px] text-e-sub leading-relaxed line-clamp-2">{cat.desc}</p>
      )}

      {/* Stats block */}
      {(cat.type === "weapon" && (cat.damageBase || cat.damageAttribute)) ||
       (cat.type === "armor" && cat.damageReduction != null) ||
       (cat.attributeBonus && Object.values(cat.attributeBonus).some((v) => v !== 0)) ||
       cat.properties ? (
        <div className="bg-e-bg rounded-lg px-2.5 py-2 flex flex-col gap-1.5">
          {cat.type === "weapon" && (cat.damageBase || cat.damageAttribute) && (
            <div className="flex items-center gap-1.5">
              <Sword size={10} className="text-e-faint shrink-0" />
              <span className="text-[10px] text-e-sub flex-1">Dano</span>
              <span className="text-[11px] font-semibold text-e-text">{weaponDamageFormula(cat)}</span>
              {cat.twoHanded && (
                <span className="text-[9px] text-e-faint ml-1">2 mãos</span>
              )}
            </div>
          )}
          {cat.type === "armor" && cat.damageReduction != null && (
            <div className="flex items-center gap-1.5">
              <Shield size={10} className="text-e-faint shrink-0" />
              <span className="text-[10px] text-e-sub flex-1">Redução</span>
              <span className="text-[11px] font-semibold text-e-text">{cat.damageReduction}</span>
            </div>
          )}
          {cat.attributeBonus &&
            Object.entries(cat.attributeBonus)
              .filter(([, v]) => v !== 0)
              .map(([attr, val]) => (
                <div key={attr} className="flex items-center gap-1.5">
                  <Zap size={10} className="text-teal-400 shrink-0" />
                  <span className="text-[10px] text-e-sub flex-1">
                    {ATTR_ABBREV[attr] ?? attr.toUpperCase().slice(0, 3)}
                  </span>
                  <span className="text-[11px] font-semibold text-teal-400">
                    {val > 0 ? `+${val}` : val}
                  </span>
                </div>
              ))}
          {cat.properties && (
            <p className="text-[9px] text-e-faint italic mt-0.5">{cat.properties}</p>
          )}
        </div>
      ) : null}

      {/* Footer: stock + price + sell */}
      <div className="flex items-center gap-2 mt-auto pt-1 border-t border-e-border/40">
        {si.stockLimit != null ? (
          <span className="text-[11px] text-e-faint">Estoque: {si.stockLimit}</span>
        ) : (
          <span className="text-[11px] text-e-faint opacity-0">·</span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {cat.goldValue != null ? (
            <span className="flex items-center gap-1 text-sm font-bold text-amber-400">
              <Coins size={13} />
              {cat.goldValue} Tyd
            </span>
          ) : (
            <span className="text-xs text-e-faint">sem preço</span>
          )}

          <button
            onClick={onSell}
            disabled={cat.goldValue == null}
            title={cat.goldValue == null ? "Item sem preço definido" : "Vender para jogador"}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-e-border text-e-sub hover:text-e-accent hover:border-e-accent/40 hover:bg-e-accent/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={11} />
            Vender
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Loja() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [catalog, setCatalog] = useState<Map<string, ItemCatalog>>(new Map());
  const [editModal, setEditModal] = useState<{ open: boolean; shop?: Shop }>({ open: false });
  const [sellModal, setSellModal] = useState<{
    shop: Shop;
    item: ItemCatalog;
    stockLimit?: number;
  } | null>(null);

  useEffect(() => {
    api.get<Shop[]>("/shops").then((r) => setShops(r.data)).catch(() => {});
    api.get<ItemCatalog[]>("/items").then((r) => {
      setCatalog(new Map(r.data.map((i) => [i.id, i])));
    }).catch(() => {});
  }, []);

  function handleSaved(shop: Shop) {
    setShops((prev) => {
      const idx = prev.findIndex((s) => s.id === shop.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = shop; return next; }
      return [...prev, shop];
    });
  }

  async function toggleActive(shop: Shop) {
    try {
      const res = await api.put<Shop>(`/shops/${shop.id}`, { ...shop, active: !shop.active });
      handleSaved(res.data);
    } catch {}
  }

  async function deleteShop(shop: Shop) {
    if (!confirm(`Deletar a loja "${shop.name}"?`)) return;
    try {
      await api.delete(`/shops/${shop.id}`);
      setShops((prev) => prev.filter((s) => s.id !== shop.id));
    } catch {}
  }

  return (
    <Page>
      <SectionHeader
        title="Lojas"
        count={shops.length}
        subtitle="Lojas ativas aparecem para os jogadores. Clique num item para vender a alguém."
        action={
          <Button variant="primary" onClick={() => setEditModal({ open: true })}>
            <Plus size={15} /> Nova loja
          </Button>
        }
      />

      {shops.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <Package size={40} className="text-e-faint opacity-40" />
          <div>
            <p className="text-sm text-e-sub">Nenhuma loja criada ainda.</p>
            <p className="text-xs text-e-faint mt-1">Monte uma loja com itens do catálogo e ative quando os jogadores chegarem nela.</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setEditModal({ open: true })}><Plus size={14} /> Criar loja</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="rounded-2xl border bg-e-surface overflow-hidden"
              style={{ borderColor: shop.active ? "#a3e63544" : "rgba(255,255,255,0.07)" }}
            >
              {/* Shop header */}
              <div className={`flex items-center gap-3 px-4 py-3 ${shop.active ? "border-b border-e-border" : ""}`}>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="font-semibold text-sm text-e-text truncate">{shop.name}</p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                      shop.active ? "bg-lime-400/15 text-lime-400" : "bg-zinc-700/40 text-e-faint"
                    }`}
                  >
                    {shop.active ? "Ativa" : "Inativa"}
                  </span>
                  <span className="text-[11px] text-e-faint shrink-0">
                    {shop.items.length} {shop.items.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleActive(shop)}
                    title={shop.active ? "Desativar" : "Ativar"}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      shop.active
                        ? "border-lime-400/30 text-lime-400 hover:bg-lime-400/10"
                        : "border-e-border text-e-faint hover:text-e-text hover:bg-e-card"
                    }`}
                  >
                    <Power size={11} />
                    {shop.active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => setEditModal({ open: true, shop })}
                    title="Editar"
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-e-border text-e-sub hover:text-e-text hover:bg-e-card transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => deleteShop(shop)}
                    title="Deletar"
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-e-border text-e-sub hover:text-e-danger hover:bg-e-card transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Item cards grid — only when active */}
              {shop.active && (
                shop.items.length === 0 ? (
                  <p className="text-xs text-e-faint text-center py-8">Sem itens nesta loja</p>
                ) : (
                  <div className="p-4 grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {shop.items.map((si) => {
                      const cat = catalog.get(si.itemId);
                      if (!cat) return null;
                      return (
                        <ShopItemCard
                          key={si.itemId}
                          si={si}
                          cat={cat}
                          onSell={() => setSellModal({ shop, item: cat, stockLimit: si.stockLimit })}
                        />
                      );
                    })}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {editModal.open && (
        <LojaModal
          shop={editModal.shop}
          onSaved={handleSaved}
          onClose={() => setEditModal({ open: false })}
        />
      )}

      {sellModal && (
        <SellItemModal
          shop={sellModal.shop}
          item={sellModal.item}
          stockLimit={sellModal.stockLimit}
          onClose={() => setSellModal(null)}
        />
      )}
    </Page>
  );
}
