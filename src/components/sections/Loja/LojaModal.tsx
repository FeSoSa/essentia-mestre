"use client";

import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { RARITY_COLORS, RARITY_LABELS, RARITY_ORDER, type Rarity } from "@/lib/rarity";
import type { ItemCatalog, Shop, ShopItem } from "@/store/types";
import { Coins, Package, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ItemIcon } from "@/components/sections/Itens/ItemCard";

const TYPE_OPTS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "weapon", label: "Armas" },
  { value: "armor", label: "Armaduras" },
  { value: "accessory", label: "Acessórios" },
  { value: "normal", label: "Normais" },
  { value: "chave", label: "Chave" },
];

interface Props {
  shop?: Shop;
  onSaved: (shop: Shop) => void;
  onClose: () => void;
}

export default function LojaModal({ shop, onSaved, onClose }: Props) {
  const editing = !!shop;
  const [name, setName] = useState(shop?.name ?? "");
  const [selectedItems, setSelectedItems] = useState<ShopItem[]>(shop?.items ?? []);
  const [catalog, setCatalog] = useState<ItemCatalog[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<ItemCatalog[]>("/items").then((r) => setCatalog(r.data)).catch(() => {});
  }, []);

  const filteredCatalog = catalog.filter((item) => {
    if (search.trim() && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && item.type !== typeFilter) return false;
    if (rarityFilter && item.rarity !== rarityFilter) return false;
    return true;
  });

  function toggleItem(item: ItemCatalog) {
    const exists = selectedItems.find((s) => s.itemId === item.id);
    if (exists) {
      setSelectedItems((prev) => prev.filter((s) => s.itemId !== item.id));
    } else {
      setSelectedItems((prev) => [...prev, { itemId: item.id }]);
    }
  }

  function setLimit(itemId: string, value: string) {
    const num = value === "" ? undefined : Number(value);
    setSelectedItems((prev) =>
      prev.map((s) => (s.itemId === itemId ? { ...s, stockLimit: num } : s))
    );
  }

  function catalogItem(itemId: string) {
    return catalog.find((c) => c.id === itemId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const body = { name: name.trim(), items: selectedItems, active: shop?.active ?? false };
    try {
      const res = editing
        ? await api.put<Shop>(`/shops/${shop!.id}`, body)
        : await api.post<Shop>("/shops", body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const inp =
    "w-full bg-e-card border border-e-border rounded-lg px-3 py-2 text-sm text-e-text placeholder:text-e-faint focus:outline-none focus:border-e-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[560px] max-h-[90vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">{editing ? "Editar loja" : "Nova loja"}</h2>
            <button type="button" onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">
              ✕
            </button>
          </div>

          {/* Nome */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-e-sub mb-1.5 block">
              Nome da loja
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inp}
              placeholder="Ex: Ferraria do Bjorn"
              required
            />
          </div>

          {/* Itens selecionados */}
          {selectedItems.length > 0 && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-e-sub mb-1.5 block">
                Itens na loja ({selectedItems.length})
              </label>
              <div className="flex flex-col gap-1.5">
                {selectedItems.map((si) => {
                  const cat = catalogItem(si.itemId);
                  if (!cat) return null;
                  return (
                    <div
                      key={si.itemId}
                      className="flex items-center gap-2 bg-e-card rounded-lg px-3 py-2"
                    >
                      {cat.icon && (
                        <span className="text-e-sub shrink-0">
                          <ItemIcon name={cat.icon} size={14} />
                        </span>
                      )}
                      <span className="flex-1 text-sm truncate">{cat.name}</span>
                      {cat.goldValue != null && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-400 shrink-0">
                          <Coins size={11} />
                          {cat.goldValue} Tyd
                        </span>
                      )}
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={si.stockLimit ?? ""}
                          onChange={(e) => setLimit(si.itemId, e.target.value)}
                          placeholder="∞"
                          className="w-16 bg-e-surface border border-e-border rounded px-2 py-0.5 text-xs text-center text-e-text placeholder:text-e-faint focus:outline-none"
                          title="Estoque máximo (vazio = ilimitado)"
                        />
                        <button
                          type="button"
                          onClick={() => toggleItem(cat)}
                          className="w-5 h-5 flex items-center justify-center text-e-faint hover:text-e-danger"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Catálogo */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-e-sub mb-1.5 block">
              Adicionar itens do catálogo
            </label>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-e-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-e-card border border-e-border rounded-lg pl-8 pr-3 py-2 text-sm text-e-text placeholder:text-e-faint focus:outline-none focus:border-e-accent"
                placeholder="Buscar item..."
              />
            </div>

            {/* Filtro por tipo */}
            <div className="flex gap-1.5 flex-wrap mb-2">
              {TYPE_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTypeFilter(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                    typeFilter === opt.value
                      ? "bg-e-accent/20 border-e-accent/50 text-e-accent"
                      : "bg-e-card border-e-border text-e-faint hover:text-e-text hover:border-e-border2"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Filtro por raridade */}
            <div className="flex gap-1.5 flex-wrap mb-2">
              <button
                type="button"
                onClick={() => setRarityFilter("")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                  rarityFilter === ""
                    ? "bg-e-card border-e-border2 text-e-sub"
                    : "bg-transparent border-e-border text-e-faint hover:text-e-text"
                }`}
              >
                Qualquer
              </button>
              {RARITY_ORDER.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarityFilter(rarityFilter === r ? "" : r)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all"
                  style={{
                    borderColor: rarityFilter === r ? RARITY_COLORS[r] : RARITY_COLORS[r] + "44",
                    color: RARITY_COLORS[r],
                    background: rarityFilter === r ? RARITY_COLORS[r] + "20" : "transparent",
                  }}
                >
                  {RARITY_LABELS[r]}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
              {filteredCatalog.map((item) => {
                const isSelected = !!selectedItems.find((s) => s.itemId === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-e-accent/15 border border-e-accent/30"
                        : "bg-e-card hover:bg-e-card/70 border border-transparent"
                    }`}
                  >
                    {item.icon ? (
                      <span className="text-e-sub shrink-0">
                        <ItemIcon name={item.icon} size={14} />
                      </span>
                    ) : (
                      <Package size={14} className="text-e-faint shrink-0" />
                    )}
                    <span className="flex-1 text-sm truncate text-e-text">{item.name}</span>
                    {item.goldValue != null && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-400 shrink-0">
                        <Coins size={11} />
                        {item.goldValue}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] font-bold text-e-accent shrink-0">✓</span>
                    )}
                  </button>
                );
              })}
              {filteredCatalog.length === 0 && (
                <p className="text-xs text-e-faint text-center py-4">Nenhum item encontrado</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1 border-t border-e-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-e-sub hover:text-e-text transition-colors"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Salvando…" : editing ? "Salvar" : "Criar loja"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
