'use client';

import { useStore } from '@/store';
import Mesa from '@/components/sections/Mesa';
import Imagens from '@/components/sections/Imagens';
import Jogadores from '@/components/sections/Jogadores';
import Inventario from '@/components/sections/Inventario';
import Log from '@/components/sections/Log';
import Bestiario from '@/components/sections/Bestiario';
import Itens from '@/components/sections/Itens';
import Habilidades from '@/components/sections/Habilidades';
import Classes from '@/components/sections/Classes';
import Essencias from '@/components/sections/Essencias';

export default function MainContent() {
  const active = useStore((s) => s.activeSection);

  return (
    <main className="flex-1 h-full flex flex-col overflow-hidden bg-e-bg">
      <div className={active === 'mesa'        ? 'flex-1 min-h-0 flex flex-col' : 'hidden'}><Mesa /></div>
      <div className={active === 'imagens'     ? 'flex-1 overflow-y-auto' : 'hidden'}><Imagens /></div>
      <div className={active === 'jogadores'   ? 'flex-1 overflow-y-auto' : 'hidden'}><Jogadores /></div>
      <div className={active === 'inventario'  ? 'flex-1 overflow-y-auto' : 'hidden'}><Inventario /></div>
      <div className={active === 'itens'       ? 'flex-1 overflow-y-auto' : 'hidden'}><Itens /></div>
      <div className={active === 'essencias'   ? 'flex-1 overflow-y-auto' : 'hidden'}><Essencias /></div>
      <div className={active === 'bestiario'   ? 'flex-1 overflow-y-auto' : 'hidden'}><Bestiario /></div>
      <div className={active === 'habilidades' ? 'flex-1 overflow-y-auto' : 'hidden'}><Habilidades /></div>
      <div className={active === 'classes'     ? 'flex-1 overflow-y-auto' : 'hidden'}><Classes /></div>
      <div className={active === 'log'         ? 'flex-1 min-h-0 flex flex-col' : 'hidden'}><Log /></div>
    </main>
  );
}
