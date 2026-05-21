"use client";

import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { RARITY_COLORS, RARITY_LABELS, RARITY_ORDER } from "@/lib/rarity";
import type { ItemCatalog, ItemRequirements } from "@/store/types";
import {
  Activity,
  Amphora,
  Anchor,
  Apple,
  Axe,
  Backpack,
  Bandage,
  Barrel,
  Bird,
  Bomb,
  BookOpen,
  BottleWine,
  BowArrow,
  Box,
  Bug,
  Cable,
  Cat,
  ChevronDown,
  Circle,
  CircleDollarSign,
  Club,
  Coffee,
  Coins,
  Compass,
  Crosshair,
  Crown,
  Cuboid,
  Diamond,
  Dices,
  Dog,
  Droplets,
  Drumstick,
  Dumbbell,
  Eye,
  Feather,
  Fish,
  Flame,
  Flashlight,
  FlaskConical,
  Footprints,
  Gem,
  Hammer,
  HardHat,
  Heart,
  HeartPulse,
  Hourglass,
  Key,
  Lasso,
  Leaf,
  Link,
  Lock,
  Magnet,
  Map,
  Moon,
  Music,
  Package,
  Pickaxe,
  Pill,
  Plus,
  Rabbit,
  Ribbon,
  Salad,
  Scroll,
  Shield,
  ShieldPlus,
  Shirt,
  Shovel,
  Skull,
  Snowflake,
  Sparkles,
  Squirrel,
  Star,
  Sun,
  Sword,
  Swords,
  Target,
  Tent,
  Trash2,
  TreePine,
  Trophy,
  Wand,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  item?: ItemCatalog;
  defaultType?: string;
  onClose: () => void;
  onSaved: (i: ItemCatalog) => void;
}

/* ── Icon system ─────────────────────────────────────────────── */
const ICON_CATEGORIES: { label: string; icons: Record<string, LucideIcon> }[] =
  [
    {
      label: "Armas",
      icons: {
        Sword,
        Swords,
        Axe,
        Wand,
        BowArrow,
        Crosshair,
        Target,
        Bomb,
        Club,
      },
    },
    {
      label: "Defesa / Cura",
      icons: { Shield, ShieldPlus, Heart, HeartPulse, Bandage, Pill, Activity },
    },
    {
      label: "Magia / Elemental",
      icons: { Flame, Zap, Wind, Snowflake, Droplets, Moon, Sun, Sparkles },
    },
    { label: "Veneno / Status", icons: { Skull, Bug } },
    {
      label: "Consumível",
      icons: {
        FlaskConical,
        Amphora,
        BottleWine,
        Barrel,
        Apple,
        Drumstick,
        Salad,
        Coffee,
      },
    },
    {
      label: "Acessórios",
      icons: { Anchor, Ribbon, HardHat, Footprints },
    },
    {
      label: "Equipamento",
      icons: {
        Shirt,
        Backpack,
        Tent,
        Lasso,
        Cable,
        Wrench,
        Hammer,
        Pickaxe,
        Shovel,
        Dumbbell,
        Key,
        Flashlight,
      },
    },
    {
      label: "Tesouros",
      icons: { Gem, Diamond, Coins, CircleDollarSign, Crown, Trophy },
    },
    {
      label: "Natureza",
      icons: {
        TreePine,
        Leaf,
        Feather,
        Bird,
        Fish,
        Dog,
        Cat,
        Rabbit,
        Squirrel,
      },
    },
    {
      label: "Misc",
      icons: {
        Package,
        BookOpen,
        Scroll,
        Star,
        Link,
        Circle,
        Eye,
        Map,
        Music,
        Hourglass,
        Compass,
        Dices,
        Cuboid,
        Lock,
        Magnet,
        Box,
      },
    },
  ];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_CATEGORIES.flatMap((c) => Object.entries(c.icons)),
);

function ItemIconPreview({
  value,
  size = 14,
}: {
  value: string;
  size?: number;
}) {
  if (value?.startsWith("img:")) {
    return (
      <img
        src={value.slice(4)}
        alt=""
        width={size * 1.5}
        height={size * 1.5}
        className="object-cover rounded"
      />
    );
  }
  const Icon = (value && ICON_MAP[value]) || Package;
  return <Icon size={size} />;
}

/* ── Icon Tile ───────────────────────────────────────────────── */
function IconTile({
  name,
  Icon,
  selected,
  onClick,
}: {
  name: string;
  Icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={name}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors cursor-pointer ${
        selected
          ? "bg-e-accent/15 text-e-accent"
          : "hover:bg-e-card text-e-text"
      }`}
    >
      <Icon size={15} className="shrink-0" />
      <span className="text-[8px] leading-none truncate w-full text-center text-e-sub">
        {name}
      </span>
    </button>
  );
}

/* ── Icon Picker ─────────────────────────────────────────────── */
function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"icone" | "imagem">(
    value?.startsWith("img:") ? "imagem" : "icone",
  );
  const [imgUrl, setImgUrl] = useState(
    value?.startsWith("img:") ? value.slice(4) : "",
  );
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const isImg = value?.startsWith("img:");
  const query = search.trim().toLowerCase();
  const allIcons = ICON_CATEGORIES.flatMap((c) => Object.entries(c.icons));
  const filtered = query
    ? allIcons.filter(([n]) => n.toLowerCase().includes(query))
    : null;

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen((v) => !v);
  }

  function pick(name: string) {
    onChange(name);
    setOpen(false);
    setSearch("");
  }
  function close() {
    setOpen(false);
    setSearch("");
  }

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors"
      >
        <span className="text-e-sub shrink-0">
          <ItemIconPreview value={value} size={13} />
        </span>
        <span className="flex-1 text-e-text truncate">
          {isImg
            ? "Imagem personalizada"
            : value || <span className="text-e-faint">Selecionar ícone…</span>}
        </span>
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={close} />
            <div
              className="fixed z-[9999] bg-e-surface border border-e-border rounded-xl shadow-2xl"
              style={{ top: pos.top, left: pos.left, width: 280 }}
            >
              {/* Mode tabs */}
              <div className="flex gap-1 p-2 border-b border-e-border">
                {(["icone", "imagem"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === m ? "bg-e-card text-e-text" : "text-e-sub hover:text-e-text"}`}
                  >
                    {m === "icone" ? "Ícone" : "URL de imagem"}
                  </button>
                ))}
              </div>

              {mode === "icone" ? (
                <>
                  <div className="p-2 border-b border-e-border">
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Pesquisar ícone…"
                      className="w-full text-xs rounded-lg px-2 py-1.5 bg-e-bg border border-e-border text-e-text outline-none placeholder:text-e-faint"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filtered ? (
                      filtered.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-e-faint text-center">
                          Nenhum ícone encontrado
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 gap-0.5 p-2">
                          {filtered.map(([name, Icon]) => (
                            <IconTile
                              key={name}
                              name={name}
                              Icon={Icon}
                              selected={name === value}
                              onClick={() => pick(name)}
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      ICON_CATEGORIES.map((cat) => (
                        <div key={cat.label}>
                          <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-e-faint bg-e-surface sticky top-0 border-b border-e-border/40">
                            {cat.label}
                          </div>
                          <div className="grid grid-cols-4 gap-0.5 p-2">
                            {Object.entries(cat.icons).map(([name, Icon]) => (
                              <IconTile
                                key={name}
                                name={name}
                                Icon={Icon}
                                selected={name === value}
                                onClick={() => pick(name)}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="p-3 flex flex-col gap-2">
                  <input
                    value={imgUrl}
                    onChange={(e) => setImgUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2"
                  />
                  {imgUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={imgUrl}
                        alt=""
                        className="w-8 h-8 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="text-xs text-e-sub truncate">
                        {imgUrl}
                      </span>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onChange(`img:${imgUrl}`);
                      close();
                    }}
                    disabled={!imgUrl.trim()}
                  >
                    Usar imagem
                  </Button>
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

/* ── Generic dropdown ────────────────────────────────────────── */
function Dropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors"
      >
        <span className="flex-1 text-e-text truncate">
          {selected?.label ?? <span className="text-e-faint">Selecionar…</span>}
        </span>
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl max-h-48 overflow-y-auto">
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

/* ── Options ─────────────────────────────────────────────────── */
const TYPE_OPTS = [
  { value: "weapon", label: "⚔️  Arma" },
  { value: "armor", label: "🛡️  Armadura" },
  { value: "accessory", label: "💍  Acessório" },
  { value: "normal", label: "🎒  Normal" },
  { value: "chave", label: "🔑  Chave" },
];
const WEAPON_OPTS = [
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
const DMGATTR_OPTS = [
  { value: "", label: "Nenhum" },
  { value: "FOR", label: "FOR — Força" },
  { value: "AGI", label: "AGI — Agilidade" },
  { value: "INT", label: "INT — Inteligência" },
  { value: "RES", label: "RES — Resistência" },
  { value: "FLX", label: "FLX — Fluxo" },
  { value: "SAB", label: "SAB — Sabedoria" },
  { value: "PRE", label: "PRE — Presença" },
  { value: "DEF", label: "DEF — Defesa" },
];
const SLOT_OPTS_WEAPON = [
  ["mainHand", "Mão Principal"],
  ["offHand", "Offhand"],
  ["both", "Qualquer mão"],
].map(([v, l]) => ({ value: v, label: l }));
const SLOT_OPTS_ACCESSORY = [
  ["amulet", "Amuleto"],
  ["ring", "Anel"],
  ["utility", "Utilitário"],
].map(([v, l]) => ({ value: v, label: l }));
const ATTR_OPTS = [
  ["strength", "FOR — Força"],
  ["agility", "AGI — Agilidade"],
  ["intelligence", "INT — Inteligência"],
  ["resistance", "RES — Resistência"],
  ["flow", "FLX — Fluxo"],
  ["wisdom", "SAB — Sabedoria"],
  ["presence", "PRE — Presença"],
  ["defense", "DEF — Defesa"],
].map(([v, l]) => ({ value: v, label: l }));

const lbl =
  "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";
const inp =
  "w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors";

/* ── Modal ───────────────────────────────────────────────────── */
export default function ItemModal({
  item,
  defaultType,
  onClose,
  onSaved,
}: Props) {
  const editing = !!item;

  const [name, setName] = useState(item?.name ?? "");
  const [desc, setDesc] = useState(item?.desc ?? "");
  const [type, setType] = useState(item?.type ?? defaultType ?? "consumable");
  const [icon, setIcon] = useState(item?.icon ?? "");
  const [equipSlot, setEquipSlot] = useState(item?.equipSlot ?? "");
  const [properties, setProperties] = useState(item?.properties ?? "");

  const [weaponType, setWeaponType] = useState(item?.weaponType ?? "curta");
  const [damageBase, setDamageBase] = useState(item?.damageBase ?? 0);
  const dmgAttrParts = item?.damageAttribute?.split("/") ?? [];
  const [dmgAttr1, setDmgAttr1] = useState(dmgAttrParts[0] ?? "");
  const [dmgAttr2, setDmgAttr2] = useState(dmgAttrParts[1] ?? "");
  const [armorWeight, setArmorWeight] = useState(item?.armorWeight ?? "");
  const [rarity, setRarity] = useState(item?.rarity ?? "");
  const [twoHanded, setTwoHanded] = useState(item?.twoHanded ?? false);

  // Attribute bonuses — armors pre-populate 'defense'
  const [bonuses, setBonuses] = useState<[string, number][]>(() => {
    const existing = Object.entries(item?.attributeBonus ?? {});
    if (
      !item &&
      (defaultType === "armor" || type === "armor") &&
      !existing.find(([k]) => k === "defense")
    ) {
      return [["defense", 0], ...existing];
    }
    return existing;
  });

  const [loading, setLoading] = useState(false);

  const [reqLevel, setReqLevel] = useState<number | "">(
    item?.requirements?.level ?? "",
  );
  const [reqAttrs, setReqAttrs] = useState<[string, number][]>(() =>
    Object.entries(item?.requirements?.attributes ?? {}),
  );

  function addReqAttr() {
    setReqAttrs((r) => [...r, ["strength", 1]]);
  }
  function updateReqAttrKey(i: number, v: string) {
    setReqAttrs((r) => r.map((x, j) => (j === i ? [v, x[1]] : x)));
  }
  function updateReqAttrVal(i: number, v: number) {
    setReqAttrs((r) => r.map((x, j) => (j === i ? [x[0], v] : x)));
  }
  function removeReqAttr(i: number) {
    setReqAttrs((r) => r.filter((_, j) => j !== i));
  }

  function handleTypeChange(t: string) {
    setType(t);
    // Reset equipSlot to a valid default for the new type
    if (t === "weapon") setEquipSlot("mainHand");
    else if (t === "armor") setEquipSlot("armor");
    else if (t === "accessory") setEquipSlot("amulet");
    else setEquipSlot("");
    if (t === "armor" && !bonuses.find(([k]) => k === "defense")) {
      setBonuses((b) => [["defense", 0], ...b]);
    }
  }

  function addBonus() {
    setBonuses((b) => [...b, ["strength", 1]]);
  }
  function updateBonusAttr(i: number, v: string) {
    setBonuses((b) => b.map((x, j) => (j === i ? [v, x[1]] : x)));
  }
  function updateBonusVal(i: number, v: number) {
    setBonuses((b) => b.map((x, j) => (j === i ? [x[0], v] : x)));
  }
  function removeBonus(i: number) {
    setBonuses((b) => b.filter((_, j) => j !== i));
  }

  const isWeapon = type === "weapon";
  const hasEquip =
    type === "weapon" || type === "armor" || type === "accessory";

  async function save() {
    if (!name.trim()) return;
    setLoading(true);
    const attrBonus =
      bonuses.length > 0 ? Object.fromEntries(bonuses) : undefined;
    const reqAttrObj =
      reqAttrs.length > 0 ? Object.fromEntries(reqAttrs) : undefined;
    const requirements: ItemRequirements | undefined =
      hasEquip && (reqLevel !== "" || reqAttrObj)
        ? {
            level: reqLevel !== "" ? reqLevel : undefined,
            attributes: reqAttrObj,
          }
        : undefined;

    const body: Partial<ItemCatalog> = {
      name: name.trim(),
      desc,
      type,
      icon: icon || undefined,
      equipSlot: equipSlot || undefined,
      attributeBonus: attrBonus,
      rarity: rarity || undefined,
      requirements,
    };
    if (isWeapon) {
      body.weaponType = weaponType;
      body.damageBase = damageBase;
      body.damageAttribute =
        [dmgAttr1, dmgAttr2].filter(Boolean).join("/") || undefined;
      body.properties = properties || undefined;
      body.twoHanded = twoHanded || undefined;
    }
    if (type === "armor") {
      body.damageReduction = attrBonus?.defense ?? 0;
      body.armorWeight = armorWeight || undefined;
    }
    try {
      const res = editing
        ? await api.put<ItemCatalog>(`/items/${item!.id}`, body)
        : await api.post<ItemCatalog>("/items", body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[480px] max-h-[90vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text">
        <div className="flex flex-col gap-5 p-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">
              {editing ? "Editar item" : "Novo item"}
            </h2>
            <button
              onClick={onClose}
              className="opacity-50 hover:opacity-100 text-sm"
            >
              ✕
            </button>
          </div>

          {/* Tipo */}
          <div>
            <label className={lbl}>Tipo</label>
            <Dropdown
              value={type}
              onChange={handleTypeChange}
              options={TYPE_OPTS}
            />
          </div>

          {/* Raridade */}
          <div>
            <label className={lbl}>Raridade</label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setRarity("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  rarity === ""
                    ? "border-e-border2 bg-e-card text-e-sub"
                    : "border-e-border text-e-faint hover:border-e-border2"
                }`}
              >
                Nenhuma
              </button>
              {RARITY_ORDER.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarity(r)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                  style={{
                    borderColor:
                      rarity === r ? RARITY_COLORS[r] : RARITY_COLORS[r] + "55",
                    color: RARITY_COLORS[r],
                    background:
                      rarity === r ? RARITY_COLORS[r] + "22" : "transparent",
                  }}
                >
                  {RARITY_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Ícone + Nome */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={lbl}>Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inp}
                placeholder="Nome do item"
              />
            </div>
          </div>

          {/* Ícone */}
          <div>
            <label className={lbl}>Ícone</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          {/* Descrição */}
          <div>
            <label className={lbl}>Descrição</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className={`resize-none ${inp}`}
              placeholder="Descrição…"
            />
          </div>

          {/* ── Weapon fields ── */}
          {isWeapon && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Tipo de arma</label>
                  <Dropdown
                    value={weaponType}
                    onChange={setWeaponType}
                    options={WEAPON_OPTS}
                  />
                </div>
                <div>
                  <label className={lbl}>Dano base</label>
                  <input
                    type="number"
                    value={damageBase}
                    onChange={(e) => setDamageBase(Number(e.target.value))}
                    className={`text-center ${inp}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Atributo 1</label>
                  <Dropdown
                    value={dmgAttr1}
                    onChange={(v) => {
                      setDmgAttr1(v);
                      if (!v) setDmgAttr2("");
                    }}
                    options={DMGATTR_OPTS}
                  />
                </div>
                <div>
                  <label className={lbl}>
                    Atributo 2{" "}
                    <span className="normal-case font-normal">
                      (usa o maior)
                    </span>
                  </label>
                  <Dropdown
                    value={dmgAttr2}
                    onChange={setDmgAttr2}
                    options={DMGATTR_OPTS.filter((o) => o.value !== dmgAttr1)}
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>Propriedades</label>
                <input
                  value={properties}
                  onChange={(e) => setProperties(e.target.value)}
                  className={inp}
                  placeholder="ex: perfurante, versátil…"
                />
              </div>
            </>
          )}

          {/* ── Equip slot ── */}
          {isWeapon && (
            <div>
              <label className={lbl}>Slot de equipamento</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "mainHand", label: "Mão principal", two: false },
                  { value: "offHand", label: "Offhand", two: false },
                  { value: "both", label: "Qualquer mão", two: false },
                  { value: "mainHand", label: "Duas mãos", two: true },
                ].map((o) => {
                  const active = equipSlot === o.value && twoHanded === o.two;
                  return (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => {
                        setEquipSlot(o.value);
                        setTwoHanded(o.two);
                      }}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${active ? "bg-e-accent/20 border-e-accent text-e-accent" : "bg-e-bg border-e-border text-e-faint hover:border-e-border2"}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {type === "accessory" && (
            <div>
              <label className={lbl}>Slot de equipamento</label>
              <div className="flex gap-2">
                {SLOT_OPTS_ACCESSORY.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setEquipSlot(o.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${equipSlot === o.value ? "bg-e-accent/20 border-e-accent text-e-accent" : "bg-e-bg border-e-border text-e-faint hover:border-e-border2"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Peso de armadura */}
          {type === "armor" && (
            <div>
              <label className={lbl}>Peso</label>
              <div className="flex gap-2">
                {[
                  { v: "leve", label: "Leve", hint: "1d20" },
                  { v: "média", label: "Média", hint: "Desvantagem" },
                  { v: "pesada", label: "Pesada", hint: "Sem desvio" },
                ].map(({ v, label, hint }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setArmorWeight(v)}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl border text-xs font-medium transition-colors cursor-pointer gap-0.5 ${
                      armorWeight === v
                        ? "bg-e-accent/15 border-e-accent text-e-accent"
                        : "border-e-border text-e-faint hover:border-e-border2 hover:text-e-sub"
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-[10px] opacity-60">{hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Attribute bonus (includes DEF for armor) ── */}
          {hasEquip && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className={lbl}>
                  {type === "armor"
                    ? "Atributos (DEF = proteção da armadura)"
                    : "Bônus de atributo"}
                </label>
                <button
                  onClick={addBonus}
                  className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text"
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>
              {bonuses.map(([attr, val], i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Dropdown
                      value={attr}
                      onChange={(v) => updateBonusAttr(i, v)}
                      options={ATTR_OPTS}
                    />
                  </div>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => updateBonusVal(i, Number(e.target.value))}
                    className="w-16 text-center text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2"
                  />
                  <button
                    onClick={() => removeBonus(i)}
                    className="opacity-40 hover:opacity-80 shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Pré-requisitos (itens equipáveis) ── */}
          {hasEquip && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className={lbl}>Pré-requisitos</label>
                <button
                  onClick={addReqAttr}
                  className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text"
                >
                  <Plus size={12} /> Atributo
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint w-14 shrink-0">
                  Nível
                </span>
                <input
                  type="number"
                  value={reqLevel}
                  onChange={(e) =>
                    setReqLevel(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  placeholder="—"
                  className="w-20 text-center text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2"
                />
              </div>
              {reqAttrs.map(([attr, val], i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Dropdown
                      value={attr}
                      onChange={(v) => updateReqAttrKey(i, v)}
                      options={ATTR_OPTS.filter((o) => o.value !== "defense")}
                    />
                  </div>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) =>
                      updateReqAttrVal(i, Number(e.target.value))
                    }
                    className="w-16 text-center text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2"
                  />
                  <button
                    onClick={() => removeReqAttr(i)}
                    className="opacity-40 hover:opacity-80 shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={save}
              disabled={!name.trim() || loading}
            >
              {loading ? "Salvando…" : editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
