"use client";

import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { CatalogEntry, EquipSlot } from "@/lib/equipmentCatalog";
import { useStore } from "@/store";
import type {
  Essencia,
  Item,
  ItemCatalog,
  Player,
  PlayerSkill,
  SkillTreeEntry,
} from "@/store/types";
import {
  Axe,
  ChevronDown,
  Circle,
  CircleDollarSign,
  Crosshair,
  Droplets,
  Flame,
  FlaskConical,
  Gem,
  Heart,
  Key,
  Link,
  Package,
  Shield,
  Sparkles,
  Star,
  Sword,
  Trash2,
  Wand,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

// ── Icon system (mirrors InventarioModal) ────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Package,
  FlaskConical,
  Flame,
  Link,
  CircleDollarSign,
  Sword,
  Crosshair,
  Axe,
  Wand,
  Shield,
  Circle,
  Gem,
  Wrench,
  Key,
};

function iconForType(type: string): string {
  switch (type) {
    case "consumable":
      return "FlaskConical";
    case "weapon":
      return "Sword";
    case "armor":
      return "Shield";
    case "accessory":
      return "Gem";
    case "currency":
      return "CircleDollarSign";
    case "chave":
      return "Key";
    default:
      return "Package";
  }
}

function iconForEntry(entry: CatalogEntry): string {
  if ("damageBase" in entry.item) {
    const wt = (entry.item as { weaponType?: string }).weaponType ?? "";
    if (wt === "bow") return "Crosshair";
    if (wt === "axe") return "Axe";
    if (wt === "staff") return "Wand";
    return "Sword";
  }
  if ("damageReduction" in entry.item) return "Shield";
  if (entry.slot === "amulet") return "Gem";
  if (entry.slot === "ring") return "Circle";
  return "Wrench";
}

function ItemIcon({
  name,
  size = 14,
  className,
}: {
  name?: string;
  size?: number;
  className?: string;
}) {
  if (name?.startsWith("img:")) {
    const px = size * 4;
    return (
      <img
        src={name.slice(4)}
        alt=""
        width={px}
        height={px}
        className={`object-cover rounded ${className ?? ""}`}
        style={{ width: size * 1.5, height: size * 1.5 }}
      />
    );
  }
  const Icon = (name && ICON_MAP[name]) || Package;
  return <Icon size={size} className={className} />;
}

// ── Shared config ────────────────────────────────────────────────────────────

const SLOT_CONFIG: { key: EquipSlot; label: string; icon: string }[] = [
  { key: "mainHand", label: "Mão Principal", icon: "Sword" },
  { key: "offHand", label: "Offhand", icon: "Shield" },
  { key: "armor", label: "Armadura", icon: "Shield" },
  { key: "amulet", label: "Amuleto", icon: "Gem" },
  { key: "ring", label: "Anel", icon: "Circle" },
  { key: "utility", label: "Utilitário", icon: "Wrench" },
];


const lbl =
  "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";


// ── CatalogSelect ─────────────────────────────────────────────────────────────

function CatalogSelect({
  entries,
  selectedId,
  onSelect,
}: {
  entries: CatalogEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = entries.find((e) => e.item.id === selectedId);
  const filtered = search.trim()
    ? entries.filter((e) => e.item.name.toLowerCase().includes(search.toLowerCase()))
    : entries;

  function stats(entry: CatalogEntry): string {
    if ("damageBase" in entry.item) {
      const w = entry.item as {
        damageBase: number;
        damageDice: { quantity: number; die: string };
      };
      return `${w.damageBase}+${w.damageDice.quantity}${w.damageDice.die}`;
    }
    if ("damageReduction" in entry.item)
      return `-${(entry.item as { damageReduction: number }).damageReduction} dano`;
    if (entry.item.attributeBonus) {
      return (
        Object.entries(entry.item.attributeBonus)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `${k.slice(0, 3).toUpperCase()}+${v}`)
          .join(" ") || ""
      );
    }
    return "";
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors cursor-pointer"
      >
        {selected ? (
          <>
            <ItemIcon
              name={iconForEntry(selected)}
              size={13}
              className="text-e-sub shrink-0"
            />
            <span className="flex-1 text-e-text truncate">
              {selected.item.name}
            </span>
            <span className="text-e-faint text-xs shrink-0">
              {stats(selected)}
            </span>
          </>
        ) : (
          <span className="text-e-faint flex-1">Selecionar…</span>
        )}
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl">
          <div className="p-2 border-b border-e-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar…"
              className="w-full text-xs rounded-lg px-2 py-1.5 bg-e-bg border border-e-border text-e-text outline-none placeholder:text-e-faint"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-e-faint">Nenhum resultado</p>
            ) : filtered.map((entry) => (
              <button
                key={entry.item.id}
                type="button"
                onClick={() => { onSelect(entry.item.id); setOpen(false); setSearch(''); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-e-card transition-colors text-left cursor-pointer"
              >
                <ItemIcon name={iconForEntry(entry)} size={13} className="text-e-sub shrink-0" />
                <span className="flex-1 text-e-text truncate">{entry.item.name}</span>
                <span className="text-e-faint text-xs shrink-0">{stats(entry)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── IconSelect ────────────────────────────────────────────────────────────────

function IconSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const SelectedIcon = ICON_MAP[value] ?? Package;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors cursor-pointer"
      >
        <SelectedIcon size={13} className="text-e-sub shrink-0" />
        <span className="flex-1 text-e-text">{value}</span>
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl max-h-44 overflow-y-auto">
          {Object.entries(ICON_MAP).map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                onChange(name);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left cursor-pointer ${
                name === value
                  ? "bg-e-accent/10 text-e-accent"
                  : "hover:bg-e-card text-e-text"
              }`}
            >
              <Icon size={13} className="shrink-0" />
              <span>{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillIcon({
  type,
  size = 13,
  className,
}: {
  type: string;
  size?: number;
  className?: string;
}) {
  const Icon = SKILL_ICON[type] ?? Sparkles;
  return <Icon size={size} className={className} />;
}

// ── SkillSelect ───────────────────────────────────────────────────────────────

function SkillSelect({
  available,
  locked,
  selectedId,
  onSelect,
}: {
  available: import("@/store/types").SkillTreeEntry[];
  locked: import("@/store/types").SkillTreeEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = available.find((e) => e.skill.id === selectedId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors cursor-pointer"
      >
        {selected ? (
          <>
            <SkillIcon
              type={selected.skill.type}
              size={13}
              className="text-e-sub shrink-0"
            />
            <span className="flex-1 text-e-text truncate">
              {selected.skill.name}
            </span>
          </>
        ) : (
          <span className="text-e-faint flex-1">Selecionar…</span>
        )}
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          {available.map((e) => (
            <button
              key={e.skill.id}
              type="button"
              onClick={() => {
                onSelect(e.skill.id === selectedId ? null : e.skill.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left cursor-pointer ${
                e.skill.id === selectedId
                  ? "bg-e-accent/10 text-e-accent"
                  : "hover:bg-e-card text-e-text"
              }`}
            >
              <SkillIcon type={e.skill.type} size={13} className="shrink-0" />
              <span className="flex-1 truncate">{e.skill.name}</span>
            </button>
          ))}
          {locked.length > 0 && available.length > 0 && (
            <div className="mx-3 my-1 h-px bg-e-border" />
          )}
          {locked.map((e) => (
            <div
              key={e.skill.id}
              title="Bloqueada — pré-requisitos não atendidos"
              className="flex items-center gap-2 px-3 py-2 text-sm text-e-faint/40 cursor-not-allowed select-none"
            >
              <SkillIcon type={e.skill.type} size={13} className="shrink-0" />
              <span className="flex-1 truncate">{e.skill.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── EssenciaSelect ────────────────────────────────────────────────────────────

const ESSENCIA_TYPE_PT: Record<string, string> = {
  fogo: "Fogo",
  água: "Água",
  terra: "Terra",
  ar: "Ar",
  tempestade: "Tempestade",
  tempo: "Tempo",
  caos: "Caos",
  ordem: "Ordem",
  vazio: "Vazio",
};

function EssenciaSelect({
  essencias,
  selectedId,
  onSelect,
}: {
  essencias: Essencia[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = essencias.find((e) => e.id === selectedId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors cursor-pointer"
      >
        {selected ? (
          <>
            <span className="flex-1 text-e-text truncate">{selected.name}</span>
            <span className="text-e-faint text-xs shrink-0">
              {ESSENCIA_TYPE_PT[selected.type] ?? selected.type}
            </span>
          </>
        ) : (
          <span className="text-e-faint flex-1">Selecionar essência…</span>
        )}
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          {essencias.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                onSelect(e.id === selectedId ? null : e.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left cursor-pointer ${
                e.id === selectedId
                  ? "bg-e-accent/10 text-e-accent"
                  : "hover:bg-e-card text-e-text"
              }`}
            >
              <span className="flex-1 truncate">{e.name}</span>
              <span className="text-e-faint text-xs shrink-0">
                {ESSENCIA_TYPE_PT[e.type] ?? e.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TypeSelect ────────────────────────────────────────────────────────────────

const ITEM_TYPES: { value: string; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "chave", label: "Chave" },
];

function TypeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = ITEM_TYPES.find((t) => t.value === value) ?? ITEM_TYPES[0];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors cursor-pointer"
      >
        <span className="flex-1 text-e-text">{current.label}</span>
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl overflow-hidden">
          {ITEM_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                onChange(t.value);
                setOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 text-sm transition-colors text-left cursor-pointer ${
                t.value === value
                  ? "bg-e-accent/10 text-e-accent"
                  : "hover:bg-e-card text-e-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── GoldControl ───────────────────────────────────────────────────────────────

function GoldControl({
  player,
  onUpdate,
}: {
  player: Player;
  onUpdate: (p: Player) => void;
}) {
  const gold = player.gold ?? 0;
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);

  async function commit() {
    const next = Math.max(0, Math.floor(Number(draft) || 0));
    setFocused(false);
    const delta = next - gold;
    if (delta === 0) return;
    setBusy(true);
    try {
      const res = await api.put<Player>(`/master/players/${player.id}/gold`, {
        delta,
      });
      if (res?.data) onUpdate(res.data);
    } catch {
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0 bg-e-gold/5 border border-e-gold/20 rounded-xl px-2.5 py-1.5">
      <CircleDollarSign size={12} className="text-e-gold" />
      <input
        type="number"
        min={0}
        value={focused ? draft : String(gold)}
        disabled={busy}
        onFocus={() => {
          setDraft(String(gold));
          setFocused(true);
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="!w-16 !py-0 !px-0 !bg-transparent !border-none !shadow-none !text-xs !font-bold !text-e-gold !tabular-nums text-center focus:outline-none"
      />
    </div>
  );
}

// ── EquipPanel ────────────────────────────────────────────────────────────────

function EquipPanel({
  item,
  onEquip,
  processing,
}: {
  item: Item;
  onEquip: (slot: EquipSlot) => void;
  processing: boolean;
}) {
  const isWeapon = item.type === "weapon";
  const naturalSlot =
    (item.equipSlot as EquipSlot | undefined) ??
    (isWeapon ? "mainHand" : item.type === "armor" ? "armor" : "utility");
  const [slot, setSlot] = useState<EquipSlot>(naturalSlot);

  if (isWeapon) {
    return (
      <div className="flex flex-col gap-1.5 mt-1.5">
        <div className="flex gap-1">
          {(["mainHand", "offHand"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={`flex-1 text-[10px] py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                slot === s
                  ? "bg-e-accent/20 border-e-accent text-e-accent"
                  : "bg-e-bg border-e-border text-e-faint hover:border-e-border2"
              }`}
            >
              {s === "mainHand" ? "Principal" : "Offhand"}
            </button>
          ))}
        </div>
        <button
          onClick={() => onEquip(slot)}
          disabled={processing}
          className="text-xs bg-e-accent/20 text-e-accent border border-e-accent/40 rounded-lg px-2 py-1.5 hover:bg-e-accent/30 disabled:opacity-40 cursor-pointer transition-colors"
        >
          {processing ? "Equipando…" : "Equipar"}
        </button>
      </div>
    );
  }

  const isAccessory = item.type === "accessory" || (item.equipSlot && ["amulet","ring","utility"].includes(item.equipSlot));

  if (isAccessory) {
    return (
      <div className="flex flex-col gap-1.5 mt-1.5">
        <div className="flex gap-1">
          {(["amulet", "ring", "utility"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={`flex-1 text-[10px] py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                slot === s
                  ? "bg-e-accent/20 border-e-accent text-e-accent"
                  : "bg-e-bg border-e-border text-e-faint hover:border-e-border2"
              }`}
            >
              {s === "amulet" ? "Amuleto" : s === "ring" ? "Anel" : "Utilit."}
            </button>
          ))}
        </div>
        <button
          onClick={() => onEquip(slot)}
          disabled={processing}
          className="w-full text-xs bg-e-accent/20 text-e-accent border border-e-accent/40 rounded-lg px-2 py-1.5 hover:bg-e-accent/30 disabled:opacity-40 cursor-pointer transition-colors"
        >
          {processing ? "Equipando…" : "Equipar"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onEquip(naturalSlot)}
      disabled={processing}
      className="w-full mt-1.5 text-xs bg-e-accent/20 text-e-accent border border-e-accent/40 rounded-lg px-2 py-1.5 hover:bg-e-accent/30 disabled:opacity-40 cursor-pointer transition-colors"
    >
      {processing
        ? "Equipando…"
        : `Equipar (${SLOT_CONFIG.find((s) => s.key === naturalSlot)?.label ?? naturalSlot})`}
    </button>
  );
}

// ── StatusBar ─────────────────────────────────────────────────────────────────

function StatusBar({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-4 flex-wrap bg-e-bg border border-e-border rounded-xl px-4 py-2.5 text-xs shrink-0">
      <span className="flex items-center gap-1 text-e-hp">
        <Heart size={11} />
        <span className="tabular-nums">
          {player.hp.current}/{player.hp.max}
        </span>
      </span>
      <span className="flex items-center gap-1 text-e-flow">
        <Droplets size={11} />
        <span className="tabular-nums">
          {player.flow.current}/{player.flow.max}
        </span>
      </span>
      <span className="flex items-center gap-1 text-e-gold">
        <CircleDollarSign size={11} />
        <span className="tabular-nums">{player.gold ?? 0}</span>
      </span>
      <span className="flex items-center gap-1 text-e-accent">
        <Sparkles size={11} />
        <span className="tabular-nums">{player.exp.available} XP</span>
      </span>
    </div>
  );
}

// ── InventarioPanel ───────────────────────────────────────────────────────────

function InventarioPanel({
  player,
  onUpdate,
}: {
  player: Player;
  onUpdate: (p: Player) => void;
}) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [givePanel, setGivePanel] = useState<
    "item" | "arma" | "armadura" | null
  >(null);
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([]);

  useEffect(() => {
    api.get<ItemCatalog[]>('/items').then((r) => {
      setCatalogEntries(
        (r.data.map((i) => ({ slot: (i.equipSlot ?? 'mainHand') as EquipSlot, item: i }))) as unknown as CatalogEntry[]
      );
    }).catch(() => {});
  }, []);

  const weaponEntries = catalogEntries.filter((e) => (e.item as unknown as ItemCatalog).type === 'weapon');
  const armorEntries  = catalogEntries.filter((e) => ['armor', 'accessory'].includes((e.item as unknown as ItemCatalog).type));
  const normalEntries = catalogEntries.filter((e) => {
    const t = (e.item as unknown as ItemCatalog).type;
    return t === 'normal' || t === 'chave';
  });
  const [itemId,  setItemId]  = useState<string | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [slotView, setSlotView] = useState<"menu" | "equip">("menu");

  const [weaponId, setWeaponId] = useState<string | null>(null);
  const [armorId, setArmorId] = useState<string | null>(null);
  const [givingEquip, setGivingEquip] = useState(false);
  const [clearError,  setClearError]  = useState<string | null>(null);

  const eq = player.equipment ?? {};
  const allItems = player.items ?? [];
  const gridItems = allItems.filter((i) => i.type !== "currency");
  const isFull = gridItems.length >= 16;

  const selectedWeapon = weaponEntries.find((e) => e.item.id === weaponId);
  const selectedArmor  = armorEntries.find((e) => e.item.id === armorId);
  const selectedNormal = normalEntries.find((e) => e.item.id === itemId);

  async function clearSlot(slot: EquipSlot) {
    setProcessing(`clear-${slot}`);
    setClearError(null);
    try {
      const res = await api.delete<Player>(`/master/players/${player.id}/equipment/${slot}`);
      onUpdate(res.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setClearError('Inventário cheio — libere um slot antes de desequipar');
    } finally {
      setProcessing(null);
    }
  }

  async function removeItem(itemId: string) {
    setProcessing(itemId);
    setActiveSlot(null);
    try {
      const res = await api.put<Player>(
        `/master/players/${player.id}/items/${itemId}`,
        { delta: -1 },
      );
      onUpdate(res.data);
    } catch {
    } finally {
      setProcessing(null);
    }
  }

  async function equipFromInventory(item: Item, slot: EquipSlot) {
    setProcessing(`equip-${item.id}`);
    try {
      const body =
        item.type === "weapon"
          ? {
              weapon: {
                id: item.id,
                name: item.name,
                weaponType: item.weaponType ?? "",
                damageBase: item.damageBase ?? 0,
                damageDice: item.damageDice ?? { quantity: 1, die: "d6" },
                damageAttribute: item.damageAttribute ?? "",
                attributeBonus: item.attributeBonus,
              },
            }
          : item.type === "armor"
            ? {
                armor: {
                  id: item.id,
                  name: item.name,
                  damageReduction: item.damageReduction ?? 0,
                  attributeBonus: item.attributeBonus,
                },
              }
            : {
                accessory: {
                  id: item.id,
                  name: item.name,
                  attributeBonus: item.attributeBonus,
                },
              };
      const res = await api.put<Player>(
        `/master/players/${player.id}/equipment/${slot}`,
        body,
      );
      onUpdate(res.data);
      setActiveSlot(null);
    } catch {
    } finally {
      setProcessing(null);
    }
  }

  async function giveItemFromCatalog() {
    if (!selectedNormal) return;
    setGivingEquip(true);
    const cat = selectedNormal.item as unknown as ItemCatalog;
    try {
      const res = await api.post<Player>(`/master/players/${player.id}/items`, {
        name: cat.name,
        desc: cat.desc ?? '',
        qty: itemQty,
        type: cat.type,
        icon: cat.icon,
      });
      onUpdate(res.data);
      setItemId(null);
      setItemQty(1);
    } catch {
    } finally {
      setGivingEquip(false);
    }
  }

  async function giveEquipmentItem(
    entry: CatalogEntry,
    type: "weapon" | "armor" | "accessory",
  ) {
    setGivingEquip(true);
    try {
      const base = {
        name: entry.item.name,
        desc: "",
        qty: 1,
        type,
        equipSlot: entry.slot,
      };
      const body =
        type === "weapon"
          ? {
              ...base,
              icon: iconForEntry(entry),
              weaponType: (entry.item as { weaponType?: string }).weaponType,
              damageBase: (entry.item as { damageBase?: number }).damageBase,
              damageDice: (entry.item as { damageDice?: unknown }).damageDice,
              damageAttribute: (entry.item as { damageAttribute?: string })
                .damageAttribute,
              attributeBonus: entry.item.attributeBonus,
            }
          : type === "armor"
            ? {
                ...base,
                icon: "Shield",
                damageReduction: (entry.item as { damageReduction?: number })
                  .damageReduction,
                attributeBonus: entry.item.attributeBonus,
              }
            : {
                ...base,
                icon: iconForEntry(entry),
                attributeBonus: entry.item.attributeBonus,
              };
      const res = await api.post<Player>(
        `/master/players/${player.id}/items`,
        body,
      );
      onUpdate(res.data);
      if (type === "weapon") setWeaponId(null);
      else setArmorId(null);
    } catch {
    } finally {
      setGivingEquip(false);
    }
  }

  function togglePanel(panel: "item" | "arma" | "armadura") {
    setGivePanel((v) => (v === panel ? null : panel));
  }

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* ── Left column ── */}
      <div className="w-[270px] shrink-0 border-r border-e-border overflow-y-auto p-4 flex flex-col gap-5">
        {/* Equipment */}
        <section>
          <p className={lbl}>Equipamento</p>
          <div className="flex flex-col gap-1.5">
            {SLOT_CONFIG.map(({ key, label: slotLabel, icon: slotIcon }) => {
              const slotItem = eq[key as keyof typeof eq] as
                | Record<string, unknown>
                | undefined;
              const busy = processing === `clear-${key}`;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-e-card border border-e-border rounded-lg px-2.5 py-2"
                >
                  <ItemIcon
                    name={
                      slotItem
                        ? iconForType(
                            key === "mainHand" || key === "offHand"
                              ? "weapon"
                              : key === "armor"
                                ? "armor"
                                : "accessory",
                          )
                        : slotIcon
                    }
                    size={12}
                    className="text-e-faint shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-e-faint">{slotLabel}</p>
                    {slotItem ? (
                      <p className="text-xs font-medium text-e-text truncate">
                        {slotItem.name as string}
                      </p>
                    ) : (
                      <p className="text-[11px] text-e-faint italic">— vazio</p>
                    )}
                  </div>
                  {slotItem && (
                    <button
                      onClick={() => clearSlot(key)}
                      disabled={busy}
                      title="Desequipar"
                      className="p-0.5 rounded hover:bg-e-danger/20 text-e-faint hover:text-e-danger disabled:opacity-40 cursor-pointer transition-colors shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {clearError && (
            <p className="text-[10px] text-e-danger mt-1.5">{clearError}</p>
          )}
        </section>

        {/* Dar ao jogador */}
        <section>
          <p className={lbl}>Dar ao jogador</p>
          <div className="flex flex-col gap-1.5">
            {/* Dar item */}
            <button
              onClick={() => togglePanel("item")}
              className={`flex items-center gap-2 w-full text-xs px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                givePanel === "item"
                  ? "bg-e-accent/10 border-e-accent text-e-accent"
                  : "bg-e-card border-e-border text-e-sub hover:text-e-text hover:border-e-border2"
              }`}
            >
              <Package size={13} /> Dar item
            </button>
            {givePanel === "item" && (
              <div className="bg-e-bg border border-e-border rounded-xl p-3 flex flex-col gap-2.5">
                <CatalogSelect
                  entries={normalEntries}
                  selectedId={itemId}
                  onSelect={setItemId}
                />
                {selectedNormal && (
                  <>
                    {(selectedNormal.item as unknown as ItemCatalog).desc && (
                      <p className="text-xs text-e-faint">
                        {(selectedNormal.item as unknown as ItemCatalog).desc}
                      </p>
                    )}
                    <div>
                      <label className={lbl}>Quantidade</label>
                      <input
                        type="number"
                        min={1}
                        value={itemQty}
                        onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                        className="w-20 text-center text-xs rounded-lg px-2 py-1.5 bg-e-surface border border-e-border text-e-text outline-none"
                      />
                    </div>
                  </>
                )}
                {isFull && (
                  <p className="text-[10px] text-e-danger">Inventário cheio (16/16)</p>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!itemId || givingEquip || isFull}
                  onClick={giveItemFromCatalog}
                >
                  {givingEquip ? "Adicionando…" : "Dar item"}
                </Button>
              </div>
            )}

            {/* Dar arma */}
            <button
              onClick={() => togglePanel("arma")}
              className={`flex items-center gap-2 w-full text-xs px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                givePanel === "arma"
                  ? "bg-e-accent/10 border-e-accent text-e-accent"
                  : "bg-e-card border-e-border text-e-sub hover:text-e-text hover:border-e-border2"
              }`}
            >
              <Sword size={13} /> Dar arma
            </button>
            {givePanel === "arma" && (
              <div className="bg-e-bg border border-e-border rounded-xl p-3 flex flex-col gap-2.5">
                <CatalogSelect
                  entries={weaponEntries}
                  selectedId={weaponId}
                  onSelect={setWeaponId}
                />
                {selectedWeapon &&
                  (() => {
                    const w = selectedWeapon.item as {
                      name: string;
                      weaponType: string;
                      damageBase: number;
                      damageDice: { quantity: number; die: string };
                      damageAttribute: string;
                      properties?: string;
                    };
                    return (
                      <div className="text-xs text-e-faint flex flex-col gap-1">
                        <p>
                          <span className="text-e-sub">{w.weaponType}</span> ·{" "}
                          {w.damageBase}+{w.damageDice.quantity}
                          {w.damageDice.die} · {w.damageAttribute}
                        </p>
                        {w.properties && <p>{w.properties}</p>}
                      </div>
                    );
                  })()}
                {isFull && (
                  <p className="text-[10px] text-e-danger">
                    Inventário cheio (16/16)
                  </p>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!weaponId || givingEquip || isFull}
                  onClick={() =>
                    selectedWeapon &&
                    giveEquipmentItem(selectedWeapon, "weapon")
                  }
                >
                  {givingEquip ? "Adicionando…" : "Adicionar ao inventário"}
                </Button>
              </div>
            )}

            {/* Dar armadura */}
            <button
              onClick={() => togglePanel("armadura")}
              className={`flex items-center gap-2 w-full text-xs px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                givePanel === "armadura"
                  ? "bg-e-accent/10 border-e-accent text-e-accent"
                  : "bg-e-card border-e-border text-e-sub hover:text-e-text hover:border-e-border2"
              }`}
            >
              <Shield size={13} /> Dar armadura
            </button>
            {givePanel === "armadura" && (
              <div className="bg-e-bg border border-e-border rounded-xl p-3 flex flex-col gap-2.5">
                <CatalogSelect
                  entries={armorEntries}
                  selectedId={armorId}
                  onSelect={setArmorId}
                />
                {selectedArmor &&
                  (() => {
                    const item = selectedArmor.item as {
                      name: string;
                      damageReduction?: number;
                      attributeBonus?: Record<string, number>;
                    };
                    const slotLabel = SLOT_CONFIG.find(
                      (s) => s.key === selectedArmor.slot,
                    )?.label;
                    return (
                      <div className="text-xs text-e-faint flex flex-col gap-1">
                        <p>
                          {slotLabel}
                          {item.damageReduction != null
                            ? ` · -${item.damageReduction} dano`
                            : ""}
                        </p>
                        {item.attributeBonus &&
                          Object.entries(item.attributeBonus).some(
                            ([, v]) => v > 0,
                          ) && (
                            <p>
                              {Object.entries(item.attributeBonus)
                                .filter(([, v]) => v > 0)
                                .map(([k, v]) => `${k}+${v}`)
                                .join(" ")}
                            </p>
                          )}
                      </div>
                    );
                  })()}
                {isFull && (
                  <p className="text-[10px] text-e-danger">
                    Inventário cheio (16/16)
                  </p>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!armorId || givingEquip || isFull}
                  onClick={() => {
                    if (!selectedArmor) return;
                    giveEquipmentItem(
                      selectedArmor,
                      selectedArmor.slot === "armor" ? "armor" : "accessory",
                    );
                  }}
                >
                  {givingEquip ? "Adicionando…" : "Adicionar ao inventário"}
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Right column ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <StatusBar player={player} />

        <section>
          <p className={lbl}>Inventário ({gridItems.length}/16)</p>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }, (_, i) => {
              const item = gridItems[i] ?? null;
              const isActive = activeSlot === i;
              const isEquip =
                item &&
                (item.type === "weapon" ||
                  item.type === "armor" ||
                  item.type === "accessory");
              const isKey = item?.type === "chave";
              return (
                <div key={i} className="relative aspect-square">
                  <button
                    onClick={() => {
                      if (!item) return;
                      if (isActive) setActiveSlot(null);
                      else {
                        setActiveSlot(i);
                        setSlotView("menu");
                      }
                    }}
                    className={`w-full h-full rounded-xl border flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                      item
                        ? isActive
                          ? "bg-e-card border-e-accent cursor-pointer"
                          : isKey
                            ? "bg-e-card border-orange-500/50 hover:border-orange-500 cursor-pointer"
                            : "bg-e-card border-e-border hover:border-e-border2 cursor-pointer"
                        : "bg-e-bg border-e-border cursor-default"
                    }`}
                  >
                    {item ? (
                      <>
                        <ItemIcon
                          name={item.icon ?? iconForType(item.type)}
                          size={20}
                          className="text-e-sub"
                        />
                        <span className="text-[9px] text-e-sub text-center leading-tight line-clamp-2 w-full px-1">
                          {item.name}
                        </span>
                        {item.qty > 1 && (
                          <span className="absolute top-1 right-1.5 text-[9px] font-black text-e-accent leading-none">
                            {item.qty}
                          </span>
                        )}
                        {isEquip && (
                          <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-e-accent/60" />
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-e-faint/40 font-medium">
                        {i + 1}
                      </span>
                    )}
                  </button>

                  {isActive && item && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setActiveSlot(null)}
                      />
                      <div className="absolute z-30 top-full mt-1 left-0 w-44 bg-e-surface border border-e-border rounded-xl shadow-2xl p-2 flex flex-col gap-1">
                        <div className="px-2 py-1.5 border-b border-e-border mb-1">
                          <p className="text-xs font-semibold text-e-text">
                            {item.name}
                          </p>
                          {item.desc && (
                            <p className="text-[10px] text-e-sub mt-0.5">
                              {item.desc}
                            </p>
                          )}
                          <p className="text-[10px] text-e-faint mt-0.5">
                            Qtd: {item.qty}
                          </p>
                        </div>
                        {isEquip && slotView === "menu" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSlotView("equip");
                            }}
                            className="flex items-center gap-2 text-xs text-e-accent hover:bg-e-accent/10 rounded-lg px-2 py-1.5 cursor-pointer transition-colors"
                          >
                            <Sword size={12} /> Equipar
                          </button>
                        )}
                        {isEquip && slotView === "equip" && (
                          <EquipPanel
                            item={item}
                            processing={processing === `equip-${item.id}`}
                            onEquip={(slot) => equipFromInventory(item, slot)}
                          />
                        )}
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={processing === item.id}
                          className="flex items-center gap-2 text-xs text-e-danger hover:bg-e-danger/10 rounded-lg px-2 py-1.5 disabled:opacity-40 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} /> Remover
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Skill helpers ─────────────────────────────────────────────────────────────

const SKILL_ICON: Record<string, LucideIcon> = {
  class: Star,
  weapon: Sword,
  essencia: Gem,
  passive: Shield,
};

function getSkillIcon(type: string): LucideIcon {
  return SKILL_ICON[type] ?? Sparkles;
}

// ── HabilidadesPanel ──────────────────────────────────────────────────────────

function HabilidadesPanel({
  player,
  onUpdate,
}: {
  player: Player;
  onUpdate: (p: Player) => void;
}) {
  const [skills, setSkills] = useState<SkillTreeEntry[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [essencias, setEssencias] = useState<Essencia[]>([]);
  const [sidePanel, setSidePanel] = useState<"essencia" | "habilidade" | null>(
    null,
  );
  const [selectedEssId, setSelectedEssId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [savingMaestria, setSavingMaestria] = useState<string | null>(null);
  const [processingEss, setProcessingEss] = useState<string | null>(null);

  const obtained = new Set(
    (player.essenciasObtidas ?? []).map((e) => e.essenciaId),
  );

  async function fetchSkills() {
    setLoadingSkills(true);
    try {
      const r = await api.get<SkillTreeEntry[]>(
        `/players/${player.id}/skill-tree`,
      );
      setSkills(r.data);
    } catch {
    } finally {
      setLoadingSkills(false);
    }
  }

  useEffect(() => {
    api
      .get<SkillTreeEntry[]>(`/players/${player.id}/skill-tree`)
      .then((r) => {
        setSkills(r.data);
        setLoadingSkills(false);
      })
      .catch(() => setLoadingSkills(false));
    api
      .get<Essencia[]>("/master/essencias")
      .then((r) => setEssencias(r.data))
      .catch(() => {});
  }, [player.id]);

  async function grantEssencia(essenciaId: string) {
    setProcessingEss(essenciaId);
    try {
      const res = await api.post<Player>(
        `/master/players/${player.id}/essencias`,
        { essenciaId },
      );
      onUpdate(res.data);
    } catch {
    } finally {
      setProcessingEss(null);
    }
  }

  async function removeEssencia(essenciaId: string) {
    setProcessingEss(essenciaId);
    try {
      const res = await api.delete<Player>(
        `/master/players/${player.id}/essencias/${essenciaId}`,
      );
      onUpdate(res.data);
    } catch {
    } finally {
      setProcessingEss(null);
    }
  }

  async function unlockSkill() {
    if (!selectedSkillId) return;
    setUnlocking(true);
    try {
      await api.post(`/players/${player.id}/unlock-skill`, {
        skillId: selectedSkillId,
      });
      setSelectedSkillId(null);
      await fetchSkills();
    } catch {
    } finally {
      setUnlocking(false);
    }
  }

  async function adjustMaestria(ps: PlayerSkill, uses: number) {
    setSavingMaestria(ps.id);
    try {
      await api.put(`/master/players/${player.id}/maestria`, {
        playerSkillId: ps.id,
        uses,
      });
      await fetchSkills();
    } catch {
    } finally {
      setSavingMaestria(null);
    }
  }

  const unlocked = skills.filter(
    (e) => e.status === "UNLOCKED" && e.playerSkill,
  );
  const available = skills.filter((e) => e.status === "AVAILABLE");
  // Group unlocked by skill type
  const grouped = unlocked.reduce<Record<string, SkillTreeEntry[]>>(
    (acc, e) => {
      const key = e.skill.type || "Outros";
      (acc[key] ??= []).push(e);
      return acc;
    },
    {},
  );

  const TYPE_PT: Record<string, string> = {
    class: "Classe",
    weapon: "Arma",
    essencia: "Essência",
  };

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* ── Left column ── */}
      <div className="w-56 shrink-0 border-r border-e-border overflow-y-auto p-4 flex flex-col gap-3">
        {/* Dar essência */}
        <button
          onClick={() =>
            setSidePanel((v) => (v === "essencia" ? null : "essencia"))
          }
          className={`flex items-center gap-2 w-full text-xs px-3 py-2.5 rounded-xl border transition-colors cursor-pointer font-medium ${
            sidePanel === "essencia"
              ? "bg-e-accent/10 border-e-accent text-e-accent"
              : "bg-e-card border-e-border text-e-sub hover:text-e-text hover:border-e-border2"
          }`}
        >
          <Gem size={13} />
          Dar essência
        </button>
        {sidePanel === "essencia" && (
          <div className="bg-e-bg border border-e-border rounded-xl p-3 flex flex-col gap-2.5">
            <EssenciaSelect
              essencias={essencias}
              selectedId={selectedEssId}
              onSelect={setSelectedEssId}
            />
            {selectedEssId &&
              (() => {
                const sel = essencias.find((e) => e.id === selectedEssId);
                if (!sel) return null;
                const has = obtained.has(sel.id);
                const busy = processingEss === sel.id;
                const bonuses = Object.entries(sel.attributeBonus ?? {}).filter(
                  ([, v]) => v > 0,
                );
                return (
                  <>
                    <div className="text-xs text-e-faint flex flex-col gap-1">
                      <p className="text-e-sub leading-snug">
                        {sel.desc || "—"}
                      </p>
                      <p className="text-[10px]">
                        {ESSENCIA_TYPE_PT[sel.type] ?? sel.type}
                      </p>
                      {bonuses.length > 0 && (
                        <p className="text-[10px] text-e-accent">
                          {bonuses
                            .map(
                              ([k, v]) => `${k.slice(0, 3).toUpperCase()}+${v}`,
                            )
                            .join(" ")}
                        </p>
                      )}
                    </div>
                    {has ? (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busy}
                        onClick={() => removeEssencia(sel.id)}
                      >
                        {busy ? "Removendo…" : "Remover"}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={busy}
                        onClick={() => grantEssencia(sel.id)}
                      >
                        {busy ? "Dando…" : "Dar essência"}
                      </Button>
                    )}
                  </>
                );
              })()}
          </div>
        )}

        {/* Dar habilidade */}
        <button
          onClick={() =>
            setSidePanel((v) => (v === "habilidade" ? null : "habilidade"))
          }
          className={`flex items-center gap-2 w-full text-xs px-3 py-2.5 rounded-xl border transition-colors cursor-pointer font-medium ${
            sidePanel === "habilidade"
              ? "bg-e-accent/10 border-e-accent text-e-accent"
              : "bg-e-card border-e-border text-e-sub hover:text-e-text hover:border-e-border2"
          }`}
        >
          <Zap size={13} />
          Dar habilidade
        </button>
        {sidePanel === "habilidade" && (
          <div className="bg-e-bg border border-e-border rounded-xl p-3 flex flex-col gap-2.5">
            {available.length === 0 &&
            skills.filter((e) => e.status === "LOCKED").length === 0 ? (
              <p className="text-[10px] text-e-faint">
                Nenhuma habilidade disponível.
              </p>
            ) : (
              <>
                <SkillSelect
                  available={available}
                  locked={skills.filter((e) => e.status === "LOCKED")}
                  selectedId={selectedSkillId}
                  onSelect={setSelectedSkillId}
                />
                {selectedSkillId &&
                  (() => {
                    const sel = available.find(
                      (e) => e.skill.id === selectedSkillId,
                    );
                    if (!sel) return null;
                    return (
                      <div className="text-xs text-e-faint flex flex-col gap-1">
                        <p className="text-e-sub leading-snug">
                          {sel.skill.desc || "—"}
                        </p>
                        <p className="text-[10px]">
                          {TYPE_PT[sel.skill.type] ?? sel.skill.type}
                          {sel.skill.cooldownTurns > 0
                            ? ` · ${sel.skill.cooldownTurns}t cooldown`
                            : ""}
                        </p>
                      </div>
                    );
                  })()}
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selectedSkillId || unlocking}
                  onClick={unlockSkill}
                >
                  {unlocking ? "Desbloqueando…" : "Desbloquear"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Right column ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <StatusBar player={player} />

        {loadingSkills ? (
          <p className="text-sm text-e-faint text-center py-8 animate-pulse">
            Carregando habilidades…
          </p>
        ) : unlocked.length === 0 ? (
          <p className="text-sm text-e-faint text-center py-8">
            Nenhuma habilidade desbloqueada.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.entries(grouped).map(([type, entries]) => {
              const SkillIcon = getSkillIcon(type);
              const groupLabel =
                TYPE_PT[type] ?? type[0].toUpperCase() + type.slice(1);
              return (
                <section key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <SkillIcon size={12} className="text-e-faint" />
                    <p className={lbl + " !mb-0"}>{groupLabel}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {entries.map((entry) => {
                      const ps = entry.playerSkill!;
                      const m = ps.maestria;
                      const isSaving = savingMaestria === ps.id;
                      return (
                        <div
                          key={ps.id}
                          className="bg-e-card border border-e-border rounded-xl p-3 flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-e-text truncate">
                                {entry.skill.name}
                              </p>
                              <p className="text-[10px] text-e-faint mt-0.5">
                                {entry.skill.type}
                                {entry.skill.cooldownTurns > 0
                                  ? ` · ${entry.skill.cooldownTurns}t cooldown`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {/* Maestria pips */}
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${i < m.level ? "bg-e-gold" : "bg-e-border"}`}
                                  />
                                ))}
                              </div>
                              <span className="text-[9px] text-e-gold font-bold">
                                Nv {m.level}
                              </span>
                            </div>
                          </div>

                          {/* XP controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => adjustMaestria(ps, -1)}
                              disabled={isSaving || m.totalUses <= 0}
                              className="w-6 h-6 rounded-lg bg-e-surface border border-e-border text-e-sub hover:text-e-text disabled:opacity-40 cursor-pointer flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              −
                            </button>
                            <span className="text-xs text-e-sub tabular-nums flex-1 text-center">
                              {m.totalUses}
                              {m.nextLevelUses > 0 && (
                                <span className="text-e-faint">
                                  /{m.nextLevelUses}
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => adjustMaestria(ps, 1)}
                              disabled={isSaving}
                              className="w-6 h-6 rounded-lg bg-e-surface border border-e-border text-e-sub hover:text-e-text disabled:opacity-40 cursor-pointer flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── DetalhesModal (main) ──────────────────────────────────────────────────────

export default function DetalhesModal({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const { setPlayer } = useStore();
  const [tab, setTab] = useState<"inventario" | "habilidades">("inventario");
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState("");
  const [givingXP, setGivingXP] = useState(false);
  async function grantXP() {
    const amount = Number(xpAmount);
    if (!amount || amount <= 0) return;
    setGivingXP(true);
    try {
      const res = await api.put<Player>("/master/exp", {
        playerId: player.id,
        amount,
      });
      if (res.data) setPlayer(res.data);
      setShowXP(false);
      setXpAmount("");
    } catch {
    } finally {
      setGivingXP(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-e-border shrink-0">
          <div className="w-9 h-9 rounded-full bg-e-card border border-e-border flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-e-gold select-none">
              {player.char.name[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-e-text truncate">
                {player.char.name}
              </p>
              <span className="text-[10px] font-bold text-e-gold bg-e-gold/10 border border-e-gold/20 px-1.5 py-0.5 rounded-md shrink-0">
                Nv {player.char.level}
              </span>
            </div>
            <p className="text-xs text-e-sub mt-0.5">
              {player.char.race} · {player.char.skillClass}
              {player.char.subClass ? ` · ${player.char.subClass}` : ""}
            </p>
          </div>

          {/* Gold input */}
          <GoldControl player={player} onUpdate={setPlayer} />

          {/* XP button + inline form */}
          <div className="flex items-center gap-2 shrink-0">
            {showXP ? (
              <>
                <input
                  type="number"
                  min={1}
                  value={xpAmount}
                  placeholder="XP"
                  onChange={(e) => setXpAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && grantXP()}
                  className="!w-20 !py-1.5 !text-sm"
                  autoFocus
                />
                <Button
                  variant="gold"
                  size="sm"
                  disabled={givingXP || !xpAmount}
                  onClick={grantXP}
                >
                  {givingXP ? "…" : "Dar"}
                </Button>
                <button
                  onClick={() => {
                    setShowXP(false);
                    setXpAmount("");
                  }}
                  className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowXP(true)}
                className="flex items-center gap-1.5 text-xs text-e-gold border border-e-gold/30 bg-e-gold/5 hover:bg-e-gold/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer font-medium"
              >
                <Sparkles size={12} /> + XP jogador
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-e-faint hover:text-e-text cursor-pointer p-1.5 rounded-lg hover:bg-e-card transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-e-border px-5 shrink-0">
          {(["inventario", "habilidades"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                tab === t
                  ? "border-e-accent text-e-text"
                  : "border-transparent text-e-faint hover:text-e-sub"
              }`}
            >
              {t === "inventario" ? "Inventário" : "Habilidades"}
            </button>
          ))}
        </div>

        {/* Panel */}
        {tab === "inventario" ? (
          <InventarioPanel player={player} onUpdate={setPlayer} />
        ) : (
          <HabilidadesPanel player={player} onUpdate={setPlayer} />
        )}
      </div>
    </div>
  );
}
