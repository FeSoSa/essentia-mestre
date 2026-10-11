"use client";

import type { ItemCatalog } from "@/store/types";
import { divisorArma } from '@/store/combateStore';
import { proxyUrl } from "@/lib/gdrive";
import { siglaAtributo } from "@/lib/atributos";
import { RARITY_COLORS, RARITY_LABELS, rarityColor, type Rarity } from "@/lib/rarity";
import {
  Activity, Amphora, Anchor, Apple, Axe, Backpack, Bandage, Barrel, Bird, Bomb,
  BookOpen, BottleWine, Box, BowArrow, Bug, Cable, Cat, Circle,
  CircleDollarSign, Club, Coffee, Coins, Compass, Crosshair, Crown, Cuboid,
  Diamond, Dices, Dog, Droplets, Drumstick, Dumbbell, Eye, Feather, Fish,
  Flashlight, Flame, FlaskConical, Footprints, Gem, Hammer, HardHat, Heart,
  HeartPulse, Hourglass, Key, Lasso, Leaf, Link, Lock, Magnet, Map, Moon,
  Music, Package, Pencil, Pickaxe, Pill, Rabbit, Ribbon, Salad, Scroll, Send,
  Shield, ShieldPlus, Shirt, Shovel, Skull, Snowflake, Sparkles, Squirrel,
  Star, Sun, Sword, Swords, Target, Tent, Trash2, TreePine, Trophy, Wand,
  Wind, Wrench, Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  // Armas
  Sword, Swords, Axe, Wand, BowArrow, Crosshair, Target, Bomb, Club,
  // Defesa / Cura
  Shield, ShieldPlus, Heart, HeartPulse, Bandage, Pill, Activity,
  // Magia / Elemental
  Flame, Zap, Wind, Snowflake, Droplets, Moon, Sun, Sparkles,
  // Veneno / Status
  Skull, Bug,
  // Consumível
  FlaskConical, Amphora, BottleWine, Barrel, Apple, Drumstick, Salad, Coffee,
  // Acessórios
  Anchor, Ribbon, HardHat, Footprints,
  // Equipamento
  Shirt, Backpack, Tent, Lasso, Cable, Wrench, Hammer, Pickaxe, Shovel, Dumbbell, Key, Flashlight,
  // Tesouros
  Gem, Diamond, Coins, CircleDollarSign, Crown, Trophy,
  // Natureza
  TreePine, Leaf, Feather, Bird, Fish, Dog, Cat, Rabbit, Squirrel,
  // Misc
  Package, BookOpen, Scroll, Star, Link, Circle, Eye, Map, Music, Hourglass, Compass, Dices, Cuboid, Lock, Magnet, Box,
};

export function ItemIcon({ name, size = 18 }: { name: string; size?: number }) {
  if (name.startsWith("img:")) {
    return (
      <img
        src={proxyUrl(name.slice(4))}
        alt=""
        width={size}
        height={size}
        className="object-cover rounded"
      />
    );
  }
  const Icon = ICON_MAP[name] ?? Package;
  return <Icon size={size} />;
}

interface Props {
  item: ItemCatalog;
  onEdit: () => void;
  onDelete: () => void;
  onSend: () => void;
}

const SUBTYPE_BADGE: Record<string, { label: string; color: string }> = {
  consumivel: { label: "Consumível", color: "#3dba72" },
  drop: { label: "Drop", color: "#a855f7" },
  chave: { label: "Chave", color: "#d4a84e" },
  misc: { label: "Misc", color: "#71717a" },
};

function dmgStr(item: ItemCatalog) {
  if (item.type !== "weapon") return null;
  const parts = [];
  if (item.damageBase) parts.push(String(item.damageBase));
  if (item.damageAttribute) {
    parts.push(`d20×${siglaAtributo(item.damageAttribute)}/${divisorArma(item)}`);
  }
  return parts.length ? parts.join(' + ') : null;
}

const SLOT_LABEL: Record<string, string> = {
  mainHand: "Mão principal", offHand: "Mão secundária", both: "Duas mãos",
  armor: "Armadura", amulet: "Amuleto", ring: "Anel", utility: "Utilitário",
};

export default function ItemCard({ item, onEdit, onDelete, onSend }: Props) {
  const dmg = dmgStr(item);
  const rColor = rarityColor(item.rarity);
  const cor = rColor ?? "#a1a1aa";
  const acao = "w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:bg-white/[0.08] transition-colors cursor-pointer";

  return (
    <div
      onClick={onEdit}
      className="group relative rounded-2xl border bg-e-surface p-3.5 flex flex-col gap-2.5 cursor-pointer transition-colors hover:bg-[#1c1c20]"
      style={{ borderColor: cor + "40", boxShadow: `inset 3px 0 0 ${cor}` }}
    >
      <div className="flex items-start gap-2.5">
        <span className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0" style={{ color: cor, background: cor + "14" }}>
          <ItemIcon name={item.icon || "Package"} size={18} />
        </span>
        <div className="flex-1 min-w-0 group-hover:pr-20 transition-[padding]">
          <p className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: rColor ?? "#fafafa" }} title={item.name}>{item.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5 flex-wrap">
            {item.rarity && <span style={{ color: RARITY_COLORS[item.rarity as Rarity] ?? "#71717a" }}>{RARITY_LABELS[item.rarity as Rarity] ?? item.rarity}</span>}
            {item.subtype && SUBTYPE_BADGE[item.subtype] && (
              <span style={{ color: SUBTYPE_BADGE[item.subtype].color }}>· {SUBTYPE_BADGE[item.subtype].label}</span>
            )}
          </p>
        </div>
      </div>

      {/* Ações: aparecem no hover para não poluir a grade */}
      <div className="absolute top-2.5 right-2.5 flex gap-0.5 rounded-lg bg-[#1c1c20] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onSend} title="Enviar para um jogador" className={`${acao} hover:text-e-accent`}><Send size={13} /></button>
        <button type="button" onClick={onEdit} title="Editar" className={`${acao} hover:text-e-text`}><Pencil size={13} /></button>
        <button type="button" onClick={onDelete} title="Excluir" className={`${acao} hover:text-e-danger`}><Trash2 size={13} /></button>
      </div>

      <div className="flex flex-col gap-1 text-xs text-e-sub">
        {dmg && (
          <p>
            <span className="text-e-faint">Dano </span>
            <span className="font-mono text-e-text">{dmg}</span>
          </p>
        )}
        {item.damageReduction != null && item.damageReduction > 0 && (
          <p><span className="text-e-faint">Reduz </span><span className="font-bold text-e-text">{item.damageReduction}</span><span className="text-e-faint"> de dano</span></p>
        )}
        {item.attributeBonus && Object.keys(item.attributeBonus).length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {Object.entries(item.attributeBonus).map(([attr, val]) => (
              <span key={attr} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/[0.05] text-e-text">
                {siglaAtributo(attr)} {val > 0 ? "+" : ""}{val}
              </span>
            ))}
          </div>
        )}
        {item.onUseEffect && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.onUseEffect.color ?? "#a855f7" }} />
            <span className="text-[11px] text-e-sub truncate" title={item.onUseEffect.name || "Efeito ao usar"}>
              {item.onUseEffect.name || "Efeito ao usar"}
              {item.onUseEffect.durationTurns === -1
                ? " · permanente"
                : item.onUseEffect.durationTurns != null
                  ? ` · ${item.onUseEffect.durationTurns} turnos`
                  : ""}
            </span>
          </div>
        )}
        {item.desc && <p className="text-e-faint line-clamp-2 leading-snug" title={item.desc}>{item.desc}</p>}
      </div>

      {(item.equipSlot || item.goldValue != null) && (
        <div className="mt-auto pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
          <span className="text-e-faint">{item.equipSlot ? SLOT_LABEL[item.equipSlot] ?? item.equipSlot : ""}</span>
          {item.goldValue != null && (
            <span className="flex items-center gap-1 font-semibold text-amber-400 tabular-nums">
              <Coins size={11} /> {item.goldValue} Tyd
            </span>
          )}
        </div>
      )}
    </div>
  );
}
