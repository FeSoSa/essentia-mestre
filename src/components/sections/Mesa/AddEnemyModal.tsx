'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Shuffle, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { EnemyTemplate, EnemyInstance, EnemyAttack, EnemyDrop, ItemCatalog } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import Button from '@/components/ui/Button';
import EmojiPicker from '@/components/ui/EmojiPicker';
import { ItemIcon } from '@/components/sections/Itens/ItemCard';

interface Props {
  onClose: () => void;
}

type Tab = 'catalogo' | 'temporario' | 'aleatorio';
type Difficulty = 'facil' | 'medio' | 'dificil' | 'extremo';

/* ── Random generator ────────────────────────────────────────── */
function rng(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const POOL: Record<Difficulty, { names: string[]; icons: string[] }> = {
  facil: {
    names: ['Goblin', 'Rato Gigante', 'Esqueleto', 'Aranha', 'Zumbi', 'Morcego', 'Cobra', 'Lobo Jovem', 'Verme', 'Sapo Venenoso'],
    icons: ['🐀', '🕷️', '🦇', '🐍', '💀', '👻', '🐺', '🐛', '🐸', '👾'],
  },
  medio: {
    names: ['Orc', 'Gnoll', 'Fantasma', 'Lobisomem', 'Cultista', 'Kobold Guerreiro', 'Demônio Menor', 'Golem de Pedra', 'Vampiro Jovem', 'Troll'],
    icons: ['👹', '🧟', '🐗', '🧌', '👿', '🦴', '🦊', '🐻', '🐊', '🪲'],
  },
  dificil: {
    names: ['Dragão Jovem', 'Lich', 'Ogro Élite', 'Demônio', 'Necromante', 'Vampiro Antigo', 'Gigante', 'Wyvern', 'Espectro', 'Golem de Ferro'],
    icons: ['🐉', '☠️', '🔥', '🦂', '🐲', '👁️', '🦁', '🐯', '🧿', '⚡'],
  },
  extremo: {
    names: ['Lorde Demoníaco', 'Dragão Ancião', 'Lich Supremo', 'Titã das Sombras', 'Abominação', 'Colosso de Ferro', 'Deus da Morte', 'Leviatã', 'Arqui-Vampiro', 'Destruidor'],
    icons: ['🐉', '☠️', '💀', '👁️', '🔥', '⚡', '🌑', '🦂', '🧿', '💠'],
  },
};

const STATS: Record<Difficulty, { hp: [number, number]; str: [number, number]; agi: [number, number]; int: [number, number]; def: [number, number]; xp: [number, number]; dmg: [number, number] }> = {
  facil:   { hp: [40,  100], str: [5,  8],  agi: [5,  8],  int: [4,  7],  def: [3,  5],  xp: [8,   40],  dmg: [2,   8] },
  medio:   { hp: [100, 220], str: [10, 14], agi: [10, 14], int: [8,  12], def: [6,  10], xp: [25,  130], dmg: [8,  20] },
  dificil: { hp: [220, 400], str: [16, 22], agi: [15, 20], int: [12, 18], def: [12, 18], xp: [90,  350], dmg: [18, 38] },
  extremo: { hp: [400, 800], str: [24, 32], agi: [22, 30], int: [20, 28], def: [20, 28], xp: [160, 500], dmg: [35, 60] },
};

interface GeneratedEnemy { name: string; icon: string; hpMax: number; str: number; agi: number; int: number; def: number; xp: number; dmgBase: number; }

function generate(diff: Difficulty): GeneratedEnemy {
  const pool = POOL[diff];
  const s    = STATS[diff];
  return {
    name:    pick(pool.names),
    icon:    pick(pool.icons),
    hpMax:   rng(...s.hp),
    str:     rng(...s.str),
    agi:     rng(...s.agi),
    int:     rng(...s.int),
    def:     rng(...s.def),
    xp:      rng(...s.xp),
    dmgBase: rng(...s.dmg),
  };
}

function instanceFromTemplate(t: EnemyTemplate): EnemyInstance {
  return {
    instanceId: '',
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
  };
}

/* ── Catalog Tab ─────────────────────────────────────────────── */
function CatalogTab({ onClose }: { onClose: () => void }) {
  const [templates, setTemplates] = useState<EnemyTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<EnemyTemplate[]>('/enemies').then((r) => {
      setTemplates(r.data);
      if (r.data.length > 0) setSelectedId(r.data[0].id);
    }).catch(() => {});
  }, []);

  const filtered = search.trim()
    ? templates.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase()))
    : templates;

  const selected = templates.find((t) => t.id === selectedId);

  async function addToCombat() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post('/combat/enemies', { templateId: selected.id, enemy: instanceFromTemplate(selected) });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const inputStyle = { background: '#2a1818', color: '#e8d8d8', borderColor: '#4a2a2a' };

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
          <p className="text-xs opacity-40 italic px-1">Nenhum template encontrado.</p>
        )}
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            style={{
              background: selectedId === t.id ? '#3a2020' : '#2a1818',
              border: `1px solid ${selectedId === t.id ? '#7a3030' : '#4a2a2a'}`,
              color: '#e8d8d8',
            }}
          >
            <span className="text-base shrink-0">{t.icon}</span>
            <span className="flex-1 font-medium truncate">{t.name}</span>
            <span className="text-xs shrink-0" style={{ color: '#7a5050' }}>{t.type}</span>
          </button>
        ))}
      </div>

      {/* Preview */}
      {selected && (
        <div className="rounded-lg p-3 text-sm flex flex-col gap-2" style={{ background: '#2a1818', border: '1px solid #4a2a2a' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{selected.icon}</span>
            <div>
              <p className="font-semibold">{selected.name}</p>
              <p className="text-xs" style={{ color: '#7a5050' }}>
                {selected.type} · HP {selected.hpMax} · ⭐ {selected.xp} XP
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            {[['FOR', selected.attributes.strength], ['AGI', selected.attributes.agility], ['INT', selected.attributes.intelligence], ['DEF', selected.attributes.defense]].map(([l, v]) => (
              <div key={l} className="rounded py-1" style={{ background: '#1e1616' }}>
                <p style={{ color: '#7a5050' }}>{l}</p>
                <p className="font-bold">{v}</p>
              </div>
            ))}
          </div>
          {selected.attacks.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {selected.attacks.map((a, i) => (
                <p key={i} className="flex justify-between text-xs">
                  <span>{a.name}</span>
                  <span style={{ color: '#7a5050' }}>{a.skillName ? `⚡ ${a.skillName}` : a.damage}</span>
                </p>
              ))}
            </div>
          )}
          {selected.drops.filter((d) => !d.goldDrop).length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selected.drops.filter((d) => !d.goldDrop).map((d, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: '#1e1616' }}>
                  <ItemIcon name={d.icon || 'Package'} size={11} /> {d.name}
                </span>
              ))}
              {selected.drops.some((d) => d.goldDrop) && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#2a2010', color: '#c8a050' }}>
                  🪙 {selected.drops.find((d) => d.goldDrop)?.goldDrop?.tier}
                </span>
              )}
            </div>
          )}
          {(selected.immunities?.length ?? 0) > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selected.immunities!.map((im, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1e1616', color: '#9a7070' }}>
                  {im.isFlag ? '🛡️ Imune' : `${im.icon} ${im.type}`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <Button variant="danger" size="sm" onClick={addToCombat} disabled={!selected || loading}>
        {loading ? 'Adicionando…' : 'Adicionar ao combate'}
      </Button>
    </div>
  );
}

/* ── Temporary Tab ───────────────────────────────────────────── */
function TemporaryTab({ onClose }: { onClose: () => void }) {
  const [name, setName]   = useState('');
  const [icon, setIcon]   = useState('👹');
  const [type, setType]   = useState('');
  const [hpMax, setHpMax] = useState(20);
  const [str, setStr]     = useState(10);
  const [agi, setAgi]     = useState(10);
  const [int_, setInt]    = useState(10);
  const [def, setDef]     = useState(5);
  const [xp, setXp]       = useState(50);
  const [loading, setLoading] = useState(false);

  // Ataque básico
  const [basicName,      setBasicName]      = useState('Ataque Básico');
  const [basicDamageBase,setBasicDamageBase]= useState(0);
  const [basicAttr,      setBasicAttr]      = useState('FOR');
  const [basicEquil,     setBasicEquil]     = useState(4);

  // Habilidades vinculadas (máx 2)
  const [skillAtks,    setSkillAtks]    = useState<EnemyAttack[]>([]);
  const [skillSearch,  setSkillSearch]  = useState<Record<number, string>>({});
  const [skills,       setSkills]       = useState<Skill[]>([]);

  // Drops
  const [drops, setDrops]         = useState<EnemyDrop[]>([]);
  const [items, setItems]         = useState<ItemCatalog[]>([]);
  const [itemSearch, setItemSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    api.get<ItemCatalog[]>('/items').then((r) => setItems(r.data)).catch(() => {});
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
  }, []);

  function buildBasicFormula(base: number, attr: string, equil: number) {
    const parts = [base > 0 ? String(base) : null, `d20×${attr}/${equil}`].filter(Boolean);
    return parts.join(' + ');
  }

  function addSkillAtk() {
    if (skillAtks.length < 2) setSkillAtks((a) => [...a, { name: '', damage: '' }]);
  }
  function removeSkillAtk(i: number) {
    setSkillAtks((a) => a.filter((_, j) => j !== i));
    setSkillSearch((s) => { const n = { ...s }; delete n[i]; return n; });
  }
  function linkSkill(i: number, skill: Skill) {
    setSkillAtks((a) => a.map((x, j) => j === i
      ? { ...x, skillId: skill.id, skillName: skill.name, damage: skill.damage?.formula ?? x.damage, name: skill.name }
      : x
    ));
    setSkillSearch((s) => ({ ...s, [i]: '' }));
  }
  function unlinkSkill(i: number) {
    setSkillAtks((a) => a.map((x, j) => j === i ? { name: '', damage: '', skillId: undefined, skillName: undefined } : x));
  }

  function addDrop() {
    if (drops.length >= 2) return;
    setDrops((d) => [...d, { name: '', icon: 'Package' }]);
  }
  function removeDrop(i: number) {
    setDrops((d) => d.filter((_, j) => j !== i));
    setItemSearch((s) => { const n = { ...s }; delete n[i]; return n; });
  }
  function linkItem(i: number, item: ItemCatalog) {
    setDrops((d) => d.map((x, j) => j === i ? { ...x, itemId: item.id, name: item.name, icon: item.icon ?? 'Package' } : x));
    setItemSearch((s) => ({ ...s, [i]: '' }));
  }
  function unlinkItem(i: number) {
    setDrops((d) => d.map((x, j) => j === i ? { ...x, itemId: undefined, name: '', icon: 'Package' } : x));
  }

  async function addToCombat() {
    if (!name.trim()) return;
    setLoading(true);
    const basicAttack: EnemyAttack = {
      name: basicName.trim() || 'Ataque Básico',
      damage: buildBasicFormula(basicDamageBase, basicAttr, basicEquil),
      damageBase: basicDamageBase,
      damageAttribute: basicAttr,
      equilibrio: basicEquil,
    };
    const instance: EnemyInstance = {
      instanceId: '',
      templateId: undefined,
      name: name.trim(),
      type: type.trim(),
      icon,
      hpCurrent: hpMax,
      hpMax,
      attributes: { strength: str, agility: agi, intelligence: int_, defense: def },
      attacks: [basicAttack, ...skillAtks.filter((a) => a.skillId)],
      drops: drops.filter((d) => d.itemId),
      xp,
      desc: '',
      notes: '',
    };
    try {
      await api.post('/combat/enemies', { enemy: instance });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const inp  = { background: '#2a1818', color: '#e8d8d8', borderColor: '#4a2a2a' };
  const iCls = 'w-full text-sm rounded px-2 py-1.5 outline-none';
  const lbl  = (s: string) => <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#7a5050' }}>{s}</p>;

  return (
    <div className="flex flex-col gap-3">
      {/* Name + icon */}
      <div className="flex gap-2 items-center">
        <EmojiPicker value={icon} onChange={setIcon} size="sm" />
        <input value={name} onChange={(e) => setName(e.target.value)}
          className={`flex-1 ${iCls}`} style={inp} placeholder="Nome" />
      </div>
      <input value={type} onChange={(e) => setType(e.target.value)}
        className={iCls} style={inp} placeholder="Tipo (ex: Besta, Humanoide…)" />

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        {([['HP máx', hpMax, setHpMax], ['FOR', str, setStr], ['AGI', agi, setAgi], ['INT', int_, setInt], ['DEF', def, setDef]] as [string, number, (n: number) => void][]).map(([label, value, set]) => (
          <div key={label}>
            {lbl(label)}
            <input type="number" value={value} onChange={(e) => set(Number(e.target.value))}
              className="w-full text-sm rounded px-2 py-1.5 outline-none text-center" style={inp} />
          </div>
        ))}
      </div>

      {/* Ataque básico */}
      <div className="flex flex-col gap-1.5 rounded-lg p-2.5" style={{ background: '#1e1616', border: '1px solid #4a2a2a' }}>
        {lbl('Ataque básico')}
        <input value={basicName} onChange={(e) => setBasicName(e.target.value)}
          className={iCls} style={inp} placeholder="Nome (ex: Mordida, Espada)" />
        <div className="grid grid-cols-3 gap-2">
          <div>
            {lbl('Dano base')}
            <input type="number" value={basicDamageBase} min={0}
              onChange={(e) => setBasicDamageBase(Number(e.target.value))}
              className="w-full text-sm rounded px-2 py-1.5 outline-none text-center" style={inp} />
          </div>
          <div>
            {lbl('Atributo')}
            <select value={basicAttr} onChange={(e) => setBasicAttr(e.target.value)}
              className="w-full text-sm rounded px-2 py-1.5 outline-none" style={inp}>
              <option value="FOR">FOR</option>
              <option value="AGI">AGI</option>
              <option value="INT">INT</option>
            </select>
          </div>
          <div>
            {lbl('Equilíbrio')}
            <input type="number" value={basicEquil} min={1}
              onChange={(e) => setBasicEquil(Number(e.target.value))}
              className="w-full text-sm rounded px-2 py-1.5 outline-none text-center" style={inp} />
          </div>
        </div>
        <p className="text-[10px] font-mono opacity-50 mt-0.5">
          Fórmula: {buildBasicFormula(basicDamageBase, basicAttr, basicEquil)}
        </p>
      </div>

      {/* Habilidades vinculadas */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#7a5050' }}>
            Habilidades <span className="normal-case font-normal opacity-60">(máx 2)</span>
          </p>
          {skillAtks.length < 2 && (
            <button onClick={addSkillAtk} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        {skillAtks.map((atk, i) => {
          const search = skillSearch[i] ?? '';
          const filtered = search.length > 0
            ? skills.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
            : [];
          return (
            <div key={i} className="flex items-center gap-2">
              {atk.skillId ? (
                <div className="flex-1 flex items-center gap-2 rounded px-2 py-1.5 text-xs" style={{ background: '#2a1818', border: '1px solid #4a2a2a' }}>
                  <span style={{ color: '#c04040' }}>⚡</span>
                  <span className="flex-1 truncate">{atk.skillName}</span>
                  <span className="font-mono opacity-50">{atk.damage}</span>
                  <button onClick={() => unlinkSkill(i)} className="opacity-50 hover:opacity-100 shrink-0 text-[10px]">Trocar</button>
                </div>
              ) : (
                <div className="relative flex-1">
                  <input value={search} onChange={(e) => setSkillSearch((s) => ({ ...s, [i]: e.target.value }))}
                    className={iCls} style={inp} placeholder="Buscar habilidade…" />
                  {filtered.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg overflow-hidden shadow-lg"
                      style={{ background: '#1e1616', border: '1px solid #4a2a2a' }}>
                      {filtered.map((sk) => (
                        <button key={sk.id} onClick={() => linkSkill(i, sk)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 flex items-center gap-2"
                          style={{ color: '#e8d8d8' }}>
                          <span style={{ color: '#c04040' }}>⚡</span>
                          <span>{sk.name}</span>
                          {sk.damage && <span className="font-mono ml-auto opacity-50">{sk.damage.formula}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => removeSkillAtk(i)} className="opacity-40 hover:opacity-80 shrink-0"><Trash2 size={13} /></button>
            </div>
          );
        })}
      </div>

      {/* Drops */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#7a5050' }}>Drops <span className="normal-case font-normal opacity-60">(máx 2)</span></p>
          {drops.length < 2 && (
            <button onClick={addDrop} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        {drops.map((drop, i) => {
          const search = itemSearch[i] ?? '';
          const filtered = search.length > 0
            ? items.filter((it) => it.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
            : [];
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 h-8 flex items-center justify-center shrink-0 rounded opacity-70" style={{ background: '#1e1616' }}>
                <ItemIcon name={drop.icon || 'Package'} size={14} />
              </span>
              {drop.itemId ? (
                <div className="flex-1 flex items-center gap-2 rounded px-2 py-1.5 text-sm" style={{ background: '#2a1818', border: '1px solid #4a2a2a' }}>
                  <span className="flex-1 truncate opacity-80">{drop.name}</span>
                  <button onClick={() => unlinkItem(i)} className="text-[10px] opacity-50 hover:opacity-100 shrink-0">Trocar</button>
                </div>
              ) : (
                <div className="relative flex-1">
                  <input value={search} onChange={(e) => setItemSearch((s) => ({ ...s, [i]: e.target.value }))}
                    className={iCls} style={inp} placeholder="Buscar item do catálogo…" />
                  {filtered.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg overflow-hidden shadow-lg"
                      style={{ background: '#1e1616', border: '1px solid #4a2a2a' }}>
                      {filtered.map((it) => (
                        <button key={it.id} onClick={() => linkItem(i, it)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 flex items-center gap-2"
                          style={{ color: '#e8d8d8' }}>
                          <span className="opacity-60 shrink-0"><ItemIcon name={it.icon ?? 'Package'} size={12} /></span>
                          <span>{it.name}</span>
                          <span className="ml-auto opacity-40 capitalize">{it.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => removeDrop(i)} className="opacity-40 hover:opacity-80 shrink-0"><Trash2 size={13} /></button>
            </div>
          );
        })}
      </div>

      {/* XP */}
      <div>
        {lbl('XP')}
        <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))}
          className="w-24 text-sm rounded px-2 py-1.5 outline-none text-center" style={inp} />
      </div>

      <Button variant="danger" size="sm" onClick={addToCombat} disabled={!name.trim() || loading}>
        {loading ? 'Adicionando…' : 'Adicionar ao combate'}
      </Button>
    </div>
  );
}

/* ── Random Tab ─────────────────────────────────────────────── */
function buildBasicAtk(str: number, agi: number, int_: number, dmgBase: number): EnemyAttack {
  const best = str >= agi && str >= int_ ? 'FOR' : agi >= int_ ? 'AGI' : 'INT';
  const equil = 4;
  const damage = dmgBase > 0 ? `${dmgBase} + d20×${best}/${equil}` : `d20×${best}/${equil}`;
  return {
    name: 'Ataque Básico',
    damage,
    damageBase: dmgBase,
    damageAttribute: best,
    equilibrio: equil,
  };
}

function RandomTab({ onClose }: { onClose: () => void }) {
  const [diff, setDiff] = useState<Difficulty>('medio');
  const [enemy, setEnemy] = useState<GeneratedEnemy>(() => generate('medio'));
  const [customName, setCustomName] = useState(() => generate('medio').name);
  const [loading, setLoading] = useState(false);

  function reroll() {
    const next = generate(diff);
    setEnemy(next);
    setCustomName(next.name);
  }

  function changeDiff(d: Difficulty) {
    const next = generate(d);
    setDiff(d);
    setEnemy(next);
    setCustomName(next.name);
  }

  async function addToCombat() {
    setLoading(true);
    const basicAtk = buildBasicAtk(enemy.str, enemy.agi, enemy.int, enemy.dmgBase);
    const instance: EnemyInstance = {
      instanceId: '',
      templateId: undefined,
      name: customName.trim() || enemy.name,
      type: 'Genérico',
      icon: enemy.icon,
      hpCurrent: enemy.hpMax,
      hpMax: enemy.hpMax,
      attributes: { strength: enemy.str, agility: enemy.agi, intelligence: enemy.int, defense: enemy.def },
      attacks: [basicAtk],
      drops: [],
      xp: enemy.xp,
      desc: '',
      notes: '',
    };
    try {
      await api.post('/combat/enemies', { enemy: instance });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const diffLabels: Record<Difficulty, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil', extremo: 'Extremo' };
  const diffColors: Record<Difficulty, string> = { facil: '#3aaa60', medio: '#d4a84e', dificil: '#c04040', extremo: '#a855f7' };

  const basicAtk = buildBasicAtk(enemy.str, enemy.agi, enemy.int, enemy.dmgBase);
  const mod = (v: number) => { const m = Math.floor((v - 10) / 2); return m >= 0 ? `+${m}` : String(m); };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        {(['facil', 'medio', 'dificil', 'extremo'] as Difficulty[]).map((d) => (
          <button key={d} onClick={() => changeDiff(d)}
            className="py-2 rounded-lg text-sm font-semibold transition-all border"
            style={{
              background: diff === d ? diffColors[d] + '22' : '#2a1818',
              borderColor: diff === d ? diffColors[d] : '#4a2a2a',
              color: diff === d ? diffColors[d] : '#7a5050',
            }}>
            {diffLabels[d]}
          </button>
        ))}
      </div>

      <div className="rounded-lg p-4 flex flex-col gap-3 border" style={{ background: '#2a1818', borderColor: '#4a2a2a' }}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg shrink-0" style={{ background: '#1e1616' }}>
            {enemy.icon}
          </span>
          <div className="flex-1 min-w-0">
            <input value={customName} onChange={(e) => setCustomName(e.target.value)}
              className="font-bold text-base bg-transparent outline-none border-b w-full"
              style={{ borderColor: '#4a2a2a', color: '#e8d8d8' }} />
            <p className="text-xs mt-0.5" style={{ color: diffColors[diff] }}>
              {diffLabels[diff]} · ⭐ {enemy.xp} XP
            </p>
          </div>
        </div>

        {/* HP */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="font-semibold uppercase tracking-wider" style={{ color: '#7a5050' }}>HP</span>
            <span className="font-bold tabular-nums">{enemy.hpMax}</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: '#1e1616' }}>
            <div className="h-full rounded-full" style={{ width: '100%', background: '#c04040' }} />
          </div>
        </div>

        {/* Attributes with modifiers */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {([['FOR', enemy.str], ['AGI', enemy.agi], ['INT', enemy.int], ['DEF', enemy.def]] as [string, number][]).map(([l, v]) => (
            <div key={l} className="rounded-lg py-1.5" style={{ background: '#1e1616' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#7a5050' }}>{l}</p>
              <p className="text-base font-black leading-tight">{v}</p>
              <p className="text-[9px] font-bold" style={{ color: Math.floor((v - 10) / 2) >= 0 ? '#3dba72' : '#e05050' }}>
                {mod(v)}
              </p>
            </div>
          ))}
        </div>

        {/* Basic attack preview */}
        <div className="flex items-center justify-between text-xs rounded px-2 py-1.5" style={{ background: '#1e1616' }}>
          <span style={{ color: '#9a6060' }}>⚔ Ataque Básico</span>
          <span className="font-mono" style={{ color: '#7a5050' }}>{basicAtk.damage}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={reroll} disabled={loading} className="gap-1.5 flex-1">
          <Shuffle size={13} /> Gerar novamente
        </Button>
        <Button variant="danger" size="sm" onClick={addToCombat} disabled={loading} className="flex-1">
          {loading ? 'Adicionando…' : 'Adicionar ao combate'}
        </Button>
      </div>
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────── */
export default function AddEnemyModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('catalogo');

  const tabCls = (t: Tab) =>
    `text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer ${
      tab === t ? 'text-e-enemy-text' : 'opacity-40 hover:opacity-70'
    }`;
  const tabStyle = (t: Tab) => tab === t ? { background: '#2a1818' } : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] max-h-[90vh] overflow-y-auto rounded-xl border"
        style={{ background: '#1e1616', borderColor: '#4a2a2a', color: '#e8d8d8' }}>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Adicionar inimigo</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100"><X size={15} /></button>
        </div>

        <div className="flex gap-1 rounded-lg p-1" style={{ background: '#2a1818' }}>
          {(['catalogo', 'temporario', 'aleatorio'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tabCls(t)} style={tabStyle(t)}>
              {t === 'catalogo' ? 'Catálogo' : t === 'temporario' ? 'Temporário' : 'Aleatório'}
            </button>
          ))}
        </div>

        {tab === 'catalogo'   && <CatalogTab   onClose={onClose} />}
        {tab === 'temporario' && <TemporaryTab onClose={onClose} />}
        {tab === 'aleatorio'  && <RandomTab    onClose={onClose} />}
      </div>
      </div>
    </div>
  );
}
