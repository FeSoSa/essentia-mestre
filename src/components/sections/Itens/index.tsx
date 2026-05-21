"use client";

import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import { api } from "@/lib/api";
import { RARITY_LABELS, RARITY_ORDER } from "@/lib/rarity";
import type { ItemCatalog } from "@/store/types";
import { ArrowDownUp, ChevronDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import ItemCard from "./ItemCard";
import ItemModal from "./ItemModal";
import SendItemModal from "./SendItemModal";

type Tab = "armas" | "armaduras" | "acessorios" | "itens";

const TAB_FILTER: Record<Tab, (i: ItemCatalog) => boolean> = {
  armas: (i) => i.type === "weapon",
  armaduras: (i) => i.type === "armor",
  acessorios: (i) => i.type === "accessory",
  itens: (i) => i.type === "normal" || i.type === "chave",
};

const TAB_DEFAULT_TYPE: Record<Tab, string> = {
  armas: "weapon",
  armaduras: "armor",
  acessorios: "accessory",
  itens: "normal",
};

const TAB_LABELS: Record<Tab, string> = {
  armas: "Armas",
  armaduras: "Armaduras",
  acessorios: "Acessórios",
  itens: "Itens",
};

const WEAPON_TYPE_OPTS = [
  { value: "espadas", label: "Espadas" },
  { value: "rapieiras", label: "Rapieiras" },
  { value: "alabardas", label: "Alabardas" },
  { value: "lancas", label: "Lanças" },
  { value: "machados-de-guerra", label: "Machados de guerra" },
  { value: "martelos", label: "Martelos" },
  { value: "armas-colossais", label: "Armas colossais" },
  { value: "adagas", label: "Adagas" },
  { value: "garras", label: "Garras" },
  { value: "a-distancia", label: "À distância" },
  { value: "luvas-manoplas", label: "Luvas & manoplas" },
  { value: "escudos", label: "Escudos" },
];

const ARMOR_WEIGHT_OPTS = [
  { value: "leve", label: "Leve" },
  { value: "média", label: "Média" },
  { value: "pesada", label: "Pesada" },
];

const EQUIP_SLOT_OPTS = [
  { value: "amulet", label: "Amuleto" },
  { value: "ring", label: "Anel" },
  { value: "utility", label: "Utilitário" },
];

const RARITY_OPTS = RARITY_ORDER.map((r) => ({
  value: r,
  label: RARITY_LABELS[r],
}));

function FilterDropdown({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const active = !!value;

  return (
    <div className="relative">
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition-colors whitespace-nowrap ${
          active
            ? "bg-e-card border-e-border2 text-e-text"
            : "bg-e-bg border-e-border text-e-faint hover:text-e-text hover:border-e-border2"
        }`}
      >
        {selected?.label ?? placeholder}
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-full bg-e-surface border border-e-border rounded-xl shadow-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-sm text-left transition-colors hover:bg-e-card ${!active ? "text-e-accent" : "text-e-faint"}`}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors ${value === opt.value ? "text-e-accent" : "text-e-text"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Itens() {
  const [items, setItems] = useState<ItemCatalog[]>([]);
  const [tab, setTab] = useState<Tab>("armas");
  const [editing, setEditing] = useState<ItemCatalog | undefined>();
  const [sending, setSending] = useState<ItemCatalog | undefined>();
  const [showNew, setShowNew] = useState(false);

  const [search, setSearch] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [filterWeaponType, setFilterWeaponType] = useState("");
  const [filterArmorWeight, setFilterArmorWeight] = useState("");
  const [filterEquipSlot, setFilterEquipSlot] = useState("");
  const [sortRarity, setSortRarity] = useState<"asc" | "desc" | "">("");

  useEffect(() => {
    api
      .get<ItemCatalog[]>("/items")
      .then((r) => setItems(r.data))
      .catch(() => {});
  }, []);

  function changeTab(t: Tab) {
    setTab(t);
    setFilterRarity("");
    setFilterWeaponType("");
    setFilterArmorWeight("");
    setFilterEquipSlot("");
  }

  function clearFilters() {
    setSearch("");
    setFilterRarity("");
    setFilterWeaponType("");
    setFilterArmorWeight("");
    setFilterEquipSlot("");
    setSortRarity("");
  }

  function handleSaved(i: ItemCatalog) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === i.id);
      return idx >= 0 ? prev.map((x, j) => (j === idx ? i : x)) : [...prev, i];
    });
  }

  async function handleDelete(i: ItemCatalog) {
    if (!confirm(`Deletar "${i.name}"?`)) return;
    await api.delete(`/items/${i.id}`).catch(() => {});
    setItems((prev) => prev.filter((x) => x.id !== i.id));
  }

  const tabItems = items.filter(TAB_FILTER[tab]);
  const filtered = tabItems
    .filter(
      (i) => !search || i.name.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((i) => !filterRarity || i.rarity === filterRarity)
    .filter((i) => !filterWeaponType || i.weaponType === filterWeaponType)
    .filter((i) => !filterArmorWeight || i.armorWeight === filterArmorWeight)
    .filter((i) => !filterEquipSlot || i.equipSlot === filterEquipSlot);
  const visible = sortRarity
    ? [...filtered].sort((a, b) => {
        const ai = RARITY_ORDER.indexOf((a.rarity ?? "branco") as never);
        const bi = RARITY_ORDER.indexOf((b.rarity ?? "branco") as never);
        return sortRarity === "asc" ? ai - bi : bi - ai;
      })
    : filtered;

  const hasFilters = !!(
    search ||
    filterRarity ||
    filterWeaponType ||
    filterArmorWeight ||
    filterEquipSlot ||
    sortRarity
  );
  const isFiltered = hasFilters && visible.length !== tabItems.length;

  const tabCls = (t: Tab) =>
    `px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
      tab === t ? "bg-e-card text-e-text" : "text-e-sub hover:text-e-text"
    }`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <SectionHeader
        title="Itens"
        subtitle="Catálogo de armas, armaduras e itens"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNew(true)}
            className="gap-1.5"
          >
            <Plus size={14} /> Novo item
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg p-1 bg-e-surface shrink-0">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button key={t} onClick={() => changeTab(t)} className={tabCls(t)}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-e-bg border border-e-border rounded-lg text-sm text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors w-40"
          />

          {(tab === "armas" || tab === "armaduras" || tab === "acessorios") && (
            <FilterDropdown
              value={filterRarity}
              onChange={setFilterRarity}
              placeholder="Raridade"
              options={RARITY_OPTS}
            />
          )}

          {tab === "armas" && (
            <FilterDropdown
              value={filterWeaponType}
              onChange={setFilterWeaponType}
              placeholder="Tipo de arma"
              options={WEAPON_TYPE_OPTS}
            />
          )}

          {tab === "armaduras" && (
            <FilterDropdown
              value={filterArmorWeight}
              onChange={setFilterArmorWeight}
              placeholder="Peso"
              options={ARMOR_WEIGHT_OPTS}
            />
          )}

          {tab === "acessorios" && (
            <FilterDropdown
              value={filterEquipSlot}
              onChange={setFilterEquipSlot}
              placeholder="Slot"
              options={EQUIP_SLOT_OPTS}
            />
          )}

          <button
            type="button"
            onClick={() =>
              setSortRarity((s) =>
                s === "asc" ? "desc" : s === "desc" ? "" : "asc",
              )
            }
            title={
              sortRarity === "asc"
                ? "Raridade: comum → mítico"
                : sortRarity === "desc"
                  ? "Raridade: mítico → comum"
                  : "Ordenar por raridade"
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition-colors whitespace-nowrap ${
              sortRarity
                ? "bg-e-card border-e-border2 text-e-text"
                : "bg-e-bg border-e-border text-e-faint hover:text-e-text hover:border-e-border2"
            }`}
          >
            <ArrowDownUp size={12} className="shrink-0" />
            {sortRarity === "asc"
              ? "Raridade ↑"
              : sortRarity === "desc"
                ? "Raridade ↓"
                : "Raridade"}
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-e-faint hover:text-e-sub transition-colors"
            >
              Limpar
            </button>
          )}

          {isFiltered && (
            <span className="text-xs text-e-faint">
              {visible.length} de {tabItems.length}
            </span>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-e-faint text-sm text-center py-16">
          {hasFilters
            ? "Nenhum item corresponde aos filtros."
            : 'Nenhum item nesta categoria. Clique em "Novo item" para criar.'}
        </p>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {visible.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onDelete={() => handleDelete(item)}
              onSend={() => setSending(item)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <ItemModal
          defaultType={TAB_DEFAULT_TYPE[tab]}
          onClose={() => setShowNew(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <ItemModal
          item={editing}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
      {sending && (
        <SendItemModal item={sending} onClose={() => setSending(undefined)} />
      )}
    </div>
  );
}
