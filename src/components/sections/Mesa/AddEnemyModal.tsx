"use client";

import type { Skill } from "@/components/sections/Habilidades/SkillCard";
import { ItemIcon } from "@/components/sections/Itens/ItemCard";
import Button from "@/components/ui/Button";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { api } from "@/lib/api";
import type {
  BossInstance,
  BossTemplate,
  EnemyAttack,
  EnemyDrop,
  EnemyInstance,
  EnemyTemplate,
  ItemCatalog,
} from "@/store/types";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import GeradorEncontro from "./GeradorEncontro";

interface Props {
  onClose: () => void;
}

type Tab = "catalogo" | "boss" | "temporario" | "aleatorio";

function instanceFromTemplate(t: EnemyTemplate): EnemyInstance {
  return {
    instanceId: "",
    templateId: t.id,
    name: t.name,
    type: t.type,
    icon: t.icon,
    imageUrl: t.imageUrl,
    hpCurrent: t.hpMax,
    hpMax: t.hpMax,
    attributes: t.attributes,
    attacks: t.attacks,
    drops: t.drops,
    immunities: t.immunities ?? [],
    xp: t.xp,
    desc: t.desc,
    notes: t.notes,
    defesa: t.defesa,
    modAcerto: t.modAcerto,
    esMax: t.esMax ?? 0,
    negaCritico: t.negaCritico ?? false,
  };
}

/* ── Catalog Tab ─────────────────────────────────────────────── */
function CatalogTab({ onClose }: { onClose: () => void }) {
  const [templates, setTemplates] = useState<EnemyTemplate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<EnemyTemplate[]>("/enemies")
      .then((r) => {
        setTemplates(r.data);
        if (r.data.length > 0) setSelectedId(r.data[0].id);
      })
      .catch(() => {});
  }, []);

  const filtered = search.trim()
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.type.toLowerCase().includes(search.toLowerCase()),
      )
    : templates;

  const selected = templates.find((t) => t.id === selectedId);

  async function addToCombat() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post("/combat/enemies", {
        templateId: selected.id,
        enemy: instanceFromTemplate(selected),
      });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "#2a1818",
    color: "#e8d8d8",
    borderColor: "#4a2a2a",
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar inimigo…"
        className="w-full text-sm rounded px-3 py-2 outline-none placeholder:opacity-40"
        style={inputStyle}
      />

      {/* Template list */}
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-xs opacity-40 italic px-1">
            Nenhum template encontrado.
          </p>
        )}
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            style={{
              background: selectedId === t.id ? "#3a2020" : "#2a1818",
              border: `1px solid ${selectedId === t.id ? "#7a3030" : "#4a2a2a"}`,
              color: "#e8d8d8",
            }}
          >
            <span className="text-base shrink-0">{t.icon}</span>
            <span className="flex-1 font-medium truncate">{t.name}</span>
            <span className="text-xs shrink-0" style={{ color: "#7a5050" }}>
              {t.type}
            </span>
          </button>
        ))}
      </div>

      {/* Preview */}
      {selected && (
        <div
          className="rounded-lg p-3 text-sm flex flex-col gap-2"
          style={{ background: "#2a1818", border: "1px solid #4a2a2a" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{selected.icon}</span>
            <div>
              <p className="font-semibold">{selected.name}</p>
              <p className="text-xs" style={{ color: "#7a5050" }}>
                {selected.type} · HP {selected.hpMax} · ⭐ {selected.xp} XP
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            {[
              ["FOR", selected.attributes.strength],
              ["AGI", selected.attributes.agility],
              ["INT", selected.attributes.intelligence],
              ["DEF", selected.attributes.defense],
            ].map(([l, v]) => (
              <div
                key={l}
                className="rounded py-1"
                style={{ background: "#1e1616" }}
              >
                <p style={{ color: "#7a5050" }}>{l}</p>
                <p className="font-bold">{v}</p>
              </div>
            ))}
          </div>
          {selected.attacks.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {selected.attacks.map((a, i) => (
                <p key={i} className="flex justify-between text-xs">
                  <span>{a.name}</span>
                  <span style={{ color: "#7a5050" }}>
                    {a.skillName ? `⚡ ${a.skillName}` : a.damage}
                  </span>
                </p>
              ))}
            </div>
          )}
          {selected.drops.filter((d) => !d.goldDrop).length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selected.drops
                .filter((d) => !d.goldDrop)
                .map((d, i) => (
                  <span
                    key={i}
                    className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                    style={{ background: "#1e1616" }}
                  >
                    <ItemIcon name={d.icon || "Package"} size={11} /> {d.name}
                  </span>
                ))}
              {selected.drops.some((d) => d.goldDrop) && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: "#2a2010", color: "#c8a050" }}
                >
                  🪙 {selected.drops.find((d) => d.goldDrop)?.goldDrop?.tier}
                </span>
              )}
            </div>
          )}
          {(selected.immunities?.length ?? 0) > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selected.immunities!.map((im, i) => (
                <span
                  key={i}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: "#1e1616", color: "#9a7070" }}
                >
                  {im.isFlag ? "🛡️ Imune" : `${im.icon} ${im.type}`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        variant="danger"
        size="sm"
        onClick={addToCombat}
        disabled={!selected || loading}
      >
        {loading ? "Adicionando…" : "Adicionar ao combate"}
      </Button>
    </div>
  );
}

/* ── Boss Catalog Tab ────────────────────────────────────────── */
function instanceFromBossTemplate(t: BossTemplate): BossInstance {
  return {
    instanceId: "",
    templateId: t.id,
    name: t.name,
    icon: t.icon,
    imageUrl: t.imageUrl,
    phases: t.phases,
    currentPhase: 0,
    hpCurrent: t.phases[0]?.hpMax ?? 0,
    immunities: t.immunities,
    resistances: t.resistances,
    drops: t.drops,
    xp: t.xp,
    specialReward: t.specialReward,
    notes: "",
    negaCritico: t.negaCritico ?? false,
  };
}

function BossTab({ onClose }: { onClose: () => void }) {
  const [templates, setTemplates] = useState<BossTemplate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<BossTemplate[]>("/bosses")
      .then((r) => {
        setTemplates(r.data);
        if (r.data.length > 0) setSelectedId(r.data[0].id);
      })
      .catch(() => {});
  }, []);

  const filtered = search.trim()
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.type.toLowerCase().includes(search.toLowerCase()),
      )
    : templates;

  const selected = templates.find((t) => t.id === selectedId);

  async function addToCombat() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post("/combat/bosses", {
        boss: instanceFromBossTemplate(selected),
      });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "#2a1818",
    color: "#e8d8d8",
    borderColor: "#4a2a2a",
  };

  if (templates.length === 0) {
    return (
      <p className="text-xs opacity-40 italic px-1 py-4">
        Nenhum boss no catálogo. Cadastre na seção Bestiário.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar boss…"
        className="w-full text-sm rounded px-3 py-2 outline-none placeholder:opacity-40"
        style={inputStyle}
      />

      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-xs opacity-40 italic px-1">
            Nenhum boss encontrado.
          </p>
        )}
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            style={{
              background: selectedId === t.id ? "#3a2020" : "#2a1818",
              border: `1px solid ${selectedId === t.id ? "#7a3030" : "#4a2a2a"}`,
              color: "#e8d8d8",
            }}
          >
            <span className="text-base shrink-0">{t.icon || "👑"}</span>
            <span className="flex-1 font-medium truncate">{t.name}</span>
            <span className="text-xs shrink-0" style={{ color: "#7a5050" }}>
              {t.phases.length} fase(s) · HP {t.phases[0]?.hpMax ?? 0}
            </span>
          </button>
        ))}
      </div>

      {selected?.notes && (
        <p className="text-xs italic px-1" style={{ color: "#7a5050" }}>
          {selected.notes}
        </p>
      )}

      <Button
        variant="danger"
        size="sm"
        onClick={addToCombat}
        disabled={!selected || loading}
      >
        {loading ? "Adicionando…" : "Adicionar ao combate"}
      </Button>
    </div>
  );
}

/* ── Temporary Tab ───────────────────────────────────────────── */
function TemporaryTab({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("👹");
  const [type, setType] = useState("");
  const [hpMax, setHpMax] = useState(20);
  const [str, setStr] = useState(10);
  const [agi, setAgi] = useState(10);
  const [int_, setInt] = useState(10);
  const [def, setDef] = useState(5);
  const [xp, setXp] = useState(50);
  const [loading, setLoading] = useState(false);

  // Ataque básico
  const [basicName, setBasicName] = useState("Ataque Básico");
  const [basicDamageBase, setBasicDamageBase] = useState(0);
  const [basicAttr, setBasicAttr] = useState("FOR");
  const [basicEquil, setBasicEquil] = useState(4);

  // Habilidades vinculadas (máx 2)
  const [skillAtks, setSkillAtks] = useState<EnemyAttack[]>([]);
  const [skillSearch, setSkillSearch] = useState<Record<number, string>>({});
  const [skills, setSkills] = useState<Skill[]>([]);

  // Drops
  const [drops, setDrops] = useState<EnemyDrop[]>([]);
  const [items, setItems] = useState<ItemCatalog[]>([]);
  const [itemSearch, setItemSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    api
      .get<ItemCatalog[]>("/items")
      .then((r) => setItems(r.data))
      .catch(() => {});
    api
      .get<Skill[]>("/skills")
      .then((r) => setSkills(r.data))
      .catch(() => {});
  }, []);

  function buildBasicFormula(base: number, attr: string, equil: number) {
    const parts = [
      base > 0 ? String(base) : null,
      `d20×${attr}/${equil}`,
    ].filter(Boolean);
    return parts.join(" + ");
  }

  function addSkillAtk() {
    if (skillAtks.length < 5)
      setSkillAtks((a) => [...a, { name: "", damage: "" }]);
  }
  function removeSkillAtk(i: number) {
    setSkillAtks((a) => a.filter((_, j) => j !== i));
    setSkillSearch((s) => {
      const n = { ...s };
      delete n[i];
      return n;
    });
  }
  function linkSkill(i: number, skill: Skill) {
    setSkillAtks((a) =>
      a.map((x, j) =>
        j === i
          ? {
              ...x,
              skillId: skill.id,
              skillName: skill.name,
              damage: skill.damage?.formula ?? x.damage,
              name: skill.name,
            }
          : x,
      ),
    );
    setSkillSearch((s) => ({ ...s, [i]: "" }));
  }
  function unlinkSkill(i: number) {
    setSkillAtks((a) =>
      a.map((x, j) =>
        j === i
          ? { name: "", damage: "", skillId: undefined, skillName: undefined }
          : x,
      ),
    );
  }

  function addDrop() {
    if (drops.length >= 2) return;
    setDrops((d) => [...d, { name: "", icon: "Package" }]);
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
          ? {
              ...x,
              itemId: item.id,
              name: item.name,
              icon: item.icon ?? "Package",
            }
          : x,
      ),
    );
    setItemSearch((s) => ({ ...s, [i]: "" }));
  }
  function unlinkItem(i: number) {
    setDrops((d) =>
      d.map((x, j) =>
        j === i ? { ...x, itemId: undefined, name: "", icon: "Package" } : x,
      ),
    );
  }

  async function addToCombat() {
    if (!name.trim()) return;
    setLoading(true);
    const basicAttack: EnemyAttack = {
      name: basicName.trim() || "Ataque Básico",
      damage: buildBasicFormula(basicDamageBase, basicAttr, basicEquil),
      damageBase: basicDamageBase,
      damageAttribute: basicAttr,
      equilibrio: basicEquil,
    };
    const instance: EnemyInstance = {
      instanceId: "",
      templateId: undefined,
      name: name.trim(),
      type: type.trim(),
      icon,
      hpCurrent: hpMax,
      hpMax,
      attributes: {
        strength: str,
        agility: agi,
        intelligence: int_,
        defense: def,
      },
      attacks: [basicAttack, ...skillAtks.filter((a) => a.skillId)],
      drops: drops.filter((d) => d.itemId),
      xp,
      desc: "",
      notes: "",
    };
    try {
      await api.post("/combat/enemies", { enemy: instance });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const inp = {
    background: "#2a1818",
    color: "#e8d8d8",
    borderColor: "#4a2a2a",
  };
  const iCls = "w-full text-sm rounded px-2 py-1.5 outline-none";
  const lbl = (s: string) => (
    <p
      className="text-[10px] uppercase tracking-wider mb-0.5"
      style={{ color: "#7a5050" }}
    >
      {s}
    </p>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Name + icon */}
      <div className="flex gap-2 items-center">
        <EmojiPicker value={icon} onChange={setIcon} size="sm" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`flex-1 ${iCls}`}
          style={inp}
          placeholder="Nome"
        />
      </div>
      <input
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={iCls}
        style={inp}
        placeholder="Tipo (ex: Besta, Humanoide…)"
      />

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        {(
          [
            ["HP máx", hpMax, setHpMax],
            ["FOR", str, setStr],
            ["AGI", agi, setAgi],
            ["INT", int_, setInt],
            ["DEF", def, setDef],
          ] as [string, number, (n: number) => void][]
        ).map(([label, value, set]) => (
          <div key={label}>
            {lbl(label)}
            <input
              type="number"
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              className="w-full text-sm rounded px-2 py-1.5 outline-none text-center"
              style={inp}
            />
          </div>
        ))}
      </div>

      {/* Ataque básico */}
      <div
        className="flex flex-col gap-1.5 rounded-lg p-2.5"
        style={{ background: "#1e1616", border: "1px solid #4a2a2a" }}
      >
        {lbl("Ataque básico")}
        <input
          value={basicName}
          onChange={(e) => setBasicName(e.target.value)}
          className={iCls}
          style={inp}
          placeholder="Nome (ex: Mordida, Espada)"
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            {lbl("Dano base")}
            <input
              type="number"
              value={basicDamageBase}
              min={0}
              onChange={(e) => setBasicDamageBase(Number(e.target.value))}
              className="w-full text-sm rounded px-2 py-1.5 outline-none text-center"
              style={inp}
            />
          </div>
          <div>
            {lbl("Atributo")}
            <select
              value={basicAttr}
              onChange={(e) => setBasicAttr(e.target.value)}
              className="w-full text-sm rounded px-2 py-1.5 outline-none"
              style={inp}
            >
              <option value="FOR">FOR</option>
              <option value="AGI">AGI</option>
              <option value="INT">INT</option>
            </select>
          </div>
          <div>
            {lbl("Equilíbrio")}
            <input
              type="number"
              value={basicEquil}
              min={1}
              onChange={(e) => setBasicEquil(Number(e.target.value))}
              className="w-full text-sm rounded px-2 py-1.5 outline-none text-center"
              style={inp}
            />
          </div>
        </div>
        <p className="text-[10px] font-mono opacity-50 mt-0.5">
          Fórmula: {buildBasicFormula(basicDamageBase, basicAttr, basicEquil)}
        </p>
      </div>

      {/* Habilidades vinculadas */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p
            className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: "#7a5050" }}
          >
            Habilidades{" "}
            <span className="normal-case font-normal opacity-60">(máx 5)</span>
          </p>
          {skillAtks.length < 5 && (
            <button
              onClick={addSkillAtk}
              className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100"
            >
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        {skillAtks.map((atk, i) => {
          const search = skillSearch[i] ?? "";
          const filtered =
            search.length > 0
              ? skills
                  .filter((s) =>
                    s.name.toLowerCase().includes(search.toLowerCase()),
                  )
                  .slice(0, 5)
              : [];
          return (
            <div key={i} className="flex items-center gap-2">
              {atk.skillId ? (
                <div
                  className="flex-1 flex items-center gap-2 rounded px-2 py-1.5 text-xs"
                  style={{ background: "#2a1818", border: "1px solid #4a2a2a" }}
                >
                  <span style={{ color: "#c04040" }}>⚡</span>
                  <span className="flex-1 truncate">{atk.skillName}</span>
                  <span className="font-mono opacity-50">{atk.damage}</span>
                  <button
                    onClick={() => unlinkSkill(i)}
                    className="opacity-50 hover:opacity-100 shrink-0 text-[10px]"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="relative flex-1">
                  <input
                    value={search}
                    onChange={(e) =>
                      setSkillSearch((s) => ({ ...s, [i]: e.target.value }))
                    }
                    className={iCls}
                    style={inp}
                    placeholder="Buscar habilidade…"
                  />
                  {filtered.length > 0 && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg overflow-hidden shadow-lg"
                      style={{
                        background: "#1e1616",
                        border: "1px solid #4a2a2a",
                      }}
                    >
                      {filtered.map((sk) => (
                        <button
                          key={sk.id}
                          onClick={() => linkSkill(i, sk)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 flex items-center gap-2"
                          style={{ color: "#e8d8d8" }}
                        >
                          <span style={{ color: "#c04040" }}>⚡</span>
                          <span>{sk.name}</span>
                          {sk.damage && (
                            <span className="font-mono ml-auto opacity-50">
                              {sk.damage.formula}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => removeSkillAtk(i)}
                className="opacity-40 hover:opacity-80 shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Drops */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p
            className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: "#7a5050" }}
          >
            Drops{" "}
            <span className="normal-case font-normal opacity-60">(máx 2)</span>
          </p>
          {drops.length < 2 && (
            <button
              onClick={addDrop}
              className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100"
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
                    it.name.toLowerCase().includes(search.toLowerCase()),
                  )
                  .slice(0, 5)
              : [];
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-8 h-8 flex items-center justify-center shrink-0 rounded opacity-70"
                style={{ background: "#1e1616" }}
              >
                <ItemIcon name={drop.icon || "Package"} size={14} />
              </span>
              {drop.itemId ? (
                <div
                  className="flex-1 flex items-center gap-2 rounded px-2 py-1.5 text-sm"
                  style={{ background: "#2a1818", border: "1px solid #4a2a2a" }}
                >
                  <span className="flex-1 truncate opacity-80">
                    {drop.name}
                  </span>
                  <button
                    onClick={() => unlinkItem(i)}
                    className="text-[10px] opacity-50 hover:opacity-100 shrink-0"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="relative flex-1">
                  <input
                    value={search}
                    onChange={(e) =>
                      setItemSearch((s) => ({ ...s, [i]: e.target.value }))
                    }
                    className={iCls}
                    style={inp}
                    placeholder="Buscar item do catálogo…"
                  />
                  {filtered.length > 0 && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg overflow-hidden shadow-lg"
                      style={{
                        background: "#1e1616",
                        border: "1px solid #4a2a2a",
                      }}
                    >
                      {filtered.map((it) => (
                        <button
                          key={it.id}
                          onClick={() => linkItem(i, it)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 flex items-center gap-2"
                          style={{ color: "#e8d8d8" }}
                        >
                          <span className="opacity-60 shrink-0">
                            <ItemIcon name={it.icon ?? "Package"} size={12} />
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
                className="opacity-40 hover:opacity-80 shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* XP */}
      <div>
        {lbl("XP")}
        <input
          type="number"
          value={xp}
          onChange={(e) => setXp(Number(e.target.value))}
          className="w-24 text-sm rounded px-2 py-1.5 outline-none text-center"
          style={inp}
        />
      </div>

      <Button
        variant="danger"
        size="sm"
        onClick={addToCombat}
        disabled={!name.trim() || loading}
      >
        {loading ? "Adicionando…" : "Adicionar ao combate"}
      </Button>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────── */
export default function AddEnemyModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("catalogo");

  const tabCls = (t: Tab) =>
    `text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer ${
      tab === t ? "text-e-enemy-text" : "opacity-40 hover:opacity-70"
    }`;
  const tabStyle = (t: Tab) => (tab === t ? { background: "#2a1818" } : {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`${tab === "aleatorio" ? "w-[680px]" : "w-[420px]"} max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl border`}
        style={{
          background: "#1e1616",
          borderColor: "#4a2a2a",
          color: "#e8d8d8",
        }}
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">Adicionar inimigo</h2>
            <button onClick={onClose} className="opacity-50 hover:opacity-100">
              <X size={15} />
            </button>
          </div>

          <div
            className="flex gap-1 rounded-lg p-1"
            style={{ background: "#2a1818" }}
          >
            {(["catalogo", "boss", "temporario", "aleatorio"] as Tab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={tabCls(t)}
                  style={tabStyle(t)}
                >
                  {t === "catalogo"
                    ? "Catálogo"
                    : t === "boss"
                      ? "Boss"
                      : t === "temporario"
                        ? "Temporário"
                        : "Aleatório"}
                </button>
              ),
            )}
          </div>

          {tab === "catalogo" && <CatalogTab onClose={onClose} />}
          {tab === "boss" && <BossTab onClose={onClose} />}
          {tab === "temporario" && <TemporaryTab onClose={onClose} />}
          {tab === "aleatorio" && <GeradorEncontro onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}
