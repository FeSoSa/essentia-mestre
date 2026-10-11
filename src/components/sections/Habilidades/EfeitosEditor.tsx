'use client';

import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import Select from '@/components/ui/Select';
import type { Efeito, EfeitoAlvo, EfeitoTipo } from '@/store/types';
import type { EffectPreset } from '@/store/effectPresetsStore';

export type UsoSkill = 'USUARIO' | 'INIMIGOS' | 'ALIADOS';

const ALVO_LABEL: Record<EfeitoAlvo, string> = {
  SELF: 'Em si mesmo',
  ALVO: 'No inimigo atingido',
  AREA: 'Nos inimigos da área',
  ALIADOS: 'Nos aliados',
};

const TIPO_LABEL: Record<EfeitoTipo, string> = {
  MODIFICADOR: 'Modificador (atributo, acerto, dano)',
  CONDICAO: 'Condição cadastrada',
  CURA: 'Cura',
  ESCUDO: 'Escudo (PV temporário)',
};

export const STATS = [
  { value: 'FOR', label: 'FOR' }, { value: 'AGI', label: 'AGI' }, { value: 'INT', label: 'INT' },
  { value: 'RES', label: 'RES' }, { value: 'FLX', label: 'FLX' }, { value: 'SAB', label: 'SAB' },
  { value: 'PRE', label: 'PRE' }, { value: 'DEF', label: 'DEF' },
  { value: 'ACERTO', label: 'Acerto' }, { value: 'DANO', label: 'Dano' },
];

/** Em quem os efeitos podem cair, pelo uso da skill. */
export function alvosPermitidos(uso: UsoSkill, area: boolean): EfeitoAlvo[] {
  if (uso === 'USUARIO') return ['SELF'];
  if (uso === 'ALIADOS') return ['ALIADOS', 'SELF'];
  return [area ? 'AREA' : 'ALVO', 'SELF'];
}

/** O que faz sentido em cada alvo: cura e Escudo não vão em inimigos. */
function tiposPermitidos(alvo: EfeitoAlvo): EfeitoTipo[] {
  return alvo === 'ALVO' || alvo === 'AREA' ? ['MODIFICADOR', 'CONDICAO'] : ['MODIFICADOR', 'CONDICAO', 'CURA', 'ESCUDO'];
}

/** Texto curto de um efeito, ex: "Em si mesmo: AGI +2, por 2 rodadas". */
export function descreverEfeito(e: Efeito): string {
  const alvo = ALVO_LABEL[e.alvo] ?? e.alvo;
  if (e.tipo === 'ESCUDO') return `${alvo}: Escudo +${e.valor ?? 0} (PV temporário)`;
  if (e.tipo === 'CURA') return e.duracao === 'PASSIVO' || (typeof e.duracao === 'number' && e.duracao > 0)
    ? `${alvo}: Cura +${e.valor ?? 0} por turno, ${e.duracao === 'PASSIVO' ? 'passivo' : `${e.duracao} rodada${e.duracao === 1 ? '' : 's'}`}`
    : `${alvo}: Cura +${e.valor ?? 0} na hora`;
  const dur = e.duracao === 'PASSIVO' ? 'passivo' : `por ${e.duracao ?? 1} rodada${(e.duracao ?? 1) === 1 ? '' : 's'}`;
  const corpo = e.tipo === 'CONDICAO'
    ? (e.condicao ?? '?')
    : `${STATS.find((s) => s.value === e.stat)?.label ?? e.stat} ${(e.valor ?? 0) >= 0 ? '+' : ''}${e.valor ?? 0}`;
  return `${alvo}: ${corpo}, ${dur}`;
}

const emInimigo = (a: EfeitoAlvo) => a === 'ALVO' || a === 'AREA';

/** Efeito novo do tipo pedido, com valores de partida (em inimigo, o modificador começa negativo). */
function novo(alvo: EfeitoAlvo, tipo: EfeitoTipo, presets: EffectPreset[]): Efeito {
  if (tipo === 'CONDICAO') return { alvo, tipo, condicao: presets[0]?.name ?? '', duracao: 2 };
  if (tipo === 'CURA' || tipo === 'ESCUDO') return { alvo, tipo, valor: 20 };
  return { alvo, tipo, stat: emInimigo(alvo) ? 'DEF' : 'FOR', valor: emInimigo(alvo) ? -1 : 1, duracao: 2 };
}

const num = 'w-16 text-center text-sm rounded-lg px-2 py-2 bg-[#111113] border border-[#303038] text-e-text outline-none focus:border-e-accent';
const rot = 'text-[10px] font-bold uppercase tracking-widest text-e-faint';

interface Props {
  value: Efeito[];
  onChange: (v: Efeito[]) => void;
  presets: EffectPreset[];
  /** Em quem a skill é usada (seção Uso da aba Base). */
  uso: UsoSkill;
  /** A skill atinge uma área (vários alvos). */
  area: boolean;
}

export default function EfeitosEditor({ value, onChange, presets, uso, area }: Props) {
  const alvos = alvosPermitidos(uso, area);
  const update = (i: number, e: Efeito) => onChange(value.map((x, j) => (j === i ? e : x)));
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));
  const add = () => onChange([...value, novo(alvos[0], uso === 'INIMIGOS' ? 'CONDICAO' : 'MODIFICADOR', presets)]);

  return (
    <div className="flex flex-col gap-2.5">
      {value.length === 0 && <p className="text-xs text-e-faint italic">Nenhum efeito.</p>}
      {value.map((e, i) => {
        const alvoOk = alvos.includes(e.alvo);
        const tipos = tiposPermitidos(e.alvo);
        const tipoOk = tipos.includes(e.tipo);
        const condicaoDesconhecida = e.tipo === 'CONDICAO' && !!e.condicao
          && !presets.some((p) => p.name.toLowerCase() === e.condicao!.toLowerCase());
        const porTurno = e.tipo === 'CURA' && typeof e.duracao === 'number' && e.duracao > 0;
        return (
          <div key={i} className={`rounded-xl border p-3 flex flex-col gap-3 ${alvoOk && tipoOk ? 'border-e-border bg-e-bg' : 'border-amber-500/50 bg-amber-500/5'}`}>
            {/* Em quem e o quê */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 flex flex-col gap-1">
                <span className={rot}>Em quem</span>
                {alvos.length === 1 && alvoOk
                  ? <div className="px-3 py-2 rounded-lg border border-[#303038] bg-[#111113] text-sm text-e-sub">{ALVO_LABEL[e.alvo]}</div>
                  : <Select value={e.alvo} options={alvos.map((a) => ({ value: a, label: ALVO_LABEL[a] }))}
                      onChange={(v) => {
                        const alvo = v as EfeitoAlvo;
                        update(i, tiposPermitidos(alvo).includes(e.tipo) ? { ...e, alvo } : novo(alvo, 'MODIFICADOR', presets));
                      }} />}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <span className={rot}>Efeito</span>
                <Select value={e.tipo} options={tipos.map((t) => ({ value: t, label: TIPO_LABEL[t] }))}
                  onChange={(v) => update(i, novo(e.alvo, v as EfeitoTipo, presets))} />
              </div>
              <button type="button" onClick={() => remove(i)} title="Remover efeito"
                className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-e-faint hover:text-e-danger hover:bg-e-danger/10">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Detalhes de cada tipo */}
            {e.tipo === 'MODIFICADOR' && (
              <div className="flex gap-2 items-end flex-wrap">
                <div className="w-36 flex flex-col gap-1">
                  <span className={rot}>Atributo</span>
                  <Select value={e.stat ?? 'FOR'} options={STATS} onChange={(v) => update(i, { ...e, stat: v })} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className={rot}>Valor</span>
                  <input type="number" value={e.valor ?? 0} onChange={(ev) => update(i, { ...e, valor: Number(ev.target.value) || 0 })} className={num} />
                </div>
                <Duracao e={e} onChange={(d) => update(i, { ...e, duracao: d })} permitePassivo={e.alvo === 'SELF'} />
              </div>
            )}

            {e.tipo === 'CONDICAO' && (
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-[180px] flex flex-col gap-1">
                  <span className={rot}>Condição</span>
                  <Select value={e.condicao ?? ''}
                    options={[
                      ...(condicaoDesconhecida ? [{ value: e.condicao!, label: `${e.condicao} (não cadastrada)` }] : []),
                      ...presets.map((p) => ({ value: p.name, label: p.name })),
                    ]}
                    onChange={(v) => update(i, { ...e, condicao: v })} />
                </div>
                <Duracao e={e} onChange={(d) => update(i, { ...e, duracao: d })} permitePassivo={e.alvo === 'SELF'} />
              </div>
            )}

            {e.tipo === 'CURA' && (
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex flex-col gap-1">
                  <span className={rot}>PV</span>
                  <input type="number" min={1} value={e.valor ?? 0} onChange={(ev) => update(i, { ...e, valor: Math.max(0, Number(ev.target.value) || 0) })} className={num} />
                </div>
                <div className="w-40 flex flex-col gap-1">
                  <span className={rot}>Quando</span>
                  <Select value={porTurno ? 'turno' : 'hora'} options={[{ value: 'hora', label: 'Na hora' }, { value: 'turno', label: 'A cada turno' }]}
                    onChange={(v) => update(i, { ...e, duracao: v === 'turno' ? 3 : undefined })} />
                </div>
                {porTurno && (
                  <div className="flex flex-col gap-1">
                    <span className={rot}>Rodadas</span>
                    <input type="number" min={1} value={e.duracao as number} onChange={(ev) => update(i, { ...e, duracao: Math.max(1, Number(ev.target.value) || 1) })} className={num} />
                  </div>
                )}
                <span className="text-[11px] text-e-faint pb-2">até o PV máximo; nunca vira Escudo</span>
              </div>
            )}

            {e.tipo === 'ESCUDO' && (
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex flex-col gap-1">
                  <span className={rot}>PV temporário</span>
                  <input type="number" min={1} value={e.valor ?? 0} onChange={(ev) => update(i, { ...e, valor: Math.max(0, Number(ev.target.value) || 0) })} className={num} />
                </div>
                <span className="text-[11px] text-e-faint pb-2">teto de 25% do PV máximo; zera no fim do dia</span>
              </div>
            )}

            {condicaoDesconhecida && (
              <p className="text-[11px] text-amber-400">Condição não encontrada entre as cadastradas: o efeito aplica só o nome.</p>
            )}
            {!(alvoOk && tipoOk) && (
              <div className="flex items-center gap-2 text-[11px] text-amber-300">
                <AlertTriangle size={12} />
                <span className="flex-1">Este efeito não combina com o uso da skill ({uso === 'USUARIO' ? 'em si mesmo' : uso === 'ALIADOS' ? 'aliados' : 'inimigos'}).</span>
                <button type="button"
                  onClick={() => update(i, !alvoOk && tiposPermitidos(alvos[0]).includes(e.tipo) ? { ...e, alvo: alvos[0] } : novo(alvoOk ? e.alvo : alvos[0], 'MODIFICADOR', presets))}
                  className="px-2 py-1 rounded-md border border-amber-500/40 hover:bg-amber-500/10">Ajustar</button>
              </div>
            )}
          </div>
        );
      })}
      <button type="button" onClick={add} className="self-start text-xs flex items-center gap-1 text-e-sub hover:text-e-text">
        <Plus size={12} /> Adicionar efeito
      </button>
    </div>
  );
}

/** Duração em rodadas, ou passivo (só em si mesmo: vale enquanto a skill estiver equipada). */
function Duracao({ e, onChange, permitePassivo }: { e: Efeito; onChange: (d: number | 'PASSIVO') => void; permitePassivo: boolean }) {
  const passivo = e.duracao === 'PASSIVO';
  return (
    <>
      {permitePassivo && (
        <div className="w-48 flex flex-col gap-1">
          <span className={rot}>Duração</span>
          <Select value={passivo ? 'PASSIVO' : 'RODADAS'}
            options={[{ value: 'RODADAS', label: 'Por rodadas' }, { value: 'PASSIVO', label: 'Passivo (enquanto equipada)' }]}
            onChange={(v) => onChange(v === 'PASSIVO' ? 'PASSIVO' : 2)} />
        </div>
      )}
      {!passivo && (
        <div className="flex flex-col gap-1">
          <span className={rot}>Rodadas</span>
          <input type="number" min={1} value={typeof e.duracao === 'number' ? e.duracao : 1}
            onChange={(ev) => onChange(Math.max(1, Number(ev.target.value) || 1))} className={num} />
        </div>
      )}
    </>
  );
}
