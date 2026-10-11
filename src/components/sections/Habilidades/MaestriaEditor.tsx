'use client';

import type { NivelMaestriaGrupo } from '@/store/types';
import { descreverNivel } from '@/lib/maestria';

const cell = 'w-full text-center text-sm rounded-lg px-2 py-1.5 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2 tabular-nums';

/** Tabela da maestria por grupo: níveis 1 a 4 com usos acumulados, +% dano e -% custo. */
export function TabelaNiveis({ niveis, onChange }: { niveis: NivelMaestriaGrupo[]; onChange: (n: NivelMaestriaGrupo[]) => void }) {
  const ordenados = [...niveis].sort((a, b) => a.nivel - b.nivel);
  const set = (nivel: number, key: 'usos' | 'danoPct' | 'custoPct', v: number) =>
    onChange(ordenados.map((n) => (n.nivel === nivel ? { ...n, [key]: Number.isFinite(v) ? v : 0 } : n)));

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-e-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-e-bg/60">
            <tr className="text-e-faint">
              <th className="font-medium text-left px-3 py-2 w-16">Nível</th>
              <th className="font-medium px-1 py-2" title="usos acumulados para o nível ficar disponível">Usos</th>
              <th className="font-medium px-1 py-2" title="% a mais de dano nas skills do grupo e no ataque com a arma">Dano +%</th>
              <th className="font-medium px-1 py-2" title="% a menos de custo nas skills do grupo">Custo -%</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((n) => (
              <tr key={n.nivel} className="border-t border-e-border">
                <td className="px-3 py-1.5 font-semibold text-e-gold">Nv {n.nivel}</td>
                <td className="px-1 py-1.5">
                  {n.nivel === 1
                    ? <span className="block text-center text-e-faint">0</span>
                    : <input type="number" min={1} value={n.usos} onChange={(e) => set(n.nivel, 'usos', Number(e.target.value))} className={cell} />}
                </td>
                <td className="px-1 py-1.5">
                  <input type="number" min={0} value={n.danoPct} onChange={(e) => set(n.nivel, 'danoPct', Number(e.target.value))} className={cell} />
                </td>
                <td className="px-1 py-1.5">
                  <input type="number" min={0} max={100} value={n.custoPct} onChange={(e) => set(n.nivel, 'custoPct', Number(e.target.value))} className={cell} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-1 rounded-xl bg-e-bg/60 border border-e-border px-3 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Resumo para o jogador</span>
        {ordenados.filter((n) => n.nivel > 1).map((n) => (
          <span key={n.nivel} className="text-xs text-e-sub">
            <b className="text-e-gold">Nv {n.nivel}</b> com {n.usos} usos: {descreverNivel(n)}
          </span>
        ))}
      </div>
    </div>
  );
}
