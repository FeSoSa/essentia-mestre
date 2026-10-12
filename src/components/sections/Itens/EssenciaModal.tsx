'use client';

import { useState } from 'react';
import { X, Trash2, Wand2 } from 'lucide-react';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { tabelaBonusPadrao } from '@/lib/atributos';
import type { Essencia } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import { STATUS_ICONS } from '@/lib/statusIcons';

const TYPES = ['Elemental', 'Mitica', 'Derivada'];

const ATTRS: { key: string; label: string }[] = [
  { key: 'strength',     label: 'FOR' },
  { key: 'agility',      label: 'AGI' },
  { key: 'intelligence', label: 'INT' },
  { key: 'resistance',   label: 'RES' },
  { key: 'flow',         label: 'FLX' },
  { key: 'wisdom',       label: 'SAB' },
  { key: 'presence',     label: 'PRE' },
];

const COLOR_SWATCHES = [
  '#d4a84e', // gold
  '#a855f7', // purple
  '#4ade80', // teal
  '#ef4444', // red
  '#3b82f6', // blue
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#e2e8f0', // white
  '#71717a', // zinc
  '#7c3aed', // violet
];

const lbl = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';

interface Props {
  essencia?: Essencia;
  essencias: Essencia[];
  skills: Skill[];
  onClose: () => void;
  onSaved: (e: Essencia) => void;
}

export default function EssenciaModal({ essencia, essencias, skills, onClose, onSaved }: Props) {
  const [name,     setName]     = useState(essencia?.name ?? '');
  const [type,     setType]     = useState(essencia?.type ?? 'Derivada');
  const [parentId, setParentId] = useState(essencia?.parentId ?? '');
  // Derivada: nível da mãe que libera a Derivada (null = só tendo a Derivada)
  const [nivelMae, setNivelMae] = useState<number | null>(essencia?.nivelMaeNecessario ?? null);
  const [desc,    setDesc]    = useState(essencia?.desc ?? '');
  const [icon,    setIcon]    = useState(essencia?.icon ?? '');
  const [color,   setColor]   = useState(essencia?.color ?? '');
  const [colorInput, setColorInput] = useState(essencia?.color ?? '');
  // Bônus por nível: quanto cada nível (1 a 4) soma. Sem tabela salva, parte da regra padrão sobre o bônus total.
  const [tabela, setTabela] = useState<Record<string, number>[]>(() => {
    const salva = essencia?.bonusPorNivel ?? [];
    const base = salva.length ? salva : tabelaBonusPadrao(essencia?.attributeBonus ?? {});
    return [0, 1, 2, 3].map((i) => ({ ...(base[i] ?? {}) }));
  });
  const [attrs, setAttrs] = useState<string[]>(() =>
    ATTRS.map((a) => a.key).filter((k) => (essencia?.bonusPorNivel ?? []).some((m) => k in m) || k in (essencia?.attributeBonus ?? {})));
  const [saving, setSaving] = useState(false);

  const linkedSkills = essencia
    ? skills.filter((s) => s.essenciaId === essencia.id)
    : [];

  const acumulado = (attr: string, nivel: number) => tabela.slice(0, nivel).reduce((t, m) => t + (m[attr] ?? 0), 0);

  function setCelula(attr: string, nivel: number, val: number) {
    setTabela((t) => t.map((m, i) => (i === nivel - 1 ? { ...m, [attr]: val } : m)));
  }
  function removeAttr(attr: string) {
    setAttrs((a) => a.filter((k) => k !== attr));
    setTabela((t) => t.map((m) => Object.fromEntries(Object.entries(m).filter(([k]) => k !== attr))));
  }
  /** Mantém o total de cada atributo e redistribui pela regra padrão (25/50/75/100%). */
  function distribuirPadrao() {
    const totais = Object.fromEntries(attrs.map((k) => [k, acumulado(k, 4)]));
    const padrao = tabelaBonusPadrao(totais);
    setTabela([0, 1, 2, 3].map((i) => ({ ...padrao[i] })));
  }

  function pickColor(hex: string) {
    setColor(hex);
    setColorInput(hex);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      // A API recalcula o total (attributeBonus) somando a tabela
      const bonusPorNivel = attrs.length
        ? tabela.map((m) => Object.fromEntries(attrs.map((k) => [k, m[k] ?? 0]).filter(([, v]) => v !== 0)))
        : [];
      const attributeBonus = Object.fromEntries(attrs.map((k) => [k, acumulado(k, 4)]).filter(([, v]) => v !== 0));
      const skillIds = linkedSkills.map((s) => s.id);
      const payload = {
        name, type, desc, attributeBonus, bonusPorNivel, skillIds,
        icon: icon || null, color: color || null,
        parentId: type === 'Derivada' ? parentId || null : null,
        nivelMaeNecessario: type === 'Derivada' && parentId ? nivelMae : null,
      };
      const res = essencia
        ? await api.put<Essencia>(`/master/essencias/${essencia.id}`, payload)
        : await api.post<Essencia>('/master/essencias', payload);
      onSaved(res.data);
      onClose();
    } catch {}
    finally { setSaving(false); }
  }

  const selectedIconEntry = STATUS_ICONS.find((i) => i.name === icon);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <div className="flex items-center gap-3">
            {selectedIconEntry && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: (color || '#71717a') + '22', color: color || '#71717a' }}>
                <selectedIconEntry.Icon size={16} />
              </div>
            )}
            <h3 className="font-semibold text-e-text">{essencia ? 'Editar Essência' : 'Nova Essência'}</h3>
          </div>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-4 flex-1">

          <div>
            <label className={lbl}>Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Essência do Fogo" required />
          </div>

          <div>
            <label className={lbl}>Tipo</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    type === t
                      ? 'bg-e-accent/15 border-e-accent text-e-accent'
                      : 'border-e-border text-e-faint hover:border-e-border2 hover:text-e-sub'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {type === 'Derivada' && (
            <div>
              <label className={lbl}>Essência Elemental (origem)</label>
              <Select
                value={parentId}
                onChange={setParentId}
                options={[
                  { value: '', label: 'Nenhuma' },
                  ...essencias
                    .filter((e) => (e.type === 'Elemental' || e.type === 'Grande') && e.id !== essencia?.id)
                    .map((e) => ({ value: e.id, label: e.name })),
                ]}
              />
              {parentId && (
                <div className="mt-3">
                  <label className={lbl}>Liberada pela Essência-mãe a partir do nível</label>
                  <div className="flex gap-1.5">
                    {[null, 1, 2, 3, 4].map((n) => (
                      <button key={String(n)} type="button" onClick={() => setNivelMae(n)}
                        className={`flex-1 py-1.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                          nivelMae === n ? 'bg-e-accent/15 border-e-accent text-e-accent' : 'border-e-border text-e-faint hover:border-e-border2'}`}>
                        {n == null ? 'Não' : n}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-e-faint mt-1">
                    {nivelMae == null
                      ? 'Só quem tiver esta Derivada acessa as skills dela.'
                      : `Quem tiver a Essência-mãe no nível ${nivelMae} ou acima acessa as skills desta Derivada (o requisito e a maestria usam a mãe).`}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className={lbl}>Descrição</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Descrição da essência…" rows={3}
              className="w-full rounded-xl px-3 py-2 bg-e-bg border border-e-border text-sm text-e-text resize-none outline-none focus:border-e-border2 transition-colors placeholder:text-e-faint" />
          </div>

          {/* Ícone */}
          <div>
            <label className={lbl}>Ícone</label>
            <div className="grid grid-cols-9 gap-1.5">
              {/* Sem ícone */}
              <button type="button" onClick={() => setIcon('')}
                className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center text-[9px] font-bold ${
                  !icon ? 'border-e-accent bg-e-accent/10 text-e-accent' : 'border-e-border hover:border-e-border2 text-e-faint'
                }`}>
                sem
              </button>
              {STATUS_ICONS.map(({ name: n, Icon }) => (
                <button key={n} type="button" title={n} onClick={() => setIcon(icon === n ? '' : n)}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                    icon === n
                      ? 'border-e-accent bg-e-accent/10 text-e-accent'
                      : 'border-e-border hover:border-e-border2 text-e-faint hover:text-e-sub'
                  }`}
                  style={icon === n && color ? { borderColor: color, backgroundColor: color + '22', color } : {}}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className={lbl}>Cor</label>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-6 gap-1.5">
                {COLOR_SWATCHES.map((c) => (
                  <button key={c} type="button" onClick={() => pickColor(c)}
                    className={`h-7 rounded-lg border-2 transition-all cursor-pointer ${
                      color === c ? 'scale-110 border-white/50' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }} />
                ))}
                {/* Sem cor */}
                <button type="button" onClick={() => pickColor('')}
                  className={`h-7 rounded-lg border transition-colors cursor-pointer flex items-center justify-center text-[9px] font-bold ${
                    !color ? 'border-e-accent text-e-accent' : 'border-e-border text-e-faint hover:border-e-border2'
                  }`}>
                  auto
                </button>
              </div>
              {/* Hex custom */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg border border-e-border shrink-0"
                  style={{ backgroundColor: colorInput || 'transparent' }} />
                <input type="text" value={colorInput}
                  onChange={(e) => {
                    setColorInput(e.target.value);
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColor(e.target.value);
                  }}
                  placeholder="#rrggbb"
                  className="flex-1 rounded-xl px-3 py-1.5 bg-e-bg border border-e-border text-sm text-e-text outline-none focus:border-e-border2 transition-colors placeholder:text-e-faint font-mono" />
              </div>
            </div>
          </div>

          {/* Bônus de atributos por nível (acumulado) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${lbl} !mb-0`}>Bônus de atributos por nível</label>
              {attrs.length > 0 && (
                <button type="button" onClick={distribuirPadrao} title="Mantém o total e redistribui 25/50/75/100% pelos níveis"
                  className="flex items-center gap-1 text-[11px] text-e-faint hover:text-e-accent transition-colors cursor-pointer">
                  <Wand2 size={12} /> Distribuir pelo padrão
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {attrs.length > 0 && (
                <div className="rounded-xl border border-e-border bg-e-bg/60 p-2.5 flex flex-col gap-1.5">
                  <div className="grid grid-cols-[3rem_repeat(4,1fr)_2.5rem_1.75rem] gap-1.5 items-center text-[10px] font-bold uppercase tracking-widest text-e-faint">
                    <span />
                    {[1, 2, 3, 4].map((n) => <span key={n} className="text-center">Nv {n}</span>)}
                    <span className="text-center">Total</span>
                    <span />
                  </div>
                  {attrs.map((k) => (
                    <div key={k} className="grid grid-cols-[3rem_repeat(4,1fr)_2.5rem_1.75rem] gap-1.5 items-start">
                      <span className="text-sm font-semibold text-e-text pt-1.5">{ATTRS.find((a) => a.key === k)?.label ?? k}</span>
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex flex-col items-center gap-0.5">
                          <input type="number" value={tabela[n - 1][k] ?? 0} onChange={(e) => setCelula(k, n, Number(e.target.value))}
                            className="!px-1 !py-1.5 !text-center tabular-nums" aria-label={`${k} nível ${n}`} />
                          <span className="text-[10px] text-e-faint tabular-nums">= {acumulado(k, n) > 0 ? '+' : ''}{acumulado(k, n)}</span>
                        </div>
                      ))}
                      <span className="text-sm font-semibold text-e-accent text-center pt-1.5 tabular-nums">
                        {acumulado(k, 4) > 0 ? '+' : ''}{acumulado(k, 4)}
                      </span>
                      <button type="button" onClick={() => removeAttr(k)} aria-label="Remover atributo"
                        className="p-1.5 mt-0.5 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-danger/10 transition-colors cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <p className="text-[11px] text-e-faint pt-1">
                    Cada campo é o que o nível soma; embaixo, o total que o jogador tem com a Essência naquele nível.
                  </p>
                </div>
              )}
              {attrs.length < ATTRS.length && (
                <Select variant="action" value="" placeholder="Adicionar atributo"
                  onChange={(k) => setAttrs((a) => ATTRS.map((x) => x.key).filter((x) => x === k || a.includes(x)))}
                  options={ATTRS.filter((a) => !attrs.includes(a.key)).map((a) => ({ value: a.key, label: a.label }))} />
              )}
            </div>
          </div>

          {/* Habilidades vinculadas */}
          <div>
            <label className={lbl}>Habilidades vinculadas</label>
            {linkedSkills.length === 0 ? (
              <p className="text-xs text-e-faint py-2">
                {essencia
                  ? 'Nenhuma habilidade vinculada. Crie habilidades do tipo Essência em Habilidades e selecione esta essência.'
                  : 'Salve a essência e depois vincule habilidades a ela na seção Habilidades.'}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {linkedSkills.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-e-bg border border-e-border">
                    <span className="flex-1 text-sm text-e-text truncate">{s.name}</span>
                    {s.ultimate && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 uppercase tracking-wider">ULT</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-e-border">
            <Button type="button" variant="ghost" size="md" className="w-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={saving}>
              {saving ? 'Salvando…' : essencia ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
