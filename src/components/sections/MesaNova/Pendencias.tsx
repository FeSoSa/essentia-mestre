'use client';

import { useState } from 'react';
import { Check, X, Sword, Sparkles, Flame, Loader2, ArrowRight, Bot, HeartHandshake, ShieldAlert } from 'lucide-react';
import { useStore } from '@/store';
import { useCombateStore } from '@/store/combateStore';
import { pedidos, SOBRECARGA_NIVEIS } from '@/lib/pedidos';
import { mensagemErro } from '@/lib/api';
import { getStatusIcon } from '@/lib/statusIcons';
import { AcaoCard } from '@/components/sections/Mesa/EnemyTurnPanel';
import type { AllyEffectApprovalRequest, DamageApprovalRequest, EffectApprovalRequest, SobrecargaRequest } from '@/store/types';
import { Secao } from './ui';
import { useCombatentes } from './combatentes';

function Cartao({ cor, Icon, titulo, children }: { cor: string; Icon: typeof Sword; titulo: string; children: React.ReactNode }) {
  return (
    <div className="w-[300px] shrink-0 rounded-2xl border bg-[#18181b] flex flex-col overflow-hidden" style={{ borderColor: cor + '45' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: cor + '25', background: cor + '0d' }}>
        <Icon size={13} style={{ color: cor }} />
        <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: cor }}>{titulo}</span>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">{children}</div>
    </div>
  );
}

function Botoes({ onSim, onNao, simTxt = 'Aprovar', naoTxt = 'Rejeitar', simOff, naoOff }: {
  onSim: () => Promise<void>; onNao: () => Promise<void>; simTxt?: string; naoTxt?: string; simOff?: boolean; naoOff?: boolean;
}) {
  const [carregando, setCarregando] = useState<'sim' | 'nao' | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  async function rodar(q: 'sim' | 'nao', fn: () => Promise<void>) {
    setCarregando(q); setErro(null);
    try { await fn(); } catch (e) { setErro(mensagemErro(e)); } finally { setCarregando(null); }
  }
  return (
    <div className="flex flex-col gap-1.5 mt-auto">
      {erro && <span className="text-[11px] text-e-danger">{erro}</span>}
      <div className="flex gap-2">
        <button type="button" disabled={carregando != null || naoOff} onClick={() => rodar('nao', onNao)}
          className="h-8 px-3 rounded-lg border border-white/10 text-xs font-semibold text-e-sub hover:text-e-text hover:bg-white/5 disabled:opacity-35 cursor-pointer flex items-center gap-1.5">
          {carregando === 'nao' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} {naoTxt}
        </button>
        <button type="button" disabled={carregando != null || simOff} onClick={() => rodar('sim', onSim)}
          className="flex-1 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-bold hover:bg-emerald-500/25 disabled:opacity-35 cursor-pointer flex items-center justify-center gap-1.5">
          {carregando === 'sim' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {simTxt}
        </button>
      </div>
    </div>
  );
}

function PedidoDano({ r }: { r: DamageApprovalRequest }) {
  return (
    <Cartao cor="#e05050" Icon={Sword} titulo={r.ataqueBasico ? 'Ataque básico' : 'Dano'}>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-e-text truncate">{r.playerName}</span>
        <ArrowRight size={12} className="text-e-faint shrink-0" />
        <span className="text-e-sub truncate">{r.targetName}</span>
      </div>
      {(r.targetType === 'player' || r.targetType === 'ally') && (
        <div className="flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/40 px-2 py-1 text-[11px] font-bold text-red-300">
          <ShieldAlert size={12} /> FOGO AMIGO: o alvo é um aliado
        </div>
      )}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-red-400 tabular-nums leading-none">{r.damage}</span>
        <span className="text-xs text-e-faint">de dano</span>
        {r.critico && <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-e-gold">Crítico</span>}
      </div>
      {r.critico && r.danoSemCritico != null && <span className="text-[11px] text-e-faint -mt-1.5">sem crítico seria {r.danoSemCritico}</span>}
      {(r.onHitEffects?.length ?? 0) > 0 && <span className="text-[11px] text-purple-300">+ {r.onHitEffects!.map((e) => e.name).join(', ')}</span>}
      <Botoes onSim={() => pedidos.aprovarDano(r)} onNao={() => pedidos.rejeitarDano(r)} />
    </Cartao>
  );
}

function PedidoEfeito({ r }: { r: EffectApprovalRequest }) {
  return (
    <Cartao cor="#a855f7" Icon={Sparkles} titulo="Efeito">
      <div className="text-sm">
        <span className="font-semibold text-e-text">{r.playerName}</span>
        <span className="text-e-sub"> em {r.targets.map((t) => t.targetName).join(', ')}</span>
      </div>
      {r.targets.some((t) => t.targetType === 'player' || t.targetType === 'ally') && (
        <div className="flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/40 px-2 py-1 text-[11px] font-bold text-red-300">
          <ShieldAlert size={12} /> FOGO AMIGO: {r.targets.filter((t) => t.targetType === 'player' || t.targetType === 'ally').map((t) => t.targetName).join(', ')}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {r.onHitEffects.map((ef) => {
          const I = getStatusIcon(ef.icon);
          return (
            <span key={ef.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-500/15 border border-purple-500/30 text-purple-200">
              {I && <I size={11} />} {ef.name} <span className="opacity-60">{ef.durationTurns === -1 ? '∞' : `${ef.durationTurns}t`}</span>
            </span>
          );
        })}
      </div>
      <Botoes onSim={() => pedidos.aprovarEfeito(r)} onNao={() => pedidos.rejeitarEfeito(r)} />
    </Cartao>
  );
}

function PedidoAliados({ r }: { r: AllyEffectApprovalRequest }) {
  const custo = Object.entries(r.costs ?? {}).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k === 'flow' || k === 'percentual_flow' ? 'Fluxo' : k}`).join(', ');
  return (
    <Cartao cor="#4ade80" Icon={HeartHandshake} titulo="Em aliados">
      <div className="text-sm">
        <span className="font-semibold text-e-text">{r.playerName}</span>
        <span className="text-e-sub"> usa {r.skillName}</span>
      </div>
      <div className="flex flex-col gap-1">
        {r.alvos.map((a) => {
          const vida = Math.min(a.hpMax, a.hp + r.cura);
          const esc = Math.min(Math.floor(a.hpMax * 0.25), a.escudo + r.escudo);
          return (
            <span key={a.id} className="text-[12px] text-e-sub">
              <b className="text-e-text">{a.nome}</b>
              {r.cura > 0 && <> · PV {a.hp} → <b className="text-emerald-300">{vida}</b></>}
              {r.escudo > 0 && <> · Escudo {a.escudo} → <b className="text-sky-300">{esc}</b></>}
            </span>
          );
        })}
      </div>
      {r.efeitos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {r.efeitos.map((ef, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
              {ef.name} <span className="opacity-60">{ef.durationTurns === -1 ? '∞' : `${ef.durationTurns}t`}</span>
            </span>
          ))}
        </div>
      )}
      {custo && <span className="text-[11px] text-e-faint">Custo: {custo}</span>}
      <Botoes onSim={() => pedidos.aprovarAliados(r)} onNao={() => pedidos.rejeitarAliados(r)} />
    </Cartao>
  );
}

function PedidoSobrecarga({ r }: { r: SobrecargaRequest }) {
  const [rolagem, setRolagem] = useState('');
  const nivel = SOBRECARGA_NIVEIS.find((n) => n.nivel === r.nivel)!;
  const d20 = parseInt(rolagem, 10);
  const total = !isNaN(d20) ? d20 + r.sabMod : null;
  const passa = total != null && total >= r.cd;
  return (
    <Cartao cor="#f97316" Icon={Flame} titulo={`Sobrecarga nível ${r.nivel}`}>
      <div className="text-sm">
        <span className="font-semibold text-e-text">{r.playerName}</span>
        <span className="text-e-sub"> · +{nivel.bonus} atributos, {nivel.custoTurno} ES/turno</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-e-faint">1d20</span>
        <input value={rolagem} inputMode="numeric" placeholder="d20"
          onChange={(e) => setRolagem(e.target.value.replace(/\D/g, '').slice(0, 2))}
          className="w-14 h-8 text-center text-sm font-bold rounded-lg bg-black/30 border border-white/10 text-e-text outline-none focus:border-orange-500/60" />
        <span className="text-xs text-e-faint">{r.sabMod >= 0 ? '+' : '−'} {Math.abs(r.sabMod)} SAB</span>
        {total != null && (
          <span className={`ml-auto text-sm font-black tabular-nums ${passa ? 'text-emerald-400' : 'text-red-400'}`}>{total} vs CD {r.cd}</span>
        )}
      </div>
      {total != null && !passa && <span className="text-[11px] text-red-300 -mt-1">Falha: {nivel.danoDado} de dano no jogador.</span>}
      <Botoes simTxt="Ativar" naoTxt="Falhou"
        simOff={total == null || !passa} naoOff={total == null || passa}
        onSim={() => pedidos.aprovarSobrecarga(r.playerId)} onNao={() => pedidos.rejeitarSobrecarga(r.playerId, d20, nivel.danoDado)} />
    </Cartao>
  );
}

/** Tudo que espera uma decisão do mestre, numa faixa só. */
export default function Pendencias() {
  const { damageRequests, effectRequests, sobrecargaRequests, allyRequests } = useStore();
  const acoes = useCombateStore((s) => s.acoes);
  const { vezId } = useCombatentes();
  // Ações de inimigo: a da vez aparece no painel central; aqui ficam as demais em aberto
  const outrasAcoes = Object.values(acoes).filter((a) => a.entityId !== vezId && (a.status === 'PROPOSTA' || a.status === 'AGUARDANDO_JOGADOR'));
  const total = damageRequests.length + effectRequests.length + allyRequests.length + sobrecargaRequests.length + outrasAcoes.length;
  if (total === 0) return null;

  return (
    <Secao titulo="Esperando você" contagem={total}>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {damageRequests.map((r) => <PedidoDano key={r.requestId} r={r} />)}
        {sobrecargaRequests.map((r) => <PedidoSobrecarga key={r.playerId} r={r} />)}
        {effectRequests.map((r) => <PedidoEfeito key={r.requestId} r={r} />)}
        {allyRequests.map((r) => <PedidoAliados key={r.requestId} r={r} />)}
        {outrasAcoes.map((a) => (
          a.entityKind === 'ally' ? (
            <div key={a.id} className="w-[340px] shrink-0 rounded-2xl border border-emerald-500/30 bg-[#18181b] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-500/20 bg-emerald-500/[0.05]">
                <Bot size={13} className="text-emerald-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">Turno de aliado</span>
              </div>
              <AcaoCard key={`${a.id}:${a.alvoId}:${a.ataqueIdx}`} acao={a} />
            </div>
          ) :
          <div key={a.id} className="w-[340px] shrink-0 rounded-2xl border border-red-500/30 bg-[#18181b] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-500/20 bg-red-500/[0.05]">
              <Bot size={13} className="text-red-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-red-300">Turno de inimigo</span>
            </div>
            <AcaoCard key={`${a.id}:${a.alvoId}:${a.ataqueIdx}`} acao={a} />
          </div>
        ))}
      </div>
    </Secao>
  );
}
