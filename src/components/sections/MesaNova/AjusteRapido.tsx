'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Ajuste rápido de um recurso: digite o valor e aplique como dano (−) ou cura (+).
 * Enter aplica como dano, que é o caso mais comum na mesa.
 */
export default function AjusteRapido({ onAplicar, rotuloMenos = 'Dano', rotuloMais = 'Cura', compacto, apenasMais, placeholder = 'valor' }: {
  onAplicar: (delta: number) => void;
  rotuloMenos?: string;
  rotuloMais?: string;
  compacto?: boolean;
  apenasMais?: boolean;   // só soma (ex: dar XP); Enter aplica como soma
  placeholder?: string;
}) {
  const [valor, setValor] = useState('');
  const n = parseInt(valor, 10);
  const valido = !isNaN(n) && n > 0;

  function aplicar(sinal: 1 | -1) {
    if (!valido) return;
    onAplicar(sinal * n);
    setValor('');
  }

  const h = compacto ? 'h-7' : 'h-8';
  return (
    <div className="flex items-center gap-1">
      {!apenasMais && <button type="button" disabled={!valido} onClick={() => aplicar(-1)}
        className={`${h} px-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-[11px] font-bold hover:bg-red-500/20 disabled:opacity-35 cursor-pointer flex items-center gap-1`}>
        <Minus size={11} /> {rotuloMenos}
      </button>}
      <input value={valor} inputMode="numeric" placeholder={placeholder}
        onChange={(e) => setValor(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onKeyDown={(e) => { if (e.key === 'Enter') aplicar(apenasMais ? 1 : -1); }}
        className={`${h} w-16 text-center text-sm font-bold tabular-nums rounded-lg bg-black/30 border border-white/10 text-e-text placeholder:text-e-faint placeholder:font-normal placeholder:text-xs outline-none focus:border-e-accent/60`} />
      <button type="button" disabled={!valido} onClick={() => aplicar(1)}
        className={`${h} px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/20 disabled:opacity-35 cursor-pointer flex items-center gap-1`}>
        <Plus size={11} /> {rotuloMais}
      </button>
    </div>
  );
}
