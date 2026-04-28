'use client';

import { useState } from 'react';
import {
  X, Trash2, CheckCircle, XCircle, ChevronDown,
  Package, FlaskConical, Flame, Link, CircleDollarSign,
  Sword, Crosshair, Axe, Wand, Shield, Circle, Gem, Wrench,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import Button from '@/components/ui/Button';
import type { Player, Item } from '@/store/types';
import { EQUIPMENT_CATALOG, type CatalogEntry, type EquipSlot } from '@/lib/equipmentCatalog';

// ── Icon system ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Package, FlaskConical, Flame, Link, CircleDollarSign,
  Sword, Crosshair, Axe, Wand, Shield, Circle, Gem, Wrench,
};

function iconForType(type: string): string {
  switch (type) {
    case 'consumable': return 'FlaskConical';
    case 'weapon':     return 'Sword';
    case 'armor':      return 'Shield';
    case 'accessory':  return 'Gem';
    case 'currency':   return 'CircleDollarSign';
    default:           return 'Package';
  }
}

function iconForEntry(entry: CatalogEntry): string {
  if ('damageBase' in entry.item) {
    const wt = (entry.item as { weaponType?: string }).weaponType ?? '';
    if (wt === 'bow')   return 'Crosshair';
    if (wt === 'axe')   return 'Axe';
    if (wt === 'staff') return 'Wand';
    return 'Sword';
  }
  if ('damageReduction' in entry.item) return 'Shield';
  if (entry.slot === 'amulet') return 'Gem';
  if (entry.slot === 'ring')   return 'Circle';
  return 'Wrench';
}

function ItemIcon({ name, size = 14, className }: { name?: string; size?: number; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || Package;
  return <Icon size={size} className={className} />;
}

// ── Equipment slot config ──────────────────────────────────────────────────────

const SLOT_CONFIG: { key: EquipSlot; label: string; icon: string }[] = [
  { key: 'mainHand', label: 'Mão Principal', icon: 'Sword'          },
  { key: 'offHand',  label: 'Offhand',       icon: 'Shield'         },
  { key: 'armor',    label: 'Armadura',      icon: 'Shield'         },
  { key: 'amulet',   label: 'Amuleto',       icon: 'Gem'            },
  { key: 'ring',     label: 'Anel',          icon: 'Circle'         },
  { key: 'utility',  label: 'Utilitário',    icon: 'Wrench'         },
];

// ── Quick-add chips ────────────────────────────────────────────────────────────

const QUICK_ITEMS = [
  { name: 'Poção de Vida',  desc: 'Recupera HP',       type: 'consumable', icon: 'FlaskConical' },
  { name: 'Poção de Fluxo', desc: 'Recupera Flow',     type: 'consumable', icon: 'FlaskConical' },
  { name: 'Poção de Éter',  desc: 'Recupera Éter',     type: 'consumable', icon: 'FlaskConical' },
  { name: 'Antídoto',       desc: 'Cura venenos',      type: 'consumable', icon: 'FlaskConical' },
  { name: 'Tocha',          desc: 'Ilumina o caminho', type: 'equipment',  icon: 'Flame'        },
  { name: 'Corda',          desc: '15 metros',         type: 'equipment',  icon: 'Link'         },
];

const lbl = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';

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
  const selected = entries.find((e) => e.item.id === selectedId);

  function stats(entry: CatalogEntry): string {
    if ('damageBase' in entry.item) {
      const w = entry.item as { damageBase: number; damageDice: { quantity: number; die: string } };
      return `${w.damageBase}+${w.damageDice.quantity}${w.damageDice.die}`;
    }
    if ('damageReduction' in entry.item)
      return `-${(entry.item as { damageReduction: number }).damageReduction} dano`;
    if (entry.item.attributeBonus) {
      return Object.entries(entry.item.attributeBonus)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k.slice(0, 3).toUpperCase()}+${v}`)
        .join(' ') || '';
    }
    return '';
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
            <ItemIcon name={iconForEntry(selected)} size={13} className="text-e-sub shrink-0" />
            <span className="flex-1 text-e-text truncate">{selected.item.name}</span>
            <span className="text-e-faint text-xs shrink-0">{stats(selected)}</span>
          </>
        ) : (
          <span className="text-e-faint flex-1">Selecionar…</span>
        )}
        <ChevronDown size={13} className={`text-e-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl max-h-52 overflow-y-auto">
          {entries.map((entry) => (
            <button
              key={entry.item.id}
              type="button"
              onClick={() => { onSelect(entry.item.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-e-card transition-colors text-left cursor-pointer"
            >
              <ItemIcon name={iconForEntry(entry)} size={13} className="text-e-sub shrink-0" />
              <span className="flex-1 text-e-text truncate">{entry.item.name}</span>
              <span className="text-e-faint text-xs shrink-0">{stats(entry)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Icon picker ───────────────────────────────────────────────────────────────

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {Object.entries(ICON_MAP).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          title={name}
          onClick={() => onChange(name)}
          className={`flex flex-col items-center justify-center gap-1 rounded-lg p-2 border transition-colors cursor-pointer ${
            value === name
              ? 'bg-e-accent/20 border-e-accent text-e-accent'
              : 'bg-e-bg border-e-border text-e-faint hover:text-e-sub hover:border-e-border2'
          }`}
        >
          <Icon size={16} />
          <span className="text-[8px] leading-none truncate w-full text-center">{name}</span>
        </button>
      ))}
    </div>
  );
}

// ── Equip-from-inventory sub-panel ────────────────────────────────────────────

function EquipPanel({
  item,
  onEquip,
  processing,
}: {
  item: Item;
  onEquip: (slot: EquipSlot) => void;
  processing: boolean;
}) {
  const isWeapon = item.type === 'weapon';
  const naturalSlot = (item.equipSlot as EquipSlot | undefined) ?? (isWeapon ? 'mainHand' : item.type === 'armor' ? 'armor' : 'utility');
  const [slot, setSlot] = useState<EquipSlot>(naturalSlot);

  if (isWeapon) {
    return (
      <div className="flex flex-col gap-1.5 mt-1.5">
        <div className="flex gap-1">
          {(['mainHand', 'offHand'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={`flex-1 text-[10px] py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                slot === s
                  ? 'bg-e-accent/20 border-e-accent text-e-accent'
                  : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'
              }`}
            >
              {s === 'mainHand' ? 'Principal' : 'Offhand'}
            </button>
          ))}
        </div>
        <button
          onClick={() => onEquip(slot)}
          disabled={processing}
          className="text-xs bg-e-accent/20 text-e-accent border border-e-accent/40 rounded-lg px-2 py-1.5 hover:bg-e-accent/30 disabled:opacity-40 cursor-pointer transition-colors"
        >
          {processing ? 'Equipando…' : 'Equipar'}
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
      {processing ? 'Equipando…' : `Equipar (${SLOT_CONFIG.find((s) => s.key === naturalSlot)?.label ?? naturalSlot})`}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type GiveTab = 'itens' | 'armas' | 'armaduras';

export default function InventarioModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const { setPlayer } = useStore();

  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<GiveTab>('itens');

  // Tab: Itens
  const [createForm, setCreateForm] = useState({
    name: '', desc: '', qty: 1, type: 'consumable', icon: 'FlaskConical',
  });
  const [giving, setGiving] = useState(false);

  // Tab: Armas / Armaduras
  const [weaponId, setWeaponId]   = useState<string | null>(null);
  const [armorId, setArmorId]     = useState<string | null>(null);
  const [givingEquip, setGivingEquip] = useState(false);

  // Grid
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [slotView, setSlotView]     = useState<'menu' | 'equip'>('menu');

  // ── Derived ──────────────────────────────────────────────────────────────────

  const eq        = player.equipment ?? {};
  const allItems  = player.items ?? [];
  const pending   = player.pendingRequests ?? [];
  const currency  = allItems.filter((i) => i.type === 'currency');
  const gridItems = allItems.filter((i) => i.type !== 'currency');
  const isFull    = gridItems.length >= 16;

  const weaponEntries = EQUIPMENT_CATALOG.filter(
    (e) => e.slot === 'mainHand' || e.slot === 'offHand',
  );
  const armorEntries = EQUIPMENT_CATALOG.filter(
    (e) => e.slot === 'armor' || e.slot === 'amulet' || e.slot === 'ring' || e.slot === 'utility',
  );

  const selectedWeapon = weaponEntries.find((e) => e.item.id === weaponId);
  const selectedArmor  = armorEntries.find((e) => e.item.id === armorId);
  const activeItem     = activeSlot !== null ? (gridItems[activeSlot] ?? null) : null;

  // ── API handlers ─────────────────────────────────────────────────────────────

  async function handleRequest(requestId: string, approve: boolean) {
    setProcessing(requestId);
    try {
      const res = await api.post<Player>(
        approve ? '/master/approve-item' : '/master/reject-item',
        { playerId: player.id, requestId },
      );
      setPlayer(res.data);
    } catch {}
    finally { setProcessing(null); }
  }

  async function removeItem(itemId: string) {
    setProcessing(itemId);
    setActiveSlot(null);
    try {
      const res = await api.delete<Player>(`/master/players/${player.id}/items/${itemId}`);
      setPlayer(res.data);
    } catch {}
    finally { setProcessing(null); }
  }

  async function adjustCurrency(itemId: string, delta: number) {
    setProcessing(`cur-${itemId}`);
    try {
      const res = await api.put<Player>(`/master/players/${player.id}/items/${itemId}`, { delta });
      setPlayer(res.data);
    } catch {}
    finally { setProcessing(null); }
  }

  async function giveItem() {
    if (!createForm.name.trim()) return;
    setGiving(true);
    try {
      const res = await api.post<Player>(`/master/players/${player.id}/items`, {
        name: createForm.name, desc: createForm.desc,
        qty: createForm.qty,   type: createForm.type,
        icon: createForm.icon,
      });
      setPlayer(res.data);
      setCreateForm({ name: '', desc: '', qty: 1, type: 'consumable', icon: 'FlaskConical' });
    } catch {}
    finally { setGiving(false); }
  }

  async function giveEquipmentItem(entry: CatalogEntry, type: 'weapon' | 'armor' | 'accessory') {
    setGivingEquip(true);
    try {
      const base = { name: entry.item.name, desc: '', qty: 1, type, equipSlot: entry.slot };
      const body =
        type === 'weapon' ? {
          ...base,
          icon: iconForEntry(entry),
          weaponType: (entry.item as { weaponType?: string }).weaponType,
          damageBase: (entry.item as { damageBase?: number }).damageBase,
          damageDice: (entry.item as { damageDice?: unknown }).damageDice,
          damageAttribute: (entry.item as { damageAttribute?: string }).damageAttribute,
          attributeBonus: entry.item.attributeBonus,
        } :
        type === 'armor' ? {
          ...base,
          icon: 'Shield',
          damageReduction: (entry.item as { damageReduction?: number }).damageReduction,
          attributeBonus: entry.item.attributeBonus,
        } : {
          ...base,
          icon: iconForEntry(entry),
          attributeBonus: entry.item.attributeBonus,
        };
      const res = await api.post<Player>(`/master/players/${player.id}/items`, body);
      setPlayer(res.data);
      if (type === 'weapon') setWeaponId(null);
      else setArmorId(null);
    } catch {}
    finally { setGivingEquip(false); }
  }

  async function equipFromInventory(item: Item, slot: EquipSlot) {
    setProcessing(`equip-${item.id}`);
    try {
      const body =
        item.type === 'weapon' ? {
          weapon: {
            id: item.id, name: item.name,
            weaponType: item.weaponType ?? '',
            damageBase: item.damageBase ?? 0,
            damageDice: item.damageDice ?? { quantity: 1, die: 'd6' },
            damageAttribute: item.damageAttribute ?? '',
            attributeBonus: item.attributeBonus,
          },
        } :
        item.type === 'armor' ? {
          armor: {
            id: item.id, name: item.name,
            damageReduction: item.damageReduction ?? 0,
            attributeBonus: item.attributeBonus,
          },
        } : {
          accessory: {
            id: item.id, name: item.name,
            attributeBonus: item.attributeBonus,
          },
        };
      const res = await api.put<Player>(`/master/players/${player.id}/equipment/${slot}`, body);
      setPlayer(res.data);
      setActiveSlot(null);
    } catch {}
    finally { setProcessing(null); }
  }

  async function clearSlot(slot: EquipSlot) {
    setProcessing(`clear-${slot}`);
    try {
      const res = await api.delete<Player>(`/master/players/${player.id}/equipment/${slot}`);
      setPlayer(res.data);
    } catch {}
    finally { setProcessing(null); }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) { setActiveSlot(null); onClose(); } }}
    >
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <div>
            <h3 className="font-semibold text-e-text">{player.char.name} — Inventário</h3>
            <p className="text-xs text-e-sub mt-0.5">
              {gridItems.length}/16 slots
              {pending.length > 0 ? ` · ${pending.length} solicitação${pending.length !== 1 ? 'ões' : ''}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">

          {/* ── Left column ── */}
          <div className="w-[400px] shrink-0 border-r border-e-border overflow-y-auto p-6 flex flex-col gap-6">

            {/* Equipment — display + unequip only */}
            <section>
              <p className={lbl}>Equipamento</p>
              <div className="grid grid-cols-2 gap-2">
                {SLOT_CONFIG.map(({ key, label: slotLabel, icon: slotIcon }) => {
                  const slotItem = eq[key as keyof typeof eq] as Record<string, unknown> | undefined;
                  const busy = processing === `clear-${key}`;
                  return (
                    <div key={key} className="bg-e-card rounded-xl border border-e-border flex items-center gap-2.5 px-3 py-3">
                      <ItemIcon
                        name={slotItem
                          ? iconForType(key === 'mainHand' || key === 'offHand' ? 'weapon' : key === 'armor' ? 'armor' : 'accessory')
                          : slotIcon}
                        size={13}
                        className="text-e-faint shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-e-faint mb-0.5">{slotLabel}</p>
                        {slotItem ? (
                          <p className="text-xs font-medium text-e-text truncate">{slotItem.name as string}</p>
                        ) : (
                          <p className="text-xs text-e-faint italic">Vazio</p>
                        )}
                      </div>
                      {slotItem && (
                        <button
                          onClick={() => clearSlot(key)}
                          disabled={busy}
                          title="Desequipar"
                          className="p-1 rounded hover:bg-e-danger/20 text-e-faint hover:text-e-danger disabled:opacity-40 cursor-pointer transition-colors shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Give item — 3 tabs */}
            <section>
              <p className={lbl}>Dar item</p>
              <div className="flex gap-1 mb-4 bg-e-bg rounded-xl p-1">
                {(['itens', 'armas', 'armaduras'] as GiveTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      tab === t ? 'bg-e-surface text-e-text shadow-sm' : 'text-e-faint hover:text-e-sub'
                    }`}
                  >
                    {t === 'armaduras' ? 'Arm./Acess.' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* ── Tab: Itens ── */}
              {tab === 'itens' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ITEMS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setCreateForm((f) => ({ ...f, name: c.name, desc: c.desc, type: c.type, icon: c.icon }))}
                        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-e-border bg-e-card hover:border-e-accent hover:text-e-accent text-e-sub transition-colors cursor-pointer"
                      >
                        <ItemIcon name={c.icon} size={11} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <div className="bg-e-bg border border-e-border rounded-xl p-3 flex flex-col gap-3">
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <div>
                        <label className={lbl}>Nome</label>
                        <input
                          type="text" value={createForm.name} placeholder="Nome do item"
                          onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className={lbl}>Qtd</label>
                        <input
                          type="number" min={1} value={createForm.qty}
                          onChange={(e) => setCreateForm((f) => ({ ...f, qty: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Descrição</label>
                      <input
                        type="text" value={createForm.desc} placeholder="Opcional"
                        onChange={(e) => setCreateForm((f) => ({ ...f, desc: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Tipo</label>
                      <select value={createForm.type} onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}>
                        <option value="consumable">Consumível</option>
                        <option value="equipment">Equipamento</option>
                        <option value="currency">Moeda</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Ícone</label>
                      <IconPicker value={createForm.icon} onChange={(v) => setCreateForm((f) => ({ ...f, icon: v }))} />
                    </div>
                  </div>
                  {isFull && createForm.type !== 'currency' && (
                    <p className="text-xs text-e-danger bg-e-danger/10 border border-e-danger/20 rounded-lg px-3 py-2">
                      Inventário cheio (16/16)
                    </p>
                  )}
                  <Button
                    type="button" variant="primary" size="md"
                    disabled={!createForm.name.trim() || giving || (isFull && createForm.type !== 'currency')}
                    onClick={giveItem}
                  >
                    {giving ? 'Adicionando…' : 'Dar item'}
                  </Button>
                </div>
              )}

              {/* ── Tab: Armas ── */}
              {tab === 'armas' && (
                <div className="flex flex-col gap-3">
                  <CatalogSelect entries={weaponEntries} selectedId={weaponId} onSelect={setWeaponId} />
                  {selectedWeapon && (() => {
                    const w = selectedWeapon.item as {
                      name: string; weaponType: string;
                      damageBase: number; damageDice: { quantity: number; die: string };
                      damageAttribute: string; properties?: string;
                      attributeBonus?: Record<string, number>;
                    };
                    return (
                      <div className="bg-e-bg border border-e-border rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <ItemIcon name={iconForEntry(selectedWeapon)} size={15} className="text-e-accent shrink-0" />
                          <span className="text-sm font-medium text-e-text">{w.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <span className="text-e-faint">Tipo<br /><span className="text-e-sub">{w.weaponType}</span></span>
                          <span className="text-e-faint">Dano<br /><span className="text-e-sub">{w.damageBase}+{w.damageDice.quantity}{w.damageDice.die}</span></span>
                          <span className="text-e-faint">Attr<br /><span className="text-e-sub">{w.damageAttribute}</span></span>
                        </div>
                        {w.properties && <p className="text-xs text-e-faint">Propriedades: <span className="text-e-sub">{w.properties}</span></p>}
                        {w.attributeBonus && Object.entries(w.attributeBonus).some(([, v]) => v > 0) && (
                          <p className="text-xs text-e-faint">
                            Bônus: <span className="text-e-sub">{Object.entries(w.attributeBonus).filter(([, v]) => v > 0).map(([k, v]) => `${k}+${v}`).join(', ')}</span>
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  {isFull && (
                    <p className="text-xs text-e-danger bg-e-danger/10 border border-e-danger/20 rounded-lg px-3 py-2">
                      Inventário cheio (16/16)
                    </p>
                  )}
                  <Button
                    type="button" variant="primary" size="md"
                    disabled={!weaponId || givingEquip || isFull}
                    onClick={() => selectedWeapon && giveEquipmentItem(selectedWeapon, 'weapon')}
                  >
                    {givingEquip ? 'Adicionando…' : 'Adicionar ao inventário'}
                  </Button>
                </div>
              )}

              {/* ── Tab: Armaduras e Acessórios ── */}
              {tab === 'armaduras' && (
                <div className="flex flex-col gap-3">
                  <CatalogSelect entries={armorEntries} selectedId={armorId} onSelect={setArmorId} />
                  {selectedArmor && (() => {
                    const item = selectedArmor.item as {
                      name: string;
                      damageReduction?: number;
                      attributeBonus?: Record<string, number>;
                    };
                    const slotLabel = SLOT_CONFIG.find((s) => s.key === selectedArmor.slot)?.label;
                    return (
                      <div className="bg-e-bg border border-e-border rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <ItemIcon name={iconForEntry(selectedArmor)} size={15} className="text-e-accent shrink-0" />
                          <span className="text-sm font-medium text-e-text">{item.name}</span>
                          <span className="text-[10px] text-e-faint border border-e-border rounded px-1.5 py-0.5 ml-auto">{slotLabel}</span>
                        </div>
                        {'damageReduction' in selectedArmor.item && (
                          <p className="text-xs text-e-faint">Redução de dano: <span className="text-e-sub">{item.damageReduction}</span></p>
                        )}
                        {item.attributeBonus && Object.entries(item.attributeBonus).some(([, v]) => v > 0) && (
                          <p className="text-xs text-e-faint">
                            Bônus: <span className="text-e-sub">{Object.entries(item.attributeBonus).filter(([, v]) => v > 0).map(([k, v]) => `${k}+${v}`).join(', ')}</span>
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  {isFull && (
                    <p className="text-xs text-e-danger bg-e-danger/10 border border-e-danger/20 rounded-lg px-3 py-2">
                      Inventário cheio (16/16)
                    </p>
                  )}
                  <Button
                    type="button" variant="primary" size="md"
                    disabled={!armorId || givingEquip || isFull}
                    onClick={() => {
                      if (!selectedArmor) return;
                      const t = selectedArmor.slot === 'armor' ? 'armor' : 'accessory';
                      giveEquipmentItem(selectedArmor, t as 'armor' | 'accessory');
                    }}
                  >
                    {givingEquip ? 'Adicionando…' : 'Adicionar ao inventário'}
                  </Button>
                </div>
              )}
            </section>

            {/* Pending requests */}
            {pending.length > 0 && (
              <section>
                <p className={`${lbl} text-e-gold`}>Solicitações pendentes</p>
                <div className="flex flex-col gap-2">
                  {pending.map((req) => {
                    const itemName = allItems.find((i) => i.id === req.itemId)?.name ?? req.itemId;
                    return (
                      <div key={req.id} className="flex items-center gap-3 bg-e-gold/5 border border-e-gold/20 rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-e-faint mb-0.5">{req.type}</p>
                          <p className="text-sm font-medium text-e-text truncate">{itemName}</p>
                        </div>
                        <button onClick={() => handleRequest(req.id, true)} disabled={processing === req.id}
                          title="Aprovar" className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 disabled:opacity-40 cursor-pointer transition-colors">
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => handleRequest(req.id, false)} disabled={processing === req.id}
                          title="Rejeitar" className="p-1.5 rounded-lg hover:bg-e-danger/20 text-e-danger disabled:opacity-40 cursor-pointer transition-colors">
                          <XCircle size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

            {/* Currency */}
            {currency.length > 0 && (
              <section>
                <p className={lbl}>Moedas</p>
                <div className="flex flex-col gap-2">
                  {currency.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-e-card border border-e-border rounded-xl px-4 py-3">
                      <CircleDollarSign size={16} className="text-e-gold shrink-0" />
                      <span className="flex-1 text-sm font-medium text-e-text">{item.name}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => adjustCurrency(item.id, -1)} disabled={processing === `cur-${item.id}`}
                          className="w-6 h-6 rounded-lg bg-e-surface border border-e-border text-e-sub hover:text-e-text disabled:opacity-40 cursor-pointer flex items-center justify-center transition-colors text-sm font-bold">
                          −
                        </button>
                        <span className="text-sm font-bold tabular-nums text-e-gold w-10 text-center">{item.qty}</span>
                        <button onClick={() => adjustCurrency(item.id, 1)} disabled={processing === `cur-${item.id}`}
                          className="w-6 h-6 rounded-lg bg-e-surface border border-e-border text-e-sub hover:text-e-text disabled:opacity-40 cursor-pointer flex items-center justify-center transition-colors text-sm font-bold">
                          +
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} disabled={processing === item.id}
                        className="text-e-faint hover:text-e-danger disabled:opacity-40 cursor-pointer transition-colors p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Inventory grid */}
            <section className="flex-1">
              <p className={lbl}>Inventário ({gridItems.length}/16)</p>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 16 }, (_, i) => {
                  const item = gridItems[i] ?? null;
                  const isActive = activeSlot === i;
                  const isEquipable = item && (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory');
                  return (
                    <div key={i} className="relative aspect-square">
                      <button
                        onClick={() => {
                          if (!item) return;
                          if (isActive) { setActiveSlot(null); }
                          else { setActiveSlot(i); setSlotView('menu'); }
                        }}
                        className={`w-full h-full rounded-xl border flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                          item
                            ? isActive
                              ? 'bg-e-card border-e-accent cursor-pointer'
                              : 'bg-e-card border-e-border hover:border-e-border2 cursor-pointer'
                            : 'bg-e-bg border-e-border cursor-default'
                        }`}
                      >
                        {item ? (
                          <>
                            <ItemIcon name={item.icon ?? iconForType(item.type)} size={22} className="text-e-sub" />
                            <span className="text-[10px] text-e-sub text-center leading-tight line-clamp-2 w-full px-1">
                              {item.name}
                            </span>
                            {item.qty > 1 && (
                              <span className="absolute top-1 right-1.5 text-[9px] font-black text-e-accent leading-none">
                                {item.qty}
                              </span>
                            )}
                            {isEquipable && (
                              <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-e-accent/60" title="Equipável" />
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-e-faint/40 font-medium">{i + 1}</span>
                        )}
                      </button>

                      {/* Mini menu */}
                      {isActive && item && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveSlot(null)} />
                          <div className="absolute z-30 top-full mt-1 left-0 w-48 bg-e-surface border border-e-border rounded-xl shadow-2xl p-2 flex flex-col gap-1">
                            <div className="px-2 py-1.5 border-b border-e-border mb-1">
                              <p className="text-xs font-semibold text-e-text">{item.name}</p>
                              {item.desc && <p className="text-[10px] text-e-sub mt-0.5 leading-snug">{item.desc}</p>}
                              {item.type === 'weapon' && item.damageDice && (
                                <p className="text-[10px] text-e-faint mt-0.5">
                                  {item.weaponType} · {item.damageBase}+{item.damageDice.quantity}{item.damageDice.die} · {item.damageAttribute}
                                </p>
                              )}
                              {item.type === 'armor' && item.damageReduction != null && (
                                <p className="text-[10px] text-e-faint mt-0.5">Redução: {item.damageReduction}</p>
                              )}
                              {item.attributeBonus && Object.entries(item.attributeBonus).some(([, v]) => v > 0) && (
                                <p className="text-[10px] text-e-faint mt-0.5">
                                  {Object.entries(item.attributeBonus).filter(([, v]) => v > 0).map(([k, v]) => `${k}+${v}`).join(' ')}
                                </p>
                              )}
                              <p className="text-[10px] text-e-faint mt-0.5">Qtd: {item.qty}</p>
                            </div>

                            {isEquipable && slotView === 'menu' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSlotView('equip'); }}
                                className="flex items-center gap-2 text-xs text-e-accent hover:bg-e-accent/10 rounded-lg px-2 py-1.5 cursor-pointer transition-colors"
                              >
                                <Sword size={12} /> Equipar
                              </button>
                            )}

                            {isEquipable && slotView === 'equip' && (
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
                              <Trash2 size={12} /> Remover do inventário
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
      </div>
    </div>
  );
}
