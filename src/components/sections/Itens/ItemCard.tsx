'use client';

import {
  Pencil, Trash2, Send,
  Package, FlaskConical, Flame, Link, CircleDollarSign, Key,
  Sword, Crosshair, Axe, Wand2, Shield, Circle, Gem, Wrench,
  Zap, Star, Sparkles, BookOpen, Shirt, Scroll,
  type LucideIcon,
} from 'lucide-react';
import type { ItemCatalog } from '@/store/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Package, FlaskConical, Flame, Link, CircleDollarSign, Key,
  Sword, Crosshair, Axe, Wand2, Shield, Circle, Gem, Wrench,
  Zap, Star, Sparkles, BookOpen, Shirt, Scroll,
};

function ItemIcon({ name, size = 18 }: { name: string; size?: number }) {
  if (name.startsWith('img:')) {
    return <img src={name.slice(4)} alt="" width={size} height={size} className="object-cover rounded" />;
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

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  weapon:    { label: 'Arma',      color: '#e05050' },
  armor:     { label: 'Armadura',  color: '#4a9fe0' },
  accessory: { label: 'Acessório', color: '#d4a84e' },
  normal:    { label: 'Normal',    color: '#3dba72' },
  chave:     { label: 'Chave',     color: '#d4a84e' },
};

function dmgStr(item: ItemCatalog) {
  if (item.type !== 'weapon') return null;
  const parts = [];
  if (item.damageBase) parts.push(String(item.damageBase));
  if (item.damageDice) parts.push(`${item.damageDice.quantity}${item.damageDice.die}`);
  return parts.length ? parts.join('+') : null;
}

export default function ItemCard({ item, onEdit, onDelete, onSend }: Props) {
  const badge = TYPE_BADGE[item.type] ?? { label: item.type, color: '#71717a' };
  const dmg   = dmgStr(item);

  return (
    <div className="rounded-lg border border-e-border bg-e-surface p-3 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        {item.icon && (
          <span className="w-8 h-8 flex items-center justify-center rounded bg-e-card text-e-sub shrink-0">
            <ItemIcon name={item.icon} size={18} />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{item.name}</p>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{ background: badge.color + '22', color: badge.color }}
          >
            {badge.label}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onSend}   title="Enviar para jogador"
            className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-accent hover:bg-e-card transition-colors">
            <Send size={12} />
          </button>
          <button onClick={onEdit}   title="Editar"
            className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-text hover:bg-e-card transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} title="Deletar"
            className="w-6 h-6 rounded flex items-center justify-center text-e-sub hover:text-e-danger hover:bg-e-card transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-0.5 text-xs text-e-sub">
        {dmg && (
          <p><span className="text-e-faint">Dano</span> <span className="font-mono text-e-text">{dmg}</span>
            {item.damageAttribute && <span className="text-e-faint ml-1">+ {item.damageAttribute.slice(0,3).toUpperCase()}</span>}
          </p>
        )}
        {item.damageReduction != null && item.damageReduction > 0 && (
          <p><span className="text-e-faint">DR</span> <span className="font-bold text-e-text">−{item.damageReduction}</span></p>
        )}
        {item.attributeBonus && Object.keys(item.attributeBonus).length > 0 && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            {Object.entries(item.attributeBonus).map(([attr, val]) => (
              <span key={attr} className="px-1.5 py-0.5 rounded text-[10px] bg-e-card text-e-text">
                {attr.slice(0,3).toUpperCase()} {val > 0 ? '+' : ''}{val}
              </span>
            ))}
          </div>
        )}
        {item.equipSlot && <p className="text-e-faint capitalize">{item.equipSlot}</p>}
        {item.desc && <p className="text-e-faint truncate">{item.desc}</p>}
      </div>
    </div>
  );
}
