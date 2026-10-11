"use client";

import type { Skill } from "@/components/sections/Habilidades/SkillCard";
import { CheckField } from '@/components/ui/Checkbox';
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { RARITY_LABELS, rarityColor } from "@/lib/rarity";
import type { ClassKit, ClassPerks, ItemCatalog } from "@/store/types";
import { ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  kit?: ClassKit;
  skills: Skill[];
  items: ItemCatalog[];
  onClose: () => void;
  onSaved: (k: ClassKit) => void;
}

const lbl =
  "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";
const inp =
  "w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors";

const WEAPON_TYPES = [
  { value: "espadas", label: "Espadas" },
  { value: "rapieiras", label: "Rapieiras" },
  { value: "alabardas", label: "Alabardas" },
  { value: "lancas", label: "Lanças" },
  { value: "machados-de-guerra", label: "Machados de guerra" },
  { value: "machadinhas", label: "Machadinhas" },
  { value: "martelos", label: "Martelos" },
  { value: "armas-colossais", label: "Armas colossais" },
  { value: "adagas", label: "Adagas" },
  { value: "garras", label: "Garras" },
  { value: "cajado", label: "Cajado" },
  { value: "grimorio", label: "Grimório" },
  { value: "orbe", label: "Orbe" },
  { value: "arcos", label: "Arcos" },
  { value: "bestas", label: "Bestas" },
  { value: "pistolas", label: "Pistolas" },
  { value: "luvas-manoplas", label: "Luvas & manoplas" },
  { value: "escudos", label: "Escudos" },
];

const WEAPON_TYPE_LABELS = Object.fromEntries(
  WEAPON_TYPES.map(({ value, label }) => [value, label]),
);

const ARMOR_WEIGHT_LABELS: Record<string, string> = {
  leve: "Leve",
  média: "Média",
  pesada: "Pesada",
};

function itemSubtype(i: ItemCatalog): string | undefined {
  if (i.type === "weapon" && i.weaponType) return WEAPON_TYPE_LABELS[i.weaponType] ?? i.weaponType;
  if (i.type === "armor" && i.armorWeight) return ARMOR_WEIGHT_LABELS[i.armorWeight] ?? i.armorWeight;
  return undefined;
}

const ATTR_ABBREV_OPTS = [
  { value: "FOR", label: "FOR — Força" },
  { value: "AGI", label: "AGI — Agilidade" },
  { value: "INT", label: "INT — Inteligência" },
  { value: "RES", label: "RES — Resistência" },
  { value: "FLX", label: "FLX — Fluxo" },
  { value: "SAB", label: "SAB — Sabedoria" },
  { value: "PRE", label: "PRE — Presença" },
  { value: "DEF", label: "DEF — Defesa" },
];

function AttrDropdown({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude?: string;
}) {
  const [open, setOpen] = useState(false);
  const opts = [
    { value: "", label: "Nenhum" },
    ...ATTR_ABBREV_OPTS.filter((o) => o.value !== exclude),
  ];
  const current = opts.find((o) => o.value === value);
  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors"
      >
        <span
          className={`flex-1 truncate ${current?.value ? "text-e-text" : "text-e-faint"}`}
        >
          {current?.label ?? "Nenhum"}
        </span>
        <ChevronDown
          size={13}
          className={`text-e-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl max-h-52 overflow-y-auto">
          {opts.map((opt) => (
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

export default function ClassKitModal({
  kit,
  skills,
  items,
  onClose,
  onSaved,
}: Props) {
  const editing = !!kit;

  const [skillClass, setSkillClass] = useState(kit?.skillClass ?? "");

  // Habilidades iniciais
  const [skillSearch, setSkillSearch] = useState("");
  const [starterSkillIds, setStarterSkillIds] = useState<string[]>(
    kit?.starterSkillIds ?? [],
  );

  // Itens iniciais: { id, qty }
  const [itemSearch, setItemSearch] = useState("");
  const [starterItems, setStarterItems] = useState<
    { id: string; qty: number }[]
  >(kit?.starterItems.map((i) => ({ id: i.id, qty: i.qty })) ?? []);

  const [hasPressureBar, setHasPressureBar] = useState(
    kit?.perks?.hasPressureBar ?? false,
  );
  const [unarmedDanoBase, setUnarmedDanoBase] = useState(
    String(kit?.perks?.unarmedAttack?.damageBase ?? ""),
  );
  const unarmedAttrParts =
    kit?.perks?.unarmedAttack?.attribute?.split("/") ?? [];
  const [unarmedAttr1, setUnarmedAttr1] = useState(unarmedAttrParts[0] ?? "");
  const [unarmedAttr2, setUnarmedAttr2] = useState(unarmedAttrParts[1] ?? "");

  // Proficiências iniciais da classe; também alimentam o sorteador de itens (allowedWeaponTypes)
  const [allowedWeaponTypes, setAllowedWeaponTypes] = useState<string[]>(
    kit?.proficienciasIniciais ?? kit?.allowedWeaponTypes ?? [],
  );

  // Bônus de PV/Fluxo máximo por nível acima do 1
  const [pvPorNivel, setPvPorNivel] = useState<number>(kit?.pvPorNivel ?? 0);
  const [fluxoPorNivel, setFluxoPorNivel] = useState<number>(kit?.fluxoPorNivel ?? 0);

  const [loading, setLoading] = useState(false);

  function toggleWeapon(value: string) {
    setAllowedWeaponTypes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  }

  function toggleSkill(id: string) {
    setStarterSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addItem(id: string) {
    setStarterItems((prev) => {
      if (prev.find((x) => x.id === id)) return prev;
      return [...prev, { id, qty: 1 }];
    });
    setItemSearch("");
  }

  function removeItem(id: string) {
    setStarterItems((prev) => prev.filter((x) => x.id !== id));
  }

  function setItemQty(id: string, qty: number) {
    setStarterItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qty } : x)),
    );
  }

  async function save() {
    if (!skillClass.trim()) return;
    setLoading(true);

    const builtItems = starterItems.map(({ id, qty }) => {
      const catalog = items.find((i) => i.id === id);
      return catalog
        ? { ...catalog, qty }
        : { id, name: "", desc: "", qty, type: "normal" };
    });

    const attrStr = [unarmedAttr1, unarmedAttr2].filter(Boolean).join("/");
    const unarmedAttack =
      unarmedDanoBase !== "" && attrStr
        ? { damageBase: Number(unarmedDanoBase), attribute: attrStr }
        : undefined;
    const perks: ClassPerks = { hasPressureBar, unarmedAttack };

    const body = {
      skillClass: skillClass.trim(),
      starterSlots: [],
      starterSkillIds,
      starterItems: builtItems,
      starterEquipment: kit?.starterEquipment ?? {},
      allowedWeaponTypes,
      proficienciasIniciais: allowedWeaponTypes,
      pvPorNivel,
      fluxoPorNivel,
      perks,
    };

    try {
      const res = editing
        ? await api.put<ClassKit>(`/master/kits/${kit!.id}`, body)
        : await api.post<ClassKit>("/master/kits", body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );
  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) &&
      !starterItems.find((x) => x.id === i.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[560px] max-h-[92vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text">
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">
              {editing ? "Editar classe" : "Nova classe"}
            </h2>
            <button
              onClick={onClose}
              className="opacity-50 hover:opacity-100 text-sm"
            >
              ✕
            </button>
          </div>

          {/* Nome da classe */}
          <div>
            <label className={lbl}>Nome da classe</label>
            <input
              value={skillClass}
              onChange={(e) => setSkillClass(e.target.value)}
              className={inp}
              placeholder="ex: Intenso, Preciso, Guardião…"
            />
          </div>

          {/* Peculiaridades */}
          <div className="flex flex-col gap-3">
            <label className={lbl}>Peculiaridades da classe</label>
            <CheckField checked={hasPressureBar} onChange={setHasPressureBar} color="orange"
              label="Barra de Pressão" desc="Habilita o recurso de pressão (ex: Intenso)"
              className="px-3 py-2.5 rounded-xl bg-e-bg border border-e-border hover:border-e-border2 transition-colors" />
            <div className="flex flex-col gap-1.5">
              <label className={lbl}>Ataque desarmado</label>
              <div className="flex gap-2">
                <div className="w-24">
                  <label className="text-[10px] text-e-faint mb-1 block">
                    Dano base
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={unarmedDanoBase}
                    onChange={(e) => setUnarmedDanoBase(e.target.value)}
                    className={`text-center ${inp}`}
                    placeholder="—"
                  />
                </div>
                <div className="flex gap-2 flex-1">
                  <div className="flex-1">
                    <label className="text-[10px] text-e-faint mb-1 block">
                      Atributo 1
                    </label>
                    <AttrDropdown
                      value={unarmedAttr1}
                      onChange={(v) => {
                        setUnarmedAttr1(v);
                        if (!v) setUnarmedAttr2("");
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-e-faint mb-1 block">
                      Atributo 2
                    </label>
                    <AttrDropdown
                      value={unarmedAttr2}
                      onChange={setUnarmedAttr2}
                      exclude={unarmedAttr1}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-e-faint">
                Desarmado: dano_base + d20×atributo / equilíbrio sem proficiência (padrão 6)
              </p>
            </div>
          </div>

          {/* PV e Fluxo por nível */}
          <div className="flex flex-col gap-2">
            <label className={lbl}>Ganho por nível</label>
            <div className="flex gap-3">
              <label className="flex flex-col gap-1 w-36">
                <span className="text-[10px] text-e-faint">PV por nível</span>
                <input type="number" min={0} value={pvPorNivel}
                  onChange={(e) => setPvPorNivel(Math.max(0, Number(e.target.value) || 0))}
                  className="text-center text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2" />
              </label>
              <label className="flex flex-col gap-1 w-36">
                <span className="text-[10px] text-e-faint">Fluxo por nível</span>
                <input type="number" min={0} value={fluxoPorNivel}
                  onChange={(e) => setFluxoPorNivel(Math.max(0, Number(e.target.value) || 0))}
                  className="text-center text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2" />
              </label>
            </div>
            <p className="text-[11px] text-e-faint">
              A cada nível acima do 1, soma ao PV e ao Fluxo máximos (além do que vem dos atributos). Ao subir de nível, o atual sobe o mesmo tanto.
            </p>
          </div>

          {/* Proficiências iniciais */}
          <div className="flex flex-col gap-2">
            <label className={lbl}>Proficiências iniciais</label>
            <p className="text-[11px] text-e-faint -mt-1">
              Qualquer classe equipa qualquer arma. Sem proficiência: ataque básico a /6, sem skills da categoria e sem propriedade especial.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WEAPON_TYPES.map(({ value, label }) => {
                const active = allowedWeaponTypes.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleWeapon(value)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors border
                    ${
                      active
                        ? "bg-e-accent/20 border-e-accent text-e-accent"
                        : "bg-e-bg border-e-border text-e-faint hover:border-e-border2"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habilidades iniciais */}
          <div className="flex flex-col gap-2">
            <label className={lbl}>Habilidades iniciais</label>
            <input
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Buscar habilidade…"
              className={inp}
            />
            {skillSearch && (
              <div className="border border-e-border rounded-xl bg-e-bg max-h-36 overflow-y-auto">
                {filteredSkills.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-e-faint">
                    Nenhuma encontrada.
                  </p>
                ) : (
                  filteredSkills.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        toggleSkill(s.id);
                        setSkillSearch("");
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors text-e-text flex items-center justify-between"
                    >
                      <span>{s.name}</span>
                      <span className="text-[10px] text-e-faint">
                        {s.skillClass || "Geral"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
            {starterSkillIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {starterSkillIds.map((id) => {
                  const s = skills.find((x) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-e-card text-xs text-e-text"
                    >
                      {s?.name ?? id}
                      <button
                        onClick={() => toggleSkill(id)}
                        className="opacity-50 hover:opacity-100"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Itens iniciais */}
          <div className="flex flex-col gap-2">
            <label className={lbl}>Itens iniciais</label>
            <input
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Buscar item no catálogo…"
              className={inp}
            />
            {itemSearch && (
              <div className="border border-e-border rounded-xl bg-e-bg max-h-36 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-e-faint">
                    Nenhum encontrado.
                  </p>
                ) : (
                  filteredItems.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => addItem(i.id)}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors text-e-text flex items-center justify-between gap-2"
                    >
                      <span className="flex-1 truncate">{i.name}</span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {i.rarity && (
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: rarityColor(i.rarity) }}
                          >
                            {RARITY_LABELS[i.rarity as keyof typeof RARITY_LABELS] ?? i.rarity}
                          </span>
                        )}
                        {itemSubtype(i) && (
                          <span className="text-[10px] text-e-faint">
                            {itemSubtype(i)}
                          </span>
                        )}
                        <span className="text-[10px] text-e-faint capitalize">
                          {i.type}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
            {starterItems.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {starterItems.map(({ id, qty }) => {
                  const item = items.find((x) => x.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-e-card"
                    >
                      <span className="flex-1 text-sm text-e-text flex items-center gap-1.5 truncate">
                        {item?.name ?? id}
                        {item?.rarity && (
                          <span
                            className="text-[10px] font-medium shrink-0"
                            style={{ color: rarityColor(item.rarity) }}
                          >
                            {RARITY_LABELS[item.rarity as keyof typeof RARITY_LABELS] ?? item.rarity}
                          </span>
                        )}
                        {item && itemSubtype(item) && (
                          <span className="text-[10px] text-e-faint shrink-0">
                            {itemSubtype(item)}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setItemQty(id, Math.max(1, qty - 1))}
                          className="w-5 h-5 rounded text-e-sub hover:text-e-text flex items-center justify-center text-xs"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-mono text-e-text">
                          {qty}
                        </span>
                        <button
                          onClick={() => setItemQty(id, qty + 1)}
                          className="w-5 h-5 rounded text-e-sub hover:text-e-text flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(id)}
                        className="opacity-40 hover:opacity-80"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-1 border-t border-e-border">
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
              disabled={!skillClass.trim() || loading}
            >
              {loading ? "Salvando…" : editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
