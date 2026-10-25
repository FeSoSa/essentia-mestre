'use client';

import { useEffect } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { DEGRAUS, fmtMult, useTiposDano, type Descoberta } from '@/lib/tiposDano';

/**
 * O que o grupo já descobriu acertando. Pendente = só o mestre vê; liberada = aparece no Bestiário
 * dos jogadores. Dá para esconder de novo ou descartar (dano aprovado por engano).
 */
export default function DescobertasList({ search }: { search: string }) {
  const { descobertas, carregarDescobertas, liberarDescoberta, apagarDescoberta } = useTiposDano();
  useEffect(() => { carregarDescobertas(); }, [carregarDescobertas]);

  const q = search.trim().toLowerCase();
  const lista = descobertas.filter((e) => !q || e.nome.toLowerCase().includes(q));
  const pendentes = descobertas.flatMap((e) => e.descobertas).filter((d) => !d.liberada).length;

  if (descobertas.length === 0)
    return <p className="text-e-faint text-sm text-center py-16">Nenhuma descoberta ainda. Elas aparecem quando você aprova um golpe dos jogadores num inimigo.</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-e-sub">
        {pendentes > 0 ? `${pendentes} esperando liberação. ` : ''}Só o que está liberado aparece no Bestiário do app dos jogadores.
      </p>
      {lista.map((e) => (
        <div key={e.criaturaChave} className="bg-e-surface border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{e.icon || '⚔'}</span>
            <span className="font-semibold text-e-text">{e.nome}</span>
          </div>
          {e.descobertas.map((d) => <Linha key={d.id} d={d} onLiberar={liberarDescoberta} onApagar={apagarDescoberta} />)}
        </div>
      ))}
    </div>
  );
}

function Linha({ d, onLiberar, onApagar }: { d: Descoberta; onLiberar: (id: string, v: boolean) => Promise<void>; onApagar: (id: string) => Promise<void> }) {
  const info = DEGRAUS[d.degrau];
  return (
    <div className={`flex items-center gap-3 text-sm ${d.liberada ? '' : 'opacity-70'}`}>
      <span className={`text-[11px] font-bold rounded-md px-1.5 py-0.5 border ${info.cor}`}>
        {d.tipoNome}: {d.degrau === 'NEUTRO' ? 'normal' : `${info.label} ${fmtMult(info.mult)}`}
      </span>
      <span className="text-xs text-e-faint truncate">por {d.playerName} · {new Date(d.descobertoEm).toLocaleDateString('pt-BR')}</span>
      <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider ${d.liberada ? 'text-emerald-300' : 'text-amber-300'}`}>
        {d.liberada ? 'Liberada' : 'Pendente'}
      </span>
      <button type="button" title={d.liberada ? 'Esconder dos jogadores' : 'Liberar para os jogadores'} onClick={() => onLiberar(d.id, !d.liberada)}
        className="p-1.5 cursor-pointer rounded-lg text-e-faint hover:text-e-text hover:bg-e-card">
        {d.liberada ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button type="button" title="Descartar" onClick={() => { if (confirm('Descartar esta descoberta?')) onApagar(d.id); }}
        className="p-1.5 cursor-pointer rounded-lg text-e-faint hover:text-e-danger hover:bg-e-card">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
