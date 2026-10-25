'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, X } from 'lucide-react';
import type { Skill, Essencia } from './SkillCard';
import type { ItemCatalog } from '@/store/types';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import { useSkillForm } from './useSkillForm';
import { COST_OPTS } from '@/lib/costOptions';
import EfeitosEditor from './EfeitosEditor';
import TiposDanoPicker from '@/components/shared/TiposDanoPicker';
import Select from '@/components/ui/Select';
import { fmtEquilibrio } from '@/store/combateStore';

interface Props {
  skill?: Skill;
  essencias: Essencia[];
  classes: string[];
  weapons: ItemCatalog[];
  /** Todas as skills, para escolher a que não equipa junto com esta. */
  todasSkills: Skill[];
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
  { value: 'machadinhas',        label: 'Machadinhas'        },
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

type TabId = 'base' | 'turno' | 'combate' | 'maestria' | 'efeitos';

export default function SkillModal({ skill, essencias, classes, weapons, todasSkills, onClose, onSaved }: Props) {
  const f = useSkillForm(skill, essencias);
  const [tab, setTab] = useState<TabId>('base');

  const isEnemy = f.type === 'inimigo';

  const tabs = [
    { id: 'base'    as TabId, label: 'Base'          },
    !f.passive && !isEnemy && { id: 'turno'   as TabId, label: 'Turno & Custos' },
    !f.passive && { id: 'combate' as TabId, label: 'Combate'        },
    { id: 'efeitos' as TabId, label: 'Efeitos & Req' },
  ].filter(Boolean) as { id: TabId; label: string }[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[600px] max-w-[95vw] max-h-[92vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text">
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
                {f.weaponTypes.length > 1 && (
                  <div className="mt-3">
                    <label className={lbl}>Grupo de maestria <span className="normal-case font-normal">(com outra arma da lista, a skill pede maestria nela também)</span></label>
                    <div className="flex gap-1.5 flex-wrap">
                      {f.weaponTypes.map((t) => {
                        const ativo = (f.weaponTypes.includes(f.grupoMaestria) ? f.grupoMaestria : f.weaponTypes[0]) === t;
                        return (
                          <button key={t} type="button" onClick={() => f.setGrupoMaestria(t)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${ativo ? 'bg-e-gold/20 border-e-gold text-e-gold' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                            {WEAPON_OPTS.find((w) => w.value === t)?.label ?? t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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

            {f.temTier && (
              <div>
                <label className={lbl}>Tier <span className="normal-case font-normal">(equilíbrio, custo base e requisito: nível de classe, nível da Essência ou maestria da arma)</span></label>
                <div className="flex gap-1.5">
                  {[...f.tiers].sort((a, b) => a.tier - b.tier).map((t) => (
                    <button key={t.tier} type="button" onClick={() => f.setTier(t.tier)}
                      className={`flex-1 flex flex-col items-center px-2 py-1.5 rounded-xl border transition-colors ${f.tier === t.tier ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                      <span className="text-sm font-bold">{t.tier}</span>
                      <span className="text-[10px] opacity-70">/{fmtEquilibrio(t.equilibrio)} · {t.custoBase} FLX</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Uso: em quem, alcance e quantos alvos ── */}
          {!f.passive && (
            <div className={sec}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Uso</p>
              <div>
                <label className={lbl}>Em quem a skill é usada</label>
                <div className="flex gap-2">
                  {([
                    { value: 'USUARIO',  label: 'Em si mesmo', sub: 'buff, cura, escudo próprio' },
                    { value: 'INIMIGOS', label: 'Inimigos',    sub: 'dano, condições' },
                    { value: 'ALIADOS',  label: 'Aliados',     sub: 'cura, escudo, buff em outros' },
                  ] as const).map((o) => (
                    <button key={o.value} type="button" onClick={() => f.setAlvo(o.value)}
                      className={`flex-1 flex flex-col items-start px-3 py-2 rounded-xl border transition-colors text-left ${f.alvo === o.value ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                      <span className="text-sm font-semibold">{o.label}</span>
                      <span className="text-[10px] opacity-70">{o.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
              {f.alvo !== 'USUARIO' && (
                <div className="flex gap-3 items-end flex-wrap">
                  <div>
                    <label className={lbl}>Alcance</label>
                    <div className="flex gap-2">
                      {([
                        { area: false, label: 'Um alvo' },
                        { area: true,  label: 'Área (vários alvos)' },
                      ] as const).map((o) => (
                        <button key={String(o.area)} type="button" onClick={() => f.setHasMultiTarget(o.area)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${f.hasMultiTarget === o.area ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {f.hasMultiTarget && (
                    <div className="w-32">
                      <label className={lbl}>Até quantos alvos</label>
                      <input type="number" min={2} max={20} value={f.multiMaxTargets}
                        onChange={(e) => f.setMultiMaxTargets(e.target.value)} className={`text-center ${inp}`} />
                    </div>
                  )}
                </div>
              )}
              <p className="text-[11px] text-e-faint">
                {f.alvo === 'USUARIO' ? 'Os efeitos novos já começam no usuário.'
                  : f.alvo === 'ALIADOS' ? 'Os efeitos novos já começam em aliados; o mestre aplica neles na mesa.'
                  : f.hasMultiTarget ? `Atinge até ${f.multiMaxTargets || 2} inimigos; os efeitos novos já começam em área.`
                  : 'Atinge um inimigo; os efeitos novos já começam no alvo.'}
              </p>
            </div>
          )}

          {/* ── Comportamento ── */}
          {!isEnemy && (
            <div className={sec}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Comportamento</p>

              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'passive',  label: 'Passiva',      sub: 'Sem custo ativo',             active: f.passive,     color: 'teal',   disabled: false },
                  { key: 'ultimate', label: 'Ultimate',     sub: 'Habilidade de poder máximo',  active: f.ultimate,    color: 'amber',  disabled: false },
                  { key: 'pressao',  label: 'Pressão Dice', sub: 'd20 + pontos de Pressão',     active: f.pressaoDice, color: 'orange', disabled: f.passive },
                  { key: 'ignoraDef', label: 'Ignora toda DEF', sub: 'Acerta sempre, sem rolar acerto', active: f.ignoraDef, color: 'rose', disabled: f.passive },
                  { key: 'fimCombate', label: 'Recarga no fim do combate', sub: 'Uma vez por combate', active: Number(f.cooldown) >= 99, color: 'sky', disabled: f.passive },
                  { key: 'contra', label: 'Contra-ataque', sub: 'Inimigo que errar abre um contra-ataque', active: f.contraAtaque, color: 'amber', disabled: false },
                ] as const).map(({ key, label, sub, active, color, disabled }) => {
                  const colors: Record<string, string> = {
                    teal:   active ? 'border-teal-500/60   bg-teal-500/10   text-teal-300'   : '',
                    amber:  active ? 'border-amber-500/60  bg-amber-500/10  text-amber-300'  : '',
                    orange: active ? 'border-orange-500/60 bg-orange-500/10 text-orange-300' : '',
                    rose:   active ? 'border-rose-500/60   bg-rose-500/10   text-rose-300'   : '',
                    sky:    active ? 'border-sky-500/60    bg-sky-500/10    text-sky-300'    : '',
                  };
                  return (
                    <button key={key} type="button" disabled={disabled}
                      onClick={() => {
                        if (key === 'passive')  { f.togglePassive(); if (!f.passive) setTab('base'); }
                        if (key === 'ultimate') f.setUltimate((v: boolean) => !v);
                        if (key === 'pressao')  f.setPressaoDice((v: boolean) => !v);
                        if (key === 'ignoraDef') f.setIgnoraDef((v: boolean) => !v);
                        if (key === 'contra') f.setContraAtaque((v: boolean) => !v);
                        // Recarga 999: a recarga zera sozinha quando o combate termina
                        if (key === 'fimCombate') f.setCooldown(Number(f.cooldown) >= 99 ? '0' : '999');
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
          {/* ── Não equipa junto com (vale também para passivas, por isso fica na Base) ── */}
          <div className={sec}>
            <div>
              <label className={lbl}>Não equipa junto com <span className="normal-case font-normal">(uma ou outra: o slot recusa as duas juntas)</span></label>
              <Select value={f.exclusivaCom} onChange={f.setExclusivaCom} placeholder="Nenhuma"
                options={[{ value: '', label: 'Nenhuma' }, ...todasSkills
                  .filter((s) => s.id !== skill?.id)
                  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                  .map((s) => ({ value: s.id, label: `${s.name}${s.tier ? ` · T${s.tier}` : ''}${s.skillClass ? ` · ${s.skillClass}` : ''}` }))]} />
              {(() => {
                const apontam = todasSkills.filter((s) => skill && s.exclusivaCom === skill.id).map((s) => s.name);
                return apontam.length > 0
                  ? <p className="text-[11px] text-violet-300 mt-1.5">Também não equipa junto com {apontam.join(', ')} (marcado na outra skill).</p>
                  : null;
              })()}
            </div>
          </div>
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
                {Number(f.cooldown) >= 99
                  ? <p className="text-sm text-sky-300 py-2">Fim do combate</p>
                  : <input type="number" min={0} value={f.cooldown}
                      onChange={(e) => f.setCooldown(e.target.value)} className={`text-center ${inp}`} />}
              </div>
              <div className="w-36">
                <label className={lbl}>Crítico mínimo</label>
                <input type="number" min={1} max={20} value={f.critThreshold}
                  onChange={(e) => f.setCritThreshold(e.target.value)}
                  placeholder="arma" className={`text-center ${inp}`} />
              </div>
              <div className="w-36">
                <label className={lbl}>Bônus de acerto</label>
                <input type="number" value={f.bonusAcerto}
                  onChange={(e) => f.setBonusAcerto(e.target.value)}
                  placeholder="0" className={`text-center ${inp}`} />
              </div>
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
              <p className="text-xs text-e-faint italic">Sem custo: gratuita.</p>
            )}
            {f.temTier && (
              <p className={`text-[11px] ${f.custoAbaixoDoBase ? 'text-red-400' : 'text-e-faint'}`}>
                Custo base do Tier {f.tier}: {f.regra.custoBase} de Fluxo{f.custoAbaixoDoBase ? '. O custo de Fluxo está abaixo do base e não pode ser salvo.' : ' (mínimo).'}
              </p>
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
                  <div className="flex gap-1.5">
                    {(['formula', 'weapon'] as const).map((s) => (
                      <button key={s} onClick={() => f.setDamageSource(s)}
                        className={`flex-1 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
                          f.damageSource === s
                            ? 'border-e-accent bg-e-accent/10 text-e-accent'
                            : 'border-e-border text-e-faint hover:text-e-text'
                        }`}>
                        {s === 'formula' ? 'Fórmula' : 'Arma equipada'}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className={lbl}>Tipo de dano <span className="normal-case font-normal">(até 2, ex: Fogo numa skill de fogo; {f.damageSource === 'weapon'
                      ? 'se deixar vazio, usa o da arma equipada' : 'se deixar vazio, o golpe fica sem tipo e sai Neutro'})</span></label>
                    <TiposDanoPicker value={f.tiposDano} onChange={f.setTiposDano} vazio="Nenhum escolhido" />
                  </div>

                  {f.damageSource === 'formula' ? <>
                    <div className="flex gap-3 items-start flex-wrap">
                      <div className="w-24">
                        <label className={lbl}>Dano base</label>
                        <input type="number" min={0} value={f.dmgFixed}
                          onChange={(e) => f.setDmgFixed(e.target.value)} className={`text-center ${inp}`} />
                      </div>
                      {!f.temTier && (
                        <div className="w-24">
                          <label className={lbl}>Equilíbrio</label>
                          <input type="number" min={1} value={f.dmgEquilibrio}
                            onChange={(e) => f.setDmgEquilibrio(e.target.value)}
                            placeholder="vazio" className={`text-center ${inp}`} />
                        </div>
                      )}
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
                  </> : <>
                    <div className="w-[220px]">
                      <label className={lbl}>Mão</label>
                      <Dropdown
                        value={f.weaponSlot}
                        onChange={(v) => f.setWeaponSlot(v as 'mainHand' | 'offHand')}
                        options={[
                          { value: 'mainHand', label: 'Mão principal' },
                          { value: 'offHand',  label: 'Mão secundária' },
                        ]}
                      />
                    </div>

                    <div className="flex flex-col gap-2 border-t border-e-border pt-2.5">
                      <div className="flex items-center justify-between">
                        <label className={`${lbl} mb-0`}>Modificadores de dano</label>
                        <button onClick={f.addWeaponDamageModifier}
                          className="flex items-center gap-1 text-xs text-e-accent hover:opacity-80">
                          <Plus size={13} /> Adicionar
                        </button>
                      </div>
                      {f.weaponDamageModifiers.map((mod, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <div className="w-32">
                            <Dropdown
                              value={mod.type}
                              onChange={(v) => f.updateWeaponDamageModifier(i, {
                                type: v as 'flat' | 'percent' | 'extra_dice',
                                value: undefined, percentual: undefined, dice: undefined,
                              })}
                              options={[
                                { value: 'flat',       label: 'Fixo' },
                                { value: 'percent',    label: 'Percentual' },
                                { value: 'extra_dice', label: 'Dado extra' },
                              ]}
                            />
                          </div>
                          {mod.type === 'flat' && (
                            <input type="number" value={mod.value ?? 0}
                              onChange={(e) => f.updateWeaponDamageModifier(i, { value: Number(e.target.value) })}
                              placeholder="valor" className={`w-20 text-center ${smallInp}`} />
                          )}
                          {mod.type === 'percent' && (
                            <input type="number" value={mod.percentual ?? 0}
                              onChange={(e) => f.updateWeaponDamageModifier(i, { percentual: Number(e.target.value) })}
                              placeholder="%" className={`w-20 text-center ${smallInp}`} />
                          )}
                          {mod.type === 'extra_dice' && <>
                            <input type="number" min={1} value={mod.dice?.quantity ?? 1}
                              onChange={(e) => f.updateWeaponDamageModifier(i, { dice: { quantity: Number(e.target.value) || 1, die: mod.dice?.die ?? 'd6' } })}
                              placeholder="qtd" className={`w-14 text-center ${smallInp}`} />
                            <div className="w-20">
                              <Dropdown
                                value={mod.dice?.die ?? 'd6'}
                                onChange={(v) => f.updateWeaponDamageModifier(i, { dice: { quantity: mod.dice?.quantity ?? 1, die: v } })}
                                options={['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map((d) => ({ value: d, label: d }))}
                              />
                            </div>
                          </>}
                          <button onClick={() => f.removeWeaponDamageModifier(i)} className="opacity-40 hover:opacity-80 shrink-0">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>}
                </div>
              )}
            </div>

            {f.hasDamage && f.hasMultiTarget && f.alvo !== 'USUARIO' && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-3 flex flex-col gap-3">
                <p className="text-xs text-red-300">Área: até {f.multiMaxTargets || 2} alvos (definido em Base, na seção Uso). Como o dano se divide:</p>
                {(
                  <div className="flex flex-col gap-3">
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
        </>}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ABA: EFEITOS & REQ                                            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {tab === 'efeitos' && <>
          {/* ── Efeitos ── */}
          <div className={secFirst}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Efeitos</p>
            <p className="text-[11px] text-e-faint">
              Escolha em quem cada efeito cai e o que ele faz. As opções seguem o uso da skill (aba Base): em inimigos não há cura nem Escudo, e "passivo" só existe em si mesmo.
            </p>
            <EfeitosEditor value={f.efeitos} onChange={f.setEfeitos} presets={f.presets}
              uso={f.passive ? 'USUARIO' : f.alvo} area={f.hasMultiTarget && f.alvo !== 'USUARIO'} />
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
