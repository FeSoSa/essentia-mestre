"use client";

import { ItemIcon } from "@/components/sections/Itens/ItemCard";
import PhaseEditor, {
  EMPTY_ATTRS,
} from "@/components/sections/Mesa/PhaseEditor";
import Button from "@/components/ui/Button";
import { CheckField } from "@/components/ui/Checkbox";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { api } from "@/lib/api";
import { normalizeGdriveUrl, proxyUrl } from "@/lib/gdrive";
import type {
  BossAttributes,
  BossImmunity,
  BossPhase,
  BossResistance,
  BossTemplate,
  EnemyDrop,
  GoldDrop,
  GoldDropTier,
  ItemCatalog,
} from "@/store/types";
import { Coins, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import TracosDanoEditor from "@/components/shared/TracosDanoEditor";
import type { TracoDano } from "@/lib/tiposDano";

interface Props {
  template?: BossTemplate;
  onClose: () => void;
  onSaved: (t: BossTemplate) => void;
}

const lbl =
  "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";
const inp =
  "w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors";
const smallInp =
  "text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2 transition-colors";
const sec = "flex flex-col gap-3 mt-5 pt-5 border-t border-e-boss-border/40";
const secFirst = "flex flex-col gap-3 mt-4";
const secLabel =
  "text-[9px] font-bold uppercase tracking-widest text-e-boss-text/50";

const GOLD_TIER_OPTS: { value: GoldDropTier; label: string }[] = [
  { value: "pobre", label: "🪙 Pobre" },
  { value: "comum", label: "💰 Comum" },
  { value: "rico", label: "💎 Rico" },
  { value: "tesouro", label: "👑 Tesouro" },
];

const GOLD_TIER_DEFAULTS: Record<GoldDropTier, { min: number; max: number }> = {
  pobre: { min: 5, max: 30 },
  comum: { min: 30, max: 150 },
  rico: { min: 150, max: 700 },
  tesouro: { min: 700, max: 3500 },
};

type Tab = "base" | "fases" | "defesas" | "mais";

export default function BossTemplateModal({
  template,
  onClose,
  onSaved,
}: Props) {
  const editing = !!template;
  const [tab, setTab] = useState<Tab>("base");

  const [name, setName] = useState(template?.name ?? "");
  const [icon, setIcon] = useState(template?.icon ?? "👑");
  const [imageUrl, setImageUrl] = useState(template?.imageUrl ?? "");
  const [xp, setXp] = useState(template?.xp ?? 500);
  const [negaCritico, setNegaCritico] = useState(template?.negaCritico ?? false);
  const [tracosDano, setTracosDano] = useState<TracoDano[]>(template?.tracosDano ?? []);
  const [notes, setNotes] = useState(template?.notes ?? "");

  const initPhase = (n: number, hp: number): BossPhase => ({
    phaseNumber: n,
    name: "",
    hpMax: hp,
    attributes: { ...EMPTY_ATTRS } as BossAttributes,
    attacks: [],
    specialAbility: undefined,
  });

  const [phases, setPhases] = useState<BossPhase[]>(
    template?.phases ?? [initPhase(1, 100)],
  );
  const [immunities] = useState<BossImmunity[]>(
    template?.immunities ?? [],
  );
  const [resistances] = useState<BossResistance[]>(
    template?.resistances ?? [],
  );
  const [drops, setDrops] = useState<EnemyDrop[]>(
    (template?.drops ?? []).filter((d) => !d.goldDrop),
  );
  const [goldDrop, setGoldDrop] = useState<GoldDrop | null>(
    template?.drops.find((d) => d.goldDrop)?.goldDrop ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ItemCatalog[]>([]);
  const [itemSearch, setItemSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    api
      .get<ItemCatalog[]>("/items")
      .then((r) => setItems(r.data))
      .catch(() => {});
  }, []);

  function updatePhase(i: number, p: BossPhase) {
    setPhases((prev) =>
      prev.map((x, j) => (j === i ? { ...p, phaseNumber: i + 1 } : x)),
    );
  }
  function addPhase() {
    setPhases((prev) => [...prev, initPhase(prev.length + 1, 60)]);
  }
  function removePhase(i: number) {
    setPhases((prev) =>
      prev
        .filter((_, j) => j !== i)
        .map((p, j) => ({ ...p, phaseNumber: j + 1 })),
    );
  }

  function addDrop() {
    if (drops.length < 2) setDrops((d) => [...d, { name: "", icon: "🎁" }]);
  }
  function updateDrop(i: number, f: keyof EnemyDrop, v: string) {
    setDrops((d) => d.map((x, j) => (j === i ? { ...x, [f]: v } : x)));
  }
  function removeDrop(i: number) {
    setDrops((d) => d.filter((_, j) => j !== i));
    setItemSearch((s) => {
      const n = { ...s };
      delete n[i];
      return n;
    });
  }
  function linkItem(i: number, item: ItemCatalog) {
    setDrops((d) =>
      d.map((x, j) =>
        j === i
          ? { ...x, itemId: item.id, name: item.name, icon: item.icon ?? "🎁" }
          : x,
      ),
    );
    setItemSearch((s) => ({ ...s, [i]: "" }));
  }
  function unlinkItem(i: number) {
    setDrops((d) =>
      d.map((x, j) =>
        j === i ? { ...x, itemId: undefined, name: "", icon: "🎁" } : x,
      ),
    );
  }

  function addGoldDrop() {
    setGoldDrop({ tier: "rico", ...GOLD_TIER_DEFAULTS["rico"] });
  }
  function updateGoldTier(tier: GoldDropTier) {
    setGoldDrop((g) =>
      g ? { ...g, tier, ...GOLD_TIER_DEFAULTS[tier] } : null,
    );
  }

  async function save() {
    if (!name.trim() || phases.length < 1) return;
    setLoading(true);

    const allDrops: EnemyDrop[] = [...drops.filter((d) => d.itemId)];
    if (goldDrop) {
      allDrops.push({ name: "", icon: "🪙", goldDrop });
    }

    const body = {
      name: name.trim(),
      icon,
      imageUrl: imageUrl.trim() ? normalizeGdriveUrl(imageUrl.trim()) : undefined,
      type: "Boss",
      phases,
      immunities,
      resistances,
      drops: allDrops,
      xp,
      notes,
      negaCritico,
      tracosDano,
    };
    try {
      const res = editing
        ? await api.put<BossTemplate>(`/bosses/${template!.id}`, body)
        : await api.post<BossTemplate>("/bosses", body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const tabBtn = (id: Tab) =>
    `flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
      tab === id
        ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
        : "bg-e-bg border-e-boss-border/40 text-e-boss-text/60 hover:border-e-boss-border"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[520px] max-h-[92vh] overflow-y-auto rounded-xl border-2 border-e-boss-border bg-e-boss-bg text-e-boss-text">
        <div className="flex flex-col px-5 pt-5 pb-0">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span className="text-amber-400">★</span>
              {editing ? "Editar boss" : "Novo boss"}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center opacity-50 hover:opacity-100 hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1.5 border-b border-e-boss-border/40 pb-3">
            <button
              type="button"
              className={tabBtn("base")}
              onClick={() => setTab("base")}
            >
              Base
            </button>
            <button
              type="button"
              className={tabBtn("fases")}
              onClick={() => setTab("fases")}
            >
              Fases{" "}
              {phases.length > 0 && (
                <span className="ml-1 opacity-60">({phases.length})</span>
              )}
            </button>
            <button
              type="button"
              className={tabBtn("defesas")}
              onClick={() => setTab("defesas")}
            >
              Defesas
            </button>
            <button
              type="button"
              className={tabBtn("mais")}
              onClick={() => setTab("mais")}
            >
              Drops & Mais
            </button>
          </div>

          {/* ── ABA BASE ── */}
          {tab === "base" && (
            <>
              <div className={secFirst}>
                <div className="flex gap-2 items-center">
                  <EmojiPicker value={icon} onChange={setIcon} />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inp}
                    placeholder="Nome do boss"
                  />
                </div>
              </div>

              <div className={sec}>
                <label className={lbl}>
                  Imagem{" "}
                  <span className="normal-case font-normal">
                    (URL — opcional)
                  </span>
                </label>
                <div className="flex gap-2 items-center">
                  {imageUrl.trim() && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proxyUrl(normalizeGdriveUrl(imageUrl.trim()))}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-e-boss-border"
                    />
                  )}
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className={inp}
                    placeholder="https://…"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── ABA FASES ── */}
          {tab === "fases" && (
            <>
              <div className={secFirst}>
                <div className="flex items-center justify-between">
                  <p className={secLabel}>Fases ({phases.length})</p>
                  <button
                    onClick={addPhase}
                    className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Plus size={12} /> Adicionar fase
                  </button>
                </div>
                {phases.map((phase, i) => (
                  <PhaseEditor
                    key={i}
                    phase={phase}
                    index={i}
                    total={phases.length}
                    onChange={(p) => updatePhase(i, p)}
                    onRemove={() => removePhase(i)}
                  />
                ))}
                {phases.length < 1 && (
                  <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
                    Mínimo de 1 fase necessário.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── ABA DEFESAS ── */}
          {tab === "defesas" && (
            <>
              <div className={secFirst}>
                <p className={secLabel}>Fraquezas e resistências</p>
                <TracosDanoEditor value={tracosDano} onChange={setTracosDano} />
              </div>

            </>
          )}

          {/* ── ABA DROPS & MAIS ── */}
          {tab === "mais" && (
            <>
              {/* Item drops */}
              <div className={secFirst}>
                <div className="flex items-center justify-between">
                  <p className={secLabel}>
                    Drops de item{" "}
                    <span className="normal-case font-normal opacity-60">
                      (máx 2)
                    </span>
                  </p>
                  {drops.length < 2 && (
                    <button
                      onClick={addDrop}
                      className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  )}
                </div>
                {drops.map((drop, i) => {
                  const search = itemSearch[i] ?? "";
                  const filtered =
                    search.length > 0
                      ? items
                          .filter((it) =>
                            it.name
                              .toLowerCase()
                              .includes(search.toLowerCase()),
                          )
                          .slice(0, 6)
                      : [];
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex gap-2 items-center">
                        <span
                          className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg"
                          style={{ background: "#2a2410", color: "#c8a050" }}
                        >
                          <ItemIcon name={drop.icon || "Package"} size={15} />
                        </span>
                        {drop.itemId ? (
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-e-bg border border-e-border text-sm">
                            <span className="flex-1 truncate opacity-80">
                              {drop.name}
                            </span>
                            <button
                              onClick={() => unlinkItem(i)}
                              className="text-[10px] opacity-50 hover:opacity-100 transition-opacity shrink-0"
                            >
                              Trocar
                            </button>
                          </div>
                        ) : (
                          <div className="relative flex-1">
                            <input
                              value={search}
                              onChange={(e) =>
                                setItemSearch((s) => ({
                                  ...s,
                                  [i]: e.target.value,
                                }))
                              }
                              className={inp}
                              placeholder="Buscar item do catálogo…"
                            />
                            {filtered.length > 0 && (
                              <div
                                className="absolute left-0 right-0 top-full mt-1 z-10 bg-e-boss-bg border rounded-lg overflow-hidden shadow-lg"
                                style={{ borderColor: "#6a5a20" }}
                              >
                                {filtered.map((it) => (
                                  <button
                                    key={it.id}
                                    onClick={() => linkItem(i, it)}
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                                    style={{ color: "#f0e8d0" }}
                                  >
                                    <span className="opacity-60 shrink-0">
                                      <ItemIcon
                                        name={it.icon ?? "Package"}
                                        size={13}
                                      />
                                    </span>
                                    <span>{it.name}</span>
                                    <span className="ml-auto opacity-40 capitalize">
                                      {it.type}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => removeDrop(i)}
                          className="opacity-40 hover:opacity-80 shrink-0 transition-opacity"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {drops.length === 0 && (
                  <p className="text-xs opacity-50 italic">
                    Nenhum drop de item.
                  </p>
                )}
              </div>

              {/* Gold drop */}
              <div className={sec}>
                <div className="flex items-center justify-between">
                  <p className={secLabel}>Drop de gold</p>
                  {!goldDrop && (
                    <button
                      onClick={addGoldDrop}
                      className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  )}
                </div>
                {goldDrop ? (
                  <div
                    className="flex flex-col gap-2 p-3 rounded-xl border"
                    style={{
                      background: "rgba(200,160,80,0.08)",
                      borderColor: "rgba(200,160,80,0.3)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-amber-400">
                        <Coins size={13} />
                        <span className="font-medium">
                          Aleatorizador de gold
                        </span>
                      </div>
                      <button
                        onClick={() => setGoldDrop(null)}
                        className="opacity-40 hover:opacity-80 transition-opacity"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div>
                      <label className={lbl}>Faixa</label>
                      <div className="flex gap-1.5">
                        {GOLD_TIER_OPTS.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => updateGoldTier(t.value)}
                            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                              goldDrop.tier === t.value
                                ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                                : "border-e-border bg-e-bg opacity-60 hover:opacity-100"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={lbl}>Mínimo</label>
                        <input
                          type="number"
                          value={goldDrop.min}
                          onChange={(e) =>
                            setGoldDrop((g) =>
                              g ? { ...g, min: Number(e.target.value) } : null,
                            )
                          }
                          className={`text-center w-full ${smallInp}`}
                        />
                      </div>
                      <div>
                        <label className={lbl}>Máximo</label>
                        <input
                          type="number"
                          value={goldDrop.max}
                          onChange={(e) =>
                            setGoldDrop((g) =>
                              g ? { ...g, max: Number(e.target.value) } : null,
                            )
                          }
                          className={`text-center w-full ${smallInp}`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs opacity-50 italic">
                    Nenhum drop de gold.
                  </p>
                )}
              </div>

              <div className={sec}>
                <label className={lbl}>XP</label>
                <input
                  type="number"
                  value={xp}
                  onChange={(e) => setXp(Number(e.target.value))}
                  className={`w-28 text-center ${smallInp}`}
                />
                <CheckField checked={negaCritico} onChange={setNegaCritico} className="mt-3"
                  label="Nega 1 crítico por rodada" desc="O primeiro crítico contra o boss em cada rodada vira acerto normal" />
              </div>

              <div className={sec}>
                <label className={lbl}>
                  Observações{" "}
                  <span className="normal-case font-normal">(privado)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={`resize-none ${inp}`}
                  placeholder="Notas internas…"
                />
              </div>
            </>
          )}

          {/* Footer */}
          <div className="sticky bottom-0 flex gap-2 justify-end py-4 px-5 -mx-5 border-t border-e-boss-border/40 mt-8 bg-e-boss-bg">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={save}
              disabled={!name.trim() || phases.length < 1 || loading}
            >
              {loading ? "Salvando…" : editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
