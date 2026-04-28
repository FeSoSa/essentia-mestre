import {
  Flame, Snowflake, Skull, Zap, Wind, Droplets,
  Shield, Sword, Moon, Sun, Sparkles, HeartCrack,
  Eye, EyeOff, Footprints, Swords, Dices, Leaf,
  type LucideIcon,
} from 'lucide-react';

export interface StatusIconEntry { name: string; Icon: LucideIcon; }

export const STATUS_ICONS: StatusIconEntry[] = [
  { name: 'Flame',      Icon: Flame      },
  { name: 'Snowflake',  Icon: Snowflake  },
  { name: 'Skull',      Icon: Skull      },
  { name: 'Zap',        Icon: Zap        },
  { name: 'Wind',       Icon: Wind       },
  { name: 'Droplets',   Icon: Droplets   },
  { name: 'Shield',     Icon: Shield     },
  { name: 'Sword',      Icon: Sword      },
  { name: 'Moon',       Icon: Moon       },
  { name: 'Sun',        Icon: Sun        },
  { name: 'Sparkles',   Icon: Sparkles   },
  { name: 'HeartCrack', Icon: HeartCrack },
  { name: 'Eye',        Icon: Eye        },
  { name: 'EyeOff',     Icon: EyeOff     },
  { name: 'Footprints', Icon: Footprints },
  { name: 'Swords',     Icon: Swords     },
  { name: 'Dices',      Icon: Dices      },
  { name: 'Leaf',       Icon: Leaf       },
];

export function getStatusIcon(name?: string | null): LucideIcon | null {
  return STATUS_ICONS.find((i) => i.name === name)?.Icon ?? null;
}
