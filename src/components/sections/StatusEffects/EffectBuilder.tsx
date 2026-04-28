'use client';

import type { AutoEffect, Dice } from '@/store/types';

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

const ATTRS = ['strength', 'agility', 'intelligence', 'resistance', 'flow', 'wisdom', 'presence', 'defense'];
const DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

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
              <select value={eff.trigger} onChange={(e) => update(i, { trigger: e.target.value })}>
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Tipo</label>
              <select value={eff.type} onChange={(e) => update(i, { type: e.target.value })}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
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
                <select value={eff.attribute ?? ''} onChange={(e) => update(i, { attribute: e.target.value })}>
                  <option value="">Selecionar…</option>
                  {ATTRS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}

            <div className="col-span-2">
              <label className={label}>Dado (opcional)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="qtd"
                  value={eff.dice?.quantity ?? 0}
                  onChange={(e) => update(i, { dice: { quantity: Number(e.target.value), die: eff.dice?.die ?? 'd6' } as Dice })}
                  className="!w-20" min={0} />
                <select
                  value={eff.dice?.die ?? ''}
                  onChange={(e) => update(i, { dice: e.target.value ? { quantity: eff.dice?.quantity ?? 1, die: e.target.value } as Dice : undefined })}>
                  <option value="">Nenhum</option>
                  {DICE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
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
