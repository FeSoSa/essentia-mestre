'use client';

import { LayoutDashboard, ImageIcon, Users, ScrollText, BookOpen, Package, Archive, Wand2, GraduationCap, Sparkles, Dna, ShoppingBag, Map } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore, useActivePlayers } from '@/store';
import type { SectionId } from '@/store/types';

type Item = { id: SectionId; label: string; Icon: LucideIcon };

/**
 * Menu agrupado pelo uso: o que se usa durante a sessão, o que é do grupo
 * e o compêndio (catálogos que o mestre edita fora da mesa).
 */
const GRUPOS: { titulo: string; itens: Item[] }[] = [
  {
    titulo: 'Sessão',
    itens: [
      { id: 'mesa',    label: 'Mesa',    Icon: LayoutDashboard },
      { id: 'mapa',    label: 'Mapa',    Icon: Map },
      { id: 'imagens', label: 'Imagens', Icon: ImageIcon },
      { id: 'log',     label: 'Log',     Icon: ScrollText },
    ],
  },
  {
    titulo: 'Grupo',
    itens: [
      { id: 'jogadores',  label: 'Jogadores',  Icon: Users },
      { id: 'inventario', label: 'Inventário', Icon: Archive },
      { id: 'loja',       label: 'Loja',       Icon: ShoppingBag },
    ],
  },
  {
    titulo: 'Compêndio',
    itens: [
      { id: 'itens',       label: 'Itens',       Icon: Package },
      { id: 'essencias',   label: 'Essências',   Icon: Sparkles },
      { id: 'habilidades', label: 'Habilidades', Icon: Wand2 },
      { id: 'bestiario',   label: 'Bestiário',   Icon: BookOpen },
      { id: 'classes',     label: 'Classes',     Icon: GraduationCap },
      { id: 'racas',       label: 'Raças',       Icon: Dna },
    ],
  },
];

export default function Sidebar() {
  const { activeSection, setActiveSection, damageRequests, sobrecargaRequests, effectRequests } = useStore();
  const players = useActivePlayers();
  const pedidosInventario = players.reduce((acc, p) => acc + (p.pendingRequests?.length ?? 0), 0);
  const pedidosMesa = damageRequests.length + sobrecargaRequests.length + effectRequests.length;

  const badge = (id: SectionId) =>
    id === 'mesa' ? pedidosMesa : id === 'inventario' ? pedidosInventario : 0;

  return (
    <aside className="w-[84px] shrink-0 h-full flex flex-col border-r border-white/[0.06] bg-[#111113]">
      <div className="h-[60px] shrink-0 flex items-center justify-center">
        <span className="w-9 h-9 rounded-xl bg-e-accent/10 border border-e-accent/30 text-e-accent font-black text-lg flex items-center justify-center">
          E
        </span>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] px-2 pb-3 flex flex-col gap-3">
        {GRUPOS.map((g) => (
          <div key={g.titulo} className="flex flex-col gap-0.5">
            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-600 text-center pb-1 pt-1 border-t border-white/[0.06]">
              {g.titulo}
            </span>
            {g.itens.map(({ id, label, Icon }) => {
              const active = activeSection === id;
              const n = badge(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  title={label}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors',
                    active ? 'bg-e-accent/10 text-e-accent' : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.05]',
                  ].join(' ')}
                >
                  <span className="relative">
                    <Icon size={19} strokeWidth={active ? 2.2 : 1.7} />
                    {n > 0 && (
                      <span className={`absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center leading-none ring-2 ring-[#111113] ${
                        id === 'mesa' ? 'bg-red-500 text-white' : 'bg-amber-400 text-black'}`}>
                        {n > 9 ? '9+' : n}
                      </span>
                    )}
                  </span>
                  <span className={`text-[9.5px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
