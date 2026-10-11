'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import type { Player } from '@/store/types';

/** Resumo de Capacidade e Uso de Essência do jogador, com o aviso de penalidade quando excede. */
export function CapacidadeEssencia({ player }: { player: Player }) {
  const e = player.essencia;
  if (!e) return null;
  const excede = e.excedente > 0;
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs flex flex-col gap-0.5 ${excede ? 'border-red-500/40 bg-red-500/10' : 'border-e-border bg-e-bg'}`}>
      <span className="text-e-sub">
        Capacidade <b className="text-e-text">{e.capacidade}</b> · Uso <b className={excede ? 'text-red-400' : 'text-e-text'}>{e.uso}</b>
        <span className="text-e-faint"> (4 + mod. SAB)</span>
      </span>
      {excede && (
        <span className="text-red-300">
          Excedente +{e.excedente}: RES {e.penalidadeRes}{e.penalidadeFlx ? `, FLX ${e.penalidadeFlx}` : ''}
          {e.testeSabDescanso ? '. Teste de SAB a cada descanso longo.' : '.'}
        </span>
      )}
    </div>
  );
}

/** Seletor do nível (1 a 4) de uma Essência do jogador; o mestre define manualmente. */
export function NivelEssencia({ player, essenciaId }: { player: Player; essenciaId: string }) {
  const { setPlayer } = useStore();
  const [salvando, setSalvando] = useState(false);
  const atual = player.essenciasObtidas?.find((o) => o.essenciaId === essenciaId)?.nivel ?? 1;

  async function definir(nivel: number) {
    if (nivel === atual) return;
    setSalvando(true);
    try {
      const res = await api.put<Player>(`/master/players/${player.id}/essencias/${essenciaId}/nivel`, { nivel });
      setPlayer(res.data);
    } catch {}
    finally { setSalvando(false); }
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <span className="text-[10px] text-e-faint mr-0.5">Nível</span>
      {[1, 2, 3, 4].map((n) => (
        <button key={n} type="button" disabled={salvando} onClick={() => definir(n)}
          className={`w-6 h-6 rounded-md text-[11px] font-bold border transition-colors disabled:opacity-50 ${
            n === atual ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'
          }`}>
          {n}
        </button>
      ))}
    </div>
  );
}
