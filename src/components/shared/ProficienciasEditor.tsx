'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import type { Player } from '@/store/types';

/** Categorias de arma (mesmos valores de weaponType dos itens e skills). */
export const CATEGORIAS_ARMA = [
  { value: 'espadas', label: 'Espadas' },
  { value: 'rapieiras', label: 'Rapieiras' },
  { value: 'alabardas', label: 'Alabardas' },
  { value: 'lancas', label: 'Lanças' },
  { value: 'machados-de-guerra', label: 'Machados de guerra' },
  { value: 'machadinhas', label: 'Machadinhas' },
  { value: 'martelos', label: 'Martelos' },
  { value: 'armas-colossais', label: 'Armas colossais' },
  { value: 'adagas', label: 'Adagas' },
  { value: 'garras', label: 'Garras' },
  { value: 'cajado', label: 'Cajado' },
  { value: 'grimorio', label: 'Grimório' },
  { value: 'orbe', label: 'Orbe' },
  { value: 'arcanos', label: 'Arcanos' },
  { value: 'arcos', label: 'Arcos' },
  { value: 'bestas', label: 'Bestas' },
  { value: 'pistolas', label: 'Pistolas' },
  { value: 'luvas-manoplas', label: 'Luvas & manoplas' },
  { value: 'escudos', label: 'Escudos' },
];

/**
 * Proficiências do jogador por categoria de arma. A classe dá as iniciais; ganhar ou perder
 * (treino, uso) é decisão do mestre aqui.
 */
export default function ProficienciasEditor({ player }: { player: Player }) {
  const { setPlayer } = useStore();
  const [salvando, setSalvando] = useState(false);
  const atuais = player.proficiencias ?? [];

  async function alternar(cat: string) {
    const novas = atuais.includes(cat) ? atuais.filter((c) => c !== cat) : [...atuais, cat];
    setSalvando(true);
    try {
      const res = await api.put<Player>(`/master/players/${player.id}/proficiencias`, { proficiencias: novas });
      setPlayer(res.data);
    } catch {}
    finally { setSalvando(false); }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIAS_ARMA.map((c) => {
          const ativo = atuais.includes(c.value);
          return (
            <button key={c.value} type="button" disabled={salvando} onClick={() => alternar(c.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                ativo ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'
              }`}>
              {c.label}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-e-faint">
        Sem proficiência: ataque básico a /6 com o dano da arma, sem skills da categoria e sem a propriedade especial.
      </p>
    </div>
  );
}
