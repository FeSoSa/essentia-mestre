'use client';

import { useState } from 'react';
import { Swords, Moon, Skull, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { modificador } from '@/lib/encontro';
import type { Player } from '@/store/types';
import { useStore } from '@/store';
import { useMesaStore } from '@/store/mesaStore';
import { Avatar, fracEs, corVida, COR_ES, escudoDe } from './ui';
import { useCombatentes } from './combatentes';

/**
 * O "quadrado" do grupo: um botão por jogador. Clique abre a ficha;
 * o selo no canto decide se o jogador entra no combate.
 */
export default function GrupoBox() {
  const { players, vezId, emCombate, initiative } = useCombatentes();
  const [mexendo, setMexendo] = useState<string | null>(null);
  const { selecionar, foraDoCombate, alternarCombate } = useMesaStore();
  const { damageRequests, sobrecargaRequests, effectRequests } = useStore();
  // Antes do combate vale a escolha do mestre; durante, quem está na ordem de turno
  const naLuta = (id: string) => (emCombate ? initiative.some((e) => e.playerId === id) : !foraDoCombate.includes(id));
  const participantes = players.filter((p) => naLuta(p.id)).length;

  /** Entra num combate já começado: rola a iniciativa (d20 + metade do mod de AGI) e entra na posição dela. */
  async function entrar(p: Player) {
    const agi = (p.effectiveAttributes ?? p.attributes).agility;
    const valor = Math.ceil(Math.random() * 20) + Math.floor(modificador(agi) / 2);
    setMexendo(p.id);
    try { await api.post('/master/initiative/entrar', { playerId: p.id, valor }); } catch {} finally { setMexendo(null); }
  }

  async function sair(p: Player) {
    if (!window.confirm(`Tirar ${p.char.name} da luta? Ele sai da ordem de turno.`)) return;
    setMexendo(p.id);
    try { await api.post('/master/initiative/sair', { playerId: p.id }); } catch {} finally { setMexendo(null); }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#18181b] p-4 flex flex-col gap-3 h-full">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-e-sub">Grupo</h2>
        <span className="text-[11px] text-e-faint tabular-nums">{participantes}/{players.length} {emCombate ? 'na luta' : 'no combate'}</span>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-e-faint py-6 text-center">Aguardando jogadores conectarem…</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {players.map((p) => {
            const fora = !naLuta(p.id);
            const vez = vezId === p.id;
            const pct = p.hp.max > 0 ? p.hp.current / p.hp.max : 0;
            const caido = p.hp.current <= 0;
            const pendentes = damageRequests.filter((r) => r.playerId === p.id).length
              + sobrecargaRequests.filter((r) => r.playerId === p.id).length
              + effectRequests.filter((r) => r.playerId === p.id).length;
            return (
              <div key={p.id}
                className={`relative group rounded-xl border transition-all ${
                  vez ? 'border-e-accent/70 bg-e-accent/[0.07]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15'
                } ${fora ? 'opacity-45' : ''}`}>
                <button type="button" onClick={() => selecionar(p.id)}
                  className="w-full flex flex-col items-center gap-1 pt-2.5 pb-2 px-1 cursor-pointer">
                  <div className="relative">
                    <Avatar src={p.char.portraitUrl} nome={p.char.name} pct={pct} pctEs={fracEs(p.flow.current, p.flow.max)} escudo={escudoDe(p)} size={48} apagado={caido} />
                    {caido && <Skull size={16} className="absolute inset-0 m-auto text-red-400" />}
                    {pendentes > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center ring-2 ring-[#18181b]"
                        title="Pedidos esperando você">
                        {pendentes}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-e-text max-w-full truncate px-1">{p.char.name}</span>
                  <span className="text-[10px] tabular-nums leading-none"><span style={{ color: corVida(pct) }}>{p.hp.current}</span><span className="text-e-faint"> PV · </span><span style={{ color: COR_ES }}>{p.flow.current}</span><span className="text-e-faint"> ES</span></span>
                  {vez && <span className="text-[9px] font-black uppercase tracking-wider text-e-accent leading-none">na vez</span>}
                </button>
                <button type="button" disabled={mexendo === p.id}
                  onClick={() => (emCombate ? (fora ? entrar(p) : sair(p)) : alternarCombate(p.id))}
                  title={emCombate
                    ? (fora ? 'Fora da luta. Clique para entrar agora (rola a iniciativa).' : 'Na luta. Clique para tirar da ordem de turno.')
                    : (fora ? 'Fora do combate. Clique para incluir.' : 'No combate. Clique para deixar de fora.')}
                  className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                    fora ? 'text-e-faint hover:text-e-text bg-white/5' : 'text-e-accent bg-e-accent/10 hover:bg-e-accent/20'}`}>
                  {mexendo === p.id ? <Loader2 size={12} className="animate-spin" /> : fora ? <Moon size={12} /> : <Swords size={12} />}
                </button>
                {emCombate && fora && (
                  <button type="button" onClick={() => entrar(p)} disabled={mexendo === p.id}
                    className="absolute inset-x-1.5 bottom-1.5 h-6 rounded-md bg-e-accent/15 border border-e-accent/40 text-e-accent text-[10px] font-bold cursor-pointer hover:bg-e-accent/25 opacity-0 group-hover:opacity-100 transition-opacity">
                    Entrar na luta
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
