'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ClassKit, ClassPerks, ItemCatalog } from '@/store/types';
import type { Skill } from '@/components/sections/Habilidades/SkillCard';
import Button from '@/components/ui/Button';

interface Props {
  kit?: ClassKit;
  skills: Skill[];
  items: ItemCatalog[];
  onClose: () => void;
  onSaved: (k: ClassKit) => void;
}

const lbl = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';
const inp = 'w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors';

const ATTRS = ['strength', 'agility', 'intelligence', 'resistance', 'flow', 'wisdom', 'presence', 'defense'] as const;
const ATTR_LABEL: Record<string, string> = {
  strength: 'FOR', agility: 'AGI', intelligence: 'INT', resistance: 'RES',
  flow: 'FLX', wisdom: 'SAB', presence: 'PRE', defense: 'DEF',
};
const ATTR_FULL: Record<string, string> = {
  strength: 'Força', agility: 'Agilidade', intelligence: 'Inteligência', resistance: 'Resistência',
  flow: 'Fluxo', wisdom: 'Sabedoria', presence: 'Presença', defense: 'Defesa',
};

export default function ClassKitModal({ kit, skills, items, onClose, onSaved }: Props) {
  const editing = !!kit;

  const [skillClass, setSkillClass] = useState(kit?.skillClass ?? '');
  const [attrs, setAttrs] = useState<Record<string, string>>(
    Object.fromEntries(ATTRS.map((a) => [a, String((kit?.starterAttributes as any)?.[a] ?? 0)]))
  );

  // Habilidades iniciais
  const [skillSearch,    setSkillSearch]    = useState('');
  const [starterSkillIds, setStarterSkillIds] = useState<string[]>(kit?.starterSkillIds ?? []);

  // Itens iniciais: { id, qty }
  const [itemSearch,    setItemSearch]    = useState('');
  const [starterItems,  setStarterItems]  = useState<{ id: string; qty: number }[]>(
    kit?.starterItems.map((i) => ({ id: i.id, qty: i.qty })) ?? []
  );

  const [hasPressureBar, setHasPressureBar] = useState(kit?.perks?.hasPressureBar ?? false);
  const [unarmedDamage, setUnarmedDamage] = useState(kit?.perks?.unarmedDamage ?? '');

  const [loading, setLoading] = useState(false);

  function toggleSkill(id: string) {
    setStarterSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function addItem(id: string) {
    setStarterItems((prev) => {
      if (prev.find((x) => x.id === id)) return prev;
      return [...prev, { id, qty: 1 }];
    });
    setItemSearch('');
  }

  function removeItem(id: string) {
    setStarterItems((prev) => prev.filter((x) => x.id !== id));
  }

  function setItemQty(id: string, qty: number) {
    setStarterItems((prev) => prev.map((x) => x.id === id ? { ...x, qty } : x));
  }

  async function save() {
    if (!skillClass.trim()) return;
    setLoading(true);

    const builtItems = starterItems.map(({ id, qty }) => {
      const catalog = items.find((i) => i.id === id);
      return {
        id, name: catalog?.name ?? '', desc: catalog?.desc ?? '',
        qty, type: catalog?.type ?? 'normal', icon: catalog?.icon,
      };
    });

    const perks: ClassPerks = { hasPressureBar, unarmedDamage: unarmedDamage.trim() || undefined };

    const body = {
      skillClass: skillClass.trim(),
      starterAttributes: Object.fromEntries(ATTRS.map((a) => [a, Number(attrs[a]) || 0])),
      starterSlots: [],
      starterSkillIds,
      starterItems: builtItems,
      starterEquipment: kit?.starterEquipment ?? {},
      perks,
    };

    try {
      const res = editing
        ? await api.put<ClassKit>(`/master/kits/${kit!.id}`, body)
        : await api.post<ClassKit>('/master/kits', body);
      onSaved(res.data);
      onClose();
    } catch {
      setLoading(false);
    }
  }

  const filteredSkills = skills.filter(
    (s) => s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );
  const filteredItems = items.filter(
    (i) => i.name.toLowerCase().includes(itemSearch.toLowerCase()) &&
           !starterItems.find((x) => x.id === i.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[560px] max-h-[92vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text">
      <div className="flex flex-col gap-5 p-5">

        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">{editing ? 'Editar classe' : 'Nova classe'}</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>

        {/* Nome da classe */}
        <div>
          <label className={lbl}>Nome da classe</label>
          <input value={skillClass} onChange={(e) => setSkillClass(e.target.value)}
            className={inp} placeholder="ex: Intenso, Preciso, Guardião…" />
        </div>


        {/* Peculiaridades */}
        <div className="flex flex-col gap-3">
          <label className={lbl}>Peculiaridades da classe</label>
          <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl bg-e-bg border border-e-border hover:border-e-border2 transition-colors">
            <input type="checkbox" checked={hasPressureBar} onChange={(e) => setHasPressureBar(e.target.checked)}
              className="w-4 h-4 accent-orange-400 shrink-0" />
            <div>
              <p className="text-sm text-e-text font-medium">Barra de Pressão</p>
              <p className="text-[11px] text-e-faint">Habilita o recurso de pressão (ex: Intenso)</p>
            </div>
          </label>
          <div className="flex flex-col gap-1.5">
            <label className={lbl}>Dano desarmado</label>
            <input
              value={unarmedDamage}
              onChange={(e) => setUnarmedDamage(e.target.value)}
              className={inp}
              placeholder="ex: 1d4+FOR, 1d6+AGI…"
            />
            <p className="text-[11px] text-e-faint">Fórmula de dano sem arma equipada</p>
          </div>
        </div>

        {/* Atributos iniciais */}
        <div>
          <label className={lbl}>Atributos iniciais</label>
          <div className="grid grid-cols-4 gap-2">
            {ATTRS.map((a) => (
              <div key={a} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-e-faint"
                  title={ATTR_FULL[a]}>{ATTR_LABEL[a]}</span>
                <input
                  type="number" min={0} value={attrs[a]}
                  onChange={(e) => setAttrs((prev) => ({ ...prev, [a]: e.target.value }))}
                  className="w-full text-center text-sm rounded-lg px-1 py-1.5 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Habilidades iniciais */}
        <div className="flex flex-col gap-2">
          <label className={lbl}>Habilidades iniciais</label>
          <input value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)}
            placeholder="Buscar habilidade…" className={inp} />
          {skillSearch && (
            <div className="border border-e-border rounded-xl bg-e-bg max-h-36 overflow-y-auto">
              {filteredSkills.length === 0
                ? <p className="px-3 py-2 text-sm text-e-faint">Nenhuma encontrada.</p>
                : filteredSkills.map((s) => (
                  <button key={s.id} type="button" onClick={() => { toggleSkill(s.id); setSkillSearch(''); }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors text-e-text flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className="text-[10px] text-e-faint">{s.skillClass || 'Geral'}</span>
                  </button>
                ))
              }
            </div>
          )}
          {starterSkillIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {starterSkillIds.map((id) => {
                const s = skills.find((x) => x.id === id);
                return (
                  <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-e-card text-xs text-e-text">
                    {s?.name ?? id}
                    <button onClick={() => toggleSkill(id)} className="opacity-50 hover:opacity-100">✕</button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Itens iniciais */}
        <div className="flex flex-col gap-2">
          <label className={lbl}>Itens iniciais</label>
          <input value={itemSearch} onChange={(e) => setItemSearch(e.target.value)}
            placeholder="Buscar item no catálogo…" className={inp} />
          {itemSearch && (
            <div className="border border-e-border rounded-xl bg-e-bg max-h-36 overflow-y-auto">
              {filteredItems.length === 0
                ? <p className="px-3 py-2 text-sm text-e-faint">Nenhum encontrado.</p>
                : filteredItems.map((i) => (
                  <button key={i.id} type="button" onClick={() => addItem(i.id)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors text-e-text flex items-center justify-between">
                    <span>{i.name}</span>
                    <span className="text-[10px] text-e-faint capitalize">{i.type}</span>
                  </button>
                ))
              }
            </div>
          )}
          {starterItems.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {starterItems.map(({ id, qty }) => {
                const item = items.find((x) => x.id === id);
                return (
                  <div key={id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-e-card">
                    <span className="flex-1 text-sm text-e-text">{item?.name ?? id}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setItemQty(id, Math.max(1, qty - 1))}
                        className="w-5 h-5 rounded text-e-sub hover:text-e-text flex items-center justify-center text-xs">−</button>
                      <span className="w-6 text-center text-sm font-mono text-e-text">{qty}</span>
                      <button onClick={() => setItemQty(id, qty + 1)}
                        className="w-5 h-5 rounded text-e-sub hover:text-e-text flex items-center justify-center text-xs">+</button>
                    </div>
                    <button onClick={() => removeItem(id)} className="opacity-40 hover:opacity-80">
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-1 border-t border-e-border">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!skillClass.trim() || loading}>
            {loading ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
          </Button>
        </div>

      </div>
      </div>
    </div>
  );
}
