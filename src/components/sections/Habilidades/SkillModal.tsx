'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, X, ChevronUp } from 'lucide-react';
import type { Skill, Essencia } from './SkillCard';
import type { ItemCatalog } from '@/store/types';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import EffectBuilder from '../StatusEffects/EffectBuilder';
import { useSkillForm } from './useSkillForm';
import { STATUS_ICONS, getStatusIcon } from '@/lib/statusIcons';

interface Props {
  skill?: Skill;
  essencias: Essencia[];
  classes: string[];
  weapons: ItemCatalog[];
  onClose: () => void;
  onSaved: (s: Skill) => void;
}

const lbl      = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';
const inp      = 'w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors';
const smallInp = 'text-sm rounded-xl px-2 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2 transition-colors';
const sec      = 'flex flex-col gap-4 mt-6 pt-6 border-t border-e-border';
const secFirst = 'flex flex-col gap-4 mt-4';

const WEAPON_OPTS = [
  { value: 'espadas',            label: 'Espadas'            },
  { value: 'rapieiras',          label: 'Rapieiras'          },
  { value: 'alabardas',          label: 'Alabardas'          },
  { value: 'lancas',             label: 'Lanças'             },
  { value: 'machados-de-guerra', label: 'Machados de guerra' },
  { value: 'martelos',           label: 'Martelos'           },
  { value: 'armas-colossais',    label: 'Armas colossais'    },
  { value: 'adagas',             label: 'Adagas'             },
  { value: 'garras',             label: 'Garras'             },
  { value: 'cajado',             label: 'Cajado'             },
  { value: 'grimorio',           label: 'Grimório'           },
  { value: 'orbe',               label: 'Orbe'               },
  { value: 'arcos',              label: 'Arcos'              },
  { value: 'bestas',             label: 'Bestas'             },
  { value: 'pistolas',           label: 'Pistolas'           },
  { value: 'luvas-manoplas',     label: 'Luvas & manoplas'   },
  { value: 'escudos',            label: 'Escudos'            },
];

const ATTR_ABBREV_OPTS = [
  { value: 'FOR', label: 'FOR — Força'        },
  { value: 'AGI', label: 'AGI — Agilidade'    },
  { value: 'INT', label: 'INT — Inteligência' },
  { value: 'RES', label: 'RES — Resistência'  },
  { value: 'FLX', label: 'FLX — Fluxo'        },
  { value: 'SAB', label: 'SAB — Sabedoria'     },
  { value: 'PRE', label: 'PRE — Presença'      },
  { value: 'DEF', label: 'DEF — Defesa'        },
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
  { value: 'flow',            label: 'Fluxo'   },
  { value: 'hp',              label: 'HP'      },
  { value: 'ether',           label: 'Éter'    },
  { value: 'charge',          label: 'Carga'   },
  { value: 'percentual_flow', label: 'Fluxo %' },
  { value: 'percentual_hp',   label: 'HP %'    },
  { value: 'pressao',         label: 'Pressão' },
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

type TabId = 'base' | 'turno' | 'combate' | 'efeitos';

export default function SkillModal({ skill, essencias, classes, weapons, onClose, onSaved }: Props) {
  const f = useSkillForm(skill, essencias);
  const [tab, setTab] = useState<TabId>('base');
  const [presetSearch, setPresetSearch] = useState('');

  const isEnemy = f.type === 'inimigo';

  const tabs = [
    { id: 'base'    as TabId, label: 'Base'          },
    !f.passive && !isEnemy && { id: 'turno'   as TabId, label: 'Turno & Custos' },
    !f.passive && !f.toggle && { id: 'combate' as TabId, label: 'Combate'        },
    { id: 'efeitos' as TabId, label: 'Efeitos & Req' },
  ].filter(Boolean) as { id: TabId; label: string }[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[520px] max-h-[92vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text">
      <div className="flex flex-col px-5 pt-5 pb-0">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="font-bold text-base">{f.editing ? 'Editar habilidade' : 'Nova habilidade'}</h2>
            {f.editing && <p className="text-[11px] text-e-faint mt-0.5">{skill!.name}</p>}
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:text-e-text hover:bg-e-card transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex gap-1.5 border-b border-e-border pb-3">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${tab === t.id ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ABA: BASE                                                      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {tab === 'base' && <>
          {/* ── Identidade ── */}
          <div className={secFirst}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Identidade</p>

            <div className="flex gap-2">
              {(['class', 'weapon', 'essencia', 'mestre', 'inimigo'] as const).map((t) => (
                <button key={t} type="button" onClick={() => { f.setType(t); if (t === 'inimigo' && (tab as TabId) === 'turno') setTab('base'); }}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${f.type === t ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                  {t === 'class' ? 'Classe' : t === 'weapon' ? 'Arma' : t === 'essencia' ? 'Essência' : t === 'mestre' ? 'Mestre' : 'Inimigos'}
                </button>
              ))}
            </div>

            <div>
              <label className={lbl}>Nome</label>
              <input value={f.name} onChange={(e) => f.setName(e.target.value)}
                className={inp} placeholder="Nome da habilidade" />
            </div>

            {f.type === 'class' && (
              <div>
                <label className={lbl}>Classe <span className="normal-case font-normal">(vazio = Geral)</span></label>
                <div className="flex gap-1.5 flex-wrap">
                  <button type="button" onClick={() => f.setSkillClass('')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${f.skillClass === '' ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                    Geral
                  </button>
                  {classes.map((c) => (
                    <button key={c} type="button" onClick={() => f.setSkillClass(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${f.skillClass === c ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {f.type === 'weapon' && (
              <div>
                <label className={lbl}>Tipo de arma <span className="normal-case font-normal">(pode selecionar vários)</span></label>
                <div className="flex gap-1.5 flex-wrap">
                  {WEAPON_OPTS.map((w) => {
                    const active = f.weaponTypes.includes(w.value);
                    return (
                      <button key={w.value} type="button"
                        onClick={() => f.setWeaponTypes((prev) =>
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

            {f.type === 'essencia' && (
              <div>
                <label className={lbl}>Essência</label>
                {f.essenciaOpts.length > 0
                  ? <Dropdown value={f.essenciaId} onChange={f.setEssenciaId}
                      options={[{ value: '', label: 'Selecionar…' }, ...f.essenciaOpts]} />
                  : <p className="text-xs text-e-faint">Nenhuma essência cadastrada.</p>
                }
              </div>
            )}

            <div>
              <label className={lbl}>Descrição</label>
              <textarea value={f.desc} onChange={(e) => f.setDesc(e.target.value)} rows={3}
                className={`resize-none ${inp}`} placeholder="Efeito da habilidade…" />
            </div>
          </div>

          {/* ── Comportamento ── */}
          {!isEnemy && (
            <div className={sec}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Comportamento</p>

              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'passive',  label: 'Passiva',      sub: 'Sem custo ativo',             active: f.passive,     color: 'teal',   disabled: false },
                  { key: 'ultimate', label: 'Ultimate',     sub: 'Habilidade de poder máximo',  active: f.ultimate,    color: 'amber',  disabled: false },
                  { key: 'toggle',   label: 'Por turno',    sub: 'Custo renovado a cada turno', active: f.toggle,      color: 'sky',    disabled: false },
                  { key: 'pressao',  label: 'Pressão Dice', sub: 'd20 + pontos de Pressão',     active: f.pressaoDice, color: 'orange', disabled: f.passive },
                ] as const).map(({ key, label, sub, active, color, disabled }) => {
                  const colors: Record<string, string> = {
                    teal:   active ? 'border-teal-500/60   bg-teal-500/10   text-teal-300'   : '',
                    amber:  active ? 'border-amber-500/60  bg-amber-500/10  text-amber-300'  : '',
                    sky:    active ? 'border-sky-500/60    bg-sky-500/10    text-sky-300'    : '',
                    orange: active ? 'border-orange-500/60 bg-orange-500/10 text-orange-300' : '',
                  };
                  return (
                    <button key={key} type="button" disabled={disabled}
                      onClick={() => {
                        if (key === 'passive')  { f.togglePassive(); if (!f.passive) setTab('base'); }
                        if (key === 'ultimate') f.setUltimate((v: boolean) => !v);
                        if (key === 'toggle')   { f.toggleToggle(); if (!f.toggle && (tab as TabId) === 'combate') setTab('base'); }
                        if (key === 'pressao')  f.setPressaoDice((v: boolean) => !v);
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
          )}
        </>}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ABA: TURNO & CUSTOS                                           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {tab === 'turno' && <>
          {/* ── Turno ── */}
          <div className={secFirst}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Turno</p>

            <div>
              <label className={lbl}>Ação</label>
              <div className="flex gap-2">
                {([
                  { value: 'main',  label: 'Principal' },
                  { value: 'bonus', label: 'Bônus'     },
                  { value: 'both',  label: 'Ambas'     },
                ] as const).map((opt) => (
                  <button key={opt.value} type="button" onClick={() => f.setActionType(opt.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${f.actionType === opt.value ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="w-36">
                <label className={lbl}>Cooldown (turnos)</label>
                <input type="number" min={0} value={f.cooldown}
                  onChange={(e) => f.setCooldown(e.target.value)} className={`text-center ${inp}`} />
              </div>
              {f.toggle ? (
                <div className="w-36">
                  <label className={lbl}>Limite ativo (turnos, -1=∞)</label>
                  <input type="number" min={-1} value={f.buffDuration}
                    onChange={(e) => f.setBuffDuration(e.target.value)} className={`text-center ${inp}`} />
                </div>
              ) : (
                <div className="w-36">
                  <label className={lbl}>Crítico mínimo</label>
                  <input type="number" min={1} max={20} value={f.critThreshold}
                    onChange={(e) => f.setCritThreshold(e.target.value)}
                    placeholder="20" className={`text-center ${inp}`} />
                </div>
              )}
            </div>
          </div>

          {/* ── Custos ── */}
          <div className={sec}>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Custos</p>
              <button onClick={f.addCost} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {f.costs.length === 0 && (
              <p className="text-xs text-e-faint italic">Sem custo — gratuita.</p>
            )}
            {f.costs.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Dropdown value={c.type} onChange={(v) => f.updateCost(i, 'type', v)} options={COST_OPTS} />
                </div>
                {c.type.startsWith('percentual') ? (
                  <input type="number" min={0} max={100} value={c.percentual}
                    onChange={(e) => f.updateCost(i, 'percentual', e.target.value)}
                    placeholder="%" className={`w-16 text-center ${smallInp}`} />
                ) : (
                  <input type="number" min={0} value={c.value}
                    onChange={(e) => f.updateCost(i, 'value', e.target.value)}
                    placeholder="val" className={`w-16 text-center ${smallInp}`} />
                )}
                <button onClick={() => f.removeCost(i)} className="opacity-40 hover:opacity-80 shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </>}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ABA: COMBATE                                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {tab === 'combate' && <>
          {/* ── Combate ── */}
          <div className={secFirst}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Combate</p>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={f.hasDamage} onChange={f.setHasDamage} />
                <span className="text-sm font-semibold text-e-text">Tem dano</span>
              </label>
              {f.hasDamage && (
                <div className="rounded-xl border border-e-border bg-e-bg p-3 flex flex-col gap-3">
                  <div className="flex gap-3 items-start flex-wrap">
                    <div className="w-24">
                      <label className={lbl}>Dano base</label>
                      <input type="number" min={0} value={f.dmgFixed}
                        onChange={(e) => f.setDmgFixed(e.target.value)} className={`text-center ${inp}`} />
                    </div>
                    <div className="w-24">
                      <label className={lbl}>Equilíbrio</label>
                      <input type="number" min={1} value={f.dmgEquilibrio}
                        onChange={(e) => f.setDmgEquilibrio(e.target.value)}
                        placeholder="—" className={`text-center ${inp}`} />
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="w-[120px]">
                        <label className={lbl}>Atributo 1</label>
                        <Dropdown
                          value={f.dmgAttr1}
                          onChange={(v) => { f.setDmgAttr1(v); if (!v) f.setDmgAttr2(''); }}
                          options={[{ value: '', label: 'Nenhum' }, ...ATTR_ABBREV_OPTS]}
                        />
                      </div>
                      <div className="w-[120px]">
                        <label className={lbl}>Atributo 2</label>
                        <Dropdown
                          value={f.dmgAttr2}
                          onChange={f.setDmgAttr2}
                          options={[{ value: '', label: 'Nenhum' }, ...ATTR_ABBREV_OPTS.filter((o) => o.value !== f.dmgAttr1)]}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-e-sub border-t border-e-border pt-2.5">
                    Fórmula: <span className="font-mono text-e-text">⚔ {f.buildFormula() || '—'}</span>
                  </p>
                </div>
              )}
            </div>

            {f.hasDamage && (
              <div className={`rounded-xl border p-3 flex flex-col gap-3 transition-colors ${f.hasMultiTarget ? 'border-red-500/40 bg-red-500/5' : 'border-e-border'}`}>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox checked={f.hasMultiTarget} onChange={f.setHasMultiTarget} />
                  <span className={`text-sm font-semibold ${f.hasMultiTarget ? 'text-red-300' : 'text-e-text'}`}>Multi-target</span>
                  {!f.hasMultiTarget && <span className="text-xs text-e-faint">Habilidade atinge múltiplos inimigos</span>}
                </label>
                {f.hasMultiTarget && (
                  <div className="flex flex-col gap-3">
                    <div className="w-28">
                      <label className={lbl}>Máx. de alvos</label>
                      <input type="number" min={2} max={20} value={f.multiMaxTargets}
                        onChange={(e) => f.setMultiMaxTargets(e.target.value)}
                        className={`text-center ${inp}`} />
                    </div>
                    <div>
                      <label className={lbl}>Modo de dano</label>
                      <div className="flex gap-2">
                        {([
                          { value: 'igual',       label: 'Igual',       desc: 'Total a todos'        },
                          { value: 'distribuido', label: 'Distribuído',  desc: 'Dividido entre alvos' },
                          { value: 'especifico',  label: 'Específico',   desc: '1º total, demais fixo' },
                        ] as const).map((opt) => (
                          <button key={opt.value} type="button" onClick={() => f.setMultiDamageMode(opt.value)}
                            className={`flex-1 flex flex-col items-center px-2 py-2 rounded-lg border transition-colors ${f.multiDamageMode === opt.value ? 'bg-red-500/20 border-red-500/60 text-red-300' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                            <span className="text-xs font-bold">{opt.label}</span>
                            <span className="text-[10px] mt-0.5 opacity-70">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {f.multiDamageMode === 'especifico' && (
                      <div className="w-40">
                        <label className={lbl}>Dano fixo (alvos 2+)</label>
                        <input type="number" min={0} value={f.multiSpecificDmg}
                          onChange={(e) => f.setMultiSpecificDmg(e.target.value)}
                          placeholder="0" className={`text-center ${inp}`} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Efeitos no Alvo ── */}
          <div className={sec}>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Efeitos no Alvo</p>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button type="button" onClick={() => f.setPresetDropdownOpen((v) => !v)}
                    className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                    <Plus size={12} /> Preset
                  </button>
                  {f.presetDropdownOpen && (
                    <div className="absolute right-0 z-50 mt-1 w-52 bg-e-surface border border-e-border rounded-xl shadow-2xl">
                      <div className="p-2 border-b border-e-border">
                        <input
                          autoFocus
                          value={presetSearch}
                          onChange={(e) => setPresetSearch(e.target.value)}
                          placeholder="Buscar…"
                          className="w-full text-xs rounded-lg px-2 py-1.5 bg-e-bg border border-e-border text-e-text outline-none placeholder:text-e-faint"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {f.presets.filter((p) => !presetSearch.trim() || p.name.toLowerCase().includes(presetSearch.toLowerCase())).map((p) => {
                          const PresetIcon = getStatusIcon(p.icon);
                          return (
                            <button key={p.id} type="button"
                              onClick={() => { f.addPresetAsHitEffect(p); setPresetSearch(''); }}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors text-e-text flex items-center">
                              {PresetIcon && <PresetIcon size={13} className="mr-1.5 shrink-0" />}
                              <span className="flex-1 truncate">{p.name}</span>
                              <span className="ml-1.5 text-[10px] text-e-faint shrink-0">{p.durationTurns === -1 ? '∞' : `${p.durationTurns}t`}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <button type="button" onClick={f.addCustomHitEffect}
                  className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                  <Plus size={12} /> Personalizado
                </button>
              </div>
            </div>

            {f.onHitEffects.length === 0 && (
              <p className="text-xs text-e-faint italic">Nenhum efeito aplicado no alvo.</p>
            )}

            {f.onHitEffects.map((eff, i) => {
              const expanded = f.expandedHitEffect.has(i);
              const EffIcon = getStatusIcon(eff.icon);
              return (
                <div key={eff.id} className="rounded-xl border border-e-border bg-e-bg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    {EffIcon && <EffIcon size={15} className="shrink-0" />}
                    <span className={`flex-1 text-sm font-medium truncate ${eff.name ? 'text-e-text' : 'text-e-faint italic'}`}>
                      {eff.name || 'Sem nome'}
                    </span>
                    <span className="text-xs text-e-faint shrink-0">
                      {eff.durationTurns === -1 ? '∞' : `${eff.durationTurns}t`}
                    </span>
                    <button type="button" onClick={() => f.toggleHitExpand(i)}
                      className="opacity-50 hover:opacity-100 transition-opacity shrink-0">
                      {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    <button type="button" onClick={() => f.removeHitEffect(i)}
                      className="opacity-40 hover:opacity-80 shrink-0 transition-opacity">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {expanded && (
                    <div className="px-3 pb-3 flex flex-col gap-3 border-t border-e-border pt-3">
                      <div>
                        <label className={lbl}>Nome</label>
                        <input value={eff.name} onChange={(e) => f.updateHitEffect(i, { name: e.target.value })}
                          className={inp} placeholder="Nome do efeito" />
                      </div>

                      <div>
                        <label className={lbl}>Descrição</label>
                        <textarea value={eff.desc ?? ''} onChange={(e) => f.updateHitEffect(i, { desc: e.target.value })}
                          placeholder="O que este efeito faz ao personagem…" rows={2}
                          className="w-full rounded-xl px-3 py-2 bg-e-bg border border-e-border text-sm text-e-text resize-none outline-none focus:border-e-border2 transition-colors placeholder:text-e-faint" />
                      </div>

                      <div>
                        <label className={lbl}>Ícone</label>
                        <div className="grid grid-cols-9 gap-1.5">
                          {STATUS_ICONS.map(({ name: n, Icon }) => (
                            <button key={n} type="button" title={n}
                              onClick={() => f.updateHitEffect(i, { icon: eff.icon === n ? '' : n })}
                              className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                                eff.icon === n
                                  ? 'border-e-accent bg-e-accent/10 text-e-accent'
                                  : 'border-e-border hover:border-e-border2 text-e-faint hover:text-e-sub'
                              }`}
                              style={eff.icon === n && eff.color ? { borderColor: eff.color, backgroundColor: eff.color + '22', color: eff.color } : {}}
                            >
                              <Icon size={14} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className={lbl}>Cor</label>
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-6 gap-1.5">
                            {['#ef4444','#f97316','#facc15','#4ade80','#06b6d4','#3b82f6','#a855f7','#ec4899','#d4a84e','#e2e8f0','#71717a','#7c3aed'].map((c) => (
                              <button key={c} type="button" onClick={() => f.updateHitEffect(i, { color: c })}
                                className={`h-7 rounded-lg border-2 transition-all cursor-pointer ${eff.color === c ? 'scale-110 border-white/50' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: c }} />
                            ))}
                            <button type="button" onClick={() => f.updateHitEffect(i, { color: undefined })}
                              className={`h-7 rounded-lg border transition-colors cursor-pointer flex items-center justify-center text-[9px] font-bold ${!eff.color ? 'border-e-accent text-e-accent' : 'border-e-border text-e-faint hover:border-e-border2'}`}>
                              auto
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <Checkbox checked={eff.durationTurns === -1}
                            onChange={(checked) => f.updateHitEffect(i, { durationTurns: checked ? -1 : 1 })} />
                          <span className="text-sm text-e-sub">Permanente</span>
                        </label>
                        {eff.durationTurns !== -1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-e-sub shrink-0">Duração:</span>
                            <input type="number" min={1} value={eff.durationTurns}
                              onChange={(e) => f.updateHitEffect(i, { durationTurns: Number(e.target.value) })}
                              className="!w-20 text-center" />
                            <span className="text-sm text-e-faint">turnos</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Bônus de acerto</label>
                          <input type="number" value={eff.hitBonus ?? ''}
                            onChange={(e) => f.updateHitEffect(i, { hitBonus: e.target.value !== '' ? Number(e.target.value) : undefined })}
                            placeholder="Ex: -2" className={`text-center ${inp}`} />
                        </div>
                        <div>
                          <label className={lbl}>Bônus de ataque</label>
                          <input type="number" value={eff.attackBonus ?? ''}
                            onChange={(e) => f.updateHitEffect(i, { attackBonus: e.target.value !== '' ? Number(e.target.value) : undefined })}
                            placeholder="Ex: -3" className={`text-center ${inp}`} />
                        </div>
                      </div>

                      <div>
                        <label className={lbl}>Auto-efeitos</label>
                        <EffectBuilder
                          effects={eff.effects}
                          onChange={(effects) => f.updateHitEffect(i, { effects })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ABA: EFEITOS & REQ                                            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {tab === 'efeitos' && <>
          {/* ── Efeitos ── */}
          <div className={secFirst}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Efeitos</p>

            {/* Atributos passivos */}
            {!isEnemy && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className={lbl}>Atributos passivos <span className="normal-case font-normal">(enquanto equipada)</span></label>
                  <button type="button" onClick={() => f.setPassiveAttrs((a) => [...a, ['strength', '1']])}
                    className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                    <Plus size={12} /> Adicionar
                  </button>
                </div>
                {f.passiveAttrs.length === 0 && <p className="text-xs text-e-faint italic">Nenhum.</p>}
                {f.passiveAttrs.map(([attr, val], i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Dropdown value={attr} onChange={(v) => f.setPassiveAttrs((a) => a.map((x, j) => j === i ? [v, x[1]] as [string, string] : x))} options={ATTR_OPTS} />
                    </div>
                    <input type="number" value={val}
                      onChange={(e) => f.setPassiveAttrs((a) => a.map((x, j) => j === i ? [x[0], e.target.value] as [string, string] : x))}
                      className={`w-16 text-center ${smallInp}`} />
                    <button onClick={() => f.setPassiveAttrs((a) => a.filter((_, j) => j !== i))} className="opacity-40 hover:opacity-80 shrink-0 transition-opacity">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Buff de atributo */}
            <div className="flex flex-col gap-2 pt-4 border-t border-e-border">
              <div className="flex items-center justify-between">
                <label className={lbl}>Buff de atributo <span className="normal-case font-normal">(ao usar, por N turnos)</span></label>
                <button type="button" onClick={() => f.setBuffAttrs((a) => [...a, ['strength', '1']])}
                  className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text transition-colors">
                  <Plus size={12} /> Adicionar
                </button>
              </div>
              {f.buffAttrs.length === 0 && <p className="text-xs text-e-faint italic">Nenhum.</p>}
              {f.buffAttrs.map(([attr, val], i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Dropdown value={attr} onChange={(v) => f.setBuffAttrs((a) => a.map((x, j) => j === i ? [v, x[1]] as [string, string] : x))} options={ATTR_OPTS} />
                  </div>
                  <input type="number" value={val}
                    onChange={(e) => f.setBuffAttrs((a) => a.map((x, j) => j === i ? [x[0], e.target.value] as [string, string] : x))}
                    className={`w-16 text-center ${smallInp}`} />
                  <button onClick={() => f.setBuffAttrs((a) => a.filter((_, j) => j !== i))} className="opacity-40 hover:opacity-80 shrink-0 transition-opacity">
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
                  { label: 'Acerto +',  val: f.hitBonus,    set: f.setHitBonus    },
                  { label: 'Ataque +',  val: f.attackBonus, set: f.setAttackBonus },
                  { label: 'Dano +',    val: f.damageBonus, set: f.setDamageBonus },
                ] as { label: string; val: string; set: (v: string) => void }[]).map(({ label, val, set }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-e-faint font-medium">{label}</span>
                    <input type="number" value={val} onChange={(e) => set(e.target.value)}
                      placeholder="—" className={`text-center ${smallInp} w-full`} />
                  </div>
                ))}
              </div>
              {!f.toggle && (f.hitBonus !== '' || f.attackBonus !== '' || f.damageBonus !== '' || f.buffAttrs.length > 0) && (
                <div className="flex items-center gap-3">
                  <span className={lbl + ' mb-0'}>Duração</span>
                  <input type="number" min={-1} value={f.buffDuration}
                    onChange={(e) => f.setBuffDuration(e.target.value)}
                    placeholder="-1 = ∞" className={`w-28 text-center ${smallInp}`} />
                  <span className="text-xs text-e-faint">turnos (-1 = ∞)</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Pré-requisitos ── */}
          {!isEnemy && (
          <div className={sec}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Pré-requisitos</p>

            <div className="flex gap-3 flex-wrap">
              <div className="w-32">
                <label className={lbl}>Nível mínimo</label>
                <input type="number" min={1} value={f.reqLevel}
                  onChange={(e) => f.setReqLevel(e.target.value)}
                  placeholder="—" className={`text-center ${inp}`} />
              </div>
            </div>

            <div>
              <label className={lbl}>Arma necessária (equipada)</label>
              {f.reqWeapon && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-e-card border border-e-border text-sm text-e-text">
                  <span className="flex-1">
                    {weapons.find((w) => w.weaponType === f.reqWeapon || w.id === f.reqWeapon)?.name ?? f.reqWeapon}
                    <span className="ml-2 text-[10px] text-e-faint font-mono">{f.reqWeapon}</span>
                  </span>
                  <button onClick={() => f.setReqWeapon('')} className="opacity-50 hover:opacity-100 text-xs">✕</button>
                </div>
              )}
              {!f.reqWeapon && (
                <>
                  <input value={f.reqWeaponSearch} onChange={(e) => f.setReqWeaponSearch(e.target.value)}
                    placeholder="Buscar tipo de arma…" className={inp} />
                  {f.reqWeaponSearch && (
                    <div className="mt-1 border border-e-border rounded-xl bg-e-bg max-h-36 overflow-y-auto">
                      {[...new Map(
                        weapons
                          .filter((w) => w.weaponType && (
                            w.name.toLowerCase().includes(f.reqWeaponSearch.toLowerCase()) ||
                            w.weaponType.toLowerCase().includes(f.reqWeaponSearch.toLowerCase())
                          ))
                          .map((w) => [w.weaponType, w])
                      ).values()].map((w) => (
                        <button key={w.weaponType} type="button"
                          onClick={() => { f.setReqWeapon(w.weaponType!); f.setReqWeaponSearch(''); }}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors text-e-text">
                          <span className="font-mono text-e-accent">{w.weaponType}</span>
                          <span className="ml-2 text-e-faint">{w.name}</span>
                        </button>
                      ))}
                      {weapons.filter((w) => w.weaponType && (
                        w.name.toLowerCase().includes(f.reqWeaponSearch.toLowerCase()) ||
                        w.weaponType.toLowerCase().includes(f.reqWeaponSearch.toLowerCase())
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
                <button onClick={f.addReqAttr} className="text-xs flex items-center gap-1 text-e-sub hover:text-e-text">
                  <Plus size={12} /> Adicionar
                </button>
              </div>
              {f.reqAttrs.map(([attr, val], i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Dropdown value={attr} onChange={(v) => f.updateReqAttr(i, 0, v)} options={ATTR_OPTS} />
                  </div>
                  <input type="number" min={1} value={val}
                    onChange={(e) => f.updateReqAttr(i, 1, e.target.value)}
                    className={`w-16 text-center ${smallInp}`} />
                  <button onClick={() => f.removeReqAttr(i)} className="opacity-40 hover:opacity-80 shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}
        </>}

        {/* ── Footer ── */}
        {f.error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 break-all mt-6">
            {f.error}
          </p>
        )}

        <div className="sticky bottom-0 flex gap-2 justify-end py-4 px-5 -mx-5 border-t border-e-border mt-8 bg-e-surface">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={f.loading}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={() => f.save(onSaved, onClose)} disabled={!f.name.trim() || f.loading}>
            {f.loading ? 'Salvando…' : f.editing ? 'Salvar' : 'Criar'}
          </Button>
        </div>

      </div>
      </div>
    </div>
  );
}
