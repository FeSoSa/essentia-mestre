'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import Select from '@/components/ui/Select';
import { useTiposDano, DEGRAUS, DEGRAUS_TRACO, fmtMult, nomeTipo, type TracoDano, type DegrauTraco } from '@/lib/tiposDano';

interface Props {
  value: TracoDano[];
  onChange: (v: TracoDano[]) => void;
}

/** Fraquezas, resistências e imunidades por tipo de dano (raça, criatura ou armadura). Sem traço = Neutro. */
export default function TracosDanoEditor({ value, onChange }: Props) {
  const { tipos, carregado, carregar } = useTiposDano();
  useEffect(() => { carregar(); }, [carregar]);
  if (!carregado) return <span className="text-xs text-amber-400">Não consegui carregar os tipos de dano (reinicie a API)</span>;

  const livres = tipos.filter((t) => !value.some((v) => v.tipoDanoId === t.id)).map((t) => ({ value: t.id, label: t.nome }));
  const mudar = (i: number, degrau: DegrauTraco) => onChange(value.map((t, j) => (j === i ? { ...t, degrau } : t)));

  return (
    <div className="flex flex-col gap-1.5">
      {value.length === 0 && <span className="text-xs text-e-faint">Neutro a todos os tipos</span>}
      {value.map((t, i) => (
        <div key={t.tipoDanoId} className="flex items-center gap-2">
          <span className="text-sm font-semibold w-28 truncate">{nomeTipo(tipos, t.tipoDanoId)}</span>
          <div className="flex gap-1">
            {DEGRAUS_TRACO.map((d) => (
              <button key={d} type="button" onClick={() => mudar(i, d)}
                className={`text-[11px] font-bold rounded-lg px-2 py-1 border cursor-pointer transition-colors ${
                  t.degrau === d ? DEGRAUS[d].cor : 'border-e-border text-e-faint hover:text-e-text'}`}>
                {DEGRAUS[d].label} {fmtMult(DEGRAUS[d].mult)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="ml-auto opacity-50 hover:opacity-100 cursor-pointer"><X size={13} /></button>
        </div>
      ))}
      {livres.length > 0 && (
        <div>
          <Select variant="action" value="" placeholder="Adicionar tipo" options={livres}
            onChange={(id) => id && onChange([...value, { tipoDanoId: id, degrau: 'FRACO' }])} />
        </div>
      )}
    </div>
  );
}

/** Chips compactos dos traços, para cards e listas. */
export function TracosDanoChips({ value }: { value?: TracoDano[] }) {
  const { tipos, carregar } = useTiposDano();
  useEffect(() => { carregar(); }, [carregar]);
  if (!value?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {value.map((t) => (
        <span key={t.tipoDanoId} className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 border ${DEGRAUS[t.degrau].cor}`}>
          {nomeTipo(tipos, t.tipoDanoId)}: {DEGRAUS[t.degrau].label}
        </span>
      ))}
    </div>
  );
}

/** "Fogo: Fraco x1,5" com a cor do degrau; nada quando o golpe saiu Neutro sem tipo decisivo. */
export function DegrauBadge({ degrau }: { degrau?: import('@/lib/tiposDano').DegrauAplicado | null }) {
  if (!degrau || degrau.degrau === 'NEUTRO') return null;
  const info = DEGRAUS[degrau.degrau];
  return (
    <span className={`inline-block text-[11px] font-bold rounded-md px-1.5 py-0.5 border ${info.cor}`}
      title={degrau.origem === 'armadura' ? 'Pela armadura' : degrau.origem === 'raca' ? 'Pela raça ou criatura' : undefined}>
      {degrau.tipoNome ?? '?'}: {info.label} {fmtMult(info.mult)}
    </span>
  );
}
