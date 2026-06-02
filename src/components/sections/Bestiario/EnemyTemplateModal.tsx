'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Coins } from 'lucide-react';
import Checkbox from '@/components/ui/Checkbox';
import { api } from '@/lib/api';
import type { EnemyTemplate, EnemyAttack, EnemyDrop, BossImmunity, GoldDrop, GoldDropTier, ItemCatalog } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import EmojiPicker from '@/components/ui/EmojiPicker';
import { ItemIcon } from '@/components/sections/Itens/ItemCard';

interface Props {
  template?: EnemyTemplate;
  onClose: () => void;
  onSaved: (t: EnemyTemplate) => void;
}

const lbl      = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';
const inp      = 'w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors';
const smallInp = 'text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2 transition-colors';
const sec      = 'flex flex-col gap-3 mt-5 pt-5 border-t border-e-border';
const secFirst = 'flex flex-col gap-3 mt-4';
const secLabel = 'text-[9px] font-bold uppercase tracking-widest text-e-faint';

const IMMUNITY_KIND_OPTS = [
  { value: 'total',   label: 'Total'   },
  { value: 'partial', label: 'Parcial' },
];

const GOLD_TIER_OPTS: { value: GoldDropTier; label: string }[] = [
  { value: 'pobre',    label: '🪙 Pobre'    },
  { value: 'comum',    label: '💰 Comum'    },
  { value: 'rico',     label: '💎 Rico'     },
  { value: 'tesouro',  label: '👑 Tesouro'  },
];

const GOLD_TIER_DEFAULTS: Record<GoldDropTier, { min: number; max: number }> = {
  pobre:   { min: 1,   max: 10  },
  comum:   { min: 5,   max: 30  },
  rico:    { min: 20,  max: 80  },
  tesouro: { min: 50,  max: 200 },
};

type Tab = 'base' | 'combate' | 'extras';

export default function EnemyTemplateModal({ template, onClose, onSaved }: Props) {
  const editing = !!template;
  const [tab, setTab] = useState<Tab>('base');

  const [name,    setName]    = useState(template?.name    ?? '');
  const [icon,    setIcon]    = useState(template?.icon    ?? '👹');
  const [imageUrl,setImageUrl]= useState(template?.imageUrl ?? '');
  const [type,    setType]    = useState(template?.type    ?? '');
  const [hpMax,   setHpMax]   = useState(template?.hpMax   ?? 20);
  const [str,     setStr]     = useState(template?.attributes.strength      ?? 10);
  const [agi,     setAgi]     = useState(template?.attributes.agility       ?? 10);
  const [int_,    setInt]     = useState(template?.attributes.intelligence   ?? 10);
  const [def,     setDef]     = useState(template?.attributes.defense        ?? 5);
  const [xp,      setXp]      = useState(template?.xp     ?? 50);
  const [desc,    setDesc]    = useState(template?.desc    ?? '');
  const [notes,   setNotes]   = useState(template?.notes   ?? '');
  // attacks[0] = ataque básico, attacks[1..2] = habilidades vinculadas
  const rawAttacks = template?.attacks ?? [];
  const rawBasic = rawAttacks[0] ?? {};
  const [basicDmgBase,   setBasicDmgBase]   = useState<number>(rawBasic.damageBase ?? 0);
  const [basicAttr,      setBasicAttr]      = useState<string>(rawBasic.damageAttribute ?? 'FOR');
  const [basicEquilibrio,setBasicEquilibrio] = useState<number>(rawBasic.equilibrio ?? 4);
  const [skillAttacks, setSkillAttacks] = useState<EnemyAttack[]>(rawAttacks.slice(1, 3));
  const [drops,      setDrops]      = useState<EnemyDrop[]>(template?.drops        ?? []);
  const [goldDrop,   setGoldDrop]   = useState<GoldDrop | null>(
    template?.drops.find((d) => d.goldDrop)?.goldDrop ?? null
  );
  const [immunities, setImmunities] = useState<BossImmunity[]>(template?.immunities ?? []);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState<Record<number, string>>({});
  const [items, setItems] = useState<ItemCatalog[]>([]);
  const [itemSearch, setItemSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
    api.get<ItemCatalog[]>('/items').then((r) => setItems(r.data)).catch(() => {});
  }, []);

  // Skill attacks (índices 0..1 do array skillAttacks = attacks[1..2])
  function addSkillAttack() {
    if (skillAttacks.length < 2) setSkillAttacks((a) => [...a, { name: '', damage: '' }]);
  }
  function removeSkillAttack(i: number) {
    setSkillAttacks((a) => a.filter((_, j) => j !== i));
    setSkillSearch((s) => { const n = { ...s }; delete n[i]; return n; });
  }
  function linkSkill(i: number, skill: Skill) {
    setSkillAttacks((a) => a.map((x, j) => j === i
      ? { ...x, skillId: skill.id, skillName: skill.name, damage: skill.damage?.formula ?? x.damage, name: skill.name }
      : x
    ));
    setSkillSearch((s) => ({ ...s, [i]: '' }));
  }
  function unlinkSkill(i: number) {
    setSkillAttacks((a) => a.map((x, j) => j === i ? { ...x, skillId: undefined, skillName: undefined, name: '', damage: '' } : x));
  }

  // Item drops
  const itemDrops = drops.filter((d) => !d.goldDrop);
  function addDrop() {
    if (itemDrops.length < 2) setDrops((d) => [...d, { name: '', icon: '🎁' }]);
  }
  function updateDrop(realIdx: number, f: keyof EnemyDrop, v: string) {
    setDrops((d) => d.map((x, j) => j === realIdx ? { ...x, [f]: v } : x));
  }
  function removeDrop(realIdx: number) {
    setDrops((d) => d.filter((_, j) => j !== realIdx));
    setItemSearch((s) => { const n = { ...s }; delete n[realIdx]; return n; });
  }
  function linkItem(realIdx: number, item: ItemCatalog) {
    setDrops((d) => d.map((x, j) => j === realIdx
      ? { ...x, itemId: item.id, name: item.name, icon: item.icon ?? '🎁' }
      : x
    ));
    setItemSearch((s) => ({ ...s, [realIdx]: '' }));
  }
  function unlinkItem(realIdx: number) {
    setDrops((d) => d.map((x, j) => j === realIdx ? { ...x, itemId: undefined, name: '', icon: '🎁' } : x));
  }

  // Gold drop
  function addGoldDrop() {
    setGoldDrop({ tier: 'comum', ...GOLD_TIER_DEFAULTS['comum'] });
  }
  function updateGoldTier(tier: GoldDropTier) {
    setGoldDrop((g) => g ? { ...g, tier, ...GOLD_TIER_DEFAULTS[tier] } : null);
  }

  // Immunities
  function addImmunity() {
    setImmunities((p) => [...p, { type: '', icon: '🛡️', kind: 'total' }]);
  }
  function updateImmunity<K extends keyof BossImmunity>(i: number, f: K, v: BossImmunity[K]) {
    setImmunities((p) => p.map((x, j) => j === i ? { ...x, [f]: v } : x));
  }
  function toggleFlag(i: number, on: boolean) {
    setImmunities((p) => p.map((x, j) => j === i ? { ...x, isFlag: on, type: on ? '' : x.type } : x));
  }

  async function save() {
    if (!name.trim()) return;
    setLoading(true);

    // Merge drops: item drops (only linked ones) + optional gold drop entry
    const allDrops: EnemyDrop[] = [
      ...drops.filter((d) => !d.goldDrop && d.itemId),
    ];
    if (goldDrop) {
      allDrops.push({ name: '', icon: '🪙', goldDrop });
    }

    const basicDamageFormula = [basicDmgBase > 0 ? String(basicDmgBase) : null, `d20×${basicAttr}/${basicEquilibrio}`].filter(Boolean).join(' + ');
    const basicAttackEntry: EnemyAttack = { name: 'Ataque Básico', damage: basicDamageFormula, damageBase: basicDmgBase, damageAttribute: basicAttr, equilibrio: basicEquilibrio };

    const allAttacks = [
      basicAttackEntry,
      ...skillAttacks.filter((a) => a.skillId),
    ];

    const body = {
      name: name.trim(), icon, imageUrl: imageUrl.trim() || undefined,
      type: type.trim(), hpMax,
      attributes: { strength: str, agility: agi, intelligence: int_, defense: def },
      attacks: allAttacks,
      drops: allDrops,
      immunities, xp, desc, notes,
    };
    try {
      const res = editing
        ? await api.put<EnemyTemplate>(`/enemies/${template!.id}`, body)
        : await api.post<EnemyTemplate>('/enemies', body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const tabBtn = (id: Tab) =>
    `flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
      tab === id
        ? 'bg-e-accent/20 border-e-accent text-e-accent'
        : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[440px] max-h-[92vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text">
      <div className="flex flex-col px-5 pt-5 pb-0">

        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <h2 className="font-bold text-base">{editing ? 'Editar inimigo' : 'Novo inimigo'}</h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:text-e-text hover:bg-e-card transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1.5 border-b border-e-border pb-3">
          <button type="button" className={tabBtn('base')}    onClick={() => setTab('base')}>Base</button>
          <button type="button" className={tabBtn('combate')} onClick={() => setTab('combate')}>Combate</button>
          <button type="button" className={tabBtn('extras')}  onClick={() => setTab('extras')}>Extras</button>
        </div>

        {/* ── ABA BASE ── */}
        {tab === 'base' && <>
          <div className={secFirst}>
            <div className="flex gap-2 items-center">
              <EmojiPicker value={icon} onChange={setIcon} />
              <input value={name} onChange={(e) => setName(e.target.value)}
                className={inp} placeholder="Nome do inimigo" />
            </div>
          </div>

          <div className={sec}>
            <label className={lbl}>Imagem <span className="normal-case font-normal">(URL — opcional)</span></label>
            <div className="flex gap-2 items-center">
              {imageUrl.trim() && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl.trim()} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-e-border" />
              )}
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                className={inp} placeholder="https://…" />
            </div>
          </div>

          <div className={sec}>
            <label className={lbl}>Tipo</label>
            <input value={type} onChange={(e) => setType(e.target.value)}
              className={inp} placeholder="ex: Besta, Humanoide…" />
          </div>
        </>}

        {/* ── ABA COMBATE ── */}
        {tab === 'combate' && <>
          <div className={secFirst}>
            <p className={secLabel}>Estatísticas</p>
            <div className="grid grid-cols-5 gap-2">
              {([
                { label: 'HP máx', value: hpMax, set: setHpMax, showMod: false },
                { label: 'FOR',    value: str,   set: setStr,   showMod: true  },
                { label: 'AGI',    value: agi,   set: setAgi,   showMod: true  },
                { label: 'INT',    value: int_,  set: setInt,   showMod: true  },
                { label: 'DEF',    value: def,   set: setDef,   showMod: true  },
              ] as { label: string; value: number; set: (n: number) => void; showMod: boolean }[]).map(({ label, value, set, showMod }) => {
                const mod = Math.floor((value - 10) / 2);
                return (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <label className={lbl}>{label}</label>
                    <input type="number" value={value} onChange={(e) => set(Number(e.target.value))}
                      className={`text-center ${smallInp} w-full`} />
                    {showMod && (
                      <span className="text-[10px] font-bold" style={{ color: mod >= 0 ? '#3dba72' : '#e05050' }}>
                        {mod >= 0 ? `+${mod}` : mod}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ataque básico */}
          <div className={sec}>
            <p className={secLabel}>Ataque básico</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={lbl}>Dano base</label>
                <input type="number" value={basicDmgBase} onChange={(e) => setBasicDmgBase(Number(e.target.value))}
                  className={`text-center w-full ${smallInp}`} min={0} />
              </div>
              <div>
                <label className={lbl}>Atributo</label>
                <select value={basicAttr} onChange={(e) => setBasicAttr(e.target.value)}
                  className={`w-full ${smallInp}`}>
                  <option value="FOR">FOR</option>
                  <option value="AGI">AGI</option>
                  <option value="INT">INT</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Equilíbrio</label>
                <input type="number" value={basicEquilibrio} onChange={(e) => setBasicEquilibrio(Number(e.target.value))}
                  className={`text-center w-full ${smallInp}`} min={1} />
              </div>
            </div>
            <p className="text-xs font-mono text-e-faint mt-1">
              ⚔ {[basicDmgBase > 0 ? String(basicDmgBase) : null, `d20×${basicAttr}/${basicEquilibrio}`].filter(Boolean).join(' + ')}
            </p>
          </div>

          {/* Habilidades do catálogo */}
          <div className={sec}>
            <div className="flex items-center justify-between">
              <p className={secLabel}>Habilidades <span className="normal-case font-normal text-e-faint">(máx 2)</span></p>
              {skillAttacks.length < 2 && (
                <button onClick={addSkillAttack} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                  <Plus size={12} /> Adicionar
                </button>
              )}
            </div>
            {skillAttacks.map((atk, i) => {
              const search = skillSearch[i] ?? '';
              const filtered = search.length > 0
                ? skills.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
                : [];
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  {atk.skillId ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-e-card border border-e-accent/30">
                      <span className="text-e-accent text-sm">⚡</span>
                      <span className="flex-1 text-sm font-medium text-e-text truncate">{atk.skillName}</span>
                      {atk.damage && <span className="font-mono text-xs text-e-faint">{atk.damage}</span>}
                      <button onClick={() => unlinkSkill(i)} className="text-[10px] text-e-faint hover:text-e-text transition-colors shrink-0">
                        Trocar
                      </button>
                      <button onClick={() => removeSkillAttack(i)} className="opacity-40 hover:opacity-80 shrink-0 transition-opacity ml-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          value={search}
                          onChange={(e) => setSkillSearch((s) => ({ ...s, [i]: e.target.value }))}
                          className={inp}
                          placeholder="Buscar habilidade do catálogo…"
                        />
                        {filtered.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-e-surface border border-e-border rounded-lg overflow-hidden shadow-lg">
                            {filtered.map((sk) => (
                              <button key={sk.id} onClick={() => linkSkill(i, sk)}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-e-card transition-colors flex items-center gap-2">
                                <span className="text-e-accent">⚡</span>
                                <span className="text-e-text">{sk.name}</span>
                                {sk.damage && <span className="text-e-faint font-mono ml-auto">{sk.damage.formula}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeSkillAttack(i)} className="opacity-40 hover:opacity-80 shrink-0 transition-opacity">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {skillAttacks.length === 0 && <p className="text-xs text-e-faint italic">Nenhuma habilidade vinculada.</p>}
          </div>
        </>}

        {/* ── ABA EXTRAS ── */}
        {tab === 'extras' && <>
          {/* Item drops */}
          <div className={secFirst}>
            <div className="flex items-center justify-between">
              <p className={secLabel}>Drops de item <span className="normal-case font-normal text-e-faint">(máx 2)</span></p>
              {itemDrops.length < 2 && (
                <button onClick={addDrop} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                  <Plus size={12} /> Adicionar
                </button>
              )}
            </div>
            {drops.map((drop, realIdx) => {
              if (drop.goldDrop) return null;
              const search = itemSearch[realIdx] ?? '';
              const filtered = search.length > 0
                ? items.filter((it) => it.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
                : [];
              return (
                <div key={realIdx} className="flex flex-col gap-1">
                  <div className="flex gap-2 items-center">
                    <span className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg bg-e-card text-e-faint">
                      <ItemIcon name={drop.icon || 'Package'} size={15} />
                    </span>
                    {drop.itemId ? (
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-e-card border border-e-border text-sm">
                        <span className="flex-1 truncate">{drop.name}</span>
                        <button onClick={() => unlinkItem(realIdx)} className="text-[10px] text-e-faint hover:text-e-text transition-colors shrink-0">
                          Trocar
                        </button>
                      </div>
                    ) : (
                      <div className="relative flex-1">
                        <input
                          value={search}
                          onChange={(e) => setItemSearch((s) => ({ ...s, [realIdx]: e.target.value }))}
                          className={inp}
                          placeholder="Buscar item do catálogo…"
                        />
                        {filtered.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-e-surface border border-e-border rounded-lg overflow-hidden shadow-lg">
                            {filtered.map((it) => (
                              <button key={it.id} onClick={() => linkItem(realIdx, it)}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-e-card transition-colors flex items-center gap-2">
                                <span className="text-e-faint shrink-0"><ItemIcon name={it.icon ?? 'Package'} size={13} /></span>
                                <span className="text-e-text">{it.name}</span>
                                <span className="text-e-faint ml-auto capitalize">{it.type}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <button onClick={() => removeDrop(realIdx)} className="opacity-40 hover:opacity-80 shrink-0 transition-opacity">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
            {itemDrops.length === 0 && <p className="text-xs text-e-faint italic">Nenhum drop de item.</p>}
          </div>

          {/* Gold drop */}
          <div className={sec}>
            <div className="flex items-center justify-between">
              <p className={secLabel}>Drop de gold</p>
              {!goldDrop && (
                <button onClick={addGoldDrop} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                  <Plus size={12} /> Adicionar
                </button>
              )}
            </div>
            {goldDrop ? (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-e-card border border-e-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                    <Coins size={13} />
                    <span className="font-medium">Aleatorizador de gold</span>
                  </div>
                  <button onClick={() => setGoldDrop(null)} className="opacity-40 hover:opacity-80 transition-opacity">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div>
                  <label className={lbl}>Faixa</label>
                  <div className="flex gap-1.5">
                    {GOLD_TIER_OPTS.map((t) => (
                      <button key={t.value} type="button"
                        onClick={() => updateGoldTier(t.value)}
                        className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                          goldDrop.tier === t.value
                            ? 'border-yellow-500/60 bg-yellow-500/15 text-yellow-300'
                            : 'border-e-border bg-e-bg text-e-faint hover:border-e-border2'
                        }`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Mínimo</label>
                    <input type="number" value={goldDrop.min} onChange={(e) => setGoldDrop((g) => g ? { ...g, min: Number(e.target.value) } : null)}
                      className={`text-center w-full ${smallInp}`} />
                  </div>
                  <div>
                    <label className={lbl}>Máximo</label>
                    <input type="number" value={goldDrop.max} onChange={(e) => setGoldDrop((g) => g ? { ...g, max: Number(e.target.value) } : null)}
                      className={`text-center w-full ${smallInp}`} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-e-faint italic">Nenhum drop de gold.</p>
            )}
          </div>

          {/* Immunities */}
          <div className={sec}>
            <div className="flex items-center justify-between">
              <p className={secLabel}>Imunidades</p>
              <button onClick={addImmunity}
                className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {immunities.map((im, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex gap-2 items-center">
                  <EmojiPicker value={im.icon} onChange={(v) => updateImmunity(i, 'icon', v)} size="sm" />
                  {!im.isFlag && (
                    <Select
                      value={im.kind ?? 'total'}
                      onChange={(v) => updateImmunity(i, 'kind', v as 'total' | 'partial')}
                      options={IMMUNITY_KIND_OPTS}
                      className="w-28 shrink-0"
                    />
                  )}
                  {im.isFlag ? (
                    <span className="flex-1 text-xs text-e-faint italic">Imunidade genérica (sem tipo)</span>
                  ) : (
                    <input value={im.type}
                      onChange={(e) => updateImmunity(i, 'type', e.target.value)}
                      className={inp} placeholder={im.kind === 'partial' ? 'Label (ex: Espadas)' : 'Tipo (ex: Veneno)'} />
                  )}
                  <button onClick={() => setImmunities((p) => p.filter((_, j) => j !== i))}
                    className="opacity-40 hover:opacity-80 shrink-0 transition-opacity">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 ml-11 cursor-pointer" onClick={() => toggleFlag(i, !im.isFlag)}>
                  <Checkbox checked={!!im.isFlag} onChange={(v) => toggleFlag(i, v)} color="default" />
                  <span className="text-[10px] text-e-faint select-none">Imunidade genérica (sem tipo nomeado)</span>
                </div>
                {im.kind === 'partial' && !im.isFlag && (
                  <input
                    value={(im.sources ?? []).join(', ')}
                    onChange={(e) => updateImmunity(i, 'sources', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    className={`ml-11 ${inp}`} placeholder="Fontes (ex: espada, Essência do Fogo)" />
                )}
              </div>
            ))}
            {immunities.length === 0 && <p className="text-xs text-e-faint italic">Nenhuma imunidade.</p>}
          </div>

          <div className={sec}>
            <label className={lbl}>XP</label>
            <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))}
              className={`w-28 text-center ${smallInp}`} />
          </div>

          <div className={sec}>
            <label className={lbl}>Descrição <span className="normal-case font-normal">(visível ao jogador)</span></label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              className={`resize-none ${inp}`} placeholder="Aparência, lore, comportamento…" />
          </div>

          <div className={sec}>
            <label className={lbl}>Observações <span className="normal-case font-normal">(privado)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className={`resize-none ${inp}`} placeholder="Notas internas…" />
          </div>
        </>}

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-2 justify-end py-4 px-5 -mx-5 border-t border-e-border mt-8 bg-e-surface">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!name.trim() || loading}>
            {loading ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
          </Button>
        </div>

      </div>
      </div>
    </div>
  );
}
