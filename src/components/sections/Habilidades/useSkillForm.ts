'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { Skill, Essencia } from './SkillCard';
import { useEffectPresetsStore, type EffectPreset } from '@/store/effectPresetsStore';

type CostEntry = { type: string; value: string; percentual: string };
type AttrReq   = [string, string];
type AttrEntry = [string, string];

export function useSkillForm(skill: Skill | undefined, essencias: Essencia[]) {
  const editing = !!skill;

  const [name,        setName]        = useState(skill?.name ?? '');
  const [desc,        setDesc]        = useState(skill?.desc ?? '');
  const [type,        setType]        = useState<'class' | 'weapon' | 'essencia' | 'mestre' | 'inimigo'>((skill?.type as any) ?? 'class');
  const [skillClass,  setSkillClass]  = useState(skill?.skillClass ?? '');
  const [weaponTypes, setWeaponTypes] = useState<string[]>(
    (skill as any)?.weaponTypes ?? (skill?.weaponType ? [skill.weaponType] : ['espadas'])
  );
  const [essenciaId,    setEssenciaId]    = useState(skill?.essenciaId ?? '');
  const [cooldown,      setCooldown]      = useState(String(skill?.cooldownTurns ?? 0));
  const [critThreshold, setCritThreshold] = useState(String((skill as any)?.critThreshold ?? ''));
  const [ultimate,    setUltimate]    = useState(skill?.ultimate ?? false);
  const [passive,     setPassive]     = useState((skill as any)?.passive ?? false);
  const [pressaoDice, setPressaoDice] = useState((skill as any)?.pressaoDice ?? false);
  const [actionType,  setActionType]  = useState<'main' | 'bonus' | 'both'>(
    ((skill as any)?.actionType as 'main' | 'bonus' | 'both') ?? 'main'
  );

  const [hasDamage,     setHasDamage]     = useState(!!skill?.damage || skill?.damageSource === 'weapon');
  const [dmgFixed,      setDmgFixed]      = useState(String(skill?.damage?.baseFixed ?? 0));
  const [dmgEquilibrio, setDmgEquilibrio] = useState(String(skill?.damage?.equilibrio ?? ''));
  const dmgAtributoRaw = skill?.damage?.atributo?.split('/') ?? [];
  const [dmgAttr1, setDmgAttr1] = useState(dmgAtributoRaw[0] ?? '');
  const [dmgAttr2, setDmgAttr2] = useState(dmgAtributoRaw[1] ?? '');

  const [damageSource, setDamageSource] = useState<'formula' | 'weapon'>(skill?.damageSource ?? 'formula');
  const [weaponSlot,   setWeaponSlot]   = useState<'mainHand' | 'offHand'>(skill?.weaponSlot ?? 'mainHand');
  const [weaponDamageModifiers, setWeaponDamageModifiers] = useState<NonNullable<Skill['weaponDamageModifiers']>>(
    skill?.weaponDamageModifiers ?? []
  );

  function addWeaponDamageModifier() {
    setWeaponDamageModifiers((m) => [...m, { type: 'flat', value: 0 }]);
  }
  function removeWeaponDamageModifier(i: number) {
    setWeaponDamageModifiers((m) => m.filter((_, j) => j !== i));
  }
  function updateWeaponDamageModifier(i: number, patch: Partial<NonNullable<Skill['weaponDamageModifiers']>[number]>) {
    setWeaponDamageModifiers((m) => m.map((x, j) => j === i ? { ...x, ...patch } : x));
  }

  const [costs, setCosts] = useState<CostEntry[]>(
    skill?.costs.map((c) => ({
      type: c.type,
      value: String(c.value ?? ''),
      percentual: String(c.percentual ?? ''),
    })) ?? []
  );

  const [reqLevel,        setReqLevel]        = useState(String(skill?.requirements?.level ?? ''));
  const [reqWeapon,       setReqWeapon]       = useState(skill?.requirements?.weaponRequired ?? '');
  const [reqWeaponSearch, setReqWeaponSearch] = useState('');
  const [reqAttrs,        setReqAttrs]        = useState<AttrReq[]>(
    Object.entries(skill?.requirements?.attributes ?? {}).map(([k, v]) => [k, String(v)])
  );

  const parseAttrMap = (m?: Record<string, number> | null): AttrEntry[] =>
    m ? Object.entries(m).map(([k, v]) => [k, String(v)]) : [];

  const [passiveAttrs, setPassiveAttrs] = useState<AttrEntry[]>(parseAttrMap((skill as any)?.passiveAttributes));
  const [buffAttrs,    setBuffAttrs]    = useState<AttrEntry[]>(parseAttrMap((skill as any)?.buffAttributes));
  const [buffDuration, setBuffDuration] = useState(String((skill as any)?.buffDurationTurns ?? 1));
  const [hitBonus,     setHitBonus]     = useState<string>(String((skill as any)?.hitBonus    ?? ''));
  const [attackBonus,  setAttackBonus]  = useState<string>(String((skill as any)?.attackBonus ?? ''));
  const [damageBonus,  setDamageBonus]  = useState<string>(String((skill as any)?.damageBonus ?? ''));

  const [hasMultiTarget,   setHasMultiTarget]   = useState(!!(skill as any)?.multiTarget);
  const [multiMaxTargets,  setMultiMaxTargets]  = useState(String((skill as any)?.multiTarget?.maxTargets ?? 2));
  const [multiDamageMode,  setMultiDamageMode]  = useState<'igual' | 'distribuido' | 'especifico'>((skill as any)?.multiTarget?.damageMode ?? 'igual');
  const [multiSpecificDmg, setMultiSpecificDmg] = useState(String((skill as any)?.multiTarget?.specificDamage ?? ''));

  const presets = useEffectPresetsStore((s) => s.presets);
  const [onHitEffects,       setOnHitEffects]       = useState<EffectPreset[]>((skill as any)?.onHitEffects ?? []);
  const [expandedHitEffect,  setExpandedHitEffect]  = useState<Set<number>>(new Set());
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);

  const [selfEffects,            setSelfEffects]            = useState<EffectPreset[]>((skill as any)?.selfEffects ?? []);
  const [expandedSelfEffect,     setExpandedSelfEffect]     = useState<Set<number>>(new Set());
  const [presetDropdownOpenSelf, setPresetDropdownOpenSelf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Behavior toggles ──────────────────────────────────────────────────────

  function togglePassive() {
    const v = !passive;
    setPassive(v);
    if (v) { setHasDamage(false); setCosts([]); }
  }

  // ── Costs ─────────────────────────────────────────────────────────────────

  function addCost() { setCosts((c) => [...c, { type: 'flow', value: '', percentual: '' }]); }
  function removeCost(i: number) { setCosts((c) => c.filter((_, j) => j !== i)); }
  function updateCost(i: number, field: keyof CostEntry, v: string) {
    setCosts((c) => c.map((x, j) => j === i ? { ...x, [field]: v } : x));
  }

  // ── On-hit effects ────────────────────────────────────────────────────────

  function addPresetAsHitEffect(preset: EffectPreset) {
    const entry: EffectPreset = { ...preset, id: `${preset.id}-${Date.now()}` };
    setOnHitEffects((e) => [...e, entry]);
    setExpandedHitEffect((s) => new Set([...s, onHitEffects.length]));
    setPresetDropdownOpen(false);
  }
  function addCustomHitEffect() {
    const entry: EffectPreset = { id: `custom-${Date.now()}`, name: '', durationTurns: 1, effects: [] };
    setOnHitEffects((e) => [...e, entry]);
    setExpandedHitEffect((s) => new Set([...s, onHitEffects.length]));
  }
  function removeHitEffect(i: number) {
    setOnHitEffects((e) => e.filter((_, j) => j !== i));
    setExpandedHitEffect((s) => { const n = new Set(s); n.delete(i); return n; });
  }
  function updateHitEffect(i: number, patch: Partial<EffectPreset>) {
    setOnHitEffects((e) => e.map((x, j) => j === i ? { ...x, ...patch } : x));
  }
  function toggleHitExpand(i: number) {
    setExpandedHitEffect((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  // ── Self effects (efeitos no usuário) ───────────────────────────────────────

  function addPresetAsSelfEffect(preset: EffectPreset) {
    const entry: EffectPreset = { ...preset, id: `${preset.id}-${Date.now()}` };
    setSelfEffects((e) => [...e, entry]);
    setExpandedSelfEffect((s) => new Set([...s, selfEffects.length]));
    setPresetDropdownOpenSelf(false);
  }
  function addCustomSelfEffect() {
    const entry: EffectPreset = { id: `custom-${Date.now()}`, name: '', durationTurns: 1, effects: [] };
    setSelfEffects((e) => [...e, entry]);
    setExpandedSelfEffect((s) => new Set([...s, selfEffects.length]));
  }
  function removeSelfEffect(i: number) {
    setSelfEffects((e) => e.filter((_, j) => j !== i));
    setExpandedSelfEffect((s) => { const n = new Set(s); n.delete(i); return n; });
  }
  function updateSelfEffect(i: number, patch: Partial<EffectPreset>) {
    setSelfEffects((e) => e.map((x, j) => j === i ? { ...x, ...patch } : x));
  }
  function toggleSelfExpand(i: number) {
    setExpandedSelfEffect((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  // ── Requirement attrs ─────────────────────────────────────────────────────

  function addReqAttr() { setReqAttrs((a) => [...a, ['strength', '10']]); }
  function removeReqAttr(i: number) { setReqAttrs((a) => a.filter((_, j) => j !== i)); }
  function updateReqAttr(i: number, field: 0 | 1, v: string) {
    setReqAttrs((a) => a.map((x, j) => j === i ? (field === 0 ? [v, x[1]] : [x[0], v]) as AttrReq : x));
  }

  // ── Damage formula ────────────────────────────────────────────────────────

  function buildAtributo(): string | undefined {
    const parts = [dmgAttr1, dmgAttr2].filter(Boolean);
    return parts.length > 0 ? parts.join('/') : undefined;
  }

  function buildFormula(): string {
    const parts: string[] = [];
    if (Number(dmgFixed) > 0) parts.push(String(dmgFixed));
    const atrib = buildAtributo();
    if (atrib) {
      const eq = dmgEquilibrio ? `/${dmgEquilibrio}` : '';
      parts.push(`d20×${atrib}${eq}`);
    }
    return parts.join(' + ');
  }

  // ── Essencia options ──────────────────────────────────────────────────────

  const essenciaOpts = essencias.map((e) => ({ value: e.id, label: `${e.name} (${e.type})` }));

  // ── Save ──────────────────────────────────────────────────────────────────

  async function save(onSaved: (s: Skill) => void, onClose: () => void) {
    if (!name.trim()) return;
    setLoading(true);

    const attributes = reqAttrs.length > 0
      ? Object.fromEntries(reqAttrs.map(([a, v]) => [a, Number(v)]))
      : undefined;
    const requirements = (reqLevel || attributes || reqWeapon) ? {
      level:          reqLevel  ? Number(reqLevel) : undefined,
      attributes,
      weaponRequired: reqWeapon || undefined,
    } : undefined;

    const toAttrMap = (entries: AttrEntry[]) => {
      const m: Record<string, number> = {};
      for (const [k, v] of entries) { if (k && v) m[k] = Number(v); }
      return Object.keys(m).length > 0 ? m : undefined;
    };

    const body: Omit<Skill, 'id'> & {
      id?: string; passive?: boolean; pressaoDice?: boolean;
      passiveAttributes?: any; buffAttributes?: any; buffDurationTurns?: number;
      weaponTypes?: string[]; onHitEffects?: EffectPreset[]; selfEffects?: EffectPreset[]; critThreshold?: number;
      damageSource?: 'formula' | 'weapon'; weaponSlot?: 'mainHand' | 'offHand';
      weaponDamageModifiers?: Skill['weaponDamageModifiers'];
    } = {
      ...(editing ? { id: skill!.id } : {}),
      name: name.trim(), desc, type, ultimate, passive, pressaoDice, actionType,
      multiTarget: hasMultiTarget ? {
        maxTargets:     Number(multiMaxTargets) || 2,
        damageMode:     multiDamageMode,
        specificDamage: multiDamageMode === 'especifico' && multiSpecificDmg !== '' ? Number(multiSpecificDmg) : undefined,
      } : undefined,
      skillClass:  type === 'class'    ? skillClass || undefined : undefined,
      weaponType:  type === 'weapon'   ? (weaponTypes[0] ?? undefined) : undefined,
      weaponTypes: type === 'weapon'   ? weaponTypes : undefined,
      essenciaId:  type === 'essencia' ? essenciaId || undefined : undefined,
      passiveAttributes: toAttrMap(passiveAttrs),
      buffAttributes:    toAttrMap(buffAttrs),
      buffDurationTurns: (buffAttrs.length > 0 || hitBonus !== '' || attackBonus !== '' || damageBonus !== '') && buffDuration
        ? Number(buffDuration)
        : undefined,
      hitBonus:    hitBonus    !== '' ? Number(hitBonus)    : undefined,
      attackBonus: attackBonus !== '' ? Number(attackBonus) : undefined,
      damageBonus: damageBonus !== '' ? Number(damageBonus) : undefined,
      cooldownTurns: Number(cooldown) || 0,
      critThreshold: critThreshold !== '' ? Number(critThreshold) : undefined,
      costs: costs.map((c) => ({
        type: c.type,
        value:      c.value      !== '' ? Number(c.value)      : undefined,
        percentual: c.percentual !== '' ? Number(c.percentual) : undefined,
      })),
      damage: hasDamage && damageSource === 'formula' ? {
        formula:    buildFormula(),
        baseFixed:  Number(dmgFixed) || 0,
        atributo:   buildAtributo(),
        equilibrio: dmgEquilibrio !== '' ? Number(dmgEquilibrio) : undefined,
      } : undefined,
      damageSource: hasDamage ? damageSource : undefined,
      weaponSlot: hasDamage && damageSource === 'weapon' ? weaponSlot : undefined,
      weaponDamageModifiers: hasDamage && damageSource === 'weapon' && weaponDamageModifiers.length > 0
        ? weaponDamageModifiers
        : undefined,
      requirements,
      onHitEffects: onHitEffects.length > 0 ? onHitEffects : undefined,
      selfEffects: selfEffects.length > 0 ? selfEffects : undefined,
    };

    try {
      const res = editing
        ? await api.put<Skill>(`/skills/${skill!.id}`, body)
        : await api.post<Skill>('/skills', body);
      onSaved(res.data);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data ?? err?.message ?? 'Erro ao salvar.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setLoading(false);
    }
  }

  return {
    editing,
    // identity
    name, setName, desc, setDesc, type, setType,
    skillClass, setSkillClass, weaponTypes, setWeaponTypes,
    essenciaId, setEssenciaId, essenciaOpts,
    // behavior
    passive, togglePassive, ultimate, setUltimate,
    pressaoDice, setPressaoDice,
    // turn
    actionType, setActionType, cooldown, setCooldown, critThreshold, setCritThreshold,
    // costs
    costs, addCost, removeCost, updateCost,
    // damage
    hasDamage, setHasDamage, dmgFixed, setDmgFixed,
    dmgEquilibrio, setDmgEquilibrio, dmgAttr1, setDmgAttr1, dmgAttr2, setDmgAttr2,
    buildFormula,
    damageSource, setDamageSource, weaponSlot, setWeaponSlot,
    weaponDamageModifiers, addWeaponDamageModifier, removeWeaponDamageModifier, updateWeaponDamageModifier,
    // multi-target
    hasMultiTarget, setHasMultiTarget, multiMaxTargets, setMultiMaxTargets,
    multiDamageMode, setMultiDamageMode, multiSpecificDmg, setMultiSpecificDmg,
    // on-hit effects
    onHitEffects, presets, presetDropdownOpen, setPresetDropdownOpen,
    expandedHitEffect, addPresetAsHitEffect, addCustomHitEffect,
    removeHitEffect, updateHitEffect, toggleHitExpand,
    // self effects (efeitos no usuário)
    selfEffects, presetDropdownOpenSelf, setPresetDropdownOpenSelf,
    expandedSelfEffect, addPresetAsSelfEffect, addCustomSelfEffect,
    removeSelfEffect, updateSelfEffect, toggleSelfExpand,
    // passive / buff effects
    passiveAttrs, setPassiveAttrs, buffAttrs, setBuffAttrs,
    buffDuration, setBuffDuration,
    hitBonus, setHitBonus, attackBonus, setAttackBonus, damageBonus, setDamageBonus,
    // requirements
    reqLevel, setReqLevel, reqWeapon, setReqWeapon,
    reqWeaponSearch, setReqWeaponSearch, reqAttrs,
    addReqAttr, removeReqAttr, updateReqAttr,
    // form
    loading, error, save,
  };
}
