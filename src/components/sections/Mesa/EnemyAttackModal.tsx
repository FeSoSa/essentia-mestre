'use client';

import { useState, useEffect } from 'react';
import { X, Swords, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import type { EnemyAttack, Player } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import type { EffectPreset } from '@/store/effectPresetsStore';
import { getStatusIcon } from '@/lib/statusIcons';

interface Props {
  entityId: string;
  entityKind: 'enemy' | 'boss' | 'ally';
  entityName: string;
  attacks: EnemyAttack[];
  entityAttributes: { strength: number; agility: number; intelligence: number };
  players: Player[];
  theme: { accent: string; accentBg: string; border: string };
  onClose: () => void;
}

type Step = 'attack' | 'hit' | 'damage' | 'effects' | 'result';

function getModifier(value: number): number {
  if (value <= 7)  return -1;
  if (value <= 11) return 0;
  if (value <= 15) return 1;
  if (value <= 19) return 2;
  if (value <= 23) return 3;
  if (value <= 27) return 4;
  if (value <= 31) return 5;
  if (value <= 35) return 6;
  if (value <= 40) return 7;
  if (value <= 46) return 8;
  if (value <= 53) return 9;
  if (value <= 61) return 10;
  return 11;
}

function calcDamage(atk: EnemyAttack, d20: number, entityAttributes: { strength: number; agility: number; intelligence: number }, isCrit: boolean): number {
  const ATTR_MAP: Record<string, number> = {
    FOR: entityAttributes.strength,
    AGI: entityAttributes.agility,
    INT: entityAttributes.intelligence,
  };

  // Campos estruturados têm prioridade; se ausentes, lê a string damage
  let base: number;
  let attrVal: number;
  let eq: number;

  if (atk.damageBase != null && atk.damageAttribute && atk.equilibrio != null) {
    base    = atk.damageBase;
    attrVal = ATTR_MAP[atk.damageAttribute] ?? entityAttributes.strength;
    eq      = atk.equilibrio;
  } else {
    // Parse da string "16 + d20×FOR/4" ou "d20xFOR/4"
    const s = (atk.damage ?? '').replace(/×/g, 'x');
    const m = s.match(/(?:(\d+)\s*\+\s*)?d20x([A-Z]+)\/(\d+)/i);
    if (!m) return 0;
    base    = m[1] ? parseInt(m[1], 10) : 0;
    attrVal = ATTR_MAP[m[2].toUpperCase()] ?? entityAttributes.strength;
    eq      = parseInt(m[3], 10);
  }

  const mod   = getModifier(attrVal);
  const total = base + Math.floor((d20 * mod) / eq);
  return isCrit ? total * 2 : Math.max(0, total);
}

export default function EnemyAttackModal({ entityId, entityKind, entityName, attacks, entityAttributes, players, theme: t, onClose }: Props) {
  const [step, setStep] = useState<Step>('attack');
  const [selectedAttack, setSelectedAttack] = useState<EnemyAttack | null>(null);
  const [targetId, setTargetId] = useState(players[0]?.id ?? '');
  const [hitInput, setHitInput] = useState('');
  const [dmgInput, setDmgInput] = useState('');
  const [isCrit, setIsCrit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ damage: number; targetName: string } | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [appliedEffects, setAppliedEffects] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
  }, []);

  const targetPlayer = players.find((p) => p.id === targetId);
  const defVal = targetPlayer ? targetPlayer.attributes.defense : 10;

  const hitValue = parseInt(hitInput, 10);
  const validHit = !isNaN(hitValue) && hitValue >= 1;
  const hitHit = validHit && hitValue >= defVal;

  const dmgValue = parseInt(dmgInput, 10);
  const validDmg = !isNaN(dmgValue) && dmgValue >= 1;

  const isSkillAttack = !!selectedAttack?.skillId;
  // Ataque básico: d20 de dano separado do d20 de acerto
  const computedDamage = selectedAttack && validDmg && !isSkillAttack
    ? calcDamage(selectedAttack, dmgValue, entityAttributes, isCrit)
    : null;

  const linkedSkill = selectedAttack?.skillId ? skills.find((s) => s.id === selectedAttack.skillId) : undefined;
  const hitEffects: EffectPreset[] = linkedSkill?.onHitEffects ?? [];

  function reset() {
    setStep('attack');
    setSelectedAttack(null);
    setHitInput('');
    setDmgInput('');
    setIsCrit(false);
    setResult(null);
    setAppliedEffects(new Set());
  }

  async function applyHitEffect(effect: EffectPreset, index: number) {
    if (!targetId) return;
    try {
      await api.post(`/master/status-effect`, {
        playerId: targetId,
        effect: {
          id: crypto.randomUUID(), name: effect.name, icon: effect.icon, desc: effect.desc ?? '',
          durationTurns: effect.durationTurns, effects: effect.effects,
          hitBonus: effect.hitBonus, attackBonus: effect.attackBonus,
        },
      });
      setAppliedEffects((prev) => new Set([...prev, index]));
    } catch {}
  }

  async function sendAttack(damage: number) {
    if (!targetId) return;
    setLoading(true);
    try {
      await api.post('/master/enemy-attack', {
        targetPlayerId: targetId,
        damage,
      });
      setResult({ damage, targetName: targetPlayer?.char.name ?? 'Alvo' });
      setStep(hitEffects.length > 0 ? 'effects' : 'result');
    } catch {}
    finally { setLoading(false); }
  }

  const inp = 'w-full text-sm rounded-lg px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none text-center font-mono text-2xl';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]"
        style={{ borderColor: t.border }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 rounded-t-2xl"
          style={{ background: t.accentBg, borderBottom: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2">
            <Swords size={14} style={{ color: t.accent }} />
            <span className="font-semibold text-sm text-e-text">{entityName}</span>
            <span className="text-xs text-e-faint">— Atacar</span>
          </div>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">

          {/* Passo 1: Selecionar ataque + alvo */}
          {step === 'attack' && (
            <>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-2">Ataque</p>
                <div className="flex flex-col gap-1.5">
                  {attacks.map((atk, i) => (
                    <button key={i} onClick={() => setSelectedAttack(atk)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer"
                      style={selectedAttack === atk
                        ? { borderColor: t.accent, background: t.accentBg, color: '#fff' }
                        : { borderColor: '#333', background: 'transparent', color: '#888' }}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{atk.name || `Ataque ${i + 1}`}</span>
                        {atk.skillName && <span className="text-[10px] opacity-60">⚡ {atk.skillName}</span>}
                      </div>
                      <span className="font-mono text-xs opacity-70">{atk.damage}</span>
                    </button>
                  ))}
                  {attacks.length === 0 && <p className="text-xs text-e-faint italic">Nenhum ataque cadastrado.</p>}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-2">Alvo</p>
                <div className="flex flex-col gap-1">
                  {players.map((p) => (
                    <button key={p.id} onClick={() => setTargetId(p.id)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer"
                      style={targetId === p.id
                        ? { borderColor: t.accent, background: t.accentBg, color: '#fff' }
                        : { borderColor: '#333', background: 'transparent', color: '#888' }}>
                      <span className="font-medium">{p.char.name}</span>
                      <span className="text-xs" style={{ color: '#666' }}>DEF {p.attributes.defense}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-e-border text-e-faint hover:text-e-text transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button onClick={() => setStep('hit')} disabled={!selectedAttack || !targetId}
                  className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                  style={{ background: t.accent, color: '#000' }}>
                  Rolar Acerto →
                </button>
              </div>
            </>
          )}

          {/* Passo 2: Rolagem de acerto */}
          {step === 'hit' && selectedAttack && (
            <>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1">
                  {selectedAttack.name} → {targetPlayer?.char.name}
                </p>
                <p className="text-xs text-e-faint">DEF do alvo: <span className="font-bold text-e-text">{defVal}</span></p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Resultado do d20</label>
                <input type="number" value={hitInput} onChange={(e) => setHitInput(e.target.value)}
                  className={inp} placeholder="—" min={1} max={20} autoFocus />
                {validHit && (
                  <p className={`text-center text-xl font-black mt-1 ${hitHit ? 'text-green-400' : 'text-red-400'}`}>
                    {hitHit ? 'ACERTOU' : 'ERROU'}
                    {hitValue === 20 && <span className="ml-2 text-yellow-400 text-base"> ✦ CRÍTICO</span>}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={reset} className="px-4 py-2 text-xs rounded-lg border border-e-border text-e-faint hover:text-e-text transition-colors cursor-pointer">
                  Voltar
                </button>
                <button onClick={onClose} disabled={!validHit || hitHit}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-red-700 text-red-400 hover:bg-red-900/30 disabled:opacity-30 transition-colors cursor-pointer">
                  Errou
                </button>
                <button onClick={() => { setIsCrit(hitValue === 20); setStep('damage'); }}
                  disabled={!validHit || !hitHit}
                  className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                  style={{ background: t.accent, color: '#000' }}>
                  Acertou → Dano
                </button>
              </div>
            </>
          )}

          {/* Passo 3: Dano */}
          {step === 'damage' && selectedAttack && (
            <>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1">
                  Dano — {selectedAttack.name}
                </p>
                {selectedAttack.damage && (
                  <p className="text-sm font-mono text-e-faint">⚔ {selectedAttack.damage}</p>
                )}
                {isCrit && <p className="text-yellow-400 text-xs font-bold mt-1">✦ Crítico</p>}
              </div>

              {isSkillAttack ? (
                /* Habilidade: mestre insere o total manualmente */
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Total de dano</label>
                  <input type="number" value={dmgInput} onChange={(e) => setDmgInput(e.target.value)}
                    className={inp} placeholder="—" min={0} autoFocus />
                </div>
              ) : (
                /* Ataque básico: d20 de dano separado, calcula a fórmula */
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Resultado do d20 de dano</label>
                    <input type="number" value={dmgInput} onChange={(e) => setDmgInput(e.target.value)}
                      className={inp} placeholder="—" min={1} max={20} autoFocus />
                  </div>
                  {computedDamage !== null && (
                    <div className="rounded-lg p-3 text-center" style={{ background: t.accentBg, border: `1px solid ${t.border}` }}>
                      <p className="text-[10px] text-e-faint uppercase tracking-widest mb-1">Dano calculado</p>
                      <p className="text-4xl font-black" style={{ color: t.accent }}>{computedDamage}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => { setStep('hit'); setDmgInput(''); }} className="px-4 py-2 text-xs rounded-lg border border-e-border text-e-faint hover:text-e-text transition-colors cursor-pointer">
                  Voltar
                </button>
                <button
                  onClick={() => sendAttack(isSkillAttack ? dmgValue : (computedDamage ?? 0))}
                  disabled={loading || (isSkillAttack && !validDmg)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                  style={{ background: t.accent, color: '#000' }}>
                  {loading ? 'Aplicando…' : 'Aplicar Dano →'}
                </button>
              </div>
            </>
          )}

          {/* Passo 4: Efeitos da habilidade */}
          {step === 'effects' && result && (
            <>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1 flex items-center justify-center gap-1.5">
                  <Sparkles size={12} style={{ color: t.accent }} />
                  {selectedAttack?.skillName} → {result.targetName}
                </p>
                <p className="text-xs text-e-faint">Aplicar os efeitos desta habilidade no alvo?</p>
              </div>

              <div className="flex flex-col gap-1.5">
                {hitEffects.map((eff, i) => {
                  const applied = appliedEffects.has(i);
                  const EffIcon = getStatusIcon(eff.icon);
                  return (
                    <div key={eff.id} className="flex items-center gap-2 rounded-lg border px-3 py-2"
                      style={{ borderColor: t.border, background: applied ? t.accentBg : 'transparent' }}>
                      {EffIcon && <EffIcon size={14} className="shrink-0" style={{ color: t.accent }} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-e-text">{eff.name}</p>
                        <p className="text-[10px] text-e-faint">
                          {eff.durationTurns === -1 ? '∞' : `${eff.durationTurns}t`}
                        </p>
                      </div>
                      <button
                        onClick={() => applyHitEffect(eff, i)}
                        disabled={applied}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                        style={applied
                          ? { background: 'transparent', color: t.accent, border: `1px solid ${t.border}` }
                          : { background: t.accent, color: '#000' }}>
                        {applied ? 'Aplicado ✓' : 'Aplicar'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setStep('result')} className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  style={{ background: t.accent, color: '#000' }}>
                  Continuar →
                </button>
              </div>
            </>
          )}

          {/* Resultado */}
          {step === 'result' && result && (
            <>
              <div className="text-center py-4 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Dano aplicado</p>
                <p className="text-5xl font-black text-red-400">{result.damage}</p>
                <p className="text-sm text-e-faint">
                  → <span className="text-e-text font-semibold">{result.targetName}</span>
                </p>
              </div>
              <button onClick={onClose} className="w-full py-2 text-xs font-semibold rounded-lg cursor-pointer"
                style={{ background: t.accent, color: '#000' }}>
                Fechar
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
