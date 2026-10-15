'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Swords, Skull, Crown, Shield, Sparkles, X, ChevronsRight, Trash2, StickyNote, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { getStatusIcon } from '@/lib/statusIcons';
import type { BossInstance, CombatAlly, EnemyInstance, Player, StatusEffect } from '@/store/types';
import { proporTurno } from '@/components/sections/Mesa/EnemyTurnPanel';
import EnemyAttackModal from '@/components/sections/Mesa/EnemyAttackModal';
import CombatEntityPanel from '@/components/sections/Mesa/CombatEntityPanel';
import DefeatModal from '@/components/sections/Mesa/DefeatModal';
import BossDefeatModal from '@/components/sections/Mesa/BossDefeatModal';
import { Avatar, Barra, Pilula, Secao, Acao, corVida } from './ui';
import AjusteRapido from './AjusteRapido';
import { COR_TIPO, useCombatentes } from './combatentes';

type Entidade =
  | { kind: 'enemy'; data: EnemyInstance }
  | { kind: 'boss'; data: BossInstance }
  | { kind: 'ally'; data: CombatAlly };

function rota(e: Entidade): string {
  return e.kind === 'enemy' ? `/combat/enemies/${e.data.instanceId}`
    : e.kind === 'boss' ? `/combat/bosses/${e.data.instanceId}` : `/combat/allies/${e.data.id}`;
}

function idDe(e: Entidade): string {
  return e.kind === 'ally' ? e.data.id : e.data.instanceId;
}

function Efeitos({ lista }: { lista: StatusEffect[] }) {
  if (lista.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {lista.map((ef) => {
        const I = getStatusIcon(ef.icon);
        const cor = ef.color || '#a1a1aa';
        return (
          <span key={ef.id} title={ef.desc} className="inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-semibold"
            style={{ color: cor, background: cor + '18' }}>
            {I ? <I size={10} /> : <Sparkles size={10} />} {ef.name}{ef.durationTurns !== -1 ? ` ${ef.durationTurns}t` : ''}
          </span>
        );
      })}
    </div>
  );
}

/** Modal com ataques, efeitos e anotações de um combatente. */
function DetalhesEntidade({ e, players, onClose }: { e: Entidade; players: Player[]; onClose: () => void }) {
  const [notas, setNotas] = useState(e.data.notes ?? '');
  const tema = e.kind === 'enemy' ? 'enemy' : e.kind === 'boss' ? 'boss' : 'ally';
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(ev) => { if (ev.target === ev.currentTarget) onClose(); }}>
      <div className="w-[460px] max-w-[95vw] max-h-[88vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#18181b] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-e-text">{e.data.name}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-e-faint hover:text-e-text hover:bg-white/5 cursor-pointer"><X size={15} /></button>
        </div>
        <CombatEntityPanel entity={e} players={players} theme={tema} defaultExpanded />
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Anotações (só você vê)</span>
          <textarea value={notas} rows={3} onChange={(ev) => setNotas(ev.target.value)}
            onBlur={() => api.put(`${rota(e)}/notes`, { notes: notas }).catch(() => {})}
            className="text-sm rounded-xl px-3 py-2 bg-black/30 border border-white/10 text-e-text outline-none focus:border-white/25 resize-none" />
        </label>
      </div>
    </div>
  );
}

/** Card de um combatente no campo (inimigo, boss ou aliado). */
function CartaoCombatente({ e, players, vez }: { e: Entidade; players: Player[]; vez: boolean }) {
  const [modal, setModal] = useState<'atacar' | 'detalhes' | 'derrotar' | null>(null);
  const d = e.data;
  const tipo = e.kind === 'enemy' ? 'inimigo' : e.kind === 'boss' ? 'boss' : 'aliado';
  const cor = COR_TIPO[tipo];
  const fase = e.kind === 'boss' ? e.data.phases[e.data.currentPhase] : undefined;
  const hpMax = e.kind === 'boss' ? fase?.hpMax ?? e.data.hpCurrent : (d as EnemyInstance | CombatAlly).hpMax;
  const hp = d.hpCurrent;
  const pct = hpMax > 0 ? hp / hpMax : 0;
  const caido = hp <= 0;
  const attrs = e.kind === 'boss' ? fase?.attributes : e.data.attributes;
  const ataques = e.kind === 'boss' ? fase?.attacks ?? [] : e.data.attacks ?? [];
  const def = e.kind === 'enemy' ? e.data.defesa ?? attrs?.defense : e.kind === 'boss' ? fase?.defesa ?? attrs?.defense : attrs?.defense;
  const esMax = e.kind === 'enemy' ? e.data.esMax ?? 0 : e.kind === 'boss' ? fase?.esMax ?? 0 : 0;
  const es = e.kind === 'enemy' ? e.data.esCurrent ?? esMax : e.kind === 'boss' ? e.data.esCurrent ?? esMax : 0;
  const src = e.kind === 'ally' ? e.data.portraitUrl : e.data.imageUrl;
  const emoji = e.kind === 'ally' ? undefined : e.data.icon;
  const subtitulo = e.kind === 'boss'
    ? `Fase ${e.data.currentPhase + 1}/${e.data.phases.length}${fase?.name ? ` · ${fase.name}` : ''}`
    : e.kind === 'enemy' ? e.data.type : e.data.type;

  const ajustar = (delta: number) => api.put(`${rota(e)}/hp`, { delta }).catch(() => {});

  return (
    <div className={`relative rounded-2xl border bg-[#18181b] flex flex-col transition-shadow ${caido ? 'opacity-70' : ''}`}
      style={{ borderColor: vez ? cor : cor + '30', boxShadow: vez ? `0 0 0 1px ${cor}, 0 0 24px ${cor}25` : undefined }}>
      {vez && (
        <span className="absolute -top-2.5 left-4 text-[9px] font-black uppercase tracking-[0.16em] px-2 py-0.5 rounded-full text-black" style={{ background: cor }}>
          na vez
        </span>
      )}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Avatar src={src} emoji={emoji} nome={d.name} pct={pct} pctEs={esMax > 0 ? es / esMax : null} size={58} apagado={caido} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {e.kind === 'boss' && <Crown size={13} className="text-e-gold shrink-0" />}
              {e.kind === 'ally' && <Shield size={13} className="text-emerald-400 shrink-0" />}
              <h3 className="font-bold text-e-text truncate">{d.name}</h3>
            </div>
            <p className="text-xs text-e-faint truncate">{subtitulo}</p>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {def != null && <Pilula title="Defesa">DEF {def}</Pilula>}
              {esMax > 0 && <Pilula cor="#4a9fe0" title="Essência disponível para ataques">ES {es}/{esMax}</Pilula>}
              {'negaCritico' in d && d.negaCritico && <Pilula cor="#d4a84e" title="Nega um crítico por rodada">anti-crítico</Pilula>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Vida</span>
            <span className="text-xs tabular-nums"><b style={{ color: corVida(pct) }}>{hp}</b><span className="text-e-faint"> / {hpMax}</span></span>
          </div>
          <Barra atual={hp} max={hpMax} cor={corVida(pct)} altura={7} />
        </div>

        <AjusteRapido compacto onAplicar={ajustar} />
        <Efeitos lista={d.statusEffects ?? []} />
      </div>

      <div className="mt-auto flex items-center gap-1.5 px-4 py-3 border-t border-white/[0.06]">
        {e.kind === 'ally' && ataques.length > 0 && !caido && (
          <Acao tom="sucesso" title="O app calcula alvo, ataque, acerto e dano contra os inimigos" onClick={() => proporTurno(idDe(e), 'ally').catch(() => {})}>
            <Bot size={13} /> Auto
          </Acao>
        )}
        {e.kind !== 'ally' && ataques.length > 0 && !caido && (
          <>
            <Acao tom="perigo" title="O app calcula alvo, ataque, acerto e dano" onClick={() => proporTurno(idDe(e), e.kind as 'enemy' | 'boss').catch(() => {})}>
              <Bot size={13} /> Auto
            </Acao>
            <Acao title="Rolar o ataque você mesmo" onClick={() => setModal('atacar')}><Swords size={13} /> Atacar</Acao>
          </>
        )}
        <Acao title="Ataques, efeitos e anotações" onClick={() => setModal('detalhes')}><StickyNote size={13} /></Acao>
        {e.kind === 'boss' && e.data.currentPhase < e.data.phases.length - 1 && (
          <Acao tom="ouro" title="Avançar para a próxima fase" onClick={() => api.post(`${rota(e)}/next-phase`).catch(() => {})}><ChevronsRight size={13} /></Acao>
        )}
        <div className="ml-auto">
          {e.kind === 'ally' ? (
            <Acao title="Remover aliado" onClick={() => { if (confirm(`Remover ${d.name}?`)) api.delete(rota(e)).catch(() => {}); }}><Trash2 size={13} /></Acao>
          ) : (
            <Acao tom={caido ? 'destaque' : 'neutro'} title="Derrotar: distribui XP e drops" onClick={() => setModal('derrotar')}>
              <Skull size={13} />{caido && ' Derrotar'}
            </Acao>
          )}
        </div>
      </div>

      {/* Modais fora do card: o card de quem caiu fica esmaecido e não pode deixar o modal transparente */}
      {modal && typeof document !== 'undefined' && createPortal(<>
      {modal === 'atacar' && attrs && e.kind !== 'ally' && (
        <EnemyAttackModal entityId={idDe(e)} entityKind={e.kind} entityName={d.name} attacks={ataques}
          entityAttributes={{ strength: attrs.strength, agility: attrs.agility, intelligence: attrs.intelligence }}
          players={players} theme={{ accent: cor, accentBg: '#2a1818', border: cor + '55' }} onClose={() => setModal(null)} />
      )}
      {modal === 'detalhes' && <DetalhesEntidade e={e} players={players} onClose={() => setModal(null)} />}
      {modal === 'derrotar' && e.kind === 'enemy' && <DefeatModal enemy={e.data} players={players} onClose={() => setModal(null)} />}
      {modal === 'derrotar' && e.kind === 'boss' && <BossDefeatModal boss={e.data} players={players} onClose={() => setModal(null)} />}
      </>, document.body)}
    </div>
  );
}

/** Todos os oponentes e aliados em campo, em grade. */
export default function CampoBatalha({ onAdicionar }: { onAdicionar: (t: 'inimigo' | 'boss' | 'aliado') => void }) {
  const { enemies, bosses, allies, vezId } = useCombatentes();
  const players = useStore((s) => s.players);
  const oponentes: Entidade[] = [
    ...bosses.map((b) => ({ kind: 'boss' as const, data: b })),
    ...enemies.map((e) => ({ kind: 'enemy' as const, data: e })),
  ];
  const vivos = oponentes.filter((o) => o.data.hpCurrent > 0).length;

  return (
    <div className="flex flex-col gap-8">
      <Secao titulo="Oponentes" contagem={oponentes.length ? `${vivos} de pé · ${oponentes.length} no campo` : undefined}
        acao={<>
          <Acao tom="perigo" onClick={() => onAdicionar('inimigo')}><Plus size={13} /> Inimigo</Acao>
          <Acao tom="ouro" onClick={() => onAdicionar('boss')}><Crown size={13} /> Boss</Acao>
        </>}>
        {oponentes.length === 0 ? (
          <button type="button" onClick={() => onAdicionar('inimigo')}
            className="rounded-2xl border border-dashed border-white/15 py-10 text-sm text-e-faint hover:text-e-sub hover:border-white/25 cursor-pointer transition-colors">
            Nenhum oponente no campo. Clique para adicionar.
          </button>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {oponentes.map((o) => <CartaoCombatente key={idDe(o)} e={o} players={players} vez={vezId === idDe(o)} />)}
          </div>
        )}
      </Secao>

      {(allies.length > 0) && (
        <Secao titulo="Aliados" contagem={allies.length}
          acao={<Acao tom="sucesso" onClick={() => onAdicionar('aliado')}><Plus size={13} /> Aliado</Acao>}>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {allies.map((a) => <CartaoCombatente key={a.id} e={{ kind: 'ally', data: a }} players={players} vez={vezId === a.id} />)}
          </div>
        </Secao>
      )}
    </div>
  );
}
