'use client';

import { useEffect, useState } from 'react';
import { Bot, Swords, Skull, Crown, Shield, Dices, ScrollText, Hourglass, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { useCombateStore, divisorArma } from '@/store/combateStore';
import { useMesaStore } from '@/store/mesaStore';
import { maestriaResumo } from '@/lib/maestria';
import type { Player, SkillTreeEntry } from '@/store/types';
import { AcaoCard, proporTurno } from '@/components/sections/Mesa/EnemyTurnPanel';
import EnemyAttackModal from '@/components/sections/Mesa/EnemyAttackModal';
import { Avatar, Barra, Pilula, Acao, corVida, fracEs, escudoDe } from './ui';
import AjusteRapido from './AjusteRapido';
import { COR_TIPO, useCombatentes, type Combatente } from './combatentes';

function regraDesvio(peso?: string): string {
  const w = (peso ?? '').toLowerCase();
  if (w.includes('pesad')) return 'pesada: sem desvio';
  if (w.includes('méd') || w.includes('med')) return 'média: com desvantagem';
  if (w.includes('lev')) return 'leve: sem bônus';
  return 'sem armadura: + AGI';
}

function Moldura({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border bg-[#18181b] overflow-hidden h-full"
      style={{ borderColor: cor + '40', backgroundImage: `radial-gradient(120% 140% at 0% 0%, ${cor}14 0%, transparent 55%)` }}>
      {children}
    </div>
  );
}

function Cabecalho({ c, rotulo, extra }: { c: Combatente; rotulo: string; extra?: React.ReactNode }) {
  const cor = COR_TIPO[c.tipo];
  const pct = c.hpMax > 0 ? c.hp / c.hpMax : 0;
  return (
    <div className="flex items-center gap-4">
      <Avatar src={c.src} emoji={c.emoji} nome={c.nome} pct={pct} pctEs={fracEs(c.es, c.esMax)} escudo={escudoDe(c.jogador)} size={88} destaque={cor} apagado={c.hp <= 0} />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: cor }}>{rotulo}</span>
        <h2 className="text-2xl font-bold text-e-text leading-tight truncate">{c.nome}</h2>
        <div className="flex items-center gap-2">
          <div className="w-48"><Barra atual={c.hp} max={c.hpMax} cor={corVida(pct)} altura={7} /></div>
          <span className="text-sm font-bold tabular-nums" style={{ color: corVida(pct) }}>{c.hp}</span>
          <span className="text-xs text-e-faint tabular-nums">/ {c.hpMax} PV</span>
        </div>
        {extra}
      </div>
    </div>
  );
}

/** Sem combate: guia rápido para montar o encontro. */
function Preparar({ onIniciativa, onAdicionar }: { onIniciativa: () => void; onAdicionar: (t: 'inimigo' | 'boss' | 'aliado') => void }) {
  const { players, enemies, bosses, allies } = useCombatentes();
  const fora = useMesaStore((s) => s.foraDoCombate);
  const participantes = players.filter((p) => !fora.includes(p.id)).length;
  const oponentes = enemies.length + bosses.length;
  const passos = [
    { n: 1, titulo: 'Quem participa', desc: `${participantes} de ${players.length} jogadores. Use o selo de espada no Grupo.`, ok: participantes > 0 },
    { n: 2, titulo: 'Monte o encontro', desc: oponentes > 0 ? `${oponentes} oponente(s)${allies.length ? ` e ${allies.length} aliado(s)` : ''} no campo.` : 'Adicione inimigos ou um boss.', ok: oponentes > 0 },
    { n: 3, titulo: 'Role a iniciativa', desc: 'Confira a ordem e comece.', ok: false },
  ];
  return (
    <Moldura cor="#a3e635">
      <div className="p-6 flex flex-col gap-5 h-full">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-e-accent">Fora de combate</span>
          <h2 className="text-2xl font-bold text-e-text mt-1">Preparar encontro</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {passos.map((p) => (
            <div key={p.n} className={`rounded-xl border p-3.5 flex flex-col gap-1.5 ${p.ok ? 'border-e-accent/30 bg-e-accent/[0.05]' : 'border-white/10 bg-white/[0.02]'}`}>
              <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${p.ok ? 'bg-e-accent text-black' : 'bg-white/10 text-e-sub'}`}>{p.n}</span>
              <span className="text-sm font-semibold text-e-text">{p.titulo}</span>
              <span className="text-xs text-e-faint leading-snug">{p.desc}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-auto flex-wrap">
          <Acao tom="perigo" onClick={() => onAdicionar('inimigo')}><Skull size={13} /> Inimigo</Acao>
          <Acao tom="ouro" onClick={() => onAdicionar('boss')}><Crown size={13} /> Boss</Acao>
          <Acao tom="sucesso" onClick={() => onAdicionar('aliado')}><Shield size={13} /> Aliado</Acao>
          <Acao tom="destaque" className="ml-auto h-10 px-5 text-sm" onClick={onIniciativa} disabled={participantes + oponentes === 0}>
            <Dices size={15} /> Rolar iniciativa e começar
          </Acao>
        </div>
      </div>
    </Moldura>
  );
}

/** Vez de um inimigo ou boss: a ação proposta aparece aqui mesmo. */
function VezOponente({ c }: { c: Combatente }) {
  const acoes = useCombateStore((s) => s.acoes);
  const players = useStore((s) => s.players);
  const [manual, setManual] = useState(false);
  const acao = Object.values(acoes)
    .filter((a) => a.entityId === c.id)
    .sort((a, b) => (a.status === 'PROPOSTA' || a.status === 'AGUARDANDO_JOGADOR' ? -1 : 1) - (b.status === 'PROPOSTA' || b.status === 'AGUARDANDO_JOGADOR' ? -1 : 1))[0];
  const e = c.inimigo;
  const b = c.boss;
  const fase = b ? b.phases[b.currentPhase] : undefined;
  const attrs = e?.attributes ?? fase?.attributes;
  const ataques = e?.attacks ?? fase?.attacks ?? [];
  const def = e?.defesa ?? fase?.defesa ?? attrs?.defense;
  const esMax = e?.esMax ?? fase?.esMax ?? 0;
  const es = e?.esCurrent ?? b?.esCurrent ?? esMax;
  const cor = COR_TIPO[c.tipo];

  return (
    <Moldura cor={cor}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,360px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)] h-full">
        <div className="p-6 flex flex-col gap-4">
          <Cabecalho c={c} rotulo={c.tipo === 'boss' ? `Vez do boss${fase ? ` · fase ${b!.currentPhase + 1}` : ''}` : 'Vez do inimigo'}
            extra={
              <div className="flex gap-1.5 flex-wrap">
                {def != null && <Pilula cor="#a1a1aa">DEF {def}</Pilula>}
                {esMax > 0 && <Pilula cor="#4a9fe0">ES {es}/{esMax}</Pilula>}
                {(e?.negaCritico || b?.negaCritico) && <Pilula cor="#d4a84e">nega crítico</Pilula>}
              </div>
            } />
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Ataques</span>
            <div className="flex flex-wrap gap-1.5">
              {ataques.map((a, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-e-sub">
                  <b className="text-e-text font-semibold">{a.name}</b>{a.damage ? ` · ${a.damage}` : ''}{a.custoEs ? ` · ${a.custoEs} ES` : ''}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-auto">
            <Acao onClick={() => setManual(true)}><Swords size={13} /> Ataque manual</Acao>
            {!acao && <Acao tom="perigo" onClick={() => proporTurno(c.id, c.tipo === 'boss' ? 'boss' : 'enemy').catch(() => {})}><Bot size={13} /> Calcular turno</Acao>}
          </div>
        </div>
        <div className="border-l border-white/10 bg-black/20 flex flex-col">
          <div className="px-4 pt-4 flex items-center gap-2">
            <Bot size={13} className="text-red-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-sub">Ação proposta</span>
          </div>
          {acao ? <AcaoCard key={`${acao.id}:${acao.alvoId}:${acao.ataqueIdx}`} acao={acao} /> : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-e-faint p-6 text-center">
              <Hourglass size={22} className="animate-pulse" />
              <span className="text-xs">Calculando a ação…</span>
            </div>
          )}
        </div>
      </div>
      {manual && attrs && (
        <EnemyAttackModal entityId={c.id} entityKind={c.tipo === 'boss' ? 'boss' : 'enemy'} entityName={c.nome}
          attacks={ataques} entityAttributes={{ strength: attrs.strength, agility: attrs.agility, intelligence: attrs.intelligence }}
          players={players} theme={{ accent: cor, accentBg: '#2a1818', border: cor + '55' }} onClose={() => setManual(false)} />
      )}
    </Moldura>
  );
}

/** Vez de um aliado: o app propõe o ataque contra um inimigo ou boss, igual ao turno dos oponentes. */
function VezAliado({ c }: { c: Combatente }) {
  const acoes = useCombateStore((s) => s.acoes);
  const al = c.aliado;
  const acao = Object.values(acoes)
    .filter((a) => a.entityId === c.id)
    .sort((a, b) => (a.status === 'PROPOSTA' ? -1 : 1) - (b.status === 'PROPOSTA' ? -1 : 1))[0];
  const ataques = al?.attacks ?? [];
  const cor = COR_TIPO.aliado;

  return (
    <Moldura cor={cor}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,360px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)] h-full">
        <div className="p-6 flex flex-col gap-4">
          <Cabecalho c={c} rotulo="Vez do aliado"
            extra={al && <div className="flex gap-1.5 flex-wrap"><Pilula cor="#a1a1aa">DEF {al.attributes.defense}</Pilula></div>} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Ataques</span>
            <div className="flex flex-wrap gap-1.5">
              {ataques.map((a, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-e-sub">
                  <b className="text-e-text font-semibold">{a.name}</b>{a.damage ? ` · ${a.damage}` : ''}
                </span>
              ))}
              {ataques.length === 0 && <span className="text-xs text-e-faint">Sem ataques cadastrados: ajuste a vida dos inimigos à mão.</span>}
            </div>
          </div>
          {!acao && ataques.length > 0 && (
            <div className="flex gap-2 mt-auto">
              <Acao tom="sucesso" onClick={() => proporTurno(c.id, 'ally').catch(() => {})}><Bot size={13} /> Calcular turno</Acao>
            </div>
          )}
        </div>
        <div className="border-l border-white/10 bg-black/20 flex flex-col">
          <div className="px-4 pt-4 flex items-center gap-2">
            <Bot size={13} className="text-emerald-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-sub">Ação proposta</span>
          </div>
          {acao ? <AcaoCard key={`${acao.id}:${acao.alvoId}:${acao.ataqueIdx}`} acao={acao} /> : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-e-faint p-6 text-center">
              {ataques.length > 0 ? <Hourglass size={22} className="animate-pulse" /> : <Shield size={22} />}
              <span className="text-xs">{ataques.length > 0 ? 'Calculando a ação…' : 'Nada a calcular.'}</span>
            </div>
          )}
        </div>
      </div>
    </Moldura>
  );
}

/** Vez de um jogador: estado dele e atalhos. */
function VezJogador({ c, p }: { c: Combatente; p: Player }) {
  const { setPlayer } = useStore();
  const selecionar = useMesaStore((s) => s.selecionar);
  const [skills, setSkills] = useState<SkillTreeEntry[]>([]);
  const slotsKey = p.slots.map((s) => `${s.skillId}:${s.cooldownRemaining}`).join(',');
  useEffect(() => {
    api.get<SkillTreeEntry[]>(`/master/players/${p.id}/skill-tree`).then((r) => setSkills(r.data)).catch(() => {});
  }, [p.id, slotsKey]);
  const porId = new Map(skills.map((s) => [s.skill.id, s]));
  const attrs = p.effectiveAttributes ?? p.attributes;
  const desviosPorCombate = useCombateStore((s) => s.cfg.desviosPorCombate);
  const arma = p.equipment.mainHand;
  const formulaArma = arma
    ? `${arma.damageBase}${arma.damageAttribute ? ` + d20×${arma.damageAttribute}/${divisorArma(arma, p.proficiencias ?? [])}` : ''} · crítico ${arma.margemCritico ?? 20}+`
    : `ataque desarmado · divisor ${divisorArma(null)}`;

  async function ajustar(recurso: 'hp' | 'flow', delta: number) {
    try { setPlayer((await api.put<Player>(`/players/${p.id}/${recurso}`, { delta })).data); } catch {}
  }

  return (
    <Moldura cor={COR_TIPO.jogador}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,300px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] h-full">
        <div className="p-6 flex flex-col gap-4">
          <Cabecalho c={c} rotulo="Vez do jogador"
            extra={
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-48"><Barra atual={p.flow.current} max={p.flow.max} cor="#4a9fe0" altura={5} /></div>
                <span className="text-xs text-[#4a9fe0] font-bold tabular-nums">{p.flow.current}</span>
                <span className="text-[11px] text-e-faint tabular-nums">/ {p.flow.max} ES</span>
              </div>
            } />
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Ataque</span>
              <p className="text-sm font-semibold text-e-text truncate">{arma?.name ?? 'Desarmado'}</p>
              <p className="text-[11px] text-e-sub font-mono truncate">{formulaArma}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Defesa</span>
              <p className="text-sm font-semibold text-e-text">DEF {attrs.defense}</p>
              <p className="text-[11px] text-e-sub truncate">{p.equipment.armor?.name ?? 'Sem armadura'}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Desvios</span>
              <div className="flex gap-1 mt-1.5">
                {Array.from({ length: desviosPorCombate }, (_, i) => (
                  <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < (p.desviosRestantes ?? 0) ? 'bg-red-400' : 'bg-white/10'}`} />
                ))}
              </div>
              <p className="text-[11px] text-e-sub truncate mt-1">{regraDesvio(p.equipment.armor?.armorWeight)}</p>
            </div>
          </div>
          {(p.sobrecargaAtiva || p.statusEffects.length > 0) && (
            <div className="flex gap-1.5 flex-wrap">
              {p.sobrecargaAtiva && <Pilula cor="#f97316"><Flame size={11} /> Sobrecarga Nv {p.sobrecargaNivel}</Pilula>}
              {p.statusEffects.map((ef) => <Pilula key={ef.id} cor={ef.color || '#a1a1aa'}>{ef.name}{ef.durationTurns !== -1 ? ` ${ef.durationTurns}t` : ''}</Pilula>)}
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Vida</span>
              <AjusteRapido onAplicar={(d) => ajustar('hp', d)} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Essência</span>
              <AjusteRapido onAplicar={(d) => ajustar('flow', d)} rotuloMenos="Gastar" rotuloMais="Recuperar" />
            </div>
            <Acao className="self-end" onClick={() => selecionar(p.id)}><ScrollText size={13} /> Abrir ficha</Acao>
          </div>
        </div>
        <div className="border-l border-white/10 bg-black/20 p-4 flex flex-col gap-2 overflow-y-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-sub">Habilidades</span>
          {p.slots.filter((s) => s.skillId).map((s) => {
            const e = porId.get(s.skillId!);
            const pronta = s.cooldownRemaining <= 0;
            return (
              <div key={s.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${pronta ? 'border-white/10 bg-white/[0.03]' : 'border-transparent bg-white/[0.015] opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-e-text truncate">{e?.skill.name ?? '…'}</p>
                  {e?.maestria && <p className="text-[10px] text-e-gold/80 truncate">{maestriaResumo(e.maestria)}</p>}
                </div>
                {s.type === 'passive'
                  ? <span className="text-[10px] font-bold text-violet-300">PASSIVA</span>
                  : pronta
                  ? <span className="text-[10px] font-bold text-emerald-400">PRONTA</span>
                  : <span className="text-[10px] font-bold text-sky-300 tabular-nums">{s.cooldownRemaining} turno{s.cooldownRemaining > 1 ? 's' : ''}</span>}
              </div>
            );
          })}
          {p.slots.every((s) => !s.skillId) && <p className="text-xs text-e-faint">Nenhuma habilidade equipada.</p>}
        </div>
      </div>
    </Moldura>
  );
}

/** Painel central da Mesa: sempre mostra o que importa agora. */
export default function EmFoco({ onIniciativa, onAdicionar }: { onIniciativa: () => void; onAdicionar: (t: 'inimigo' | 'boss' | 'aliado') => void }) {
  const { emCombate, vezId, porId } = useCombatentes();
  if (!emCombate) return <Preparar onIniciativa={onIniciativa} onAdicionar={onAdicionar} />;
  const c = vezId ? porId.get(vezId) : undefined;
  if (!c) {
    return (
      <Moldura cor="#a1a1aa">
        <div className="p-6 h-full flex items-center justify-center text-sm text-e-faint">Participante da vez não está mais na mesa. Avance o turno.</div>
      </Moldura>
    );
  }
  if (c.tipo === 'jogador' && c.jogador) return <VezJogador c={c} p={c.jogador} />;
  if (c.tipo === 'inimigo' || c.tipo === 'boss') return <VezOponente key={c.id} c={c} />;
  return <VezAliado key={c.id} c={c} />;
}
