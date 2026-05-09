'use client';

import { useState } from 'react';
import {
  Plus, Trash2, ChevronDown,
  Package, FlaskConical, Flame, Link, CircleDollarSign,
  Sword, Crosshair, Axe, Wand, Shield, Circle, Gem, Wrench, Key,
  Zap, Star, Sparkles, BookOpen, Shirt, Scroll,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { ItemCatalog } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  item?: ItemCatalog;
  defaultType?: string;
  onClose: () => void;
  onSaved: (i: ItemCatalog) => void;
}

/* ── Icon system ─────────────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  Sword, Shield, Axe, Wand, Crosshair, Wrench, Gem, Circle,
  Package, FlaskConical, Flame, Link, CircleDollarSign, Key,
  Zap, Star, Sparkles, BookOpen, Shirt, Scroll,
};

function ItemIconPreview({ value, size = 14 }: { value: string; size?: number }) {
  if (value?.startsWith('img:')) {
    return <img src={value.slice(4)} alt="" width={size * 1.5} height={size * 1.5} className="object-cover rounded" />;
  }
  const Icon = (value && ICON_MAP[value]) || Package;
  return <Icon size={size} />;
}

/* ── Icon Picker ─────────────────────────────────────────────── */
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = useState(false);
  const [mode, setMode]     = useState<'icone' | 'imagem'>(value?.startsWith('img:') ? 'imagem' : 'icone');
  const [imgUrl, setImgUrl] = useState(value?.startsWith('img:') ? value.slice(4) : '');

  const isImg = value?.startsWith('img:');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors"
      >
        <span className="text-e-sub shrink-0">
          <ItemIconPreview value={value} size={13} />
        </span>
        <span className="flex-1 text-e-text truncate">
          {isImg ? 'Imagem personalizada' : (value || <span className="text-e-faint">Selecionar ícone…</span>)}
        </span>
        <ChevronDown size={13} className={`text-e-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl">
          {/* Mode tabs */}
          <div className="flex gap-1 p-2 border-b border-e-border">
            {(['icone', 'imagem'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === m ? 'bg-e-card text-e-text' : 'text-e-sub hover:text-e-text'}`}>
                {m === 'icone' ? 'Ícone Lucide' : 'URL de imagem'}
              </button>
            ))}
          </div>

          {mode === 'icone' ? (
            <div className="max-h-44 overflow-y-auto">
              {Object.entries(ICON_MAP).map(([name, Icon]) => (
                <button key={name} type="button"
                  onClick={() => { onChange(name); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${name === value ? 'bg-e-accent/10 text-e-accent' : 'hover:bg-e-card text-e-text'}`}>
                  <Icon size={13} className="shrink-0" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
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
                  <img src={imgUrl} alt="" className="w-8 h-8 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span className="text-xs text-e-sub truncate">{imgUrl}</span>
                </div>
              )}
              <Button variant="primary" size="sm" onClick={() => { onChange(`img:${imgUrl}`); setOpen(false); }} disabled={!imgUrl.trim()}>
                Usar imagem
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Generic dropdown ────────────────────────────────────────── */
function Dropdown({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors">
        <span className="flex-1 text-e-text truncate">{selected?.label ?? <span className="text-e-faint">Selecionar…</span>}</span>
        <ChevronDown size={13} className={`text-e-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors ${value === opt.value ? 'text-e-accent' : 'text-e-text'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Options ─────────────────────────────────────────────────── */
const TYPE_OPTS    = [{ value: 'weapon', label: '⚔️  Arma' }, { value: 'armor', label: '🛡️  Armadura' }, { value: 'accessory', label: '💍  Acessório' }, { value: 'normal', label: '🎒  Normal' }, { value: 'chave', label: '🔑  Chave' }];
const WEAPON_OPTS  = ['curta', 'média', 'pesada', 'ranged', 'unarmed'].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
const DMGATTR_OPTS = [['strength','FOR — Força'], ['agility','AGI — Agilidade'], ['intelligence','INT — Inteligência'], ['resistance','RES — Resistência']].map(([v, l]) => ({ value: v, label: l }));
const DICE_OPTS    = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map((v) => ({ value: v, label: v }));
const SLOT_OPTS_WEAPON    = [['mainHand','Mão Principal'], ['offHand','Offhand']].map(([v, l]) => ({ value: v, label: l }));
const SLOT_OPTS_ACCESSORY = [['amulet','Amuleto'], ['ring','Anel'], ['utility','Utilitário']].map(([v, l]) => ({ value: v, label: l }));
const ATTR_OPTS    = [['strength','FOR — Força'], ['agility','AGI — Agilidade'], ['intelligence','INT — Inteligência'], ['resistance','RES — Resistência'], ['flow','FLX — Fluxo'], ['wisdom','SAB — Sabedoria'], ['presence','PRE — Presença'], ['defense','DEF — Defesa']].map(([v, l]) => ({ value: v, label: l }));

const lbl = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';
const inp = 'w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors';

/* ── Modal ───────────────────────────────────────────────────── */
export default function ItemModal({ item, defaultType, onClose, onSaved }: Props) {
  const editing = !!item;

  const [name,    setName]    = useState(item?.name    ?? '');
  const [desc,    setDesc]    = useState(item?.desc    ?? '');
  const [type,    setType]    = useState(item?.type    ?? defaultType ?? 'consumable');
  const [icon,    setIcon]    = useState(item?.icon    ?? '');
  const [equipSlot, setEquipSlot] = useState(item?.equipSlot ?? '');
  const [properties, setProperties] = useState(item?.properties ?? '');

  const [weaponType,      setWeaponType]      = useState(item?.weaponType      ?? 'curta');
  const [damageBase,      setDamageBase]      = useState(item?.damageBase      ?? 0);
  const [diceQty,         setDiceQty]         = useState(item?.damageDice?.quantity ?? 1);
  const [diceDie,         setDiceDie]         = useState(item?.damageDice?.die      ?? 'd6');
  const [damageAttribute, setDamageAttribute] = useState(item?.damageAttribute ?? 'strength');
  const [armorWeight,     setArmorWeight]     = useState(item?.armorWeight ?? '');

  // Attribute bonuses — armors pre-populate 'defense'
  const [bonuses, setBonuses] = useState<[string, number][]>(() => {
    const existing = Object.entries(item?.attributeBonus ?? {});
    if (!item && (defaultType === 'armor' || type === 'armor') && !existing.find(([k]) => k === 'defense')) {
      return [['defense', 0], ...existing];
    }
    return existing;
  });

  const [loading, setLoading] = useState(false);

  function handleTypeChange(t: string) {
    setType(t);
    // Reset equipSlot to a valid default for the new type
    if (t === 'weapon')    setEquipSlot('mainHand');
    else if (t === 'armor') setEquipSlot('armor');
    else if (t === 'accessory') setEquipSlot('amulet');
    else setEquipSlot('');
    if (t === 'armor' && !bonuses.find(([k]) => k === 'defense')) {
      setBonuses((b) => [['defense', 0], ...b]);
    }
  }

  function addBonus() { setBonuses((b) => [...b, ['strength', 1]]); }
  function updateBonusAttr(i: number, v: string)  { setBonuses((b) => b.map((x, j) => j === i ? [v, x[1]] : x)); }
  function updateBonusVal(i: number,  v: number)  { setBonuses((b) => b.map((x, j) => j === i ? [x[0], v] : x)); }
  function removeBonus(i: number) { setBonuses((b) => b.filter((_, j) => j !== i)); }

  const isWeapon = type === 'weapon';
  const hasEquip = type === 'weapon' || type === 'armor' || type === 'accessory';

  async function save() {
    if (!name.trim()) return;
    setLoading(true);
    const attrBonus = bonuses.length > 0 ? Object.fromEntries(bonuses) : undefined;
    const body: Partial<ItemCatalog> = {
      name: name.trim(), desc, type,
      icon: icon || undefined,
      equipSlot: equipSlot || undefined,
      attributeBonus: attrBonus,
    };
    if (isWeapon) {
      body.weaponType      = weaponType;
      body.damageBase      = damageBase;
      body.damageDice      = { quantity: diceQty, die: diceDie };
      body.damageAttribute = damageAttribute;
      body.properties      = properties || undefined;
    }
    if (type === 'armor') {
      body.damageReduction = attrBonus?.defense ?? 0;
      body.armorWeight = armorWeight || undefined;
    }
    try {
      const res = editing
        ? await api.put<ItemCatalog>(`/items/${item!.id}`, body)
        : await api.post<ItemCatalog>('/items', body);
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
          <h2 className="font-bold text-base">{editing ? 'Editar item' : 'Novo item'}</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>

        {/* Tipo */}
        <div>
          <label className={lbl}>Tipo</label>
          <Dropdown value={type} onChange={handleTypeChange} options={TYPE_OPTS} />
        </div>

        {/* Ícone + Nome */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={lbl}>Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className={inp} placeholder="Nome do item" />
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
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
            className={`resize-none ${inp}`} placeholder="Descrição…" />
        </div>

        {/* ── Weapon fields ── */}
        {isWeapon && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Tipo de arma</label>
                <Dropdown value={weaponType} onChange={setWeaponType} options={WEAPON_OPTS} />
              </div>
              <div>
                <label className={lbl}>Atributo de dano</label>
                <Dropdown value={damageAttribute} onChange={setDamageAttribute} options={DMGATTR_OPTS} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Dano base</label>
                <input type="number" value={damageBase} onChange={(e) => setDamageBase(Number(e.target.value))}
                  className={`text-center ${inp}`} />
              </div>
              <div>
                <label className={lbl}>Qtd. dado</label>
                <input type="number" value={diceQty} min={0} onChange={(e) => setDiceQty(Number(e.target.value))}
                  className={`text-center ${inp}`} />
              </div>
              <div>
                <label className={lbl}>Tipo do dado</label>
                <Dropdown value={diceDie} onChange={setDiceDie} options={DICE_OPTS} />
              </div>
            </div>
            <div>
              <label className={lbl}>Propriedades</label>
              <input value={properties} onChange={(e) => setProperties(e.target.value)}
                className={inp} placeholder="ex: perfurante, versátil…" />
            </div>
          </>
        )}

        {/* ── Equip slot ── */}
        {isWeapon && (
          <div>
            <label className={lbl}>Slot de equipamento</label>
            <div className="flex gap-2">
              {SLOT_OPTS_WEAPON.map((o) => (
                <button key={o.value} type="button" onClick={() => setEquipSlot(o.value)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${equipSlot === o.value ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {type === 'accessory' && (
          <div>
            <label className={lbl}>Slot de equipamento</label>
            <div className="flex gap-2">
              {SLOT_OPTS_ACCESSORY.map((o) => (
                <button key={o.value} type="button" onClick={() => setEquipSlot(o.value)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${equipSlot === o.value ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Peso de armadura */}
        {type === 'armor' && (
          <div>
            <label className={lbl}>Peso</label>
            <div className="flex gap-2">
              {[
                { v: 'leve',  label: 'Leve',  hint: '1d20' },
                { v: 'média', label: 'Média', hint: 'Desvantagem' },
                { v: 'pesada',label: 'Pesada',hint: 'Sem desvio' },
              ].map(({ v, label, hint }) => (
                <button key={v} type="button" onClick={() => setArmorWeight(v)}
                  className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl border text-xs font-medium transition-colors cursor-pointer gap-0.5 ${
                    armorWeight === v
                      ? 'bg-e-accent/15 border-e-accent text-e-accent'
                      : 'border-e-border text-e-faint hover:border-e-border2 hover:text-e-sub'
                  }`}>
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
                {type === 'armor' ? 'Atributos (DEF = proteção da armadura)' : 'Bônus de atributo'}
              </label>
              <button onClick={addBonus} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {bonuses.map(([attr, val], i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Dropdown value={attr} onChange={(v) => updateBonusAttr(i, v)} options={ATTR_OPTS} />
                </div>
                <input type="number" value={val} onChange={(e) => updateBonusVal(i, Number(e.target.value))}
                  className="w-16 text-center text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2"
                />
                <button onClick={() => removeBonus(i)} className="opacity-40 hover:opacity-80 shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
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
