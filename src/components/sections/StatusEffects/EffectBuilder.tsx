'use client';

import type { AutoEffect } from '@/store/types';
import Select from '@/components/ui/Select';
import { COST_OPTS } from '@/lib/costOptions';

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
  { value: 'modify_resource_cost',   label: 'Reduzir custo por recurso' },
];

// Tipos passivos: ficam ativos o tempo todo que o status effect durar, não dependem do Trigger
const PASSIVE_TYPES = ['block_skill', 'modify_attribute', 'modify_damage_dealt', 'modify_damage_received', 'modify_resource_cost'];

// Tipos cujo "Valor fixo" aceita negativo (ex: -32 para reduzir dano)
const SIGNED_VALUE_TYPES = ['modify_attribute', 'modify_damage_dealt', 'modify_damage_received', 'modify_resource_cost'];

// Tipos que não usam o campo "Valor fixo" (só percentual, ou nenhum valor)
const NO_FIXED_VALUE_TYPES = ['block_skill', 'modify_resource_cost'];

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

const ATTR_LABEL: Record<string, string> = Object.fromEntries(ATTRS.map((a) => [a.value, a.label]));
const COST_LABEL: Record<string, string> = Object.fromEntries(COST_OPTS.map((c) => [c.value, c.label]));
const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** Descrição curta e legível de um AutoEffect, ex: "Força +3" ou "Dano HP 12". */
export function describeAutoEffect(eff: AutoEffect): string {
  switch (eff.type) {
    case 'modify_attribute': {
      const attr = eff.attribute ? (ATTR_LABEL[eff.attribute] ?? eff.attribute) : '?';
      const parts: string[] = [];
      if (eff.value) parts.push(signed(eff.value));
      if (eff.percentual) parts.push(`${signed(eff.percentual)}%`);
      return `${attr} ${parts.join(' ') || '+0'}`;
    }
    case 'modify_resource_cost': {
      const cost = eff.costType ? (COST_LABEL[eff.costType] ?? eff.costType) : '?';
      return `Custo ${cost} ${signed(eff.percentual ?? 0)}%`;
    }
    case 'modify_damage_dealt':
    case 'modify_damage_received': {
      const parts: string[] = [];
      if (eff.value) parts.push(signed(eff.value));
      if (eff.percentual) parts.push(`${signed(eff.percentual)}%`);
      return `${TYPE_LABEL[eff.type]} ${parts.join(' ') || '+0'}`;
    }
    case 'block_skill':
      return TYPE_LABEL[eff.type] ?? eff.type;
    default:
      return `${TYPE_LABEL[eff.type] ?? eff.type} ${eff.value ?? 0}`;
  }
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
            {!PASSIVE_TYPES.includes(eff.type) && (
              <div>
                <label className={label}>Trigger</label>
                <Select
                  value={eff.trigger}
                  onChange={(v) => update(i, { trigger: v })}
                  options={TRIGGERS}
                />
              </div>
            )}
            <div className={PASSIVE_TYPES.includes(eff.type) ? 'col-span-2' : ''}>
              <label className={label}>Tipo</label>
              <Select
                value={eff.type}
                onChange={(v) => update(i, { type: v })}
                options={TYPES}
              />
            </div>

            {PASSIVE_TYPES.includes(eff.type) && (
              <p className="col-span-2 text-[10px] text-e-faint -mt-1">
                Passivo: ativo enquanto o efeito durar, sem depender de um gatilho.
              </p>
            )}

            {!NO_FIXED_VALUE_TYPES.includes(eff.type) && (
              <div>
                <label className={label}>Valor fixo</label>
                <input type="number" value={eff.value ?? 0}
                  onChange={(e) => update(i, { value: Number(e.target.value) })}
                  min={SIGNED_VALUE_TYPES.includes(eff.type) ? undefined : 0} />
              </div>
            )}

            {eff.type !== 'block_skill' && (
              <div>
                <label className={label}>Percentual (%)</label>
                <input type="number" value={eff.percentual ?? 0}
                  onChange={(e) => update(i, { percentual: Number(e.target.value) })} />
              </div>
            )}

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

            {eff.type === 'modify_resource_cost' && (
              <div className="col-span-2">
                <label className={label}>Recurso</label>
                <Select
                  value={eff.costType ?? ''}
                  onChange={(v) => update(i, { costType: v })}
                  options={COST_OPTS}
                  placeholder="Selecionar recurso…"
                />
              </div>
            )}

            {(eff.type === 'modify_damage_dealt' || eff.type === 'modify_damage_received') && (
              <p className="col-span-2 text-[10px] text-e-faint -mt-1">
                Use negativo para reduzir (ex: -32 de dano fixo, -20% percentual). Os dois se somam ao dano base.
              </p>
            )}

            {eff.type === 'modify_resource_cost' && (
              <p className="col-span-2 text-[10px] text-e-faint -mt-1">
                Reduz o custo (percentual) de qualquer habilidade que use o recurso selecionado. Use negativo para reduzir (ex: -20%).
              </p>
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
