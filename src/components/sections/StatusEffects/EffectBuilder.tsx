'use client';

import type { AutoEffect } from '@/store/types';
import Select from '@/components/ui/Select';

const TRIGGERS = [
  { value: 'on_turn_start',      label: 'Início do turno' },
  { value: 'on_turn_end',        label: 'Fim do turno' },
  { value: 'on_skill_use',       label: 'Ao usar skill' },
  { value: 'on_damage_received', label: 'Ao receber dano' },
];

const TYPES = [
  { value: 'damage_hp',              label: 'Dano HP' },
  { value: 'damage_flow',            label: 'Dano Flow' },
  { value: 'heal_hp',                label: 'Cura HP' },
  { value: 'heal_flow',              label: 'Cura Flow' },
  { value: 'block_skill',            label: 'Bloquear skill' },
  { value: 'modify_attribute',       label: 'Modificar atributo' },
  { value: 'modify_damage_dealt',    label: 'Mod. dano causado' },
  { value: 'modify_damage_received', label: 'Mod. dano recebido' },
];

const ATTRS = [
  { value: 'strength',     label: 'Força' },
  { value: 'agility',      label: 'Agilidade' },
  { value: 'intelligence', label: 'Inteligência' },
  { value: 'resistance',   label: 'Resistência' },
  { value: 'flow',         label: 'Fluxo' },
  { value: 'wisdom',       label: 'Sabedoria' },
  { value: 'presence',     label: 'Presença' },
  { value: 'defense',      label: 'Defesa' },
];


function emptyEffect(): AutoEffect {
  return { trigger: 'on_turn_start', type: 'damage_hp' };
}

export default function EffectBuilder({ effects, onChange }: { effects: AutoEffect[]; onChange: (e: AutoEffect[]) => void }) {
  const update = (i: number, patch: Partial<AutoEffect>) =>
    onChange(effects.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  const remove = (i: number) => onChange(effects.filter((_, idx) => idx !== i));

  const label = "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1 block";

  return (
    <div className="flex flex-col gap-3">
      {effects.map((eff, i) => (
        <div key={i} className="bg-e-card border border-e-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-e-sub">Efeito {i + 1}</span>
            <button type="button" onClick={() => remove(i)}
              className="text-xs text-e-faint hover:text-e-danger cursor-pointer transition-colors">
              Remover
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Trigger</label>
              <Select
                value={eff.trigger}
                onChange={(v) => update(i, { trigger: v })}
                options={TRIGGERS}
              />
            </div>
            <div>
              <label className={label}>Tipo</label>
              <Select
                value={eff.type}
                onChange={(v) => update(i, { type: v })}
                options={TYPES}
              />
            </div>

            <div>
              <label className={label}>Valor fixo</label>
              <input type="number" value={eff.value ?? 0}
                onChange={(e) => update(i, { value: Number(e.target.value) })} min={0} />
            </div>

            <div>
              <label className={label}>Percentual (%)</label>
              <input type="number" value={eff.percentual ?? 0}
                onChange={(e) => update(i, { percentual: Number(e.target.value) })} min={0} max={100} />
            </div>

            {eff.type === 'modify_attribute' && (
              <div className="col-span-2">
                <label className={label}>Atributo</label>
                <Select
                  value={eff.attribute ?? ''}
                  onChange={(v) => update(i, { attribute: v })}
                  options={ATTRS}
                  placeholder="Selecionar atributo…"
                />
              </div>
            )}

          </div>
        </div>
      ))}

      <button type="button" onClick={() => onChange([...effects, emptyEffect()])}
        className="py-2.5 rounded-xl border border-dashed border-e-border text-e-faint hover:border-e-border2 hover:text-e-sub text-sm transition-colors cursor-pointer">
        + Adicionar efeito
      </button>
    </div>
  );
}
