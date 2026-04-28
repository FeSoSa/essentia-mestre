'use client';

import { LayoutGrid, ImageIcon, Users, ScrollText, BookOpen, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore } from '@/store';
import type { SectionId } from '@/store/types';

const NAV: { id: SectionId; label: string; Icon: LucideIcon }[] = [
  { id: 'mesa',      label: 'Mesa',      Icon: LayoutGrid },
  { id: 'imagens',   label: 'Imagens',   Icon: ImageIcon  },
  { id: 'jogadores', label: 'Jogadores', Icon: Users      },
  { id: 'itens',     label: 'Itens',     Icon: Package    },
  { id: 'bestiario', label: 'Bestiário', Icon: BookOpen   },
  { id: 'log',       label: 'Log',       Icon: ScrollText },
];

export default function Sidebar() {
  const { activeSection, setActiveSection } = useStore();

  return (
    <aside className="w-20 shrink-0 h-full flex flex-col border-r border-e-border bg-e-card">
      <nav className="flex flex-col flex-1 overflow-hidden py-1">
        {NAV.map(({ id, label, Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={active ? { background: 'rgba(0,0,0,0.25)', borderLeftColor: '#a3e635' } : {}}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-1.5 min-h-0 cursor-pointer',
                'border-l-[3px] border-transparent transition-all duration-150',
                active ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-black/15',
              ].join(' ')}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
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
