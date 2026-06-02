'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { proxyUrl } from '@/lib/gdrive';
import type { AllyAttack, AllyTemplate, BossImmunity } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import EmojiPicker from '@/components/ui/EmojiPicker';
import Checkbox from '@/components/ui/Checkbox';

interface Props {
  template?: AllyTemplate;
  onClose: () => void;
  onSaved: (t: AllyTemplate) => void;
}

const aBg     = { background: '#1a2e24', color: '#c8e8d8', border: '1px solid #2a4a3a' };
const aLabel  = { color: '#5a8a70' };
const aBorder = { borderColor: '#2a4a3a' };

const lbl      = 'text-[10px] font-bold uppercase tracking-widest mb-1.5 block';
const inp      = 'w-full text-sm rounded-xl px-3 py-2 border outline-none transition-colors placeholder:opacity-40';
const smallInp = 'text-sm rounded-xl px-2 py-2 border outline-none transition-colors';
const secFirst = 'flex flex-col gap-3 mt-4';

const IMMUNITY_KIND_OPTS = [
  { value: 'total',   label: 'Total'   },
  { value: 'partial', label: 'Parcial' },
];

type Tab = 'base' | 'combate' | 'extras';

export default function AllyTemplateModal({ template, onClose, onSaved }: Props) {
  const editing = !!template;
  const [tab, setTab] = useState<Tab>('base');

  const [name,        setName]        = useState(template?.name        ?? '');
  const [type,        setType]        = useState(template?.type        ?? '');
  const [hpMax,       setHpMax]       = useState(template?.hpMax       ?? 20);
  const [portraitUrl, setPortraitUrl] = useState(template?.portraitUrl ?? '');
  const [str,         setStr]         = useState(template?.attributes.strength     ?? 10);
  const [agi,         setAgi]         = useState(template?.attributes.agility      ?? 10);
  const [int_,        setInt]         = useState(template?.attributes.intelligence ?? 10);
  const [def,         setDef]         = useState(template?.attributes.defense      ?? 5);
  const rawAttacks = template?.attacks ?? [];
  const [basicDmgBase,    setBasicDmgBase]    = useState<number>(rawAttacks[0]?.damageBase ?? 0);
  const [basicAttr,       setBasicAttr]       = useState<string>(rawAttacks[0]?.damageAttribute ?? 'FOR');
  const [basicEquilibrio, setBasicEquilibrio] = useState<number>(rawAttacks[0]?.equilibrio ?? 4);
  const [skillAttacks,    setSkillAttacks]    = useState<AllyAttack[]>(rawAttacks.slice(1, 3));
  const [immunities,  setImmunities]  = useState<BossImmunity[]>(template?.immunities ?? []);
  const [desc,        setDesc]        = useState(template?.desc        ?? '');
  const [notes,       setNotes]       = useState(template?.notes       ?? '');
  const [loading,     setLoading]     = useState(false);
  const [skills,      setSkills]      = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    api.get<Skill[]>('/skills').then((r) => setSkills(r.data)).catch(() => {});
  }, []);

  function addSkillAttack() {
    if (skillAttacks.length < 2) setSkillAttacks((a) => [...a, { name: '', damage: '' }]);
  }
  function removeSkillAttack(i: number) {
    setSkillAttacks((a) => a.filter((_, j) => j !== i));
    setSkillSearch((s) => { const n = { ...s }; delete n[i]; return n; });
  }
  function linkSkill(i: number, skill: Skill) {
    setSkillAttacks((a) => a.map((x, j) => j === i
      ? { ...x, skillId: skill.id, skillName: skill.name, damage: skill.damage?.formula ?? x.damage, name: skill.name }
      : x
    ));
    setSkillSearch((s) => ({ ...s, [i]: '' }));
  }
  function unlinkSkill(i: number) {
    setSkillAttacks((a) => a.map((x, j) => j === i ? { ...x, skillId: undefined, skillName: undefined, name: '', damage: '' } : x));
  }

  function addImmunity() {
    setImmunities((p) => [...p, { type: '', icon: '🛡️', kind: 'total' }]);
  }
  function updateImmunity<K extends keyof BossImmunity>(i: number, f: K, v: BossImmunity[K]) {
    setImmunities((p) => p.map((x, j) => j === i ? { ...x, [f]: v } : x));
  }
  function toggleFlag(i: number, on: boolean) {
    setImmunities((p) => p.map((x, j) => j === i ? { ...x, isFlag: on, type: on ? '' : x.type } : x));
  }

  async function save() {
    if (!name.trim()) return;
    setLoading(true);
    const basicFormula = [basicDmgBase > 0 ? String(basicDmgBase) : null, `d20×${basicAttr}/${basicEquilibrio}`].filter(Boolean).join(' + ');
    const allAttacks: AllyAttack[] = [
      { name: 'Ataque Básico', damage: basicFormula, damageBase: basicDmgBase, damageAttribute: basicAttr, equilibrio: basicEquilibrio },
      ...skillAttacks.filter((a) => a.skillId),
    ];
    const body = {
      name: name.trim(), type: type.trim(), hpMax,
      portraitUrl: portraitUrl || null,
      attributes: { strength: str, agility: agi, intelligence: int_, defense: def },
      attacks: allAttacks,
      immunities, desc, notes,
    };
    try {
      const res = editing
        ? await api.put<AllyTemplate>(`/allies/${template!.id}`, body)
        : await api.post<AllyTemplate>('/allies', body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const tabBtn = (id: Tab) =>
    `flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
      tab === id
        ? 'bg-teal-500/20 border-teal-500/60 text-teal-300'
        : 'text-[#5a8a70] hover:opacity-100 opacity-60'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[440px] max-h-[92vh] overflow-y-auto rounded-xl border"
        style={{ background: '#151e1a', borderColor: '#2a4a3a', color: '#c8e8d8' }}>
      <div className="flex flex-col px-5 pt-5 pb-0">

        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <h2 className="font-bold text-base">{editing ? 'Editar aliado' : 'Novo aliado'}</h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-50 hover:opacity-100 hover:bg-white/10 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1.5 pb-3 border-b" style={aBorder}>
          <button type="button" className={tabBtn('base')}    onClick={() => setTab('base')}>Base</button>
          <button type="button" className={tabBtn('combate')} onClick={() => setTab('combate')}>Combate</button>
          <button type="button" className={tabBtn('extras')}  onClick={() => setTab('extras')}>Extras</button>
        </div>

        {/* ── ABA BASE ── */}
        {tab === 'base' && <>
          <div className={secFirst}>
            <div className="flex gap-3 items-start">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: '#1a2e24', border: '1px solid #2a4a3a' }}>
                {portraitUrl ? (
                  <img src={proxyUrl(portraitUrl)} alt="" className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <UserRound size={28} style={{ color: '#5a8a70' }} />
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className={inp} style={aBg} placeholder="Nome do aliado" />
                <input value={portraitUrl} onChange={(e) => setPortraitUrl(e.target.value)}
                  className={inp} style={aBg} placeholder="URL da imagem (opcional)" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-5 pt-5 border-t" style={aBorder}>
            <label className={lbl} style={aLabel}>Tipo</label>
            <input value={type} onChange={(e) => setType(e.target.value)}
              className={inp} style={aBg} placeholder="ex: Humano, Criatura…" />
          </div>
        </>}

        {/* ── ABA COMBATE ── */}
        {tab === 'combate' && <>
          <div className={secFirst}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={aLabel}>Estatísticas</p>
            <div className="grid grid-cols-5 gap-2">
              {([
                { label: 'HP máx', value: hpMax, set: setHpMax, showMod: false },
                { label: 'FOR',    value: str,   set: setStr,   showMod: true  },
                { label: 'AGI',    value: agi,   set: setAgi,   showMod: true  },
                { label: 'INT',    value: int_,  set: setInt,   showMod: true  },
                { label: 'DEF',    value: def,   set: setDef,   showMod: true  },
              ] as { label: string; value: number; set: (n: number) => void; showMod: boolean }[]).map(({ label, value, set, showMod }) => {
                const mod = Math.floor((value - 10) / 2);
                return (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={aLabel}>{label}</p>
                    <input type="number" value={value} onChange={(e) => set(Number(e.target.value))}
                      className={`${smallInp} w-full text-center`} style={aBg} />
                    {showMod && (
                      <span className="text-[10px] font-bold" style={{ color: mod >= 0 ? '#3dba72' : '#e05050' }}>
                        {mod >= 0 ? `+${mod}` : mod}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ataque básico */}
          <div className="flex flex-col gap-3 mt-5 pt-5 border-t" style={aBorder}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={aLabel}>Ataque básico</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={aLabel}>Dano base</p>
                <input type="number" value={basicDmgBase} onChange={(e) => setBasicDmgBase(Number(e.target.value))}
                  className={`${smallInp} w-full text-center`} style={aBg} min={0} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={aLabel}>Atributo</p>
                <select value={basicAttr} onChange={(e) => setBasicAttr(e.target.value)}
                  className={`w-full ${smallInp}`} style={aBg}>
                  <option value="FOR">FOR</option>
                  <option value="AGI">AGI</option>
                  <option value="INT">INT</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={aLabel}>Equilíbrio</p>
                <input type="number" value={basicEquilibrio} onChange={(e) => setBasicEquilibrio(Number(e.target.value))}
                  className={`${smallInp} w-full text-center`} style={aBg} min={1} />
              </div>
            </div>
            <p className="text-[10px] font-mono opacity-50">
              ⚔ {[basicDmgBase > 0 ? String(basicDmgBase) : null, `d20×${basicAttr}/${basicEquilibrio}`].filter(Boolean).join(' + ')}
            </p>
          </div>

          {/* Habilidades */}
          <div className="flex flex-col gap-3 mt-5 pt-5 border-t" style={aBorder}>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest" style={aLabel}>Habilidades <span className="normal-case font-normal opacity-60">(máx 2)</span></p>
              {skillAttacks.length < 2 && (
                <button onClick={addSkillAttack} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                  <Plus size={12} /> Adicionar
                </button>
              )}
            </div>
            {skillAttacks.map((atk, i) => {
              const search = skillSearch[i] ?? '';
              const filtered = search.length > 0
                ? skills.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
                : [];
              return (
                <div key={i}>
                  {atk.skillId ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                      style={{ background: 'rgba(80,180,140,0.1)', borderColor: 'rgba(80,180,140,0.3)' }}>
                      <span style={{ color: '#80d8b0' }}>⚡</span>
                      <span className="flex-1 text-sm font-medium truncate" style={{ color: '#c8e8d8' }}>{atk.skillName}</span>
                      {atk.damage && <span className="font-mono text-xs opacity-50">{atk.damage}</span>}
                      <button onClick={() => unlinkSkill(i)} className="text-[10px] opacity-50 hover:opacity-100 shrink-0">Trocar</button>
                      <button onClick={() => removeSkillAttack(i)} className="opacity-40 hover:opacity-80 shrink-0"><Trash2 size={12} /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input value={search}
                          onChange={(e) => setSkillSearch((s) => ({ ...s, [i]: e.target.value }))}
                          className={inp} style={aBg} placeholder="Buscar habilidade do catálogo…" />
                        {filtered.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg overflow-hidden shadow-lg border"
                            style={{ background: '#151e1a', borderColor: '#2a4a3a' }}>
                            {filtered.map((sk) => (
                              <button key={sk.id} onClick={() => linkSkill(i, sk)}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                                style={{ color: '#c8e8d8' }}>
                                <span style={{ color: '#80d8b0' }}>⚡</span>
                                <span>{sk.name}</span>
                                {sk.damage && <span className="font-mono ml-auto opacity-50">{sk.damage.formula}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeSkillAttack(i)} className="opacity-40 hover:opacity-80 shrink-0"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              );
            })}
            {skillAttacks.length === 0 && <p className="text-xs opacity-50 italic">Nenhuma habilidade vinculada.</p>}
          </div>
        </>}

        {/* ── ABA EXTRAS ── */}
        {tab === 'extras' && <>
          <div className={secFirst}>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest" style={aLabel}>Imunidades</p>
              <button onClick={addImmunity}
                className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {immunities.map((im, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex gap-2 items-center">
                  <EmojiPicker value={im.icon} onChange={(v) => updateImmunity(i, 'icon', v)} size="sm" />
                  {!im.isFlag && (
                    <Select
                      value={im.kind ?? 'total'}
                      onChange={(v) => updateImmunity(i, 'kind', v as 'total' | 'partial')}
                      options={IMMUNITY_KIND_OPTS}
                      className="w-28 shrink-0"
                    />
                  )}
                  {im.isFlag ? (
                    <span className="flex-1 text-xs opacity-50 italic">Imunidade genérica (sem tipo)</span>
                  ) : (
                    <input value={im.type}
                      onChange={(e) => updateImmunity(i, 'type', e.target.value)}
                      className={inp} style={aBg}
                      placeholder={im.kind === 'partial' ? 'Label (ex: Espadas)' : 'Tipo (ex: Veneno)'} />
                  )}
                  <button onClick={() => setImmunities((p) => p.filter((_, j) => j !== i))}
                    className="opacity-40 hover:opacity-80 shrink-0 transition-opacity">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 ml-11 cursor-pointer" onClick={() => toggleFlag(i, !im.isFlag)}>
                  <Checkbox checked={!!im.isFlag} onChange={(v) => toggleFlag(i, v)} color="default" />
                  <span className="text-[10px] opacity-50 select-none">Imunidade genérica (sem tipo nomeado)</span>
                </div>
                {im.kind === 'partial' && !im.isFlag && (
                  <input
                    value={(im.sources ?? []).join(', ')}
                    onChange={(e) => updateImmunity(i, 'sources', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    className={`ml-11 ${inp}`} style={aBg}
                    placeholder="Fontes (ex: espada, Essência do Fogo)" />
                )}
              </div>
            ))}
            {immunities.length === 0 && <p className="text-xs opacity-50 italic">Nenhuma imunidade.</p>}
          </div>

          <div className="flex flex-col gap-3 mt-5 pt-5 border-t" style={aBorder}>
            <label className={lbl} style={aLabel}>Descrição <span className="normal-case font-normal">(visível ao jogador)</span></label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              className={`resize-none ${inp}`} style={aBg} placeholder="Aparência, comportamento…" />
          </div>

          <div className="flex flex-col gap-3 mt-5 pt-5 border-t" style={aBorder}>
            <label className={lbl} style={aLabel}>Observações <span className="normal-case font-normal">(privado)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className={`resize-none ${inp}`} style={aBg} placeholder="Notas internas…" />
          </div>
        </>}

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-2 justify-end py-4 px-5 -mx-5 mt-8 border-t"
          style={{ background: '#151e1a', borderColor: '#2a4a3a' }}>
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
