'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Minus, Plus, ArrowUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { descreverNivel } from '@/lib/maestria';
import type { MaestriaGrupoInfo, Player, SkillTreeEntry } from '@/store/types';

/**
 * Maestria por grupo (arma ou Essência) e nível de classe do jogador.
 * O mestre confirma os níveis que ficaram disponíveis e pode corrigir usos.
 */
export default function MaestriaModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const { setPlayer } = useStore();
  const [maestrias, setMaestrias] = useState<MaestriaGrupoInfo[]>([]);
  const [bloqueadas, setBloqueadas] = useState<SkillTreeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [m, t] = await Promise.all([
        api.get<MaestriaGrupoInfo[]>(`/master/players/${player.id}/maestrias`),
        api.get<SkillTreeEntry[]>(`/master/players/${player.id}/skill-tree`),
      ]);
      setMaestrias(m.data);
      setBloqueadas(t.data.filter((e) => e.status === 'UNLOCKED' && e.bloqueio));
    } catch {} finally { setLoading(false); }
  }, [player.id]);

  // Recarrega quando o jogador muda (uso registrado em combate, nível confirmado)
  useEffect(() => { carregar(); }, [carregar, player]);

  async function acao(chave: string, fn: () => Promise<{ data: Player }>) {
    setBusy(chave);
    try { setPlayer((await fn()).data); } catch {} finally { setBusy(null); }
  }

  const confirmar = (g: string) => acao(`c-${g}`, () => api.post<Player>(`/master/players/${player.id}/maestrias/${encodeURIComponent(g)}/confirmar`));
  const ajustar = (g: string, uses: number) => acao(`u-${g}`, () => api.put<Player>(`/master/players/${player.id}/maestrias/${encodeURIComponent(g)}/usos`, { uses }));
  const nivelClasse = (nivel: number) => acao('classe', () => api.put<Player>(`/master/players/${player.id}/nivel-classe`, { nivel }));
  const nivelMaestria = (g: string, nivel: number) => acao(`n-${g}`, () => api.put<Player>(`/master/players/${player.id}/maestrias/${encodeURIComponent(g)}/nivel`, { nivel }));

  const atualClasse = player.nivelClasse ?? 1;
  const grupos = [
    { titulo: 'Armas', itens: maestrias.filter((m) => m.tipoGrupo === 'ARMA') },
    { titulo: 'Essências', itens: maestrias.filter((m) => m.tipoGrupo === 'ESSENCIA') },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <div>
            <h3 className="font-semibold text-e-text">Maestria: {player.char.name}</h3>
            <p className="text-xs text-e-sub mt-0.5">{player.char.skillClass} · Nv {player.char.level}</p>
          </div>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
          {/* Nível de classe */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Nível de classe</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} type="button" disabled={busy === 'classe'} onClick={() => n !== atualClasse && nivelClasse(n)}
                  className={`flex-1 h-9 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 ${
                    n === atualClasse ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-e-faint">Skills de classe pedem nível de classe igual ou maior que o tier delas.</p>
          </div>

          {loading ? (
            <p className="text-center text-e-faint text-sm animate-pulse py-6">Carregando…</p>
          ) : grupos.map(({ titulo, itens }) => (
            <div key={titulo} className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint">{titulo}</p>
              {itens.length === 0 && <p className="text-xs text-e-faint">Nenhuma.</p>}
              {itens.map((m) => (
                <div key={m.grupo} className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-3 ${
                  m.disponivel ? 'border-e-gold/50 bg-e-gold/5' : 'border-e-border bg-e-bg'} ${m.ativa ? '' : 'opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-e-text truncate">
                      {m.nome} <span className="text-e-gold">Nv{m.nivel}</span>
                    </p>
                    <p className="text-[11px] text-e-faint">
                      {m.sobePorUso
                        ? <>{m.usos} uso{m.usos !== 1 ? 's' : ''}{m.proximoNivelUsos != null ? ` de ${m.proximoNivelUsos} para o Nv${m.nivel + 1}` : ' · nível máximo'} · </>
                        : <>Elemental: não sobe por uso, você define o nível · </>}
                      {descreverNivel(m)}
                      {!m.ativa && ' · sem proficiência'}
                    </p>
                  </div>
                  {!m.sobePorUso ? (
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: m.nivelMax }, (_, k) => k + 1).map((n) => (
                        <button key={n} type="button" disabled={busy === `n-${m.grupo}`} onClick={() => n !== m.nivel && nivelMaestria(m.grupo, n)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 ${
                            n === m.nivel ? 'bg-e-gold/20 border-e-gold text-e-gold' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" title="Tirar 1 uso" disabled={busy === `u-${m.grupo}`} onClick={() => ajustar(m.grupo, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:text-e-text hover:bg-white/5 disabled:opacity-40"><Minus size={13} /></button>
                    <button type="button" title="Dar 1 uso" disabled={busy === `u-${m.grupo}`} onClick={() => ajustar(m.grupo, 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:text-e-text hover:bg-white/5 disabled:opacity-40"><Plus size={13} /></button>
                    {m.disponivel && (
                      <button type="button" disabled={busy === `c-${m.grupo}`} onClick={() => confirmar(m.grupo)}
                        className="h-7 px-2.5 rounded-lg bg-e-gold/15 border border-e-gold/40 text-e-gold text-xs font-semibold flex items-center gap-1 disabled:opacity-40">
                        <ArrowUp size={12} /> Confirmar Nv{m.nivel + 1}
                      </button>
                    )}
                  </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {bloqueadas.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Skills bloqueadas</p>
              {bloqueadas.map((e) => (
                <div key={e.skill.id} className="rounded-xl border border-red-500/30 bg-red-500/5 px-3.5 py-2">
                  <p className="text-sm text-e-text">{e.skill.name}</p>
                  <p className="text-[11px] text-red-300">{e.bloqueio}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
