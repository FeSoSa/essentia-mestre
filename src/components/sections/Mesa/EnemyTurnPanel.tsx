'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Check, RefreshCw, SkipForward, X, BarChart3, ChevronDown, ChevronUp, Shield, Loader2, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { api, mensagemErro } from '@/lib/api';
import { useStore, useActivePlayers, useEnemies, useBosses, useAllies } from '@/store';
import { useCombateStore } from '@/store/combateStore';
import Select from '@/components/ui/Select';
import type { EnemyAction, Player } from '@/store/types';

interface Relatorio {
  combatId: string;
  porInimigo: { inimigo: string; ataques: number; acertos: number; taxaAcerto: number; desvios: number; danoMedioRolado: number; danoTotalAplicado: number; esGasta: number }[];
}

/** Propõe o turno de um inimigo/boss/aliado; o resultado chega pelo socket (/topic/enemy-action). */
export async function proporTurno(entityId: string, entityKind: 'enemy' | 'boss' | 'ally') {
  await api.post('/master/enemy-turn/propose', { entityId, entityKind });
}

function defDe(p: Player): number {
  return (p.effectiveAttributes ?? p.attributes).defense;
}

function HpBar({ atual, max }: { atual: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0;
  const cor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="h-1 w-full bg-e-border rounded-full overflow-hidden">
      <div className={`h-full ${cor} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Dado em destaque (d20) com o valor rolado. */
function Dado({ valor, critico }: { valor: number; critico?: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border text-base font-black tabular-nums ${
      critico ? 'border-e-gold text-e-gold bg-e-gold/10' : 'border-e-border text-e-text bg-e-bg'}`}>
      {valor}
    </span>
  );
}

export function AcaoCard({ acao }: { acao: EnemyAction }) {
  const players = useActivePlayers();
  const enemies = useEnemies();
  const bosses = useBosses();
  const allies = useAllies();
  const removerAcao = useCombateStore((s) => s.removerAcao);
  const [alvoId, setAlvoId] = useState(acao.alvoId);
  const [ataqueIdx, setAtaqueIdx] = useState(acao.ataqueIdx);
  const [ajustando, setAjustando] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const doAliado = acao.entityKind === 'ally';
  const ataques: { name: string; damage?: string; custoEs?: number }[] = acao.entityKind === 'boss'
    ? (() => { const b = bosses.find((x) => x.instanceId === acao.entityId); return b?.phases[b.currentPhase]?.attacks ?? []; })()
    : doAliado ? allies.find((x) => x.id === acao.entityId)?.attacks ?? []
    : enemies.find((x) => x.instanceId === acao.entityId)?.attacks ?? [];
  // Aliado mira inimigos e bosses; inimigo mira jogadores
  const oponentes = [
    ...enemies.map((e) => ({ id: e.instanceId, nome: e.name, def: e.defesa ?? e.attributes.defense, hp: e.hpCurrent, hpMax: e.hpMax })),
    ...bosses.map((b) => { const f = b.phases[b.currentPhase]; return { id: b.instanceId, nome: b.name, def: f?.defesa ?? f?.attributes.defense ?? 0, hp: b.hpCurrent, hpMax: f?.hpMax ?? b.hpCurrent }; }),
  ];
  const jogador = players.find((p) => p.id === acao.alvoId);
  const alvo = doAliado
    ? oponentes.find((o) => o.id === acao.alvoId)
    : jogador && { hp: jogador.hp.current, hpMax: jogador.hp.max };
  const mudou = alvoId !== acao.alvoId || ataqueIdx !== acao.ataqueIdx;
  const proposta = acao.status === 'PROPOSTA';
  const encerrada = acao.status !== 'PROPOSTA' && acao.status !== 'AGUARDANDO_JOGADOR';

  async function chamar(qual: string, fn: () => Promise<unknown>) {
    setLoading(qual); setErro(null);
    try { await fn(); } catch (e) { setErro(mensagemErro(e)); }
    finally { setLoading(null); }
  }

  const alvoOpts = doAliado
    ? oponentes.filter((o) => o.hp > 0 || o.id === acao.alvoId).map((o) => ({
      value: o.id,
      label: `${o.nome} · DEF ${o.def} · PV ${o.hp}/${o.hpMax}`,
    }))
    : players.map((p) => ({
      value: p.id,
      label: `${p.char.name} · DEF ${defDe(p)} · PV ${p.hp.current}/${p.hp.max}`,
    }));
  const ataqueOpts = ataques.map((a, i) => ({
    value: String(i),
    label: `${a.name}${a.custoEs ? ` · ${a.custoEs} ES` : ''}${a.damage ? ` · ${a.damage}` : ''}`,
  }));

  const statusChip = {
    PROPOSTA: { txt: 'Aguardando você', cls: 'bg-e-accent/15 text-e-accent' },
    AGUARDANDO_JOGADOR: { txt: 'Jogador decidindo', cls: 'bg-amber-500/15 text-amber-300' },
    CONCLUIDA: { txt: 'Concluída', cls: 'bg-emerald-500/15 text-emerald-300' },
    ERROU: { txt: 'Errou', cls: 'bg-e-card text-e-sub' },
    PULADA: { txt: 'Pulada', cls: 'bg-e-card text-e-faint' },
  }[acao.status];

  return (
    <div className="p-4 flex flex-col gap-3 border-b border-e-border last:border-b-0">
      {/* Quem ataca quem */}
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold truncate ${doAliado ? 'text-emerald-300' : 'text-red-300'}`}>{acao.entityName}</span>
        <ArrowRight size={13} className="text-e-faint shrink-0" />
        <span className={`text-sm font-semibold truncate ${doAliado ? 'text-red-300' : 'text-e-text'}`}>{acao.alvoNome}</span>
        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusChip.cls}`}>{statusChip.txt}</span>
      </div>
      {alvo && (
        <div className="flex items-center gap-2 -mt-1.5">
          <span className="text-[10px] text-e-faint tabular-nums shrink-0">PV {alvo.hp}/{alvo.hpMax}</span>
          <HpBar atual={alvo.hp} max={alvo.hpMax} />
        </div>
      )}
      <p className="text-xs text-e-sub -mt-1">
        <b className="text-e-text">{acao.ataqueNome}</b> · {acao.formula}{acao.custoEs > 0 ? ` · ${acao.custoEs} ES` : ''}
      </p>

      {/* Acerto e dano */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-xl border p-3 flex flex-col gap-2 ${!acao.acertou ? 'border-e-border bg-e-bg/50' : doAliado ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Acerto</span>
          <div className="flex items-center gap-2">
            <Dado valor={acao.d20Acerto} critico={acao.d20Acerto === 20} />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-black tabular-nums text-e-text">{acao.totalAcerto}</span>
              <span className="text-[10px] text-e-faint flex items-center gap-1"><Shield size={9} /> DEF {acao.defAlvo}</span>
            </div>
          </div>
          <span className={`text-xs font-bold ${!acao.acertou ? 'text-e-sub' : doAliado ? 'text-emerald-400' : 'text-red-400'}`}>
            {acao.acertou ? 'Acerta' : 'Erra'} ({acao.modAcerto >= 0 ? '+' : '−'}{Math.abs(acao.modAcerto)} de mod)
          </span>
        </div>
        <div className="rounded-xl border border-e-border bg-e-bg/50 p-3 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Dano</span>
          {acao.acertou ? (
            <div className="flex items-center gap-2">
              {acao.d20Dano != null && <Dado valor={acao.d20Dano} />}
              <span className="text-2xl font-black tabular-nums text-red-400 leading-none">{acao.dano}</span>
            </div>
          ) : <span className="text-2xl font-black text-e-faint leading-none">0</span>}
          {acao.status === 'CONCLUIDA' && (
            <span className="text-xs text-e-text">
              {acao.desviou ? 'Desviou: sem dano' : `Aplicado: ${acao.danoAplicado}`}
            </span>
          )}
        </div>
      </div>

      {acao.status === 'AGUARDANDO_JOGADOR' && (
        <p className="text-xs text-amber-300 flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" /> {acao.alvoNome} está decidindo entre desviar e receber…
        </p>
      )}
      {acao.status === 'CONCLUIDA' && acao.desvioRoll != null && (
        <p className="text-xs text-e-sub">Desvio: d20 {acao.desvioRoll} = {acao.desvioTotal} vs CD 12 ({acao.desviou ? 'sucesso' : 'falhou'})</p>
      )}

      {/* Ajustar alvo / ataque */}
      {proposta && (
        ajustando ? (
          <div className="flex flex-col gap-2 rounded-xl border border-e-border bg-e-bg/40 p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Alvo</span>
            <Select value={alvoId} onChange={setAlvoId} options={alvoOpts} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint mt-1">Ataque</span>
            <Select value={String(ataqueIdx)} onChange={(v) => setAtaqueIdx(Number(v))} options={ataqueOpts} />
            <button type="button" disabled={!mudou || loading != null}
              onClick={() => chamar('trocar', async () => {
                await api.post(`/master/enemy-turn/${acao.id}/swap`, { alvoId, ataqueIdx });
                setAjustando(false);
              })}
              className="mt-1 h-8 rounded-lg text-xs font-semibold bg-e-card border border-e-border text-e-text hover:border-e-border2 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5">
              {loading === 'trocar' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Rolar de novo com a troca
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setAjustando(true)}
            className="self-start text-xs text-e-sub hover:text-e-text flex items-center gap-1.5 cursor-pointer">
            <SlidersHorizontal size={12} /> Trocar alvo ou ataque
          </button>
        )
      )}

      {erro && <p className="text-xs text-e-danger">{erro}</p>}

      {proposta && (
        <div className="flex gap-2">
          <button type="button" disabled={loading != null} onClick={() => chamar('pular', () => api.post(`/master/enemy-turn/${acao.id}/skip`))}
            className="h-9 px-3 rounded-lg text-xs font-semibold border border-e-border text-e-sub hover:text-e-text disabled:opacity-40 cursor-pointer flex items-center gap-1.5">
            <SkipForward size={13} /> Pular
          </button>
          <button type="button" disabled={loading != null || mudou}
            title={mudou ? 'Role de novo com a troca antes de permitir' : ''}
            onClick={() => chamar('permitir', () => api.post(`/master/enemy-turn/${acao.id}/allow`))}
            className={`flex-1 h-9 rounded-lg text-sm font-bold border disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5 ${doAliado
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/30'
              : 'bg-red-500/20 border-red-500/50 text-red-200 hover:bg-red-500/30'}`}>
            {loading === 'permitir' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {acao.acertou ? 'Permitir ataque' : 'Confirmar erro'}
          </button>
        </div>
      )}
      {encerrada && (
        <button type="button" onClick={() => removerAcao(acao.id)}
          className="self-end flex items-center gap-1 text-[11px] text-e-faint hover:text-e-text cursor-pointer">
          <X size={11} /> Dispensar
        </button>
      )}
    </div>
  );
}

function RelatorioCombate() {
  const [rel, setRel] = useState<Relatorio | null>(null);
  useEffect(() => { api.get<Relatorio>('/master/combat-log').then((r) => setRel(r.data)).catch(() => {}); }, []);
  if (!rel) return <p className="p-4 text-xs text-e-faint">Carregando…</p>;
  if (rel.porInimigo.length === 0) return <p className="p-4 text-xs text-e-faint">Nenhum ataque registrado neste combate.</p>;
  return (
    <div className="p-3 flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint px-1">Números do combate</span>
      {rel.porInimigo.map((r) => (
        <div key={r.inimigo} className="rounded-lg bg-e-bg/60 border border-e-border px-3 py-2 text-xs">
          <div className="flex justify-between">
            <span className="font-semibold text-e-text">{r.inimigo}</span>
            <span className="text-e-sub tabular-nums">{Math.round(r.taxaAcerto * 100)}% de acerto</span>
          </div>
          <div className="flex gap-3 text-e-faint mt-0.5 tabular-nums">
            <span>{r.acertos}/{r.ataques} acertos</span>
            <span>{r.desvios} desvios</span>
            <span>dano médio {Math.round(r.danoMedioRolado)}</span>
            <span>total {r.danoTotalAplicado}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EnemyTurnPanel() {
  const acoes = useCombateStore((s) => s.acoes);
  const { initiative, currentTurn } = useStore();
  const secao = useStore((s) => s.activeSection);
  const enemies = useEnemies();
  const bosses = useBosses();
  const allies = useAllies();
  const [aberto, setAberto] = useState(true);
  const [relatorio, setRelatorio] = useState(false);
  const ultimoTurno = useRef<string | null>(null);

  // Quando a vez é de um inimigo/boss/aliado, propõe a ação automaticamente (uma vez por turno)
  useEffect(() => {
    if (initiative.length === 0) return;
    const entrada = initiative[currentTurn % initiative.length];
    if (!entrada) return;
    const chave = `${currentTurn}:${entrada.playerId}`;
    if (ultimoTurno.current === chave) return;
    const temOponenteVivo = enemies.some((e) => e.hpCurrent > 0) || bosses.some((b) => b.hpCurrent > 0);
    const kind = enemies.some((e) => e.instanceId === entrada.playerId && e.hpCurrent > 0) ? 'enemy'
      : bosses.some((b) => b.instanceId === entrada.playerId && b.hpCurrent > 0) ? 'boss'
      : allies.some((a) => a.id === entrada.playerId && a.hpCurrent > 0 && a.attacks.length > 0) && temOponenteVivo ? 'ally' : null;
    if (!kind) return;
    ultimoTurno.current = chave;
    proporTurno(entrada.playerId, kind).catch(() => {});
  }, [initiative, currentTurn, enemies, bosses, allies]);

  const lista = Object.values(acoes).sort((a, b) => (a.status === 'PROPOSTA' ? -1 : 0) - (b.status === 'PROPOSTA' ? -1 : 0));
  // Na Mesa nova as ações aparecem integradas; aqui só continua a proposta automática
  if (secao === 'mesa') return null;
  const pendentes = lista.filter((a) => a.status === 'PROPOSTA' || a.status === 'AGUARDANDO_JOGADOR').length;
  if (lista.length === 0 && !relatorio) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-e-surface border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden">
      <button type="button" onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 border-b border-e-border cursor-pointer hover:bg-e-card/40 transition-colors">
        <Bot size={15} className="text-red-400" />
        <span className="text-sm font-semibold text-e-text">Turnos automáticos</span>
        {pendentes > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 tabular-nums">{pendentes}</span>
        )}
        <span className="ml-auto flex items-center gap-1">
          <span role="button" tabIndex={0} title="Números do combate"
            onClick={(e) => { e.stopPropagation(); setRelatorio((v) => !v); setAberto(true); }}
            className={`p-1 rounded-md transition-colors ${relatorio ? 'text-e-text bg-e-card' : 'text-e-faint hover:text-e-text'}`}>
            <BarChart3 size={13} />
          </span>
          {aberto ? <ChevronDown size={14} className="text-e-faint" /> : <ChevronUp size={14} className="text-e-faint" />}
        </span>
      </button>
      {aberto && (
        <div className="max-h-[70vh] overflow-y-auto">
          {relatorio && <div className="border-b border-e-border"><RelatorioCombate /></div>}
          {/* key inclui alvo/ataque: os campos de troca reiniciam quando a proposta é recalculada */}
          {lista.map((a) => <AcaoCard key={`${a.id}:${a.alvoId}:${a.ataqueIdx}`} acao={a} />)}
        </div>
      )}
    </div>
  );
}
