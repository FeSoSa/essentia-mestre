'use client';

import { useState } from 'react';
import {
  CircleDollarSign, Flame, Droplets, Leaf, Wind, Zap, Clock,
  Skull, Sparkles, Circle, type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import type { Essencia, Player, PlayerAttributes } from '@/store/types';
import { getStatusIcon } from '@/lib/statusIcons';
import ResourceBar from './ResourceBar';
import DetalhesModal from './DetalhesModal';
import StatusEffectModal from './StatusEffectModal';

const ESSENCIA_BG: Record<string, string> = {
  fogo: '#3a1005', água: '#0a2a40', terra: '#2a1a05',
  ar: '#1a2a1a', tempestade: '#1a1a3a', tempo: '#2a1a40',
  caos: '#3a0a0a', ordem: '#1a1a2a', vazio: '#0a0a0a',
};

const ESSENCIA_ICON: Record<string, LucideIcon> = {
  fogo: Flame, água: Droplets, terra: Leaf, ar: Wind,
  tempestade: Zap, tempo: Clock, caos: Skull, ordem: Sparkles, vazio: Circle,
};

const ATTRS: [string, keyof PlayerAttributes][] = [
  ['FOR', 'strength'], ['AGI', 'agility'],     ['INT', 'intelligence'], ['RES', 'resistance'],
  ['FLX', 'flow'],     ['SAB', 'wisdom'],       ['PRE', 'presence'],     ['DEF', 'defense'],
];

function attrMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export default function PlayerCard({
  player,
  essencias,
}: {
  player: Player;
  essencias: Essencia[];
}) {
  const { setPlayer } = useStore();
  const [modal, setModal] = useState<'detalhes' | 'status' | null>(null);

  const hpPct  = player.hp.max > 0 ? player.hp.current / player.hp.max : 0;
  const hpFill = hpPct > 0.5 ? 'bg-e-success' : hpPct > 0.25 ? 'bg-e-gold' : 'bg-e-hp';
  const hpText = hpPct > 0.5 ? 'text-e-success' : hpPct > 0.25 ? 'text-e-gold' : 'text-e-hp';
  const gold        = player.gold ?? 0;
  const XP_PER_LVL  = 100;
  const xpThreshold = (level: number) => (level - 1) * XP_PER_LVL;
  const xpInLevel   = player.exp.total - xpThreshold(player.char.level);
  const expPct      = Math.min(1, xpInLevel / XP_PER_LVL);

  async function adjust(resource: 'hp' | 'flow', delta: number) {
    try {
      const res = await api.put<Player>(`/players/${player.id}/${resource}`, { delta });
      setPlayer(res.data);
    } catch {
      const u = { ...player };
      if (resource === 'hp')
        u.hp = { ...player.hp, current: Math.max(0, Math.min(player.hp.max, player.hp.current + delta)) };
      else
        u.flow = { ...player.flow, current: Math.max(0, Math.min(player.flow.max, player.flow.current + delta)) };
      setPlayer(u);
    }
  }

  async function setValue(resource: 'hp' | 'flow', newValue: number) {
    const current = resource === 'hp' ? player.hp.current : player.flow.current;
    const delta = newValue - current;
    if (delta !== 0) await adjust(resource, delta);
  }

  const obtidas       = player.essenciasObtidas ?? [];
  const statusEffects = player.statusEffects ?? [];
  const hasRightCol   = obtidas.length > 0 || statusEffects.length > 0;

  return (
    <>
      <div className="bg-e-surface border border-e-border rounded-xl flex flex-col hover:border-e-border2 transition-colors">
        <div className="flex gap-3 p-4">

          {/* ── Left column ── */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">

            {/* Avatar + Name + Level */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-e-card border border-e-border flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-e-gold select-none">
                  {player.char.name[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-e-text truncate">{player.char.name}</p>
                  <span className="text-[10px] font-bold text-e-gold bg-e-gold/10 border border-e-gold/20 px-1.5 py-0.5 rounded-md shrink-0">
                    Nv {player.char.level}
                  </span>
                </div>
                <p className="text-xs text-e-sub mt-0.5 truncate">
                  {player.char.race} · {player.char.skillClass}
                  {player.char.subClass ? ` · ${player.char.subClass}` : ''}
                </p>
              </div>
            </div>

            {/* XP bar */}
            <div>
              <div className="h-1.5 bg-e-border rounded-full overflow-hidden">
                <div className="h-full bg-e-accent rounded-full transition-all duration-500"
                  style={{ width: `${expPct * 100}%` }} />
              </div>
              <p className="text-[10px] text-e-faint mt-0.5 tabular-nums">
                {xpInLevel}/{XP_PER_LVL} XP
              </p>
            </div>

            {/* Gold */}
            <div className="flex items-center gap-1.5">
              <CircleDollarSign size={12} className="text-e-gold shrink-0" />
              <span className="text-xs font-bold text-e-gold tabular-nums">{gold}</span>
              <span className="text-xs text-e-faint">ouro</span>
            </div>

            {/* HP */}
            <ResourceBar label="Vida" current={player.hp.current} max={player.hp.max}
              fillClass={hpFill} trackClass="bg-e-hp-bg" valueClass={hpText}
              onAdd={() => adjust('hp', 1)} onRemove={() => adjust('hp', -1)}
              onSetValue={(v) => setValue('hp', v)} />

            {/* Flow */}
            <ResourceBar label="Fluxo" current={player.flow.current} max={player.flow.max}
              fillClass="bg-e-flow" trackClass="bg-e-flow-bg" valueClass="text-e-flow"
              onAdd={() => adjust('flow', 1)} onRemove={() => adjust('flow', -1)}
              onSetValue={(v) => setValue('flow', v)} />

            {/* Attributes 4×2 */}
            <div className="grid grid-cols-4 gap-x-1 gap-y-2 pt-2 border-t border-e-border">
              {ATTRS.map(([label, key]) => {
                const score = player.attributes[key];
                const mod   = attrMod(score);
                return (
                  <div key={key} className="flex flex-col items-center">
                    <span className="text-[9px] text-e-faint uppercase tracking-wider leading-none mb-0.5">{label}</span>
                    <span className="text-xs font-bold text-e-gold tabular-nums">{score}</span>
                    <span className={`text-[8px] font-bold tabular-nums leading-none mt-0.5 ${mod >= 0 ? 'text-e-accent' : 'text-e-danger'}`}>
                      {mod >= 0 ? '+' : ''}{mod}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right column — essências + status effects ── */}
          {hasRightCol && (
            <div className="w-8 flex flex-col items-center gap-1.5 shrink-0 pt-1">
              {obtidas.map((ob) => {
                const ess     = essencias.find(e => e.id === ob.essenciaId);
                const typeKey = (ess?.type ?? '').toLowerCase();
                const bg      = ESSENCIA_BG[typeKey] ?? '#1a1a1a';
                const EssIcon = ESSENCIA_ICON[typeKey] ?? Sparkles;
                return (
                  <div key={ob.essenciaId} title={ess?.name ?? ob.essenciaId}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-white/5"
                    style={{ backgroundColor: bg }}>
                    <EssIcon size={13} className="text-white/70" />
                  </div>
                );
              })}

              {obtidas.length > 0 && statusEffects.length > 0 && (
                <div className="w-5 h-px bg-e-border my-0.5" />
              )}

              {statusEffects.map((ef) => {
                const IconComp = getStatusIcon(ef.icon);
                return (
                  <button key={ef.id} onClick={() => setModal('status')} title={ef.name}
                    className="relative w-7 h-7 rounded-full bg-e-card border border-e-border flex items-center justify-center hover:border-e-border2 transition-colors cursor-pointer shrink-0">
                    {IconComp
                      ? <IconComp size={13} className="text-e-sub" />
                      : <span className="text-[10px]">{ef.icon}</span>}
                    {ef.durationTurns !== -1 && (
                      <span className="absolute -bottom-1 -right-0.5 text-[8px] font-black text-e-text bg-e-surface rounded-full px-0.5 leading-none min-w-[12px] text-center border border-e-border">
                        {ef.durationTurns}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 pb-4">
          <button onClick={() => setModal('detalhes')}
            className="w-full py-2 rounded-xl bg-e-card border border-e-border text-sm text-e-sub font-medium hover:bg-e-border hover:text-e-text transition-colors cursor-pointer">
            Detalhes
          </button>
        </div>
      </div>

      {modal === 'detalhes' && <DetalhesModal player={player} onClose={() => setModal(null)} />}
      {modal === 'status'   && <StatusEffectModal player={player} onClose={() => setModal(null)} />}
    </>
  );
}
