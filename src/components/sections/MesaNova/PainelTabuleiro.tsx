'use client';

import { X, FileText, Footprints, Minus, Plus } from 'lucide-react';
import { useStore } from '@/store';
import { useMesaStore } from '@/store/mesaStore';
import { useTabuleiroStore } from '@/store/tabuleiroStore';
import EmFoco from './EmFoco';
import Pendencias from './Pendencias';
import GrupoBox from './GrupoBox';
import { CartaoCombatente, type Entidade } from './CampoBatalha';
import { Acao, Avatar, Barra, corVida, escudoDe, fracEs } from './ui';
import { useCombatentes, type Combatente } from './combatentes';
import { TAMANHOS, useGrade } from './grade';
import { useMovimento } from './movimento';

function entidadeDe(c: Combatente): Entidade | null {
  if (c.inimigo) return { kind: 'enemy', data: c.inimigo };
  if (c.boss) return { kind: 'boss', data: c.boss };
  if (c.aliado) return { kind: 'ally', data: c.aliado };
  return null;
}

/** Tamanho da peça no tabuleiro; no campo, só oferece o que cabe onde ela está. */
function SeletorTamanho({ c }: { c: Combatente }) {
  const { lista } = useCombatentes();
  const { posicoes, tamanhoDe, cabe } = useGrade(lista);
  const definirTamanho = useTabuleiroStore((s) => s.definirTamanho);
  const atual = tamanhoDe(c.id);
  const casa = posicoes[c.id];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Tamanho</span>
      <div className="h-7 p-0.5 rounded-lg border border-white/10 flex items-center gap-0.5">
        {TAMANHOS.map((n) => {
          const cabeAqui = !casa || n === atual || cabe(c.id, casa, n).ok;
          return (
            <button key={n} type="button" disabled={!cabeAqui} onClick={() => definirTamanho(c.id, n)}
              title={cabeAqui ? `${n}×${n} casas` : 'Não cabe onde a peça está'}
              className={`h-full px-2 rounded-md text-[11px] font-semibold tabular-nums cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
                n === atual ? 'bg-white/10 text-e-text' : 'text-e-faint hover:text-e-sub'}`}>
              {n}×{n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Deslocamento da peça: jogador vem da raça; os demais o mestre ajusta aqui. Com a regra ligada, mostra o gasto do turno. */
function Deslocamento({ c }: { c: Combatente }) {
  const mov = useMovimento();
  const definirDeslocamento = useTabuleiroStore((s) => s.definirDeslocamento);
  const { casas, fonte } = mov.deslocamentoDe(c);
  const gasto = mov.gastoDe(c.id);
  const travado = mov.regraPara(c.id) === 'travado';
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint flex items-center gap-1"><Footprints size={11} /> Deslocamento</span>
      {c.jogador ? (
        <span className="text-xs text-e-sub"><b className="text-e-text tabular-nums">{casas}</b> casas <span className="text-e-faint">· {fonte}</span></span>
      ) : (
        <div className="flex items-center gap-0.5 text-xs text-e-sub" title={fonte}>
          <button type="button" title="Menos" onClick={() => definirDeslocamento(c.id, Math.max(0, casas - 1))} className="p-1 rounded hover:bg-white/5 cursor-pointer"><Minus size={11} /></button>
          <b className="text-e-text tabular-nums w-5 text-center">{casas}</b>
          <button type="button" title="Mais" onClick={() => definirDeslocamento(c.id, Math.min(30, casas + 1))} className="p-1 rounded hover:bg-white/5 cursor-pointer"><Plus size={11} /></button>
          <span className="ml-1">casas</span>
        </div>
      )}
      {mov.ativo && (
        <span className="ml-auto text-[11px] tabular-nums">
          {travado ? <span className="text-e-faint">espera a vez (Alt move livre)</span>
            : gasto ? <span className={gasto.usado >= gasto.maximo ? 'text-amber-300' : 'text-sky-300'}>andou {gasto.usado} de {gasto.maximo}</span>
            : <span className="text-e-faint">na reserva</span>}
        </span>
      )}
    </div>
  );
}

/** Resumo do jogador selecionado; a ficha completa abre na gaveta. */
function ResumoJogador({ c }: { c: Combatente }) {
  const selecionar = useMesaStore((s) => s.selecionar);
  const pct = c.hpMax > 0 ? c.hp / c.hpMax : 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#18181b] p-4 flex items-center gap-3">
      <Avatar src={c.src} nome={c.nome} pct={pct} pctEs={fracEs(c.es, c.esMax)} escudo={escudoDe(c.jogador)} size={52} apagado={c.hp <= 0} />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className="font-bold text-e-text truncate">{c.nome}</span>
        <div className="flex items-center gap-2">
          <div className="flex-1"><Barra atual={c.hp} max={c.hpMax} cor={corVida(pct)} altura={6} /></div>
          <span className="text-xs tabular-nums"><b style={{ color: corVida(pct) }}>{c.hp}</b><span className="text-e-faint">/{c.hpMax}</span></span>
        </div>
      </div>
      <Acao title="Abrir a ficha (ou dê dois cliques na peça)" onClick={() => selecionar(c.id)}><FileText size={13} /> Ficha</Acao>
    </div>
  );
}

/**
 * Coluna ao lado do tabuleiro: quem está na vez, o que espera aprovação,
 * a peça clicada e o Grupo. Rola sozinha, o tabuleiro fica parado.
 */
export default function PainelTabuleiro({ selecionadoId, onFecharSelecionado, onIniciativa, onAdicionar }: {
  selecionadoId: string | null;
  onFecharSelecionado: () => void;
  onIniciativa: () => void;
  onAdicionar: (t: 'inimigo' | 'boss' | 'aliado') => void;
}) {
  const { porId, vezId } = useCombatentes();
  const players = useStore((s) => s.players);
  const sel = selecionadoId ? porId.get(selecionadoId) : undefined;
  // Quem está na vez já aparece inteiro no EmFoco; aqui fica só o tamanho
  const entidade = sel && sel.id !== vezId ? entidadeDe(sel) : null;

  return (
    <aside className="w-[400px] 2xl:w-[460px] shrink-0 h-full overflow-y-auto border-l border-white/[0.07] bg-[#0f0f12] p-4 flex flex-col gap-6 [scrollbar-width:thin]">
      {/* Embrulhados: EmFoco e GrupoBox usam h-full, que aqui esticaria até a altura da coluna */}
      <div className="shrink-0"><EmFoco onIniciativa={onIniciativa} onAdicionar={onAdicionar} /></div>
      <Pendencias vertical />
      {sel && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-e-sub">Selecionado</h2>
            <button type="button" title="Fechar" onClick={onFecharSelecionado}
              className="ml-auto p-1 rounded-lg text-e-faint hover:text-e-text hover:bg-white/5 cursor-pointer"><X size={13} /></button>
          </div>
          <SeletorTamanho c={sel} />
          <Deslocamento c={sel} />
          {sel.tipo === 'jogador' ? <ResumoJogador c={sel} />
            : entidade && <CartaoCombatente key={sel.id} e={entidade} players={players} vez={false} />}
        </section>
      )}
      <div className="shrink-0"><GrupoBox /></div>
    </aside>
  );
}
