"use client";

import { useEffect, useState } from "react";
import { ChevronDown, X, Package, FlaskConical, Sword, Shield, Gem, Wrench, Key, Flame, Link, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/store";
import Button from "@/components/ui/Button";
import type { Player, ClassKit, PlayerAttributes } from "@/store/types";
import { normalizeGdriveUrl, proxyUrl } from '@/lib/gdrive';

const RACES = ["Humano", "Elfo", "Anão", "Gnomo", "Wix", "Nakudama"];

const DEFAULT_SLOTS_FREE = 6;

const ATTR_LABELS: [keyof PlayerAttributes, string, string][] = [
  ['strength',     'Força',         'FOR'],
  ['agility',      'Agilidade',     'AGI'],
  ['intelligence', 'Inteligência',  'INT'],
  ['resistance',   'Resistência',   'RES'],
  ['flow',         'Flow',          'FLX'],
  ['wisdom',       'Sabedoria',     'SAB'],
  ['presence',     'Presença',      'PRE'],
  ['defense',      'Defesa',        'DEF'],
];

const EMPTY_ATTRS: PlayerAttributes = {
  strength: 0, agility: 0, intelligence: 0, resistance: 0,
  flow: 0, wisdom: 0, presence: 0, defense: 0,
};

const ITEM_ICON_MAP: Record<string, LucideIcon> = {
  Package, FlaskConical, Sword, Shield, Gem, Wrench, Key, Flame, Link,
};

function itemIcon(type: string, icon?: string): LucideIcon {
  if (icon && ITEM_ICON_MAP[icon]) return ITEM_ICON_MAP[icon];
  switch (type) {
    case 'weapon':    return Sword;
    case 'armor':     return Shield;
    case 'accessory': return Gem;
    case 'chave':     return Key;
    default:          return Package;
  }
}

function attrMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ── SimpleSelect ──────────────────────────────────────────────────────────────

function SimpleSelect({ value, options, placeholder = 'Selecionar…', onChange, required }: {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-e-bg border rounded-xl text-sm text-left transition-colors cursor-pointer ${
          open ? 'border-e-border2' : 'border-e-border hover:border-e-border2'
        } ${required && !value ? 'border-e-danger/40' : ''}`}>
        <span className={`flex-1 ${value ? 'text-e-text' : 'text-e-faint'}`}>{value || placeholder}</span>
        <ChevronDown size={13} className={`text-e-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl overflow-hidden">
          {options.map(opt => (
            <button key={opt} type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full px-3 py-2 text-sm text-left cursor-pointer transition-colors ${
                opt === value ? 'bg-e-accent/10 text-e-accent' : 'hover:bg-e-card text-e-text'
              }`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CharacterModal ────────────────────────────────────────────────────────────

export default function CharacterModal({ player, onClose }: { player?: Player; onClose: () => void }) {
  const { setPlayer } = useStore();
  const [name,        setName]        = useState(player?.char.name ?? "");
  const [code,        setCode]        = useState(player?.code ?? "");
  const [race,        setRace]        = useState(player?.char.race ?? "");
  const [cls,         setCls]         = useState(player?.char.skillClass ?? "");
  const [sub,         setSub]         = useState(player?.char.subClass ?? "");
  const [portraitUrl, setPortraitUrl] = useState(player?.char.portraitUrl ?? "");
  const [attrs,       setAttrs]       = useState<PlayerAttributes>(player?.attributes ?? EMPTY_ATTRS);
  const [level,         setLevel]         = useState(String(player?.char.level        ?? 1));
  const [slotsClass,    setSlotsClass]    = useState(String(player?.char.slotsClass   ?? 2));
  const [slotsFree,     setSlotsFree]     = useState(String(player?.char.slotsFree    ?? DEFAULT_SLOTS_FREE));
  const [etherUnlocked,       setEtherUnlocked]       = useState(player?.ether?.unlocked ?? false);
  const [sobrecargaUnlocked,  setSobrecargaUnlocked]  = useState(player?.sobrecargaDesbloqueada ?? false);
  const [expAvailable,  setExpAvailable]  = useState(String(player?.exp?.available    ?? 0));
  const [expTotal,      setExpTotal]      = useState(String(player?.exp?.total        ?? 0));
  const [kitLoading,  setKitLoading]  = useState(false);
  const [kit,         setKit]         = useState<ClassKit | null>(null);
  const [allKits,     setAllKits]     = useState<ClassKit[]>([]);
  const [subclasses]  = useState<string[]>([]);
  const [saving,      setSaving]      = useState(false);

  const saveUrl    = normalizeGdriveUrl(portraitUrl);
  const previewSrc = proxyUrl(portraitUrl);

  // Carrega todos os kits uma vez
  useEffect(() => {
    api.get<ClassKit[]>('/master/kits').then(r => setAllKits(r.data)).catch(() => {});
  }, []);

  // Quando a classe muda, aplica o kit correspondente
  useEffect(() => {
    if (!cls || allKits.length === 0) { setKit(null); return; }
    const found = allKits.find(k => k.skillClass === cls || k.skillClass === cls.split(' - ').pop());
    if (!found) { setKit(null); return; }
    setKit(found);
    if (!player) {
      setAttrs(found.starterAttributes ?? EMPTY_ATTRS);
      const classSlots = found.starterSlots.filter(s => s.type === 'class').length || 2;
      setSlotsClass(String(classSlots));
    }
  }, [cls, allKits, player]);


  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const base = {
        code, name, skillClass: cls, subClass: sub || undefined, race,
        attributes: attrs, portraitUrl: saveUrl || undefined,
        level:      isNaN(Number(level))      ? 1                  : Number(level)      || 1,
        slotsClass: isNaN(Number(slotsClass)) ? 2                  : Number(slotsClass),
        slotsFree:  isNaN(Number(slotsFree))  ? DEFAULT_SLOTS_FREE : Number(slotsFree),
        etherUnlocked,
        sobrecargaDesbloqueada: sobrecargaUnlocked,
        expAvailable: Number(expAvailable),
        expTotal:     Number(expTotal),
      };
      const res = player
        ? await api.put<Player>(`/master/players/${player.id}`, base)
        : await api.post<Player>("/master/players", {
            ...base,
            equipment: kit?.starterEquipment ?? {},
            items: kit?.starterItems ?? [],
          });

      setPlayer(res.data);
      onClose();
    } catch {
    } finally { setSaving(false); }
  }

  const lbl = "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <h3 className="font-semibold text-e-text">{player ? "Editar Personagem" : "Novo Personagem"}</h3>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-5 flex-1">

          {/* Nome + Código */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do personagem" required />
            </div>
            <div>
              <label className={lbl}>Código de Acesso</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: hero123" required />
            </div>
          </div>

          {/* Portrait */}
          <div>
            <label className={lbl}>URL do Portrait</label>
            <input
              type="text"
              value={portraitUrl}
              onChange={(e) => setPortraitUrl(e.target.value)}
              placeholder="URL direta ou link do Google Drive (opcional)"
            />
            {previewSrc && (
              <div className="mt-2">
                <img
                  src={previewSrc}
                  alt="preview"

                  className="w-16 h-16 rounded-lg object-cover border border-e-border bg-e-card"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Raça</label>
              <SimpleSelect value={race} options={RACES} onChange={setRace} required />
            </div>
            <div>
              <label className={lbl}>Classe</label>
              <SimpleSelect
                value={cls}
                options={allKits.map(k => k.skillClass)}
                onChange={setCls}
                required
              />
              {kit?.perks?.hasPressureBar && (
                <p className="text-[10px] text-orange-400 mt-1">Barra de Pressão habilitada</p>
              )}
            </div>
          </div>

          {subclasses.length > 0 && (
            <div>
              <label className={lbl}>Subclasse</label>
              <SimpleSelect value={sub} options={['Nenhuma', ...subclasses]} onChange={v => setSub(v === 'Nenhuma' ? '' : v)} />
            </div>
          )}

          {kitLoading && <p className="text-center text-e-faint text-sm animate-pulse">Carregando kit…</p>}

          {/* Atributos */}
          <div>
            <label className={lbl}>Atributos</label>
            <div className="grid grid-cols-4 gap-2">
              {ATTR_LABELS.map(([key, label, short]) => {
                const score = attrs[key];
                const mod   = attrMod(score);
                return (
                  <div key={key} className="bg-e-card rounded-xl p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-e-faint">{short}</span>
                      <span className={`text-[8px] font-bold tabular-nums ${mod >= 0 ? 'text-e-accent' : 'text-e-danger'}`}>
                        {mod >= 0 ? '+' : ''}{mod}
                      </span>
                    </div>
                    <input
                      type="number"
                      title={label}
                      value={score}
                      onChange={(e) => setAttrs(p => ({ ...p, [key]: Number(e.target.value) }))}
                      className="!text-center !text-base !font-bold !text-e-text !bg-transparent !border-0 !p-0 !shadow-none !w-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nível + Slots + EXP + Éter */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Nível</label>
              <input type="number" min={1} value={level}
                onChange={e => setLevel(e.target.value)}
                className="!text-center !text-sm !font-bold" />
            </div>
            <div>
              <label className={lbl}>Slots de classe</label>
              <input type="number" min={0} max={10} value={slotsClass}
                onChange={e => setSlotsClass(e.target.value)}
                className="!text-center !text-sm !font-bold" />
            </div>
            <div>
              <label className={lbl}>Slots livres</label>
              <input type="number" min={0} max={10} value={slotsFree}
                onChange={e => setSlotsFree(e.target.value)}
                className="!text-center !text-sm !font-bold" />
            </div>
            <div>
              <label className={lbl}>Pontos disponíveis</label>
              <input type="number" min={0} value={expAvailable}
                onChange={e => setExpAvailable(e.target.value)}
                className="!text-center !text-sm !font-bold" />
            </div>
            <div>
              <label className={lbl}>EXP total</label>
              <input type="number" min={0} value={expTotal}
                onChange={e => setExpTotal(e.target.value)}
                className="!text-center !text-sm !font-bold" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={etherUnlocked}
                  onChange={e => setEtherUnlocked(e.target.checked)}
                  className="w-4 h-4 accent-purple-400" />
                <span className="text-sm text-e-text">Éter desbloqueado</span>
              </label>
              {etherUnlocked && (
                <p className="text-[10px] text-e-faint pl-6">
                  Máx = min(⌊SAB ÷ 4⌋, 10) — calculado ao salvar
                </p>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sobrecargaUnlocked}
                  onChange={e => setSobrecargaUnlocked(e.target.checked)}
                  className="w-4 h-4 accent-orange-400" />
                <span className="text-sm text-e-text">Sobrecarga desbloqueada</span>
              </label>
            </div>
          </div>

          {/* Kit items */}
          {kit && (kit.starterItems ?? []).length > 0 && (
            <div>
              <label className={lbl}>Itens do Kit — {cls}</label>
              <div className="flex flex-wrap gap-1.5">
                {(kit.starterItems as { name: string; type: string; qty: number; icon?: string }[]).map((item, i) => {
                  const Icon = itemIcon(item.type, item.icon);
                  return (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-e-card border border-e-border text-xs text-e-sub">
                      <Icon size={11} className="text-e-faint shrink-0" />
                      <span>{item.name}</span>
                      {item.qty > 1 && <span className="text-e-faint">×{item.qty}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-e-border mt-1">
            <Button type="button" variant="ghost"   size="md" className="w-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={saving}>
              {saving ? "Salvando…" : player ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
