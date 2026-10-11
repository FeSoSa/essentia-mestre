"use client";

import Button from "@/components/ui/Button";
import { divisorArma } from '@/store/combateStore';
import Checkbox, { CheckField } from "@/components/ui/Checkbox";
import EffectBuilder, { describeAutoEffect } from "@/components/sections/StatusEffects/EffectBuilder";
import { api } from "@/lib/api";
import type { CatalogEntry, EquipSlot } from "@/lib/equipmentCatalog";
import { genId } from "@/lib/id";
import { proxyUrl } from "@/lib/gdrive";
import { extractErrorMessage, showApiError } from "@/store/errorToastStore";
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
  Backpack, Wand2, BarChart3,
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
  Pencil,
  Plus,
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
import { STATUS_ICONS, getStatusIcon } from "@/lib/statusIcons";
import { rarityColor, RARITY_LABELS, type Rarity } from "@/lib/rarity";
import { useEffectPresetsStore, type EffectPreset } from "@/store/effectPresetsStore";
import type { AutoEffect } from "@/store/types";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { maestriaResumo } from "@/lib/maestria";
import { Avatar, Barra, fracEs, corVida, COR_ES } from "@/components/sections/MesaNova/ui";
import AjusteRapido from "@/components/sections/MesaNova/AjusteRapido";

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
        src={proxyUrl(name.slice(4))}
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
      const w = entry.item as { damageBase: number; damageAttribute?: string };
      const attr = w.damageAttribute ? ` + d20×${w.damageAttribute}/${divisorArma(w)}` : '';
      return `${w.damageBase}${attr}`;
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
        className="w-full flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-left hover:border-white/20 transition-colors cursor-pointer"
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
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-white/10 rounded-xl shadow-2xl">
          <div className="p-2 border-b border-white/10">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar…"
              className="w-full text-xs rounded-lg px-2 py-1.5 bg-black/30 border border-white/10 text-e-text outline-none placeholder:text-e-faint"
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
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
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
  const [pos, setPos]   = useState({ top: 0, left: 0, width: 0 });
  const btnRef          = useRef<HTMLButtonElement>(null);
  const SelectedIcon    = ICON_MAP[value] ?? Package;

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen((v) => !v);
  }

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-left hover:border-white/20 transition-colors cursor-pointer"
      >
        <SelectedIcon size={13} className="text-e-sub shrink-0" />
        <span className="flex-1 text-e-text">{value}</span>
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] bg-e-surface border border-white/10 rounded-xl shadow-2xl max-h-44 overflow-y-auto"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
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
                    : "hover:bg-white/[0.06] text-e-text"
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
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
        className="w-full flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-left hover:border-white/20 transition-colors cursor-pointer"
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
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
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
                  : "hover:bg-white/[0.06] text-e-text"
              }`}
            >
              <SkillIcon type={e.skill.type} size={13} className="shrink-0" />
              <span className="flex-1 leading-snug">{e.skill.name}</span>
            </button>
          ))}
          {locked.length > 0 && available.length > 0 && (
            <div className="mx-3 my-1 h-px bg-white/10" />
          )}
          {locked.map((e) => (
            <div
              key={e.skill.id}
              title="Bloqueada — pré-requisitos não atendidos"
              className="flex items-center gap-2 px-3 py-2 text-sm text-e-faint/40 cursor-not-allowed select-none"
            >
              <SkillIcon type={e.skill.type} size={13} className="shrink-0" />
              <span className="flex-1 leading-snug">{e.skill.name}</span>
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
        className="w-full flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-left hover:border-white/20 transition-colors cursor-pointer"
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
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
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
                  : "hover:bg-white/[0.06] text-e-text"
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
        className="w-full flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-left hover:border-white/20 transition-colors cursor-pointer"
      >
        <span className="flex-1 text-e-text">{current.label}</span>
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden">
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
                  : "hover:bg-white/[0.06] text-e-text"
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
  const isWeapon = item.type === "weapon" || item.equipSlot === "both";
  const naturalSlot =
    (item.equipSlot === "both" ? undefined : (item.equipSlot as EquipSlot | undefined)) ??
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
                  : "bg-black/30 border-white/10 text-e-faint hover:border-white/20"
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
                  : "bg-black/30 border-white/10 text-e-faint hover:border-white/20"
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
  const isFull = gridItems.length >= (player.inventorySize ?? 18);

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
      setClearError(extractErrorMessage(err, 'Não foi possível desequipar o item.'));
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
    } catch (err) {
      showApiError(err, 'Não foi possível remover o item.');
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
                damageAttribute: item.damageAttribute ?? "",
                equilibrio: item.equilibrio,
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
                  armorWeight: item.armorWeight,
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
    } catch (err) {
      showApiError(err, 'Não foi possível equipar o item.');
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
        catalogId: cat.id,
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
        catalogId: (entry.item as unknown as ItemCatalog).id,
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
              damageAttribute: (entry.item as { damageAttribute?: string }).damageAttribute,
              equilibrio: (entry.item as { equilibrio?: number }).equilibrio,
              margemCritico: (entry.item as { margemCritico?: number }).margemCritico,
              attributeBonus: entry.item.attributeBonus,
            }
          : type === "armor"
            ? {
                ...base,
                icon: "Shield",
                damageReduction: (entry.item as { damageReduction?: number }).damageReduction,
                armorWeight: (entry.item as { armorWeight?: string }).armorWeight,
                negaCritico: (entry.item as { negaCritico?: boolean }).negaCritico,
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
      <div className="w-[270px] shrink-0 border-r border-white/10 overflow-y-auto p-4 flex flex-col gap-5">
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
                  className="flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-2"
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
                  : "bg-white/[0.05] border-white/10 text-e-sub hover:text-e-text hover:border-white/20"
              }`}
            >
              <Package size={13} /> Dar item
            </button>
            {givePanel === "item" && (
              <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
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
                        className="w-20 text-center text-xs rounded-lg px-2 py-1.5 bg-white/[0.02] border border-white/10 text-e-text outline-none"
                      />
                    </div>
                  </>
                )}
                {isFull && (
                  <p className="text-[10px] text-e-danger">Inventário cheio ({player.inventorySize ?? 18}/{player.inventorySize ?? 18})</p>
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
                  : "bg-white/[0.05] border-white/10 text-e-sub hover:text-e-text hover:border-white/20"
              }`}
            >
              <Sword size={13} /> Dar arma
            </button>
            {givePanel === "arma" && (
              <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
                <CatalogSelect
                  entries={weaponEntries}
                  selectedId={weaponId}
                  onSelect={setWeaponId}
                />
                {selectedWeapon &&
                  (() => {
                    const w = selectedWeapon.item as {
                      name: string; weaponType: string;
                      damageBase: number; damageAttribute: string; properties?: string;
                    };
                    return (
                      <div className="text-xs text-e-faint flex flex-col gap-1">
                        <p>
                          <span className="text-e-sub">{w.weaponType}</span> ·{" "}
                          {w.damageBase}{w.damageAttribute ? ` + d20×${w.damageAttribute}/${divisorArma(w, player.proficiencias ?? [])}` : ''}
                        </p>
                        {w.properties && <p>{w.properties}</p>}
                      </div>
                    );
                  })()}
                {isFull && (
                  <p className="text-[10px] text-e-danger">
                    Inventário cheio ({player.inventorySize ?? 18}/{player.inventorySize ?? 18})
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
                  : "bg-white/[0.05] border-white/10 text-e-sub hover:text-e-text hover:border-white/20"
              }`}
            >
              <Shield size={13} /> Dar armadura
            </button>
            {givePanel === "armadura" && (
              <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
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
                    Inventário cheio ({player.inventorySize ?? 18}/{player.inventorySize ?? 18})
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

        <section>
          <p className={lbl}>Inventário ({gridItems.length}/{player.inventorySize ?? 18})</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))" }}>
            {Array.from({ length: player.inventorySize ?? 18 }, (_, i) => {
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
                    className={`w-full h-full rounded-xl border flex flex-col items-center justify-center gap-1.5 p-2 transition-colors ${
                      item
                        ? isActive
                          ? "bg-e-accent/10 border-e-accent cursor-pointer"
                          : isKey
                            ? "bg-orange-500/[0.06] border-orange-500/40 hover:border-orange-500 cursor-pointer"
                            : "bg-white/[0.05] border-white/10 hover:border-white/25 hover:bg-white/[0.08] cursor-pointer"
                        : "bg-transparent border-dashed border-white/[0.07] cursor-default"
                    }`}
                  >
                    {item ? (
                      <>
                        <ItemIcon
                          name={item.icon ?? iconForType(item.type)}
                          size={22}
                          className="text-e-text"
                        />
                        <span className="text-[10px] text-e-sub text-center leading-tight line-clamp-2 w-full">
                          {item.name}
                        </span>
                        {item.qty > 1 && (
                          <span className="absolute top-1.5 right-2 text-[10px] font-black text-e-accent leading-none">
                            {item.qty}
                          </span>
                        )}
                        {isEquip && (
                          <span
                            className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: rarityColor(item.rarity) ?? '#71717a' }}
                          />
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
                      <div className="absolute z-30 top-full mt-1 left-0 w-44 bg-e-surface border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1">
                        <div className="px-2 py-1.5 border-b border-white/10 mb-1">
                          <p className="text-xs font-semibold" style={{ color: rarityColor(item.rarity) ?? '#fafafa' }}>
                            {item.name}
                          </p>
                          {item.rarity && (
                            <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: rarityColor(item.rarity) }}>
                              {RARITY_LABELS[item.rarity as Rarity] ?? item.rarity}
                            </p>
                          )}
                          {item.desc && (
                            <p className="text-[10px] text-e-sub mt-0.5">{item.desc}</p>
                          )}
                          {item.damageBase != null && (
                            <p className="text-[10px] text-e-gold mt-0.5">
                              {item.damageBase}{item.damageAttribute ? ` + d20×${item.damageAttribute}/${divisorArma(item)}` : ''}
                              {item.weaponType ? ` · ${item.weaponType}` : ''}
                            </p>
                          )}
                          {item.damageReduction != null && (
                            <p className="text-[10px] text-e-gold mt-0.5">-{item.damageReduction} dano</p>
                          )}
                          {item.attributeBonus && Object.entries(item.attributeBonus).filter(([, v]) => v !== 0).length > 0 && (
                            <p className="text-[10px] text-emerald-400 mt-0.5">
                              {Object.entries(item.attributeBonus)
                                .filter(([, v]) => v !== 0)
                                .map(([k, v]) => `${k.slice(0,3).toUpperCase()} ${v > 0 ? '+' : ''}${v}`)
                                .join('  ')}
                            </p>
                          )}
                          <p className="text-[10px] text-e-faint mt-0.5">Qtd: {item.qty}</p>
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
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillTypeFilter, setSkillTypeFilter] = useState<string>('all');
  const [unlocking, setUnlocking] = useState(false);
  const [savingMaestria, setSavingMaestria] = useState<string | null>(null);

  async function fetchSkills() {
    setLoadingSkills(true);
    try {
      const r = await api.get<SkillTreeEntry[]>(
        `/master/players/${player.id}/skill-tree`,
      );
      setSkills(r.data);
    } catch {
    } finally {
      setLoadingSkills(false);
    }
  }

  useEffect(() => {
    api
      .get<SkillTreeEntry[]>(`/master/players/${player.id}/skill-tree`)
      .then((r) => {
        setSkills(r.data);
        setLoadingSkills(false);
      })
      .catch(() => setLoadingSkills(false));
  }, [player.id]);

  async function unlockSkill() {
    if (!selectedSkillId) return;
    setUnlocking(true);
    const selectedEntry = skills.find((e) => e.skill.id === selectedSkillId);
    const isMestre = selectedEntry?.skill.type === 'mestre';
    try {
      if (isMestre) {
        await api.post(`/master/players/${player.id}/grant-skill`, { skillId: selectedSkillId });
      } else {
        await api.post(`/players/${player.id}/unlock-skill`, { skillId: selectedSkillId });
      }
      setSelectedSkillId(null);
      await fetchSkills();
    } catch {
    } finally {
      setUnlocking(false);
    }
  }

  async function resetSkill(entry: SkillTreeEntry) {
    if (!confirm(`Remover "${entry.skill.name}" do jogador? Maestria e usos serão perdidos.`)) return;
    try {
      await api.delete(`/master/players/${player.id}/skill/${entry.skill.id}`);
      await fetchSkills();
    } catch {}
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

  async function toggleSkillBlocked(entry: SkillTreeEntry) {
    const ps = entry.playerSkill;
    if (!ps) return;
    try {
      await api.put(`/master/players/${player.id}/skill/${entry.skill.id}/block`, {
        blocked: !ps.blocked,
      });
      await fetchSkills();
    } catch {}
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

  const allGiveable = [...available, ...skills.filter((e) => e.status === "LOCKED")];
  const skillTypes = ['all', ...Array.from(new Set(allGiveable.map((e) => e.skill.type).filter(Boolean)))];
  const filteredSkills = allGiveable.filter((e) => {
    const matchType = skillTypeFilter === 'all' || e.skill.type === skillTypeFilter;
    const matchSearch = !skillSearch.trim() || e.skill.name.toLowerCase().includes(skillSearch.toLowerCase());
    return matchType && matchSearch;
  });
  const selectedSkill = available.find((e) => e.skill.id === selectedSkillId);

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* ── Left column: dar habilidade ── */}
      <div className="w-72 shrink-0 border-r border-white/10 flex flex-col">
        <div className="p-3 border-b border-white/10 flex flex-col gap-2 shrink-0">
          <p className={lbl + " !mb-0"}>Desbloquear habilidade</p>
          <input
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            placeholder="Buscar habilidade…"
            className="w-full text-xs rounded-lg px-2.5 py-1.5 bg-black/30 border border-white/10 text-e-text outline-none placeholder:text-e-faint focus:border-white/20 transition-colors"
          />
          {skillTypes.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {skillTypes.map((t) => (
                <button key={t} type="button" onClick={() => setSkillTypeFilter(t)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors cursor-pointer ${
                    skillTypeFilter === t
                      ? 'bg-e-accent/15 border-e-accent text-e-accent'
                      : 'border-white/10 text-e-faint hover:border-white/20 hover:text-e-sub'
                  }`}>
                  {t === 'all' ? 'Todas' : (TYPE_PT[t] ?? t)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {filteredSkills.length === 0 ? (
            <p className="text-xs text-e-faint text-center py-6">Nenhuma habilidade encontrada.</p>
          ) : filteredSkills.map((e) => {
            const isLocked = e.status === "LOCKED";
            const isSelected = e.skill.id === selectedSkillId;
            return (
              <button key={e.skill.id} type="button"
                onClick={() => !isLocked && setSelectedSkillId(id => id === e.skill.id ? null : e.skill.id)}
                disabled={isLocked}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-e-accent/10 border-e-accent'
                    : isLocked
                      ? 'bg-black/30 border-white/10 opacity-40 cursor-not-allowed'
                      : 'bg-black/30 border-white/10 hover:border-white/20 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex-1 text-xs font-medium leading-snug ${isSelected ? 'text-e-accent' : 'text-e-text'}`}>
                    {e.skill.name}
                  </span>
                  {e.skill.ultimate && (
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 shrink-0">ULT</span>
                  )}
                  {isLocked && <span className="text-[9px] text-e-faint shrink-0">🔒</span>}
                </div>
                {e.skill.cooldownTurns > 0 && (
                  <p className="text-[10px] text-e-faint mt-0.5">{e.skill.cooldownTurns}t cooldown</p>
                )}
              </button>
            );
          })}
        </div>

        {selectedSkill && (
          <div className="p-3 border-t border-white/10 shrink-0 flex flex-col gap-2">
            <div className="bg-black/30 rounded-lg p-2.5 flex flex-col gap-1">
              <p className="text-xs font-semibold text-e-text">{selectedSkill.skill.name}</p>
              {selectedSkill.skill.desc && (
                <p className="text-[11px] text-e-faint leading-snug line-clamp-3">{selectedSkill.skill.desc}</p>
              )}
            </div>
            <Button variant="primary" size="sm" disabled={unlocking} onClick={unlockSkill}>
              {unlocking ? 'Desbloqueando…' : 'Desbloquear'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Right column ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

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
                      const m = entry.maestria;
                      const isSaving = savingMaestria === ps.id;
                      if (!m) return null;
                      return (
                        <div
                          key={ps.id}
                          className="bg-white/[0.05] border border-white/10 rounded-xl p-3 flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-e-text break-words">
                                  {entry.skill.name}
                                </p>
                                {entry.skill.ultimate && (
                                  <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 shrink-0">ULT</span>
                                )}
                              </div>
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
                                {Array.from({ length: m.nivelMax }, (_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${i < m.nivel ? "bg-e-gold" : "bg-white/10"}`}
                                  />
                                ))}
                              </div>
                              <span className="text-[9px] text-e-gold font-bold" title={maestriaResumo(m)}>
                                {m.nome} Nv {m.nivel}
                              </span>
                              {entry.skill.ultimate && (
                                <button
                                  onClick={() => toggleSkillBlocked(entry)}
                                  title={ps.blocked ? "Desbloquear uso desta ultimate" : "Bloquear uso desta ultimate"}
                                  className={`text-[9px] font-medium mt-0.5 cursor-pointer transition-colors ${
                                    ps.blocked ? "text-e-danger hover:text-e-text" : "text-e-faint hover:text-e-text"
                                  }`}
                                >
                                  {ps.blocked ? "bloqueada ⛔" : "liberada"}
                                </button>
                              )}
                              <button
                                onClick={() => resetSkill(entry)}
                                title="Remover habilidade do jogador"
                                className="text-[9px] text-e-faint hover:text-e-danger transition-colors mt-0.5 cursor-pointer"
                              >
                                remover
                              </button>
                            </div>
                          </div>

                          {/* XP controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => adjustMaestria(ps, -1)}
                              disabled={isSaving || m.usos <= 0}
                              className="w-6 h-6 rounded-lg bg-white/[0.02] border border-white/10 text-e-sub hover:text-e-text disabled:opacity-40 cursor-pointer flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              −
                            </button>
                            <span className="text-xs text-e-sub tabular-nums flex-1 text-center">
                              {m.usos}
                              {m.proximoNivelUsos != null && (
                                <span className="text-e-faint">
                                  /{m.proximoNivelUsos}
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => adjustMaestria(ps, 1)}
                              disabled={isSaving}
                              className="w-6 h-6 rounded-lg bg-white/[0.02] border border-white/10 text-e-sub hover:text-e-text disabled:opacity-40 cursor-pointer flex items-center justify-center text-sm font-bold transition-colors"
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

// ── EfeitosPanel ─────────────────────────────────────────────────────────────

function EfeitosPanel({ player, onUpdate }: { player: Player; onUpdate: (p: Player) => void }) {
  const { presets, addPreset, updatePreset, removePreset } = useEffectPresetsStore();

  const [name,             setName]             = useState('');
  const [icon,             setIcon]             = useState('');
  const [color,            setColor]            = useState('');
  const [colorInput,       setColorInput]       = useState('');
  const [desc,             setDesc]             = useState('');
  const [duration,         setDuration]         = useState(3);
  const [permanent,        setPermanent]        = useState(false);
  const [autoEffects,      setAutoEffects]      = useState<AutoEffect[]>([]);
  const [hitBonus,         setHitBonus]         = useState('');
  const [attackBonus,      setAttackBonus]      = useState('');
  const [editingPresetId,  setEditingPresetId]  = useState<string | null>(null);
  const [presetSearch,     setPresetSearch]     = useState('');
  const [removing,         setRemoving]         = useState<string | null>(null);
  const [removingAll,      setRemovingAll]       = useState(false);
  const [removeError,      setRemoveError]      = useState<string | null>(null);
  const [saving,           setSaving]           = useState(false);
  const [applying,         setApplying]         = useState<string | null>(null);

  const currentEffects = player.statusEffects ?? [];

  function loadPreset(p: EffectPreset, forEdit = false) {
    setName(p.name);
    setIcon(p.icon ?? '');
    setColor(p.color ?? '');
    setColorInput(p.color ?? '');
    setDesc(p.desc ?? '');
    setDuration(p.durationTurns === -1 ? 3 : p.durationTurns);
    setPermanent(p.durationTurns === -1);
    setAutoEffects(p.effects);
    setHitBonus(p.hitBonus != null ? String(p.hitBonus) : '');
    setAttackBonus(p.attackBonus != null ? String(p.attackBonus) : '');
    setEditingPresetId(forEdit ? p.id : null);
  }

  function clearForm() {
    setName(''); setIcon(''); setColor(''); setColorInput(''); setDesc('');
    setDuration(3); setPermanent(false); setAutoEffects([]);
    setHitBonus(''); setAttackBonus(''); setEditingPresetId(null);
  }

  async function applyPreset(p: EffectPreset) {
    setApplying(p.id);
    try {
      const res = await api.post<Player>('/master/status-effect', {
        playerId: player.id,
        effect: { id: genId(), name: p.name, icon: p.icon, desc: p.desc ?? '', durationTurns: p.durationTurns, effects: p.effects, hitBonus: p.hitBonus, attackBonus: p.attackBonus },
      });
      onUpdate(res.data);
    } catch {}
    finally { setApplying(null); }
  }

  async function saveAsPreset() {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      icon: icon || undefined,
      color: color || undefined,
      desc: desc || undefined,
      durationTurns: permanent ? -1 : duration,
      effects: autoEffects,
      hitBonus:    hitBonus    !== '' ? Number(hitBonus)    : undefined,
      attackBonus: attackBonus !== '' ? Number(attackBonus) : undefined,
    };
    if (editingPresetId) {
      await updatePreset(editingPresetId, { id: editingPresetId, ...data });
    } else {
      await addPreset(data);
    }
    clearForm();
  }

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post<Player>('/master/status-effect', {
        playerId: player.id,
        effect: { id: genId(), name, icon: icon || undefined, color: color || undefined, desc, durationTurns: permanent ? -1 : duration, effects: autoEffects, hitBonus: hitBonus !== '' ? Number(hitBonus) : undefined, attackBonus: attackBonus !== '' ? Number(attackBonus) : undefined },
      });
      onUpdate(res.data);
      clearForm();
    } catch {}
    finally { setSaving(false); }
  }

  async function handleRemoveAll() {
    setRemovingAll(true);
    setRemoveError(null);
    try {
      const res = await api.delete<Player>(`/master/players/${player.id}/status-effects`);
      onUpdate(res.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setRemoveError(`Erro ao remover todos: ${status ?? 'verifique o console'}`);
    } finally {
      setRemovingAll(false);
    }
  }

  async function handleRemove(effectId: string) {
    if (!effectId) {
      setRemoveError('Este efeito foi criado sem ID — vai expirar automaticamente no próximo turno.');
      return;
    }
    setRemoving(effectId);
    setRemoveError(null);
    try {
      const res = await api.delete<Player>(
        `/master/status-effect/${effectId}`,
        { data: { playerId: player.id } }
      );
      onUpdate(res.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: unknown } })?.response?.status;
      const data   = (err as { response?: { data?: unknown } })?.response?.data;
      console.error('[RemoveEffect]', status, data, err);
      setRemoveError(`Erro ${status ?? 'de rede'}: ${JSON.stringify(data) || 'verifique o console'}`);
    } finally {
      setRemoving(null);
    }
  }

  const PresetIcon = ({ iconName }: { iconName?: string }) => {
    if (!iconName) return null;
    const entry = STATUS_ICONS.find((s) => s.name === iconName);
    if (!entry) return null;
    return <entry.Icon size={13} className="shrink-0" />;
  };

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* ── Left column ── */}
      <div className="w-72 shrink-0 border-r border-white/10 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Predefinidos */}
        <div>
          <p className={lbl}>Predefinidos</p>
          <input
            value={presetSearch}
            onChange={(e) => setPresetSearch(e.target.value)}
            placeholder="Buscar…"
            className="w-full text-xs rounded-lg px-2.5 py-1.5 bg-black/30 border border-white/10 text-e-text outline-none placeholder:text-e-faint focus:border-white/20 transition-colors mb-2"
          />
          <div className="flex flex-col gap-1">
            {presets.filter((p) => !presetSearch.trim() || p.name.toLowerCase().includes(presetSearch.toLowerCase())).map((p) => {
              const isApplying = applying === p.id;
              return (
                <div key={p.id} className="flex items-center gap-1 group">
                  <button
                    onClick={() => applyPreset(p)}
                    disabled={isApplying}
                    title="Aplicar diretamente"
                    className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.05] border border-white/10 hover:border-white/20 text-left transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <PresetIcon iconName={p.icon} />
                    <span className="flex-1 text-xs font-medium text-e-text truncate">{p.name}</span>
                    <span className="text-[10px] text-e-faint shrink-0">
                      {p.durationTurns === -1 ? '∞' : `${p.durationTurns}t`}
                    </span>
                    {isApplying
                      ? <span className="text-[10px] text-e-faint">…</span>
                      : <span className="text-[10px] text-e-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0">▶</span>
                    }
                  </button>
                  <button
                    onClick={() => loadPreset(p, true)}
                    title="Editar predefinido"
                    className="w-6 h-6 rounded flex items-center justify-center text-e-faint hover:text-e-text hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => removePreset(p.id)}
                    title="Remover predefinido"
                    className="w-6 h-6 rounded flex items-center justify-center text-e-faint hover:text-e-danger hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Efeitos ativos */}
        <div>
          <div className="flex items-center justify-between">
            <p className={lbl + " !mb-0"}>Ativos ({currentEffects.length})</p>
            {currentEffects.length > 0 && (
              <button
                onClick={handleRemoveAll}
                disabled={removingAll}
                className="text-[10px] text-e-danger hover:text-e-danger/80 disabled:opacity-40 cursor-pointer transition-colors"
              >
                {removingAll ? 'Removendo…' : 'Remover todos'}
              </button>
            )}
          </div>
          {removeError && (
            <p className="text-[10px] text-e-danger bg-e-danger/10 border border-e-danger/30 rounded-lg px-2 py-1.5 mb-2 break-all">
              {removeError}
            </p>
          )}
          {currentEffects.length === 0 ? (
            <p className="text-xs text-e-faint italic">Nenhum efeito ativo.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {currentEffects.map((ef) => {
                const IconComp = getStatusIcon(ef.icon);
                return (
                  <div key={ef.id || ef.name} className="flex flex-col gap-1 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      {IconComp
                        ? <IconComp size={13} className="text-e-sub shrink-0" />
                        : ef.icon ? <span className="text-sm shrink-0">{ef.icon}</span> : null}
                      <span className="flex-1 text-xs font-medium text-e-text truncate">{ef.name}</span>
                      <span className="text-[10px] font-mono text-e-sub shrink-0">
                        {ef.durationTurns === -1 ? '∞' : `${ef.durationTurns}t`}
                      </span>
                      <button
                        onClick={() => handleRemove(ef.id)}
                        disabled={removing === ef.id}
                        className="p-1 rounded hover:bg-e-danger/20 text-e-faint hover:text-e-danger disabled:opacity-40 cursor-pointer transition-colors shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {ef.effects.length > 0 && (
                      <p className="text-[10px] text-e-accent pl-[21px] truncate">
                        {ef.effects.map(describeAutoEffect).join(' · ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleAdd} className="flex flex-col gap-4 max-w-lg">
          <div className="flex items-center justify-between">
            <p className={lbl + ' !mb-0'}>{editingPresetId ? 'Editando predefinido' : 'Personalizado'}</p>
            {editingPresetId && (
              <button type="button" onClick={clearForm} className="text-[10px] text-e-faint hover:text-e-sub transition-colors cursor-pointer">
                Cancelar edição
              </button>
            )}
          </div>

          <div>
            <label className={lbl}>Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maldição do Ancião" required />
          </div>

          <div>
            <label className={lbl}>Descrição</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="O que este efeito faz ao personagem…" rows={2}
              className="w-full rounded-xl px-3 py-2 bg-black/30 border border-white/10 text-sm text-e-text resize-none outline-none focus:border-white/20 transition-colors placeholder:text-e-faint" />
          </div>

          <div>
            <label className={lbl}>Ícone</label>
            <div className="grid grid-cols-9 gap-1.5">
              {STATUS_ICONS.map(({ name: n, Icon }) => (
                <button key={n} type="button" title={n}
                  onClick={() => setIcon(icon === n ? '' : n)}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                    icon === n
                      ? 'border-e-accent bg-e-accent/10 text-e-accent'
                      : 'border-white/10 hover:border-white/20 text-e-faint hover:text-e-sub'
                  }`}
                  style={icon === n && color ? { borderColor: color, backgroundColor: color + '22', color } : {}}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Cor</label>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-6 gap-1.5">
                {['#ef4444','#f97316','#facc15','#4ade80','#06b6d4','#3b82f6','#a855f7','#ec4899','#d4a84e','#e2e8f0','#71717a','#7c3aed'].map((c) => (
                  <button key={c} type="button" onClick={() => { setColor(c); setColorInput(c); }}
                    className={`h-7 rounded-lg border-2 transition-all cursor-pointer ${color === c ? 'scale-110 border-white/50' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }} />
                ))}
                <button type="button" onClick={() => { setColor(''); setColorInput(''); }}
                  className={`h-7 rounded-lg border transition-colors cursor-pointer flex items-center justify-center text-[9px] font-bold ${!color ? 'border-e-accent text-e-accent' : 'border-white/10 text-e-faint hover:border-white/20'}`}>
                  auto
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg border border-white/10 shrink-0" style={{ backgroundColor: colorInput || 'transparent' }} />
                <input type="text" value={colorInput}
                  onChange={(e) => { setColorInput(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColor(e.target.value); }}
                  placeholder="#rrggbb"
                  className="flex-1 rounded-xl px-3 py-1.5 bg-black/30 border border-white/10 text-sm text-e-text outline-none focus:border-white/20 transition-colors placeholder:text-e-faint font-mono" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setPermanent((p) => !p)}>
              <Checkbox checked={permanent} onChange={setPermanent} />
              <span className="text-sm text-e-sub">Permanente</span>
            </label>
            {!permanent && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-e-sub shrink-0">Duração:</span>
                <input type="number" value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="!w-20" min={1} />
                <span className="text-sm text-e-faint">turnos</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Bônus de acerto</label>
              <input type="number" value={hitBonus}
                onChange={(e) => setHitBonus(e.target.value)}
                placeholder="Ex: -2" className="text-center" />
            </div>
            <div>
              <label className={lbl}>Bônus de ataque</label>
              <input type="number" value={attackBonus}
                onChange={(e) => setAttackBonus(e.target.value)}
                placeholder="Ex: -3" className="text-center" />
            </div>
          </div>

          <div>
            <p className={lbl}>Efeitos automáticos</p>
            <EffectBuilder effects={autoEffects} onChange={setAutoEffects} />
          </div>

          <div className="flex gap-2">
            <button type="button"
              onClick={saveAsPreset}
              disabled={!name.trim()}
              title={editingPresetId ? 'Atualizar predefinido' : 'Salvar como predefinido para uso futuro'}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 text-e-faint hover:text-e-sub hover:border-white/20 text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              {editingPresetId ? '✎ Atualizar predefinido' : '☆ Salvar predefinido'}
            </button>
            <button type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-e-accent text-e-bg text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer">
              {saving ? 'Aplicando…' : 'Aplicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CustomBarsPanel ───────────────────────────────────────────────────────────

const BAR_COLORS = ['#4ade80','#3b82f6','#a855f7','#f97316','#ef4444','#facc15','#06b6d4','#ec4899','#d4a84e'];

function CustomBarsPanel({ player, onUpdate }: { player: Player; onUpdate: (p: Player) => void }) {
  const bars = player.customBars ?? [];
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState(10);
  const [newColor, setNewColor] = useState('#a855f7');
  const [newColetiva, setNewColetiva] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [collectiveBars, setCollectiveBars] = useState<{ id: string; name: string; color: string; current: number; max: number }[]>([]);
  const [removingCol, setRemovingCol] = useState<string | null>(null);

  useEffect(() => {
    api.get<typeof collectiveBars>('/master/collective-bars').then((r) => setCollectiveBars(r.data)).catch(() => {});
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      if (newColetiva) {
        const res = await api.post<typeof collectiveBars>('/master/collective-bars', {
          name: newName.trim(), color: newColor, current: 0, max: newMax,
        });
        setCollectiveBars(res.data);
      } else {
        const res = await api.post<Player>(`/master/players/${player.id}/custom-bars`, {
          name: newName.trim(), color: newColor, current: 0, max: newMax,
        });
        onUpdate(res.data);
      }
      setNewName(''); setNewMax(10); setNewColetiva(false); setAdding(false);
    } catch {} finally { setSaving(false); }
  }

  async function handleAdjustCol(barId: string, field: 'current' | 'max', val: number) {
    const bar = collectiveBars.find(b => b.id === barId);
    if (!bar) return;
    try {
      const res = await api.put<typeof collectiveBars>(`/master/collective-bars/${barId}`, {
        current: field === 'current' ? val : bar.current,
        max: field === 'max' ? val : bar.max,
      });
      setCollectiveBars(res.data);
    } catch {}
  }

  async function handleRemoveCol(barId: string) {
    setRemovingCol(barId);
    try {
      const res = await api.delete<typeof collectiveBars>(`/master/collective-bars/${barId}`);
      setCollectiveBars(res.data);
    } catch {} finally { setRemovingCol(null); }
  }

  async function handleAdjust(barId: string, field: 'current' | 'max', val: number) {
    const bar = bars.find(b => b.id === barId);
    if (!bar) return;
    try {
      const res = await api.put<Player>(`/master/players/${player.id}/custom-bars/${barId}`, {
        current: field === 'current' ? val : bar.current,
        max: field === 'max' ? val : bar.max,
      });
      onUpdate(res.data);
    } catch {}
  }

  async function handleRemove(barId: string) {
    setRemoving(barId);
    try {
      const res = await api.delete<Player>(`/master/players/${player.id}/custom-bars/${barId}`);
      onUpdate(res.data);
    } catch {} finally { setRemoving(null); }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

      {/* Barras coletivas */}
      {collectiveBars.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className={lbl + ' flex items-center gap-2'}>
            Barras coletivas
            <span className="text-[9px] bg-blue-500/20 text-blue-300 rounded-full px-1.5 py-0.5 font-bold normal-case tracking-normal">todos os jogadores</span>
          </p>
          {collectiveBars.map((bar) => (
            <div key={bar.id} className="bg-white/[0.05] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: bar.color }} />
                <p className="font-semibold text-sm text-e-text flex-1">{bar.name}</p>
                <button onClick={() => handleRemoveCol(bar.id)} disabled={removingCol === bar.id}
                  className="p-1.5 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-danger/10 disabled:opacity-40 cursor-pointer transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${bar.max > 0 ? Math.min(100, (bar.current / bar.max) * 100) : 0}%`, backgroundColor: bar.color }} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <button onClick={() => handleAdjustCol(bar.id, 'current', Math.max(0, bar.current - 1))}
                    className="w-6 h-6 rounded-lg bg-white/[0.02] border border-white/10 text-e-sub hover:text-e-text cursor-pointer flex items-center justify-center font-bold transition-colors">−</button>
                  <input type="number" value={bar.current} min={0} max={bar.max}
                    onChange={(e) => handleAdjustCol(bar.id, 'current', Number(e.target.value))}
                    className="!w-16 !text-center !text-sm" />
                  <button onClick={() => handleAdjustCol(bar.id, 'current', Math.min(bar.max, bar.current + 1))}
                    className="w-6 h-6 rounded-lg bg-white/[0.02] border border-white/10 text-e-sub hover:text-e-text cursor-pointer flex items-center justify-center font-bold transition-colors">+</button>
                  <span className="text-xs text-e-faint">/ </span>
                  <input type="number" value={bar.max} min={1}
                    onChange={(e) => handleAdjustCol(bar.id, 'max', Math.max(1, Number(e.target.value)))}
                    className="!w-16 !text-center !text-sm" />
                </div>
                <span className="text-xs text-e-faint tabular-nums">{bar.current}/{bar.max}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(bars.length > 0 || collectiveBars.length > 0) && <p className={lbl}>Barras pessoais</p>}

      {bars.length === 0 && !adding && (
        <p className="text-sm text-e-faint text-center py-4">Nenhuma barra pessoal.</p>
      )}

      {bars.map((bar) => (
        <div key={bar.id} className="bg-white/[0.05] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: bar.color }} />
            <p className="font-semibold text-sm text-e-text flex-1">{bar.name}</p>
            <button onClick={() => handleRemove(bar.id)} disabled={removing === bar.id}
              className="p-1.5 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-danger/10 disabled:opacity-40 cursor-pointer transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${bar.max > 0 ? Math.min(100, (bar.current / bar.max) * 100) : 0}%`, backgroundColor: bar.color }} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-1">
              <button onClick={() => handleAdjust(bar.id, 'current', Math.max(0, bar.current - 1))}
                className="w-6 h-6 rounded-lg bg-white/[0.02] border border-white/10 text-e-sub hover:text-e-text cursor-pointer flex items-center justify-center font-bold transition-colors">−</button>
              <input type="number" value={bar.current} min={0} max={bar.max}
                onChange={(e) => handleAdjust(bar.id, 'current', Number(e.target.value))}
                className="!w-16 !text-center !text-sm" />
              <button onClick={() => handleAdjust(bar.id, 'current', Math.min(bar.max, bar.current + 1))}
                className="w-6 h-6 rounded-lg bg-white/[0.02] border border-white/10 text-e-sub hover:text-e-text cursor-pointer flex items-center justify-center font-bold transition-colors">+</button>
              <span className="text-xs text-e-faint">/ </span>
              <input type="number" value={bar.max} min={1}
                onChange={(e) => handleAdjust(bar.id, 'max', Math.max(1, Number(e.target.value)))}
                className="!w-16 !text-center !text-sm" />
            </div>
            <span className="text-xs text-e-faint tabular-nums">{bar.current}/{bar.max}</span>
          </div>
        </div>
      ))}

      {adding ? (
        <div className="bg-white/[0.05] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <p className={lbl}>Nova barra</p>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da barra (ex: Mana, Energia…)" autoFocus />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className={lbl}>Máximo</p>
              <input type="number" min={1} value={newMax} onChange={(e) => setNewMax(Number(e.target.value))} className="!text-center" />
            </div>
            <div className="flex-1">
              <p className={lbl}>Cor</p>
              <div className="flex gap-1 flex-wrap">
                {BAR_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-lg border-2 cursor-pointer transition-transform ${newColor === c ? 'scale-110 border-white/50' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <CheckField checked={newColetiva} onChange={setNewColetiva} color="sky"
            label="Barra coletiva" desc="Visível para todos os jogadores" />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => setAdding(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" className="flex-1" disabled={!newName.trim() || saving} onClick={handleAdd}>
              {saving ? 'Criando…' : 'Criar'}
            </Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-e-faint hover:border-white/20 hover:text-e-sub text-sm transition-colors cursor-pointer">
          <Plus size={13} /> Adicionar barra
        </button>
      )}
    </div>
  );
}

// ── EssenciasPanel ────────────────────────────────────────────────────────────

const TYPE_COLORS_PANEL: Record<string, { border: string; badge: string; text: string }> = {
  Elemental: { border: '#d4a84e55', badge: '#d4a84e22', text: '#d4a84e' },
  Grande:  { border: '#d4a84e55', badge: '#d4a84e22', text: '#d4a84e' },
  Mitica:  { border: '#a855f755', badge: '#a855f722', text: '#a855f7' },
  Derivada:{ border: '#4ade8055', badge: '#4ade8022', text: '#4ade80' },
};

function EssenciasPanel({ player, onUpdate }: { player: Player; onUpdate: (p: Player) => void }) {
  const [essencias,    setEssencias]    = useState<Essencia[]>([]);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [processing,   setProcessing]   = useState<string | null>(null);
  const [essSearch,    setEssSearch]    = useState('');

  useEffect(() => {
    api.get<Essencia[]>('/master/essencias').then((r) => setEssencias(r.data)).catch(() => {});
  }, []);

  const obtained = player.essenciasObtidas ?? [];
  const obtainedIds = new Set(obtained.map((o) => o.essenciaId));
  const available = essencias.filter((e) => !obtainedIds.has(e.id));
  const selectedEss = essencias.find((e) => e.id === selectedId);

  const filteredAvailable = available.filter((e) =>
    !essSearch.trim() || e.name.toLowerCase().includes(essSearch.toLowerCase())
  );

  async function grantEssencia(essenciaId: string) {
    setProcessing(essenciaId);
    try {
      const res = await api.post<Player>(`/master/players/${player.id}/essencias`, { essenciaId });
      onUpdate(res.data);
      setSelectedId(null);
    } catch {}
    finally { setProcessing(null); }
  }

  async function removeEssencia(essenciaId: string) {
    setProcessing(essenciaId);
    try {
      const res = await api.delete<Player>(`/master/players/${player.id}/essencias/${essenciaId}`);
      onUpdate(res.data);
    } catch {}
    finally { setProcessing(null); }
  }

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* ── Left: conceder ── */}
      <div className="w-72 shrink-0 border-r border-white/10 flex flex-col">
        <div className="p-3 border-b border-white/10 shrink-0 flex flex-col gap-2">
          <p className={lbl + " !mb-0"}>Conceder essência</p>
          <input
            value={essSearch}
            onChange={(e) => setEssSearch(e.target.value)}
            placeholder="Buscar essência…"
            className="w-full text-xs rounded-lg px-2.5 py-1.5 bg-black/30 border border-white/10 text-e-text outline-none placeholder:text-e-faint focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {available.length === 0 ? (
            <p className="text-xs text-e-faint text-center py-6 italic">Todas as essências já foram concedidas.</p>
          ) : filteredAvailable.length === 0 ? (
            <p className="text-xs text-e-faint text-center py-6">Nenhuma essência encontrada.</p>
          ) : filteredAvailable.map((e) => {
            const c = TYPE_COLORS_PANEL[e.type] ?? { border: '#71717a55', badge: '#71717a22', text: '#71717a' };
            const isSelected = e.id === selectedId;
            const bonuses = Object.entries(e.attributeBonus ?? {}).filter(([, v]) => v !== 0);
            return (
              <button key={e.id} type="button"
                onClick={() => setSelectedId(id => id === e.id ? null : e.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                  isSelected ? 'border-e-accent bg-e-accent/5' : 'border-white/10 bg-black/30 hover:border-white/20'
                }`}
                style={isSelected ? {} : { borderLeftColor: c.text + '66', borderLeftWidth: 3 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`flex-1 text-xs font-semibold truncate ${isSelected ? 'text-e-accent' : 'text-e-text'}`}>{e.name}</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
                    style={{ background: c.badge, color: c.text }}>{e.type}</span>
                </div>
                {bonuses.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {bonuses.map(([attr, val]) => (
                      <span key={attr} className="text-[9px] text-e-faint">
                        {attr.slice(0,3).toUpperCase()}{val > 0 ? '+' : ''}{val}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedEss && (() => {
          const c = TYPE_COLORS_PANEL[selectedEss.type] ?? { border: '#71717a55', badge: '#71717a22', text: '#71717a' };
          return (
            <div className="p-3 border-t border-white/10 shrink-0 flex flex-col gap-2">
              <div className="bg-black/30 rounded-lg p-2.5 flex flex-col gap-1" style={{ borderLeft: `3px solid ${c.text}` }}>
                <p className="text-xs font-semibold text-e-text">{selectedEss.name}</p>
                {selectedEss.desc && <p className="text-[11px] text-e-faint leading-snug line-clamp-2">{selectedEss.desc}</p>}
                {selectedEss.skillIds.length > 0 && (
                  <p className="text-[10px] text-e-faint">{selectedEss.skillIds.length} habilidade{selectedEss.skillIds.length !== 1 ? 's' : ''} desbloqueada{selectedEss.skillIds.length !== 1 ? 's' : ''}</p>
                )}
              </div>
              <Button variant="primary" size="sm" disabled={processing === selectedEss.id} onClick={() => grantEssencia(selectedEss.id)}>
                {processing === selectedEss.id ? 'Concedendo…' : 'Conceder'}
              </Button>
            </div>
          );
        })()}
      </div>

      {/* ── Right: obtidas ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {obtained.length === 0 ? (
          <p className="text-sm text-e-faint text-center py-8">Nenhuma essência obtida.</p>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {obtained.map((o) => {
              const ess = essencias.find((e) => e.id === o.essenciaId);
              if (!ess) return null;
              const c = TYPE_COLORS_PANEL[ess.type] ?? { border: '#71717a55', badge: '#71717a22', text: '#71717a' };
              const bonuses = Object.entries(ess.attributeBonus ?? {}).filter(([, v]) => v !== 0);
              const busy = processing === o.essenciaId;
              return (
                <div key={o.essenciaId} className="rounded-xl border bg-white/[0.05] p-3 flex flex-col gap-2" style={{ borderColor: c.border }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-e-text truncate">{ess.name}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: c.badge, color: c.text }}>
                        {ess.type}
                      </span>
                    </div>
                    <button
                      onClick={() => removeEssencia(o.essenciaId)}
                      disabled={busy}
                      className="p-1.5 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-danger/10 disabled:opacity-40 cursor-pointer transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {ess.desc && <p className="text-xs text-e-faint line-clamp-2">{ess.desc}</p>}
                  {bonuses.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {bonuses.map(([attr, val]) => (
                        <span key={attr} className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 text-e-text">
                          {attr.slice(0,3).toUpperCase()} {val > 0 ? '+' : ''}{val}
                        </span>
                      ))}
                    </div>
                  )}
                  {o.unlockedSkillIds.length > 0 && (
                    <p className="text-[10px] text-e-faint">
                      {o.unlockedSkillIds.length} habilidade{o.unlockedSkillIds.length !== 1 ? 's' : ''} desbloqueada{o.unlockedSkillIds.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── DetalhesModal (main) ──────────────────────────────────────────────────────

type AbaFicha = "inventario" | "habilidades" | "essencias" | "barras" | "efeitos";

const ABAS_FICHA: { id: AbaFicha; label: string; desc: string; Icon: LucideIcon }[] = [
  { id: "inventario",  label: "Inventário",  desc: "Equipamento, itens e o que dar ao jogador", Icon: Backpack },
  { id: "habilidades", label: "Habilidades", desc: "Árvore, slots, maestria e bloqueios",        Icon: Wand2 },
  { id: "essencias",   label: "Essências",   desc: "Essências obtidas e derivadas",              Icon: Gem },
  { id: "barras",      label: "Barras",      desc: "Barras personalizadas e coletivas",          Icon: BarChart3 },
  { id: "efeitos",     label: "Efeitos",     desc: "Efeitos de status ativos",                   Icon: Sparkles },
];

function xpParaNivelFicha(n: number): number {
  if (n <= 1) return 0;
  if (n <= 20) return 75 * (n * (n + 1) / 2 - 1) - 50 * (n - 1);
  const m = n - 20;
  return 14725 + m * (2750 + 150 * m);
}

/** Ficha completa do jogador: navegação lateral, recursos e recompensas sempre à vista. */
export default function DetalhesModal({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const { setPlayer } = useStore();
  const storePlayer = useStore((s) => s.players.find((p) => p.id === player.id));
  const p = storePlayer ?? player;
  const [tab, setTab] = useState<AbaFicha>("inventario");

  useEffect(() => {
    const fechar = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [onClose]);

  async function darXp(amount: number) {
    if (amount <= 0) return;
    try { const r = await api.put<Player>("/master/exp", { playerId: p.id, amount }); if (r.data) setPlayer(r.data); } catch {}
  }
  async function ajustarOuro(delta: number) {
    try { const r = await api.put<Player>(`/master/players/${p.id}/gold`, { delta }); if (r.data) setPlayer(r.data); } catch {}
  }

  const contagem: Partial<Record<AbaFicha, number>> = {
    inventario: p.items.filter((i) => i.type !== "currency").length,
    essencias: p.essenciasObtidas?.length ?? 0,
    barras: p.customBars?.length ?? 0,
    efeitos: p.statusEffects?.length ?? 0,
  };
  const hpPct = p.hp.max > 0 ? p.hp.current / p.hp.max : 0;
  const nivelAtual = xpParaNivelFicha(p.char.level);
  const xpNecessario = xpParaNivelFicha(p.char.level + 1) - nivelAtual;
  const xpNoNivel = Math.max(0, Math.min(xpNecessario, (p.exp.total ?? 0) - nivelAtual));
  const aba = ABAS_FICHA.find((a) => a.id === tab)!;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-[1440px] h-[92vh] rounded-2xl border border-white/10 bg-[#131316] flex overflow-hidden shadow-2xl">

        {/* Lateral: identidade, recursos e navegação */}
        <nav className="w-64 shrink-0 border-r border-white/[0.07] bg-[#0f0f12] flex flex-col">
          <div className="p-5 flex flex-col items-center text-center gap-2.5 border-b border-white/[0.07]">
            <Avatar src={p.char.portraitUrl} nome={p.char.name} pct={hpPct} pctEs={fracEs(p.flow.current, p.flow.max)} size={88} />
            <div className="min-w-0 w-full">
              <p className="text-lg font-bold text-e-text truncate">{p.char.name}</p>
              <p className="text-xs text-e-sub truncate">{p.char.race} · {p.char.skillClass}{p.char.subClass ? ` · ${p.char.subClass}` : ""}</p>
            </div>
            <span className="text-[11px] font-bold text-e-gold bg-e-gold/10 border border-e-gold/25 px-2 py-0.5 rounded-md">Nível {p.char.level}</span>
            <div className="w-full flex flex-col gap-1">
              <Barra atual={xpNoNivel} max={xpNecessario} cor="#a3e635" altura={4} />
              <span className="text-[10px] text-e-faint tabular-nums">{xpNoNivel}/{xpNecessario} XP para o nível {p.char.level + 1}</span>
              {(p.exp.available ?? 0) > 0 && <span className="text-[11px] text-e-gold">{p.exp.available} pontos para distribuir</span>}
            </div>
            <div className="w-full grid grid-cols-2 gap-1.5 mt-1">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-e-faint">Vida</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: corVida(hpPct) }}>{p.hp.current}<span className="text-e-faint text-[11px] font-normal">/{p.hp.max}</span></p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-e-faint">Essência</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: COR_ES }}>{p.flow.current}<span className="text-e-faint text-[11px] font-normal">/{p.flow.max}</span></p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            {ABAS_FICHA.map(({ id, label, Icon }) => {
              const ativa = tab === id;
              const n = contagem[id];
              return (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={`w-full h-10 px-3 rounded-xl flex items-center gap-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    ativa ? "bg-white/[0.08] text-e-text" : "text-e-sub hover:text-e-text hover:bg-white/[0.04]"}`}>
                  <Icon size={15} className={ativa ? "text-e-accent" : ""} />
                  {label}
                  {n ? <span className={`ml-auto text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${ativa ? "bg-e-accent text-black" : "bg-white/10 text-e-sub"}`}>{n}</span> : null}
                </button>
              );
            })}
          </div>
          <p className="px-5 py-3 text-[10px] text-e-faint border-t border-white/[0.07]">Esc fecha a ficha</p>
        </nav>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-b border-white/[0.07]">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-e-text">{aba.label}</h2>
              <p className="text-xs text-e-faint">{aba.desc}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] pl-3 pr-1.5 py-1.5">
                <div className="flex flex-col leading-tight">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-e-faint">Experiência</span>
                  <span className="text-sm font-bold text-e-accent tabular-nums">{p.exp.total ?? 0}</span>
                </div>
                <AjusteRapido compacto apenasMais rotuloMais="Dar XP" placeholder="XP" onAplicar={darXp} />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] pl-3 pr-1.5 py-1.5">
                <div className="flex flex-col leading-tight">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-e-faint">Ouro</span>
                  <span className="text-sm font-bold text-e-gold tabular-nums">{p.gold ?? 0}</span>
                </div>
                <AjusteRapido compacto rotuloMenos="Tirar" rotuloMais="Dar" placeholder="ouro" onAplicar={ajustarOuro} />
              </div>
              <button onClick={onClose} title="Fechar (Esc)"
                className="w-9 h-9 rounded-xl text-e-faint hover:text-e-text hover:bg-white/5 flex items-center justify-center cursor-pointer">
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {tab === "inventario" ? (
              <InventarioPanel player={p} onUpdate={setPlayer} />
            ) : tab === "habilidades" ? (
              <HabilidadesPanel player={p} onUpdate={setPlayer} />
            ) : tab === "essencias" ? (
              <EssenciasPanel player={p} onUpdate={setPlayer} />
            ) : tab === "barras" ? (
              <CustomBarsPanel player={p} onUpdate={setPlayer} />
            ) : (
              <EfeitosPanel player={p} onUpdate={setPlayer} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
