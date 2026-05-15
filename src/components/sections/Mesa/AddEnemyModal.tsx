'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Shuffle } from 'lucide-react';
import { api } from '@/lib/api';
import type { EnemyTemplate, EnemyInstance, EnemyAttack, EnemyDrop } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  onClose: () => void;
}

type Tab = 'catalogo' | 'temporario' | 'aleatorio';
type Difficulty = 'facil' | 'medio' | 'dificil';

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
};

const STATS: Record<Difficulty, { hp: [number, number]; str: [number, number]; agi: [number, number]; int: [number, number]; def: [number, number] }> = {
  facil:   { hp: [8,  15], str: [5,  8],  agi: [5,  8],  int: [4,  7],  def: [3,  5]  },
  medio:   { hp: [20, 35], str: [10, 14], agi: [10, 14], int: [8,  12], def: [6,  10] },
  dificil: { hp: [45, 70], str: [16, 22], agi: [15, 20], int: [12, 18], def: [12, 18] },
};

interface GeneratedEnemy { name: string; icon: string; hpMax: number; str: number; agi: number; int: number; def: number; }

function generate(diff: Difficulty): GeneratedEnemy {
  const pool = POOL[diff];
  const s    = STATS[diff];
  return {
    name:  pick(pool.names),
    icon:  pick(pool.icons),
    hpMax: rng(...s.hp),
    str:   rng(...s.str),
    agi:   rng(...s.agi),
    int:   rng(...s.int),
    def:   rng(...s.def),
  };
}

function instanceFromTemplate(t: EnemyTemplate): EnemyInstance {
  return {
    instanceId: '',
    templateId: t.id,
    name: t.name,
    type: t.type,
    icon: t.icon,
    hpCurrent: t.hpMax,
    hpMax: t.hpMax,
    attributes: t.attributes,
    attacks: t.attacks,
    drops: t.drops,
    xp: t.xp,
    desc: t.desc,
    notes: t.notes,
  };
}

/* ── Catalog Tab ─────────────────────────────────────────────── */
function CatalogTab({ onClose }: { onClose: () => void }) {
  const [templates, setTemplates] = useState<EnemyTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<EnemyTemplate[]>('/enemies').then((r) => {
      setTemplates(r.data);
      if (r.data.length > 0) setSelectedId(r.data[0].id);
    }).catch(() => {});
  }, []);

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

  return (
    <div className="flex flex-col gap-3">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full text-sm rounded px-3 py-2 outline-none"
        style={{ background: '#2a1818', color: '#e8d8d8', borderColor: '#4a2a2a' }}
      >
        {templates.length === 0 && <option value="">Nenhum template cadastrado</option>}
        {templates.map((t) => (
          <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
        ))}
      </select>

      {selected && (
        <div className="rounded-lg p-3 text-sm flex flex-col gap-1.5" style={{ background: '#2a1818' }}>
          <p className="font-semibold">{selected.icon} {selected.name}</p>
          <p className="text-xs" style={{ color: '#7a5050' }}>
            {selected.type} · HP {selected.hpMax} · ⭐ {selected.xp} XP
          </p>
          <div className="grid grid-cols-3 gap-1 text-center text-xs mt-1">
            {[['FOR', selected.attributes.strength], ['AGI', selected.attributes.agility], ['DEF', selected.attributes.defense]].map(([l, v]) => (
              <div key={l} className="rounded py-1" style={{ background: '#1e1616' }}>
                <p style={{ color: '#7a5050' }}>{l}</p>
                <p className="font-bold">{v}</p>
              </div>
            ))}
          </div>
          {selected.attacks.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-1">
              {selected.attacks.map((a, i) => (
                <p key={i} className="flex justify-between text-xs">
                  <span>{a.name}</span>
                  <span style={{ color: '#7a5050' }}>{a.damage}</span>
                </p>
              ))}
            </div>
          )}
          {selected.drops.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-0.5">
              {selected.drops.map((d, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1e1616' }}>
                  {d.icon} {d.name}
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
  const [int, setInt]     = useState(10);
  const [def, setDef]     = useState(5);
  const [attacks, setAttacks] = useState<EnemyAttack[]>([{ name: '', damage: '' }]);
  const [drops, setDrops]     = useState<EnemyDrop[]>([]);
  const [xp, setXp]       = useState(50);
  const [desc,  setDesc]  = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  function addAttack() {
    setAttacks((a) => [...a, { name: '', damage: '' }]);
  }

  function updateAttack(i: number, field: keyof EnemyAttack, value: string) {
    setAttacks((a) => a.map((x, j) => j === i ? { ...x, [field]: value } : x));
  }

  function removeAttack(i: number) {
    setAttacks((a) => a.filter((_, j) => j !== i));
  }

  function addDrop() {
    if (drops.length >= 2) return;
    setDrops((d) => [...d, { name: '', icon: '🎁' }]);
  }

  function updateDrop(i: number, field: keyof EnemyDrop, value: string) {
    setDrops((d) => d.map((x, j) => j === i ? { ...x, [field]: value } : x));
  }

  function removeDrop(i: number) {
    setDrops((d) => d.filter((_, j) => j !== i));
  }

  async function addToCombat() {
    if (!name.trim()) return;
    setLoading(true);
    const instance: EnemyInstance = {
      instanceId: '',
      templateId: undefined,
      name: name.trim(),
      type: type.trim(),
      icon,
      hpCurrent: hpMax,
      hpMax,
      attributes: { strength: str, agility: agi, intelligence: int, defense: def },
      attacks: attacks.filter((a) => a.name.trim()),
      drops: drops.filter((d) => d.name.trim()),
      xp,
      desc,
      notes,
    };
    try {
      await api.post('/combat/enemies', { enemy: instance });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const inputCls = 'w-full text-sm rounded px-2 py-1.5 outline-none';
  const inputStyle = { background: '#2a1818', color: '#e8d8d8', borderColor: '#4a2a2a' };

  return (
    <div className="flex flex-col gap-3">
      {/* Name + icon */}
      <div className="flex gap-2">
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-12 text-center text-lg rounded outline-none"
          style={inputStyle}
          maxLength={2}
          placeholder="👹"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`flex-1 ${inputCls}`}
          style={inputStyle}
          placeholder="Nome"
        />
      </div>

      {/* Type */}
      <input
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={inputCls}
        style={inputStyle}
        placeholder="Tipo (ex: Besta, Humanoide…)"
      />

      {/* HP + attributes */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'HP máx', value: hpMax, set: setHpMax },
          { label: 'FOR',    value: str,   set: setStr   },
          { label: 'AGI',    value: agi,   set: setAgi   },
          { label: 'INT',    value: int,   set: setInt   },
          { label: 'DEF',    value: def,   set: setDef   },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#7a5050' }}>{label}</p>
            <input
              type="number"
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              className="w-full text-sm rounded px-2 py-1.5 outline-none text-center"
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* Attacks */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#7a5050' }}>Ataques</p>
          <button onClick={addAttack} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
            <Plus size={12} /> Adicionar
          </button>
        </div>
        {attacks.map((atk, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={atk.name}
              onChange={(e) => updateAttack(i, 'name', e.target.value)}
              className={`flex-1 ${inputCls}`}
              style={inputStyle}
              placeholder="Nome do ataque"
            />
            <input
              value={atk.damage}
              onChange={(e) => updateAttack(i, 'damage', e.target.value)}
              className="w-20 text-sm rounded px-2 py-1.5 outline-none font-mono"
              style={inputStyle}
              placeholder="1d6+2"
            />
            <button onClick={() => removeAttack(i)} className="opacity-40 hover:opacity-80">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Drops */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#7a5050' }}>Drops</p>
          {drops.length < 2 && (
            <button onClick={addDrop} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100">
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        {drops.map((drop, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={drop.icon}
              onChange={(e) => updateDrop(i, 'icon', e.target.value)}
              className="w-10 text-center text-base rounded outline-none"
              style={inputStyle}
              maxLength={2}
            />
            <input
              value={drop.name}
              onChange={(e) => updateDrop(i, 'name', e.target.value)}
              className={`flex-1 ${inputCls}`}
              style={inputStyle}
              placeholder="Nome do item"
            />
            <button onClick={() => removeDrop(i)} className="opacity-40 hover:opacity-80">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* XP */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#7a5050' }}>XP</p>
        <input
          type="number"
          value={xp}
          onChange={(e) => setXp(Number(e.target.value))}
          className="w-24 text-sm rounded px-2 py-1.5 outline-none"
          style={inputStyle}
        />
      </div>

      {/* Desc (visível ao jogador) */}
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={2}
        className="w-full text-sm rounded px-2 py-1.5 resize-none outline-none placeholder:opacity-40"
        style={inputStyle}
        placeholder="Descrição (visível ao jogador)…"
      />

      {/* Notes (privado) */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full text-sm rounded px-2 py-1.5 resize-none outline-none placeholder:opacity-40"
        style={inputStyle}
        placeholder="Observações (privado)…"
      />

      <Button variant="danger" size="sm" onClick={addToCombat} disabled={!name.trim() || loading}>
        {loading ? 'Adicionando…' : 'Adicionar ao combate'}
      </Button>
    </div>
  );
}

/* ── Random Tab ─────────────────────────────────────────────── */
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
    const instance: EnemyInstance = {
      instanceId: '',
      templateId: undefined,
      name: customName.trim() || enemy.name,
      type: 'Genérico',
      icon: enemy.icon,
      hpCurrent: enemy.hpMax,
      hpMax: enemy.hpMax,
      attributes: { strength: enemy.str, agility: enemy.agi, intelligence: enemy.int, defense: enemy.def },
      attacks: [],
      drops: [],
      xp: 0,
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

  const diffLabels: Record<Difficulty, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
  const diffColors: Record<Difficulty, string> = { facil: '#3aaa60', medio: '#d4a84e', dificil: '#c04040' };

  return (
    <div className="flex flex-col gap-4">
      {/* Difficulty selector */}
      <div className="grid grid-cols-3 gap-2">
        {(['facil', 'medio', 'dificil'] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => changeDiff(d)}
            className="py-2 rounded-lg text-sm font-semibold transition-all border"
            style={{
              background: diff === d ? diffColors[d] + '22' : '#2a1818',
              borderColor: diff === d ? diffColors[d] : '#4a2a2a',
              color: diff === d ? diffColors[d] : '#7a5050',
            }}
          >
            {diffLabels[d]}
          </button>
        ))}
      </div>

      {/* Preview card */}
      <div className="rounded-lg p-4 flex flex-col gap-3 border" style={{ background: '#2a1818', borderColor: '#4a2a2a' }}>
        <div className="flex items-center gap-3">
          <span
            className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg shrink-0"
            style={{ background: '#1e1616' }}
          >
            {enemy.icon}
          </span>
          <div className="flex-1 min-w-0">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="font-bold text-base bg-transparent outline-none border-b w-full"
              style={{ borderColor: '#4a2a2a', color: '#e8d8d8' }}
            />
            <p className="text-xs mt-0.5" style={{ color: diffColors[diff] }}>{diffLabels[diff]}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="font-semibold uppercase tracking-wider" style={{ color: '#7a5050' }}>HP</span>
            <span className="font-bold tabular-nums">{enemy.hpMax}</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: '#1e1616' }}>
            <div className="h-full rounded-full" style={{ width: '100%', background: '#c04040' }} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          {[['FOR', enemy.str], ['AGI', enemy.agi], ['INT', enemy.int], ['DEF', enemy.def]].map(([l, v]) => (
            <div key={l} className="rounded-lg py-2" style={{ background: '#1e1616' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#7a5050' }}>{l}</p>
              <p className="text-lg font-black leading-tight">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
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
      tab === t
        ? 'text-e-enemy-text'
        : 'opacity-40 hover:opacity-70'
    }`;
  const tabStyle = (t: Tab) =>
    tab === t ? { background: '#2a1818' } : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-[420px] max-h-[90vh] overflow-y-auto rounded-xl border"
        style={{ background: '#1e1616', borderColor: '#4a2a2a', color: '#e8d8d8' }}
      >
      <div className="flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Adicionar inimigo</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg p-1" style={{ background: '#2a1818' }}>
          {(['catalogo', 'temporario', 'aleatorio'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tabCls(t)}
              style={tabStyle(t)}
            >
              {t === 'catalogo' ? 'Catálogo' : t === 'temporario' ? 'Temporário' : 'Aleatório'}
            </button>
          ))}
        </div>

        {tab === 'catalogo' && <CatalogTab onClose={onClose} />}
        {tab === 'temporario' && <TemporaryTab onClose={onClose} />}
        {tab === 'aleatorio' && <RandomTab onClose={onClose} />}
      </div>
      </div>
    </div>
  );
}
