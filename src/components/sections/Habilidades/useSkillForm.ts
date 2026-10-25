'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { Skill, Essencia } from './SkillCard';
import type { Efeito } from '@/store/types';
import { useEffectPresetsStore } from '@/store/effectPresetsStore';
import { useCombateStore, regraTier, tabelaTiers, fmtEquilibrio } from '@/store/combateStore';

type CostEntry = { type: string; value: string; percentual: string };
type AttrReq   = [string, string];

/** Skills de jogador têm tier; inimigo e mestre ficam fora e mantêm equilíbrio próprio. */
export const TIPOS_COM_TIER = ['class', 'weapon', 'essencia'];

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
  // Skill de arma: categoria da maestria (vazio = primeira categoria selecionada)
  const [grupoMaestria, setGrupoMaestria] = useState<string>(skill?.grupoMaestria ?? '');
  const [cooldown,      setCooldown]      = useState(String(skill?.cooldownTurns ?? 0));
  const [critThreshold, setCritThreshold] = useState(String((skill as any)?.critThreshold ?? ''));
  // +X no acerto desta skill: o app do jogador soma sozinho
  const [bonusAcerto, setBonusAcerto] = useState(String(skill?.bonusAcerto ?? ''));
  // Skill que não pode ser equipada junto com esta (ex.: evolução que substitui a T1)
  const [exclusivaCom, setExclusivaCom] = useState(skill?.exclusivaCom ?? '');
  // Acerta sempre: o app do jogador pula a rolagem de acerto
  const [ignoraDef, setIgnoraDef] = useState<boolean>(skill?.ignoraDef ?? false);
  // Equipada: quando um inimigo erra este jogador, o mestre pode liberar um contra-ataque
  const [contraAtaque, setContraAtaque] = useState<boolean>(skill?.contraAtaque ?? false);
  const [ultimate,    setUltimate]    = useState(skill?.ultimate ?? false);
  const [passive,     setPassive]     = useState((skill as any)?.passive ?? false);
  const [pressaoDice, setPressaoDice] = useState((skill as any)?.pressaoDice ?? false);
  const [actionType,  setActionType]  = useState<'main' | 'bonus' | 'both'>(
    ((skill as any)?.actionType as 'main' | 'bonus' | 'both') ?? 'main'
  );

  // Tier (1 a 5): define o equilíbrio da fórmula e o custo base de Fluxo
  const combate = useCombateStore((s) => s.cfg);
  const [tier, setTierState] = useState<number>(skill?.tier ?? 1);
  // Tier: arma, Essência e classe com classe definida (Geral, mestre e inimigo têm equilíbrio próprio)
  const temTier = TIPOS_COM_TIER.includes(type) && !(type === 'class' && !skillClass);
  const regra = regraTier(tier, combate);

  const [hasDamage,     setHasDamage]     = useState(!!skill?.damage || skill?.damageSource === 'weapon');
  const [dmgFixed,      setDmgFixed]      = useState(String(skill?.damage?.baseFixed ?? 0));
  // Só para inimigo/mestre; skills com tier usam o equilíbrio do tier
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

  const [efeitos, setEfeitos] = useState<Efeito[]>(skill?.efeitos ?? []);
  const [tiposDano, setTiposDano] = useState<string[]>(skill?.tiposDano ?? []);

  // Em quem a skill é usada; sem valor salvo, deduz do que ela faz (dano = inimigos)
  const [alvo, setAlvoState] = useState<'USUARIO' | 'INIMIGOS' | 'ALIADOS'>(
    skill?.alvo ?? (skill?.damage || skill?.damageSource === 'weapon' ? 'INIMIGOS' : 'USUARIO')
  );
  const [hasMultiTarget,   setHasMultiTarget]   = useState(!!(skill as any)?.multiTarget);
  /** Usada no próprio usuário não tem área nem vários alvos. */
  function setAlvo(a: 'USUARIO' | 'INIMIGOS' | 'ALIADOS') {
    setAlvoState(a);
    if (a === 'USUARIO') setHasMultiTarget(false);
  }
  const [multiMaxTargets,  setMultiMaxTargets]  = useState(String((skill as any)?.multiTarget?.maxTargets ?? 2));
  const [multiDamageMode,  setMultiDamageMode]  = useState<'igual' | 'distribuido' | 'especifico'>((skill as any)?.multiTarget?.damageMode ?? 'igual');
  const [multiSpecificDmg, setMultiSpecificDmg] = useState(String((skill as any)?.multiTarget?.specificDamage ?? ''));

  const presets = useEffectPresetsStore((s) => s.presets);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Behavior toggles ──────────────────────────────────────────────────────

  function togglePassive() {
    const v = !passive;
    setPassive(v);
    if (v) { setHasDamage(false); setCosts([]); }
  }

  // ── Costs ─────────────────────────────────────────────────────────────────

  function addCost() { setCosts((c) => [...c, { type: 'flow', value: temTier ? String(regra.custoBase) : '', percentual: '' }]); }
  function removeCost(i: number) { setCosts((c) => c.filter((_, j) => j !== i)); }
  function updateCost(i: number, field: keyof CostEntry, v: string) {
    setCosts((c) => c.map((x, j) => j === i ? { ...x, [field]: v } : x));
  }

  /** Muda o tier e sugere o custo base: sobe o custo de Fluxo que estiver abaixo do novo base. */
  function setTier(n: number) {
    setTierState(n);
    const base = regraTier(n, combate).custoBase;
    setCosts((c) => c.map((x) => (x.type === 'flow' && (x.value === '' || Number(x.value) < base) ? { ...x, value: String(base) } : x)));
  }

  /** Custo de Fluxo abaixo do base do tier (bloqueia salvar). */
  const custoFluxo = costs.find((c) => c.type === 'flow' && c.value !== '');
  const custoAbaixoDoBase = temTier && !!custoFluxo && Number(custoFluxo.value) < regra.custoBase;

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

  /** Equilíbrio efetivo: do tier (skills de jogador) ou o digitado (inimigo/mestre). */
  const equilibrioEfetivo: number | undefined = temTier
    ? regra.equilibrio
    : dmgEquilibrio !== '' ? Number(dmgEquilibrio) : undefined;

  function buildFormula(): string {
    const parts: string[] = [];
    if (Number(dmgFixed) > 0) parts.push(String(dmgFixed));
    const atrib = buildAtributo();
    if (atrib) {
      const eq = equilibrioEfetivo != null ? `/${fmtEquilibrio(equilibrioEfetivo)}` : '';
      parts.push(`d20×${atrib}${eq}`);
    }
    return parts.join(' + ');
  }

  // ── Essencia options ──────────────────────────────────────────────────────

  const essenciaOpts = essencias.map((e) => ({ value: e.id, label: `${e.name} (${e.type})` }));

  // ── Save ──────────────────────────────────────────────────────────────────

  async function save(onSaved: (s: Skill) => void, onClose: () => void) {
    if (!name.trim()) return;
    if (custoAbaixoDoBase) {
      setError(`Custo de Fluxo abaixo do custo base do Tier ${tier} (${regra.custoBase}).`);
      return;
    }
    setLoading(true);

    const attributes = reqAttrs.length > 0
      ? Object.fromEntries(reqAttrs.map(([a, v]) => [a, Number(v)]))
      : undefined;
    const requirements = (reqLevel || attributes || reqWeapon) ? {
      level:          reqLevel  ? Number(reqLevel) : undefined,
      attributes,
      weaponRequired: reqWeapon || undefined,
    } : undefined;

    const body: Omit<Skill, 'id'> & {
      id?: string; passive?: boolean; pressaoDice?: boolean;
      weaponTypes?: string[]; critThreshold?: number; bonusAcerto?: number; exclusivaCom?: string; ignoraDef?: boolean; contraAtaque?: boolean;
      damageSource?: 'formula' | 'weapon'; weaponSlot?: 'mainHand' | 'offHand';
      weaponDamageModifiers?: Skill['weaponDamageModifiers'];
    } = {
      ...(editing ? { id: skill!.id } : {}),
      name: name.trim(), desc, type, ultimate, passive, pressaoDice, actionType,
      tier: temTier ? tier : null,
      alvo,
      multiTarget: hasMultiTarget && alvo !== 'USUARIO' ? {
        maxTargets:     Number(multiMaxTargets) || 2,
        damageMode:     multiDamageMode,
        specificDamage: multiDamageMode === 'especifico' && multiSpecificDmg !== '' ? Number(multiSpecificDmg) : undefined,
      } : undefined,
      skillClass:  type === 'class'    ? skillClass || undefined : undefined,
      weaponType:  type === 'weapon'   ? (weaponTypes[0] ?? undefined) : undefined,
      weaponTypes: type === 'weapon'   ? weaponTypes : undefined,
      essenciaId:  type === 'essencia' ? essenciaId || undefined : undefined,
      grupoMaestria: type === 'weapon' ? (weaponTypes.includes(grupoMaestria) ? grupoMaestria : weaponTypes[0] ?? null) : null,
      efeitos,
      cooldownTurns: Number(cooldown) || 0,
      critThreshold: critThreshold !== '' ? Number(critThreshold) : undefined,
      bonusAcerto: bonusAcerto !== '' && Number(bonusAcerto) !== 0 ? Number(bonusAcerto) : undefined,
      exclusivaCom: exclusivaCom || undefined,
      ignoraDef: ignoraDef && !passive,
      contraAtaque,
      costs: costs.map((c) => ({
        type: c.type,
        value:      c.value      !== '' ? Number(c.value)      : undefined,
        percentual: c.percentual !== '' ? Number(c.percentual) : undefined,
      })),
      damage: hasDamage && damageSource === 'formula' ? {
        formula:    buildFormula(),
        baseFixed:  Number(dmgFixed) || 0,
        atributo:   buildAtributo(),
        equilibrio: !temTier && dmgEquilibrio !== '' ? Number(dmgEquilibrio) : undefined,
      } : undefined,
      damageSource: hasDamage ? damageSource : undefined,
      weaponSlot: hasDamage && damageSource === 'weapon' ? weaponSlot : undefined,
      weaponDamageModifiers: hasDamage && damageSource === 'weapon' && weaponDamageModifiers.length > 0
        ? weaponDamageModifiers
        : undefined,
      tiposDano: hasDamage ? tiposDano : [],
      requirements,
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
    essenciaId, setEssenciaId, essenciaOpts, grupoMaestria, setGrupoMaestria,
    // tier
    tier, setTier, temTier, regra, tiers: tabelaTiers(combate), custoAbaixoDoBase,
    // behavior
    passive, togglePassive, ultimate, setUltimate,
    pressaoDice, setPressaoDice,
    // turn
    actionType, setActionType, cooldown, setCooldown, critThreshold, setCritThreshold, bonusAcerto, setBonusAcerto, exclusivaCom, setExclusivaCom, ignoraDef, setIgnoraDef, contraAtaque, setContraAtaque,
    // costs
    costs, addCost, removeCost, updateCost,
    // damage
    hasDamage, setHasDamage, dmgFixed, setDmgFixed,
    dmgEquilibrio, setDmgEquilibrio, dmgAttr1, setDmgAttr1, dmgAttr2, setDmgAttr2,
    equilibrioEfetivo, buildFormula,
    damageSource, setDamageSource, weaponSlot, setWeaponSlot,
    weaponDamageModifiers, addWeaponDamageModifier, removeWeaponDamageModifier, updateWeaponDamageModifier,
    tiposDano, setTiposDano,
    // multi-target
    alvo, setAlvo,
    hasMultiTarget, setHasMultiTarget, multiMaxTargets, setMultiMaxTargets,
    multiDamageMode, setMultiDamageMode, multiSpecificDmg, setMultiSpecificDmg,
    // efeitos
    efeitos, setEfeitos, presets,
    // requirements
    reqLevel, setReqLevel, reqWeapon, setReqWeapon,
    reqWeaponSearch, setReqWeaponSearch, reqAttrs,
    addReqAttr, removeReqAttr, updateReqAttr,
    // form
    loading, error, save,
  };
}
