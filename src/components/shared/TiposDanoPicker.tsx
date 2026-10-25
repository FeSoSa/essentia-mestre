'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import Select from '@/components/ui/Select';
import { useTiposDano, MAX_TIPOS, nomeTipo } from '@/lib/tiposDano';

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  /** Texto quando vazio, ex: "Herda da arma usada". */
  vazio?: string;
}

/** Escolhe de 1 a 2 tipos de dano para uma skill, arma ou ataque. */
export default function TiposDanoPicker({ value, onChange, vazio = 'Sem tipo' }: Props) {
  const { tipos, carregado, carregar } = useTiposDano();
  useEffect(() => { carregar(); }, [carregar]);

  const opcoes = tipos.filter((t) => !value.includes(t.id)).map((t) => ({ value: t.id, label: t.nome }));

  if (!carregado) return <span className="text-xs text-amber-400">Não consegui carregar os tipos de dano (reinicie a API)</span>;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.length === 0 && <span className="text-xs text-e-faint">{vazio}</span>}
      {value.map((id) => (
        <span key={id} className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-1 bg-white/[0.06] border border-e-border">
          {nomeTipo(tipos, id)}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== id))} className="opacity-50 hover:opacity-100 cursor-pointer">
            <X size={11} />
          </button>
        </span>
      ))}
      {value.length < MAX_TIPOS && opcoes.length > 0 && (
        <Select variant="action" value="" placeholder="Tipo" options={opcoes} onChange={(id) => id && onChange([...value, id])} />
      )}
    </div>
  );
}
