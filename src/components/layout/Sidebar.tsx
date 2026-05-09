'use client';

import { LayoutGrid, ImageIcon, Users, ScrollText, BookOpen, Package, Archive, Wand2, GraduationCap, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore, usePlayers } from '@/store';
import type { SectionId } from '@/store/types';

const NAV: { id: SectionId; label: string; Icon: LucideIcon }[] = [
  { id: 'mesa',        label: 'Mesa',      Icon: LayoutGrid },
  { id: 'imagens',     label: 'Imagens',   Icon: ImageIcon  },
  { id: 'jogadores',   label: 'Jogadores', Icon: Users      },
  { id: 'inventario',  label: 'Inventário',Icon: Archive    },
  { id: 'itens',       label: 'Itens',     Icon: Package    },
  { id: 'essencias',   label: 'Essências', Icon: Sparkles   },
  { id: 'bestiario',   label: 'Bestiário',   Icon: BookOpen   },
  { id: 'habilidades', label: 'Habilidades', Icon: Wand2        },
  { id: 'classes',     label: 'Classes',     Icon: GraduationCap },
  { id: 'log',         label: 'Log',         Icon: ScrollText },
];

export default function Sidebar() {
  const { activeSection, setActiveSection } = useStore();
  const players = usePlayers();
  const pendingTotal = players.reduce((acc, p) => acc + (p.pendingRequests?.length ?? 0), 0);

  return (
    <aside className="w-20 shrink-0 h-full flex flex-col border-r border-e-border bg-e-card">
      <nav className="flex flex-col flex-1 overflow-hidden py-1">
        {NAV.map(({ id, label, Icon }) => {
          const active = activeSection === id;
          const hasBadge = id === 'inventario' && pendingTotal > 0;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={active ? { background: 'rgba(0,0,0,0.25)', borderLeftColor: '#a3e635' } : {}}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-1.5 min-h-0 cursor-pointer relative',
                'border-l-[3px] border-transparent transition-all duration-150',
                active ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-black/15',
              ].join(' ')}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                {hasBadge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-bold flex items-center justify-center leading-none">
                    {pendingTotal > 9 ? '9+' : pendingTotal}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
