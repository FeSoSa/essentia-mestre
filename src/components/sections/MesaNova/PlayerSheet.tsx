'use client';

import { useEffect, useState } from 'react';
import { X, CircleDollarSign, Sparkle, ScrollText, Backpack, Sparkles, Star, Gem, Flame, Swords, Moon, Clover } from 'lucide-react';
import { api, mensagemErro } from '@/lib/api';
import { useStore } from '@/store';
import { useCombateStore, divisorArma } from '@/store/combateStore';
import { useMesaStore } from '@/store/mesaStore';
import { maestriaResumo, useMaestriaStore } from '@/lib/maestria';
import { getStatusIcon } from '@/lib/statusIcons';
import type { Essencia, Player, PlayerAttributes, SkillTreeEntry } from '@/store/types';
import DetalhesModal from '@/components/sections/Mesa/DetalhesModal';
import StatusEffectModal from '@/components/sections/Mesa/StatusEffectModal';
import InventarioModal from '@/components/sections/Mesa/InventarioModal';
import MaestriaModal from '@/components/sections/Mesa/MaestriaModal';
import EssenciaModal from '@/components/sections/Mesa/EssenciaModal';
import { CapacidadeEssencia } from '@/components/shared/EssenciaNivel';
import ProficienciasEditor from '@/components/shared/ProficienciasEditor';
import { Avatar, Barra, Pilula, corVida, fracEs, escudoDe } from './ui';
import AjusteRapido from './AjusteRapido';

const ATTRS: [string, keyof PlayerAttributes][] = [
  ['FOR', 'strength'], ['AGI', 'agility'], ['INT', 'intelligence'], ['RES', 'resistance'],
  ['FLX', 'flow'], ['SAB', 'wisdom'], ['PRE', 'presence'], ['DEF', 'defense'],
];

function mod(v: number): number {
  if (v <= 7) return -1; if (v <= 11) return 0; if (v <= 15) return 1; if (v <= 19) return 2;
  if (v <= 23) return 3; if (v <= 27) return 4; if (v <= 31) return 5; if (v <= 35) return 6;
  if (v <= 40) return 7; if (v <= 46) return 8; if (v <= 53) return 9; if (v <= 61) return 10;
  return 11;
}

function xpParaNivel(n: number): number {
  if (n <= 1) return 0;
  if (n <= 20) return 75 * (n * (n + 1) / 2 - 1) - 50 * (n - 1);
  const m = n - 20;
  return 14725 + m * (2750 + 150 * m);
}

function regraDesvio(peso?: string): string {
  const w = (peso ?? '').toLowerCase();
  if (w.includes('pesad')) return 'Armadura pesada: não pode desviar';
  if (w.includes('méd') || w.includes('med')) return 'Armadura média: desvia com desvantagem';
  if (w.includes('lev')) return 'Armadura leve: desvia sem bônus';
  return 'Sem armadura: desvia com + AGI';
}

type Aba = 'resumo' | 'habilidades' | 'equipamento';
type Modal = 'detalhes' | 'efeitos' | 'inventario' | 'maestria' | 'essencias' | null;

function Recurso({ nome, atual, max, cor, onAjuste, menos, mais }: {
  nome: string; atual: number; max: number; cor: string; onAjuste: (d: number) => void; menos?: string; mais?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">{nome}</span>
        <span className="text-sm tabular-nums"><b style={{ color: cor }}>{atual}</b><span className="text-e-faint text-xs"> / {max}</span></span>
      </div>
      <Barra atual={atual} max={max} cor={cor} altura={8} />
      <div className="flex justify-end"><AjusteRapido compacto onAplicar={onAjuste} rotuloMenos={menos} rotuloMais={mais} /></div>
    </div>
  );
}

/** Ficha do jogador em gaveta lateral: abre sobre a mesa sem tirar o campo de vista. */
export default function PlayerSheet({ player, essencias, onClose }: { player: Player; essencias: Essencia[]; onClose: () => void }) {
  const { setPlayer } = useStore();
  const desviosPorCombate = useCombateStore((s) => s.cfg.desviosPorCombate);
  const { foraDoCombate, alternarCombate } = useMesaStore();
  const emCombate = useStore((s) => s.initiative.length > 0);
  const [aba, setAba] = useState<Aba>('resumo');
  const [modal, setModal] = useState<Modal>(null);
  const [skills, setSkills] = useState<SkillTreeEntry[]>([]);

  // Alguma maestria já tem usos para o próximo nível (o mestre confirma)
  const niveisMaestria = useMaestriaStore((st) => st.cfg.niveis);
  const nivelDisponivel = (player.maestrias ?? []).some((m) => {
    // Essência Elemental não sobe por uso
    const elemental = m.tipoGrupo === 'ESSENCIA' && ['Elemental', 'Grande'].includes(essencias.find((e) => e.id === m.grupo)?.type ?? '');
    const prox = niveisMaestria.find((n) => n.nivel === m.nivel + 1);
    return !elemental && !!prox && m.usos >= prox.usos;
  });
  const slotsKey = player.slots.map((s) => `${s.skillId}:${s.cooldownRemaining}`).join(',');
  useEffect(() => {
    api.get<SkillTreeEntry[]>(`/master/players/${player.id}/skill-tree`).then((r) => setSkills(r.data)).catch(() => {});
  }, [player.id, slotsKey]);

  useEffect(() => {
    const fechar = (e: KeyboardEvent) => { if (e.key === 'Escape' && !modal) onClose(); };
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [modal, onClose]);

  const attrs = player.effectiveAttributes ?? player.attributes;
  const fora = foraDoCombate.includes(player.id);
  const hpPct = player.hp.max > 0 ? player.hp.current / player.hp.max : 0;
  const floor = xpParaNivel(player.char.level);
  const xpNeeded = xpParaNivel(player.char.level + 1) - floor;
  const xpIn = Math.max(0, Math.min(xpNeeded, (player.exp.total ?? 0) - floor));
  const porId = new Map(skills.map((s) => [s.skill.id, s]));
  const nosSlots = new Set(player.slots.map((s) => s.skillId).filter(Boolean));
  const desbloqueadas = skills.filter((s) => s.status === 'UNLOCKED' && !nosSlots.has(s.skill.id));
  const eq = player.equipment;

  async function darXp(amount: number) {
    if (amount <= 0) return;
    try { setPlayer((await api.put<Player>('/master/exp', { playerId: player.id, amount })).data); } catch {}
  }

  /** Sorte: recompensa rara, o mestre dá ou tira 1 por vez. */
  async function ajustarSorte(delta: number) {
    try { setPlayer((await api.put<Player>(`/master/players/${player.id}/sorte`, { delta })).data); } catch {}
  }

  async function ajustarOuro(delta: number) {
    try { setPlayer((await api.put<Player>(`/master/players/${player.id}/gold`, { delta })).data); } catch {}
  }

  async function ajustar(recurso: 'hp' | 'flow' | 'ether' | 'pressao', delta: number) {
    try { setPlayer((await api.put<Player>(`/players/${player.id}/${recurso}`, { delta })).data); } catch {}
  }

  // Escudo: PV temporário (skill em aliado ou decisão do mestre); dano tira dele primeiro
  async function ajustarEscudo(delta: number) {
    if (delta === 0) return;
    try { setPlayer((await api.put<Player>(`/master/players/${player.id}/escudo`, { delta })).data); }
    catch (e) { alert(`Não deu para ajustar o Escudo: ${mensagemErro(e)}`); }
  }
  const escudo = player.escudo ?? 0;
  const tetoEscudo = Math.floor(player.hp.max * 0.25);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="fixed top-0 right-0 bottom-0 z-40 w-[540px] max-w-[94vw] bg-[#131316] border-l border-white/10 shadow-2xl flex flex-col animate-[slideIn_180ms_ease-out]">
        {/* Cabeçalho */}
        <div className="p-5 pb-4 border-b border-white/10 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <Avatar src={player.char.portraitUrl} nome={player.char.name} pct={hpPct} pctEs={fracEs(player.flow.current, player.flow.max)} escudo={escudoDe(player)} size={80} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-e-text truncate">{player.char.name}</h2>
                <span className="text-[11px] font-bold text-e-gold bg-e-gold/10 border border-e-gold/25 px-1.5 py-0.5 rounded-md shrink-0">Nv {player.char.level}</span>
              </div>
              <p className="text-sm text-e-sub truncate">{player.char.race} · {player.char.skillClass}{player.char.subClass ? ` · ${player.char.subClass}` : ''}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1"><Barra atual={xpIn} max={xpNeeded} cor="#a3e635" altura={4} /></div>
                <span className="text-[10px] text-e-faint tabular-nums shrink-0">{xpIn}/{xpNeeded} XP para o Nv {player.char.level + 1}</span>
              </div>
              {(player.exp.available ?? 0) > 0 && <p className="text-[11px] text-e-gold mt-1">{player.exp.available} pontos para distribuir</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-e-faint hover:text-e-text hover:bg-white/5 cursor-pointer" title="Fechar (Esc)"><X size={16} /></button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint flex items-center gap-1"><Sparkle size={11} /> Experiência</span>
                <span className="text-xs font-bold text-e-accent tabular-nums">{player.exp.total ?? 0} XP</span>
              </div>
              <AjusteRapido compacto apenasMais rotuloMais="Dar XP" placeholder="XP" onAplicar={darXp} />
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint flex items-center gap-1"><CircleDollarSign size={11} /> Ouro</span>
                <span className="text-xs font-bold text-e-gold tabular-nums">{player.gold ?? 0}</span>
              </div>
              <AjusteRapido compacto rotuloMenos="Tirar" rotuloMais="Dar" placeholder="ouro" onAplicar={ajustarOuro} />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!emCombate && (
              <button type="button" onClick={() => alternarCombate(player.id)}
                className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  fora ? 'border-white/10 text-e-sub hover:text-e-text' : 'border-e-accent/40 bg-e-accent/10 text-e-accent'}`}>
                {fora ? <><Moon size={13} /> Fora do combate</> : <><Swords size={13} /> No combate</>}
              </button>
            )}
            <div className="ml-auto flex gap-1">
              {([
                ['detalhes', 'Ficha completa', ScrollText],
                ['inventario', 'Inventário', Backpack],
                ['efeitos', 'Efeitos', Sparkles],
                ['maestria', 'Maestria', Star],
                ['essencias', 'Essências', Gem],
              ] as const).map(([id, label, Icon]) => {
                const aviso = id === 'maestria' && nivelDisponivel;
                return (
                  <button key={id} type="button" title={aviso ? 'Maestria: nível disponível para confirmar' : label} onClick={() => setModal(id)}
                    className={`relative w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer ${
                      aviso ? 'border-e-gold/60 text-e-gold bg-e-gold/10' : 'border-white/10 text-e-sub hover:text-e-text hover:bg-white/5'}`}>
                    <Icon size={14} />
                    {aviso && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-e-gold" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {(['resumo', 'habilidades', 'equipamento'] as Aba[]).map((a) => (
              <button key={a} type="button" onClick={() => setAba(a)}
                className={`flex-1 h-8 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                  aba === a ? 'bg-white/10 text-e-text' : 'text-e-faint hover:text-e-sub'}`}>
                {a === 'resumo' ? 'Resumo' : a === 'habilidades' ? 'Habilidades' : 'Equipamento'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {aba === 'resumo' && (
            <>
              <div className="flex flex-col gap-4">
                <Recurso nome="Vida" atual={player.hp.current} max={player.hp.max} cor={corVida(hpPct)} onAjuste={(d) => ajustar('hp', d)} menos="Dano" mais="Curar" />
                <div className="flex flex-col gap-1.5 -mt-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/80">Escudo</span>
                    <span className="text-sm tabular-nums"><b className="text-sky-300">{escudo}</b><span className="text-e-faint text-xs"> / {tetoEscudo} (teto)</span></span>
                  </div>
                  <Barra atual={escudo} max={Math.max(1, tetoEscudo)} cor="#7dd3fc" altura={5} />
                  <div className="flex justify-end"><AjusteRapido compacto rotuloMenos="Tirar" rotuloMais="Dar" placeholder="PV" onAplicar={ajustarEscudo} /></div>
                </div>
                <Recurso nome="Essência (ES)" atual={player.flow.current} max={player.flow.max} cor="#4a9fe0" onAjuste={(d) => ajustar('flow', d)} menos="Gastar" mais="Recuperar" />
                {player.ether?.unlocked && <Recurso nome="Éter" atual={player.ether.current} max={player.ether.max} cor="#a855f7" onAjuste={(d) => ajustar('ether', d)} menos="Gastar" mais="Recuperar" />}
                {player.pressao && <Recurso nome="Pressão" atual={player.pressao.current} max={player.pressao.max} cor="#f97316" onAjuste={(d) => ajustar('pressao', d)} menos="Gastar" mais="Ganhar" />}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">DEF</span>
                  <span className="text-2xl font-black text-e-text tabular-nums leading-none">{attrs.defense}</span>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Desvios</span>
                  <div className="flex gap-1">
                    {Array.from({ length: desviosPorCombate }, (_, i) => (
                      <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < (player.desviosRestantes ?? 0) ? 'bg-red-400' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Iniciativa</span>
                  <span className="text-2xl font-black text-e-text tabular-nums leading-none">+{Math.floor(mod(attrs.agility) / 2)}</span>
                </div>
                <div className="rounded-xl bg-amber-400/[0.06] border border-amber-400/30 p-3 flex flex-col items-center gap-1" title="Sorte: 1d6 somado a um d20, não volta com o tempo">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300 flex items-center gap-1"><Clover size={11} />Sorte</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => ajustarSorte(-1)} disabled={(player.sorte ?? 0) <= 0}
                      className="w-6 h-6 rounded-md border border-white/10 text-e-sub hover:text-e-text disabled:opacity-30" aria-label="Tirar 1 sorte">−</button>
                    <span className="text-2xl font-black text-amber-300 tabular-nums leading-none">{player.sorte ?? 0}</span>
                    <button type="button" onClick={() => ajustarSorte(1)}
                      className="w-6 h-6 rounded-md border border-amber-400/40 text-amber-300 hover:bg-amber-400/10" aria-label="Dar 1 sorte">+</button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-e-sub -mt-3">{regraDesvio(eq.armor?.armorWeight)}{eq.armor?.negaCritico ? ' · nega 1 crítico por rodada' : ''}</p>

              <div className="grid grid-cols-4 gap-1.5">
                {ATTRS.map(([label, key]) => {
                  const v = attrs[key]; const m = mod(v);
                  return (
                    <div key={key} className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-e-faint uppercase tracking-wider">{label}</span>
                      <span className="text-base font-bold text-e-text tabular-nums leading-tight">{v}</span>
                      <span className={`text-[10px] font-bold tabular-nums ${m >= 0 ? 'text-e-accent' : 'text-red-400'}`}>{m >= 0 ? '+' : ''}{m}</span>
                    </div>
                  );
                })}
              </div>

              {(player.statusEffects.length > 0 || player.sobrecargaAtiva) && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Efeitos ativos</span>
                  <div className="flex flex-wrap gap-1.5">
                    {player.sobrecargaAtiva && <Pilula cor="#f97316"><Flame size={11} /> Sobrecarga Nv {player.sobrecargaNivel}</Pilula>}
                    {player.statusEffects.map((ef) => {
                      const I = getStatusIcon(ef.icon);
                      return <Pilula key={ef.id} cor={ef.color || '#a1a1aa'} title={ef.desc}>{I && <I size={11} />} {ef.name}{ef.durationTurns !== -1 ? ` · ${ef.durationTurns}t` : ''}</Pilula>;
                    })}
                  </div>
                </div>
              )}

              {(player.essenciasObtidas ?? []).length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Essências</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(player.essenciasObtidas ?? []).map((ob) => {
                      const ess = essencias.find((e) => e.id === ob.essenciaId);
                      return <Pilula key={ob.essenciaId} cor={ess?.color || '#a1a1aa'}>{ess?.name ?? ob.essenciaId} Nv{ob.nivel ?? 1}</Pilula>;
                    })}
                  </div>
                  <CapacidadeEssencia player={player} />
                </div>
              )}
            </>
          )}

          {aba === 'habilidades' && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Nos slots</span>
                {player.slots.filter((s) => s.skillId).map((s) => {
                  const e = porId.get(s.skillId!);
                  const pronta = s.cooldownRemaining <= 0;
                  return (
                    <div key={s.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-e-text truncate">
                          {e?.skill.name ?? '…'}
                          {e?.skill.ultimate && <span className="ml-1.5 text-[9px] font-black px-1 py-0.5 rounded bg-amber-500/15 text-amber-300">ULT</span>}
                        </p>
                        {e?.maestria && <p className="text-[11px] text-e-gold/80 truncate">{maestriaResumo(e.maestria)}</p>}
                        {e?.bloqueio && <p className="text-[11px] text-red-300 truncate">Bloqueada: {e.bloqueio}</p>}
                      </div>
                      {pronta ? <span className="text-[10px] font-black text-emerald-400">PRONTA</span>
                        : <span className="text-[10px] font-black text-sky-300 tabular-nums">{s.cooldownRemaining}T</span>}
                    </div>
                  );
                })}
                {player.slots.every((s) => !s.skillId) && <p className="text-xs text-e-faint">Nenhuma habilidade nos slots.</p>}
              </div>
              {desbloqueadas.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Desbloqueadas fora dos slots</span>
                  {desbloqueadas.map((e) => (
                    <div key={e.skill.id} className="rounded-xl border border-white/[0.05] px-3.5 py-2 flex items-center gap-3 opacity-80">
                      <p className="flex-1 text-sm text-e-sub truncate">{e.skill.name}</p>
                      {e.bloqueio
                        ? <span className="text-[11px] text-red-300 shrink-0" title={e.bloqueio}>bloqueada</span>
                        : e.maestria && <span className="text-[11px] text-e-faint shrink-0">{e.maestria.nome} Nv{e.maestria.nivel}</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {aba === 'equipamento' && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Proficiências</span>
              <ProficienciasEditor player={player} />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint mt-2">Equipado</span>
              {([['Mão principal', eq.mainHand], ['Mão secundária', eq.offHand]] as const).map(([rotulo, arma]) => arma && (
                <div key={rotulo} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-e-text truncate">{arma.name}</p>
                    <p className="text-[11px] text-e-faint">{rotulo} · crítico em {arma.margemCritico ?? 20}+</p>
                  </div>
                  <span className="text-xs font-mono text-e-sub shrink-0">{arma.damageBase}{arma.damageAttribute ? ` + d20×${arma.damageAttribute}/${divisorArma(arma, player.proficiencias ?? [])}` : ''}</span>
                </div>
              ))}
              {eq.armor && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-e-text truncate">{eq.armor.name}</p>
                    <p className="text-[11px] text-e-faint">Armadura{eq.armor.armorWeight ? ` ${eq.armor.armorWeight}` : ''}</p>
                  </div>
                  <span className="text-xs text-e-sub shrink-0">+{eq.armor.attributeBonus?.defense ?? 0} DEF</span>
                </div>
              )}
              {[eq.amulet, eq.ring, eq.utility].map((a) => a && (
                <div key={a.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 flex items-center gap-3">
                  <p className="flex-1 text-sm text-e-text truncate">{a.name}</p>
                  <span className="text-[11px] text-e-faint shrink-0">{Object.entries(a.attributeBonus ?? {}).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} +${v}`).join(' · ')}</span>
                </div>
              ))}
              {!eq.mainHand && !eq.offHand && !eq.armor && !eq.amulet && !eq.ring && !eq.utility && <p className="text-xs text-e-faint">Nada equipado.</p>}
            </div>
          )}
        </div>
      </aside>

      {modal === 'detalhes'   && <DetalhesModal player={player} onClose={() => setModal(null)} />}
      {modal === 'efeitos'    && <StatusEffectModal player={player} onClose={() => setModal(null)} />}
      {modal === 'inventario' && <InventarioModal player={player} onClose={() => setModal(null)} />}
      {modal === 'maestria'   && <MaestriaModal player={player} onClose={() => setModal(null)} />}
      {modal === 'essencias'  && <EssenciaModal player={player} onClose={() => setModal(null)} />}
    </>
  );
}
