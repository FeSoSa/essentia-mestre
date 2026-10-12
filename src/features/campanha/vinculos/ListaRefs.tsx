'use client';

import { AlertTriangle, Minus, Plus, X } from 'lucide-react';
import Select from '@/components/ui/Select';
import type { CampanhaRef } from '../types';

interface Props {
  titulo: string;
  refs: CampanhaRef[];
  opcoes: { id: string; nome: string }[];
  onChange: (refs: CampanhaRef[]) => void;
  /** Cores do bloco (inimigo, chefe, item). */
  cor: { fundo: string; borda: string; texto: string; fraco: string };
  /** Algo extra ao lado de cada linha (ex.: botão "Achado por..."). */
  extra?: (ref: CampanhaRef, existe: boolean) => React.ReactNode;
  adicionarRotulo?: string;
}

/** Lista de referências `{ id, nome, qtd }` com quantidade, remoção e um seletor para adicionar. */
export default function ListaRefs({ titulo, refs, opcoes, onChange, cor, extra, adicionarRotulo = '+ Adicionar' }: Props) {
  const mudar = (i: number, r: CampanhaRef | null) =>
    onChange(r ? refs.map((x, k) => (k === i ? r : x)) : refs.filter((_, k) => k !== i));

  function adicionar(id: string) {
    const o = opcoes.find((x) => x.id === id);
    if (!o) return;
    const i = refs.findIndex((r) => r.id === id);
    if (i >= 0) mudar(i, { ...refs[i], qtd: (refs[i].qtd ?? 1) + 1 });
    else onChange([...refs, { id: o.id, nome: o.nome, qtd: 1 }]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint">{titulo}</p>
      {refs.map((r, i) => {
        const o = opcoes.find((x) => x.id === r.id);
        const nome = o?.nome ?? r.nome ?? r.id ?? '?';
        return (
          <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border" style={{ background: cor.fundo, borderColor: cor.borda }}>
            {!o && <AlertTriangle size={14} className="text-e-gold shrink-0" aria-label="Não existe no catálogo" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: cor.texto }}>{nome}</p>
              {!o && <p className="text-[11px]" style={{ color: cor.fraco }}>Não existe no catálogo. Troque ou crie o modelo.</p>}
            </div>
            <div className="flex items-center rounded-md border" style={{ borderColor: cor.borda }}>
              <button type="button" aria-label="Menos um" onClick={() => mudar(i, (r.qtd ?? 1) > 1 ? { ...r, qtd: (r.qtd ?? 1) - 1 } : r)}
                className="w-7 h-7 flex items-center justify-center cursor-pointer" style={{ color: cor.texto }}><Minus size={12} /></button>
              <span className="w-6 text-center text-sm font-bold tabular-nums" style={{ color: cor.texto }}>{r.qtd ?? 1}</span>
              <button type="button" aria-label="Mais um" onClick={() => mudar(i, { ...r, qtd: (r.qtd ?? 1) + 1 })}
                className="w-7 h-7 flex items-center justify-center cursor-pointer" style={{ color: cor.texto }}><Plus size={12} /></button>
            </div>
            {extra?.(r, !!o)}
            <button type="button" aria-label={`Tirar ${nome}`} onClick={() => mudar(i, null)}
              className="p-1 rounded text-e-faint hover:text-e-danger cursor-pointer"><X size={14} /></button>
          </div>
        );
      })}
      <Select value="" onChange={adicionar} placeholder={adicionarRotulo}
        options={opcoes.map((o) => ({ value: o.id, label: o.nome }))} />
    </div>
  );
}
