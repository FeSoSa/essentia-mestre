'use client';

import { useEffect, useRef } from 'react';
import { useMesaStore } from '@/store/mesaStore';
import { Avatar, fracEs, escudoDe } from './ui';
import { COR_TIPO, useCombatentes } from './combatentes';

/**
 * Trilha da iniciativa: fichas na ordem do turno. Quem já agiu na rodada fica apagado,
 * a ficha da vez cresce e ganha a cor do lado (jogador, inimigo, boss, aliado).
 */
export default function TurnTrack() {
  const { initiative, idx, porId, rodada } = useCombatentes();
  const abrirJogador = useMesaStore((s) => s.selecionar);
  const atualRef = useRef<HTMLDivElement>(null);

  useEffect(() => { atualRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }, [idx]);

  const proximo = initiative.length > 0 ? initiative[(idx + 1) % initiative.length] : null;

  return (
    <div className="flex items-center gap-5 min-w-0">
      <div className="flex flex-col items-center justify-center shrink-0 w-14">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-e-faint">Rodada</span>
        <span className="text-2xl font-black tabular-nums text-e-text leading-none mt-0.5">{rodada}</span>
      </div>

      <div className="flex items-end gap-3 overflow-x-auto min-w-0 pb-1 pt-1 [scrollbar-width:none]">
        {initiative.map((e, i) => {
          const c = porId.get(e.playerId);
          const tipo = c?.tipo ?? 'jogador';
          const cor = COR_TIPO[tipo];
          const atual = i === idx;
          const jaAgiu = i < idx;
          const pct = c && c.hpMax > 0 ? c.hp / c.hpMax : null;
          const caido = pct != null && pct <= 0;
          return (
            <div key={e.playerId} ref={atual ? atualRef : undefined}
              onClick={() => tipo === 'jogador' && abrirJogador(e.playerId)}
              title={`${e.name} · iniciativa ${e.value}`}
              className={`flex flex-col items-center gap-1 shrink-0 transition-all duration-300 ${tipo === 'jogador' ? 'cursor-pointer' : ''} ${jaAgiu && !atual ? 'opacity-35' : ''}`}>
              <div className="relative">
                <Avatar src={c?.src} emoji={c?.emoji} nome={e.name} pct={pct} pctEs={fracEs(c?.es, c?.esMax)} escudo={escudoDe(c?.jogador)} size={atual ? 52 : 38}
                  destaque={atual ? cor : undefined} apagado={caido} />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black tabular-nums px-1 rounded bg-[#18181b] border"
                  style={{ color: cor, borderColor: cor + '55' }}>{e.value}</span>
              </div>
              <span className={`max-w-[72px] truncate text-[10px] ${atual ? 'font-bold text-e-text' : 'text-e-faint'}`}>{e.name}</span>
            </div>
          );
        })}
      </div>

      {proximo && (
        <div className="hidden 2xl:flex flex-col shrink-0 pl-2 border-l border-white/10">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-e-faint">Próximo</span>
          <span className="text-xs text-e-sub truncate max-w-[120px]">{proximo.name}</span>
        </div>
      )}
    </div>
  );
}
