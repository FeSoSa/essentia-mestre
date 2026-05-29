'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { Skill, Essencia } from './SkillCard';
import type { ItemCatalog } from '@/store/types';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';

interface Props {
  skill?: Skill;
  essencias: Essencia[];
  classes: string[];
  weapons: ItemCatalog[];
  onClose: () => void;
  onSaved: (s: Skill) => void;
}

const lbl     = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';
const inp     = 'w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors';
const smallInp = 'text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2 transition-colors';

const WEAPON_OPTS = [
  { value: 'espadas',         label: 'Espadas'           },
  { value: 'rapieiras',       label: 'Rapieiras'         },
  { value: 'alabardas',       label: 'Alabardas'         },
  { value: 'lancas',          label: 'Lanças'            },
  { value: 'machados-de-guerra', label: 'Machados de guerra' },
  { value: 'martelos',        label: 'Martelos'          },
  { value: 'armas-colossais', label: 'Armas colossais'   },
  { value: 'adagas',          label: 'Adagas'            },
  { value: 'garras',          label: 'Garras'            },
  { value: 'arcos',            label: 'Arcos'              },
  { value: 'bestas',           label: 'Bestas'             },
  { value: 'pistolas',         label: 'Pistolas'           },
  { value: 'luvas-manoplas',  label: 'Luvas & manoplas'  },
  { value: 'escudos',         label: 'Escudos'           },
];

const ATTR_ABBREV_OPTS = [
  { value: 'FOR', label: 'FOR — Força'       },
  { value: 'AGI', label: 'AGI — Agilidade'   },
  { value: 'INT', label: 'INT — Inteligência' },
  { value: 'RES', label: 'RES — Resistência'  },
  { value: 'FLX', label: 'FLX — Fluxo'       },
  { value: 'SAB', label: 'SAB — Sabedoria'    },
  { value: 'PRE', label: 'PRE — Presença'     },
  { value: 'DEF', label: 'DEF — Defesa'       },
];

const ATTR_OPTS = [
  ['strength',     'FOR — Força'        ],
  ['agility',      'AGI — Agilidade'    ],
  ['intelligence', 'INT — Inteligência' ],
  ['resistance',   'RES — Resistência'  ],
  ['flow',         'FLX — Fluxo'        ],
  ['wisdom',       'SAB — Sabedoria'    ],
  ['presence',     'PRE — Presença'     ],
  ['defense',      'DEF — Defesa'       ],
].map(([v, l]) => ({ value: v, label: l }));

const COST_OPTS = [
  { value: 'flow',            label: 'Fluxo'    },
  { value: 'hp',              label: 'HP'       },
  { value: 'ether',           label: 'Éter'     },
  { value: 'charge',          label: 'Carga'    },
  { value: 'percentual_flow', label: 'Fluxo %'  },
  { value: 'percentual_hp',   label: 'HP %'     },
  { value: 'pressao',         label: 'Pressão'  },
];

function Dropdown<T extends string>({ value, onChange, options, placeholder }: {
  value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors">
        <span className={`flex-1 truncate ${current ? 'text-e-text' : 'text-e-faint'}`}>
          {current?.label ?? placeholder ?? '—'}
        </span>
        <ChevronDown size={13} className={`text-e-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl max-h-52 overflow-y-auto">
          {options.map((opt) => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors ${value === opt.value ? 'text-e-accent' : 'text-e-text'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type CostEntry = { type: string; value: string; percentual: string };
type AttrReq   = [string, string];

export default function SkillModal({ skill, essencias, classes, weapons, onClose, onSaved }: Props) {
  const editing = !!skill;

  const [name,       setName]       = useState(skill?.name ?? '');
  const [desc,       setDesc]       = useState(skill?.desc ?? '');
  const [type,       setType]       = useState<'class' | 'weapon' | 'essencia' | 'mestre'>((skill?.type as any) ?? 'class');
  const [skillClass, setSkillClass] = useState(skill?.skillClass ?? '');
  const [weaponTypes, setWeaponTypes] = useState<string[]>(
    (skill as any)?.weaponTypes ?? (skill?.weaponType ? [skill.weaponType] : ['espadas'])
  );
  const [essenciaId, setEssenciaId] = useState(skill?.essenciaId ?? '');
  const [cooldown,     setCooldown]     = useState(String(skill?.cooldownTurns ?? 0));
  const [critThreshold, setCritThreshold] = useState(String((skill as any)?.critThreshold ?? ''));
  const [ultimate,   setUltimate]   = useState(skill?.ultimate ?? false);
  const [toggle,     setToggle]     = useState(skill?.toggle ?? false);
  const [passive,    setPassive]    = useState((skill as any)?.passive ?? false);
  const [pressaoDice, setPressaoDice] = useState((skill as any)?.pressaoDice ?? false);
  const [actionType, setActionType] = useState<'main' | 'bonus' | 'both'>(
    ((skill as any)?.actionType as 'main' | 'bonus' | 'both') ?? 'main'
  );

  const [hasDamage,     setHasDamage]     = useState(!!skill?.damage);
  const [dmgFixed,      setDmgFixed]      = useState(String(skill?.damage?.baseFixed ?? 0));
  const [dmgEquilibrio, setDmgEquilibrio] = useState(String(skill?.damage?.equilibrio ?? ''));
  const dmgAtributoRaw = skill?.damage?.atributo?.split('/') ?? [];
  const [dmgAttr1, setDmgAttr1] = useState(dmgAtributoRaw[0] ?? '');
  const [dmgAttr2, setDmgAttr2] = useState(dmgAtributoRaw[1] ?? '');

  const [costs, setCosts] = useState<CostEntry[]>(
    skill?.costs.map((c) => ({
      type: c.type,
      value: String(c.value ?? ''),
      percentual: String(c.percentual ?? ''),
    })) ?? []
  );

  // Requirements
  const [reqLevel,      setReqLevel]      = useState(String(skill?.requirements?.level ?? ''));
  const [reqWeapon,     setReqWeapon]     = useState(skill?.requirements?.weaponRequired ?? '');
  const [reqWeaponSearch, setReqWeaponSearch] = useState('');
  const [reqAttrs,      setReqAttrs]      = useState<AttrReq[]>(
    Object.entries(skill?.requirements?.attributes ?? {}).map(([k, v]) => [k, String(v)])
  );

  // Passive / buff attributes
  type AttrEntry = [string, string];
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

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Costs
  function addCost() { setCosts((c) => [...c, { type: 'flow', value: '', percentual: '' }]); }
  function removeCost(i: number) { setCosts((c) => c.filter((_, j) => j !== i)); }
  function updateCost(i: number, field: keyof CostEntry, v: string) {
    setCosts((c) => c.map((x, j) => j === i ? { ...x, [field]: v } : x));
  }

  // Req attrs
  function addReqAttr() { setReqAttrs((a) => [...a, ['strength', '10']]); }
  function removeReqAttr(i: number) { setReqAttrs((a) => a.filter((_, j) => j !== i)); }
  function updateReqAttr(i: number, field: 0 | 1, v: string) {
    setReqAttrs((a) => a.map((x, j) => j === i ? (field === 0 ? [v, x[1]] : [x[0], v]) as AttrReq : x));
  }

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

  async function save() {
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

    const body: Omit<Skill, 'id'> & { id?: string; passive?: boolean; pressaoDice?: boolean; passiveAttributes?: any; buffAttributes?: any; buffDurationTurns?: number; weaponTypes?: string[] } = {
      ...(editing ? { id: skill!.id } : {}),
      name: name.trim(), desc, type, ultimate, toggle, passive, pressaoDice, actionType,
      multiTarget: hasMultiTarget ? {
        maxTargets:     Number(multiMaxTargets) || 2,
        damageMode:     multiDamageMode,
        specificDamage: multiDamageMode === 'especifico' && multiSpecificDmg !== '' ? Number(multiSpecificDmg) : undefined,
      } : undefined,
      skillClass:   type === 'class'    ? skillClass || undefined : undefined,
      weaponType:   type === 'weapon'   ? (weaponTypes[0] ?? undefined) : undefined,
      weaponTypes:  type === 'weapon'   ? weaponTypes : undefined,
      essenciaId:   type === 'essencia' ? essenciaId || undefined : undefined,
      passiveAttributes: toAttrMap(passiveAttrs),
      buffAttributes:    toAttrMap(buffAttrs),
      buffDurationTurns: toggle
        ? (buffDuration ? Number(buffDuration) : undefined)
        : ((buffAttrs.length > 0 || hitBonus !== '' || attackBonus !== '' || damageBonus !== '') && buffDuration ? Number(buffDuration) : undefined),
      hitBonus:    hitBonus    !== '' ? Number(hitBonus)    : undefined,
      attackBonus: attackBonus !== '' ? Number(attackBonus) : undefined,
      damageBonus: damageBonus !== '' ? Number(damageBonus) : undefined,
      cooldownTurns:  Number(cooldown) || 0,
      critThreshold:  critThreshold !== '' ? Number(critThreshold) : undefined,
      costs: costs.map((c) => ({
        type: c.type,
        value:      c.value      !== '' ? Number(c.value)      : undefined,
        percentual: c.percentual !== '' ? Number(c.percentual) : undefined,
      })),
      damage: hasDamage ? {
        formula:    buildFormula(),
        baseFixed:  Number(dmgFixed) || 0,
        atributo:   buildAtributo(),
        equilibrio: dmgEquilibrio !== '' ? Number(dmgEquilibrio) : undefined,
      } : undefined,
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

  const essenciaOpts = essencias.map((e) => ({ value: e.id, label: `${e.name} (${e.type})` }));

  const sec = 'flex flex-col gap-4 mt-6 pt-6 border-t border-e-border';
  const secLabel = 'text-[9px] font-bold uppercase tracking-widest text-e-faint';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[520px] max-h-[92vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text">
      <div className="flex flex-col px-5 pt-5 pb-0">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="font-bold text-base">{editing ? 'Editar habilidade' : 'Nova habilidade'}</h2>
            {editing && <p className="text-[11px] text-e-faint mt-0.5">{skill!.name}</p>}
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:text-e-text hover:bg-e-card transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* ── Identidade ── */}
        <div className={sec}>
          <p className={secLabel}>Identidade</p>

          <div className="flex gap-2">
            {(['class', 'weapon', 'essencia', 'mestre'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${type === t ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                {t === 'class' ? 'Classe' : t === 'weapon' ? 'Arma' : t === 'essencia' ? 'Essência' : 'Mestre'}
              </button>
            ))}
          </div>

          <div>
            <label className={lbl}>Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className={inp} placeholder="Nome da habilidade" />
          </div>

          {type === 'class' && (
            <div>
              <label className={lbl}>Classe <span className="normal-case font-normal">(vazio = Geral)</span></label>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" onClick={() => setSkillClass('')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${skillClass === '' ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                  Geral
                </button>
                {classes.map((c) => (
                  <button key={c} type="button" onClick={() => setSkillClass(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${skillClass === c ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'weapon' && (
            <div>
              <label className={lbl}>Tipo de arma <span className="normal-case font-normal">(pode selecionar vários)</span></label>
              <div className="flex gap-1.5 flex-wrap">
                {WEAPON_OPTS.map((w) => {
                  const active = weaponTypes.includes(w.value);
                  return (
                    <button key={w.value} type="button"
                      onClick={() => setWeaponTypes((prev) =>
                        active ? prev.filter((v) => v !== w.value) : [...prev, w.value]
                      )}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${active ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {type === 'essencia' && (
            <div>
              <label className={lbl}>Essência</label>
              {essenciaOpts.length > 0
                ? <Dropdown value={essenciaId} onChange={setEssenciaId}
                    options={[{ value: '', label: 'Selecionar…' }, ...essenciaOpts]} />
                : <p className="text-xs text-e-faint">Nenhuma essência cadastrada.</p>
              }
            </div>
          )}

          <div>
            <label className={lbl}>Descrição</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              className={`resize-none ${inp}`} placeholder="Efeito da habilidade…" />
          </div>
        </div>

        {/* ── Comportamento ── */}
        <div className={sec}>
          <p className={secLabel}>Comportamento</p>

          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'passive',    label: 'Passiva',    sub: 'Sem custo ativo',             active: passive,     color: 'teal'   },
              { key: 'ultimate',   label: 'Ultimate',   sub: 'Habilidade de poder máximo',  active: ultimate,    color: 'amber'  },
              { key: 'toggle',     label: 'Por turno',  sub: 'Custo renovado a cada turno', active: toggle,      color: 'sky'    },
              { key: 'pressao',    label: 'Pressão Dice', sub: 'd20 + pontos de Pressão',   active: pressaoDice, color: 'orange', disabled: passive },
            ] as const).map(({ key, label, sub, active, color, disabled }) => {
              const colors: Record<string, string> = {
                teal:   active ? 'border-teal-500/60   bg-teal-500/10   text-teal-300'   : '',
                amber:  active ? 'border-amber-500/60  bg-amber-500/10  text-amber-300'  : '',
                sky:    active ? 'border-sky-500/60    bg-sky-500/10    text-sky-300'    : '',
                orange: active ? 'border-orange-500/60 bg-orange-500/10 text-orange-300' : '',
              };
              return (
                <button key={key} type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (key === 'passive')  { const v = !passive;     setPassive(v);     if (v) { setHasDamage(false); setCosts([]); } }
                    if (key === 'ultimate') setUltimate((v) => !v);
                    if (key === 'toggle')   { const v = !toggle;      setToggle(v);      if (v) setHasDamage(false); }
                    if (key === 'pressao')  setPressaoDice((v) => !v);
                  }}
                  className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border transition-colors text-left
                    ${disabled ? 'opacity-30 cursor-not-allowed border-e-border' : active ? colors[color] : 'border-e-border bg-e-bg text-e-faint hover:border-e-border2'}`}>
                  <span className="text-sm font-semibold leading-tight">{label}</span>
                  <span className="text-[10px] opacity-60 leading-tight">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Turno ── */}
        {!passive && (
          <div className={sec}>
            <p className={secLabel}>Turno</p>

            <div>
              <label className={lbl}>Ação</label>
              <div className="flex gap-2">
                {([
                  { value: 'main',  label: 'Principal' },
                  { value: 'bonus', label: 'Bônus'     },
                  { value: 'both',  label: 'Ambas'     },
                ] as const).map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setActionType(opt.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${actionType === opt.value ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="w-36">
                <label className={lbl}>Cooldown (turnos)</label>
                <input type="number" min={0} value={cooldown}
                  onChange={(e) => setCooldown(e.target.value)} className={`text-center ${inp}`} />
              </div>
              {toggle ? (
                <div className="w-36">
                  <label className={lbl}>Limite ativo (turnos, -1=∞)</label>
                  <input type="number" min={-1} value={buffDuration}
                    onChange={(e) => setBuffDuration(e.target.value)} className={`text-center ${inp}`} />
                </div>
              ) : (
                <div className="w-36">
                  <label className={lbl}>Crítico mínimo</label>
                  <input type="number" min={1} max={20} value={critThreshold}
                    onChange={(e) => setCritThreshold(e.target.value)}
                    placeholder="20" className={`text-center ${inp}`} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Custos ── */}
        {!passive && (
          <div className={sec}>
            <div className="flex items-center justify-between">
              <p className={secLabel}>Custos</p>
              <button onClick={addCost} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {costs.length === 0 && (
              <p className="text-xs text-e-faint italic">Sem custo — gratuita.</p>
            )}
            {costs.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Dropdown value={c.type} onChange={(v) => updateCost(i, 'type', v)} options={COST_OPTS} />
                </div>
                {c.type.startsWith('percentual') ? (
                  <input type="number" min={0} max={100} value={c.percentual}
                    onChange={(e) => updateCost(i, 'percentual', e.target.value)}
                    placeholder="%" className={`w-16 text-center ${smallInp}`} />
                ) : (
                  <input type="number" min={0} value={c.value}
                    onChange={(e) => updateCost(i, 'value', e.target.value)}
                    placeholder="val" className={`w-16 text-center ${smallInp}`} />
                )}
                <button onClick={() => removeCost(i)} className="opacity-40 hover:opacity-80 shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Combate ── */}
        {!passive && !toggle && (
          <div className={sec}>
            <p className={secLabel}>Combate</p>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={hasDamage} onChange={setHasDamage} />
                <span className="text-sm font-semibold text-e-text">Tem dano</span>
              </label>
              {hasDamage && (
                <div className="rounded-xl border border-e-border bg-e-bg p-3 flex flex-col gap-3">
                  <div className="flex gap-3 items-start flex-wrap">
                    <div className="w-24">
                      <label className={lbl}>Dano base</label>
                      <input type="number" min={0} value={dmgFixed}
                        onChange={(e) => setDmgFixed(e.target.value)} className={`text-center ${inp}`} />
                    </div>
                    <div className="w-24">
                      <label className={lbl}>Equilíbrio</label>
                      <input type="number" min={1} value={dmgEquilibrio}
                        onChange={(e) => setDmgEquilibrio(e.target.value)}
                        placeholder="—" className={`text-center ${inp}`} />
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="w-[120px]">
                        <label className={lbl}>Atributo 1</label>
                        <Dropdown
                          value={dmgAttr1}
                          onChange={(v) => { setDmgAttr1(v); if (!v) setDmgAttr2(''); }}
                          options={[{ value: '', label: 'Nenhum' }, ...ATTR_ABBREV_OPTS]}
                        />
                      </div>
                      <div className="w-[120px]">
                        <label className={lbl}>Atributo 2</label>
                        <Dropdown
                          value={dmgAttr2}
                          onChange={setDmgAttr2}
                          options={[{ value: '', label: 'Nenhum' }, ...ATTR_ABBREV_OPTS.filter((o) => o.value !== dmgAttr1)]}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-e-sub border-t border-e-border pt-2.5">
                    Fórmula: <span className="font-mono text-e-text">⚔ {buildFormula() || '—'}</span>
                  </p>
                </div>
              )}
            </div>

            {hasDamage && (
              <div className={`rounded-xl border p-3 flex flex-col gap-3 transition-colors ${hasMultiTarget ? 'border-red-500/40 bg-red-500/5' : 'border-e-border'}`}>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox checked={hasMultiTarget} onChange={setHasMultiTarget} />
                  <span className={`text-sm font-semibold ${hasMultiTarget ? 'text-red-300' : 'text-e-text'}`}>Multi-target</span>
                  {!hasMultiTarget && <span className="text-xs text-e-faint">Habilidade atinge múltiplos inimigos</span>}
                </label>
                {hasMultiTarget && (
                  <div className="flex flex-col gap-3">
                    <div className="w-28">
                      <label className={lbl}>Máx. de alvos</label>
                      <input type="number" min={2} max={20} value={multiMaxTargets}
                        onChange={(e) => setMultiMaxTargets(e.target.value)}
                        className={`text-center ${inp}`} />
                    </div>
                    <div>
                      <label className={lbl}>Modo de dano</label>
                      <div className="flex gap-2">
                        {([
                          { value: 'igual',       label: 'Igual',      desc: 'Total a todos'       },
                          { value: 'distribuido', label: 'Distribuído', desc: 'Dividido entre alvos' },
                          { value: 'especifico',  label: 'Específico',  desc: '1º total, demais fixo' },
                        ] as const).map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setMultiDamageMode(opt.value)}
                            className={`flex-1 flex flex-col items-center px-2 py-2 rounded-lg border transition-colors ${multiDamageMode === opt.value ? 'bg-red-500/20 border-red-500/60 text-red-300' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                            <span className="text-xs font-bold">{opt.label}</span>
                            <span className="text-[10px] mt-0.5 opacity-70">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {multiDamageMode === 'especifico' && (
                      <div className="w-40">
                        <label className={lbl}>Dano fixo (alvos 2+)</label>
                        <input type="number" min={0} value={multiSpecificDmg}
                          onChange={(e) => setMultiSpecificDmg(e.target.value)}
                          placeholder="0" className={`text-center ${inp}`} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Efeitos ── */}
        <div className={sec}>
          <p className={secLabel}>Efeitos</p>

          {/* Atributos passivos */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={lbl}>Atributos passivos <span className="normal-case font-normal">(enquanto equipada)</span></label>
              <button type="button" onClick={() => setPassiveAttrs((a) => [...a, ['strength', '1']])}
                className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {passiveAttrs.length === 0 && <p className="text-xs text-e-faint italic">Nenhum.</p>}
            {passiveAttrs.map(([attr, val], i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Dropdown value={attr} onChange={(v) => setPassiveAttrs((a) => a.map((x, j) => j === i ? [v, x[1]] as [string,string] : x))} options={ATTR_OPTS} />
                </div>
                <input type="number" value={val}
                  onChange={(e) => setPassiveAttrs((a) => a.map((x, j) => j === i ? [x[0], e.target.value] as [string,string] : x))}
                  className={`w-16 text-center ${smallInp}`} />
                <button onClick={() => setPassiveAttrs((a) => a.filter((_, j) => j !== i))} className="opacity-40 hover:opacity-80 shrink-0 transition-opacity">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Buff de atributo */}
          <div className="flex flex-col gap-2 pt-4 border-t border-e-border">
            <div className="flex items-center justify-between">
              <label className={lbl}>Buff de atributo <span className="normal-case font-normal">(ao usar, por N turnos)</span></label>
              <button type="button" onClick={() => setBuffAttrs((a) => [...a, ['strength', '1']])}
                className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {buffAttrs.length === 0 && <p className="text-xs text-e-faint italic">Nenhum.</p>}
            {buffAttrs.map(([attr, val], i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Dropdown value={attr} onChange={(v) => setBuffAttrs((a) => a.map((x, j) => j === i ? [v, x[1]] as [string,string] : x))} options={ATTR_OPTS} />
                </div>
                <input type="number" value={val}
                  onChange={(e) => setBuffAttrs((a) => a.map((x, j) => j === i ? [x[0], e.target.value] as [string,string] : x))}
                  className={`w-16 text-center ${smallInp}`} />
                <button onClick={() => setBuffAttrs((a) => a.filter((_, j) => j !== i))} className="opacity-40 hover:opacity-80 shrink-0 transition-opacity">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Bônus de combate */}
          <div className="flex flex-col gap-3 pt-4 border-t border-e-border">
            <label className={lbl}>Bônus de combate <span className="normal-case font-normal">(buff ao usar, mesma duração)</span></label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { label: 'Acerto +',  val: hitBonus,    set: setHitBonus    },
                { label: 'Ataque +',  val: attackBonus, set: setAttackBonus },
                { label: 'Dano +',    val: damageBonus, set: setDamageBonus },
              ] as { label: string; val: string; set: (v: string) => void }[]).map(({ label, val, set }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-e-faint font-medium">{label}</span>
                  <input type="number" value={val} onChange={(e) => set(e.target.value)}
                    placeholder="—" className={`text-center ${smallInp} w-full`} />
                </div>
              ))}
            </div>
            {!toggle && (hitBonus !== '' || attackBonus !== '' || damageBonus !== '' || buffAttrs.length > 0) && (
              <div className="flex items-center gap-3">
                <span className={lbl + ' mb-0'}>Duração</span>
                <input type="number" min={-1} value={buffDuration}
                  onChange={(e) => setBuffDuration(e.target.value)}
                  placeholder="-1 = ∞" className={`w-28 text-center ${smallInp}`} />
                <span className="text-xs text-e-faint">turnos (-1 = ∞)</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Pré-requisitos ── */}
        <div className={sec}>
          <p className={secLabel}>Pré-requisitos</p>

          <div className="flex gap-3 flex-wrap">
            <div className="w-32">
              <label className={lbl}>Nível mínimo</label>
              <input type="number" min={1} value={reqLevel}
                onChange={(e) => setReqLevel(e.target.value)}
                placeholder="—" className={`text-center ${inp}`} />
            </div>
          </div>

          <div>
            <label className={lbl}>Arma necessária (equipada)</label>
            {reqWeapon && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-e-card border border-e-border text-sm text-e-text">
                <span className="flex-1">
                  {weapons.find((w) => w.weaponType === reqWeapon || w.id === reqWeapon)?.name ?? reqWeapon}
                  <span className="ml-2 text-[10px] text-e-faint font-mono">{reqWeapon}</span>
                </span>
                <button onClick={() => setReqWeapon('')} className="opacity-50 hover:opacity-100 text-xs">✕</button>
              </div>
            )}
            {!reqWeapon && (
              <>
                <input value={reqWeaponSearch} onChange={(e) => setReqWeaponSearch(e.target.value)}
                  placeholder="Buscar tipo de arma…" className={inp} />
                {reqWeaponSearch && (
                  <div className="mt-1 border border-e-border rounded-xl bg-e-bg max-h-36 overflow-y-auto">
                    {[...new Map(
                      weapons
                        .filter((w) => w.weaponType && (
                          w.name.toLowerCase().includes(reqWeaponSearch.toLowerCase()) ||
                          w.weaponType.toLowerCase().includes(reqWeaponSearch.toLowerCase())
                        ))
                        .map((w) => [w.weaponType, w])
                    ).values()].map((w) => (
                      <button key={w.weaponType} type="button"
                        onClick={() => { setReqWeapon(w.weaponType!); setReqWeaponSearch(''); }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors text-e-text">
                        <span className="font-mono text-e-accent">{w.weaponType}</span>
                        <span className="ml-2 text-e-faint">{w.name}</span>
                      </button>
                    ))}
                    {weapons.filter((w) => w.weaponType && (
                      w.name.toLowerCase().includes(reqWeaponSearch.toLowerCase()) ||
                      w.weaponType.toLowerCase().includes(reqWeaponSearch.toLowerCase())
                    )).length === 0 && (
                      <p className="px-3 py-2 text-sm text-e-faint">Nenhuma arma encontrada.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={lbl}>Atributos mínimos</label>
              <button onClick={addReqAttr} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {reqAttrs.map(([attr, val], i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Dropdown value={attr} onChange={(v) => updateReqAttr(i, 0, v)} options={ATTR_OPTS} />
                </div>
                <input type="number" min={1} value={val}
                  onChange={(e) => updateReqAttr(i, 1, e.target.value)}
                  className={`w-16 text-center ${smallInp}`} />
                <button onClick={() => removeReqAttr(i)} className="opacity-40 hover:opacity-80 shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 break-all mt-6">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 flex gap-2 justify-end py-4 px-5 -mx-5 border-t border-e-border mt-8 bg-e-surface">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!name.trim() || loading}>
            {loading ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
          </Button>
        </div>

      </div>
      </div>
    </div>
  );
}
