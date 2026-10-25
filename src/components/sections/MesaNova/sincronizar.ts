'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useTabuleiroStore } from '@/store/tabuleiroStore';
import { useCombatentes } from './combatentes';
import { useGrade } from './grade';
import { useMovimento } from './movimento';

/**
 * Espelha o tabuleiro na API para o app dos jogadores: a cada mudança (peça, terreno,
 * vida, vez) manda o retrato inteiro, com um respiro para não disparar a cada passo.
 * Só começa depois de ler o que estava salvo, para não apagar o tabuleiro do servidor.
 */
export function useSincronizarTabuleiro() {
  const { lista } = useCombatentes();
  const { carregado, carregar, carregarRacas, regraMovimento, visivel, marcas } = useTabuleiroStore();
  const { colunas, linhas, terreno, noCampo } = useGrade(lista);
  const mov = useMovimento();

  useEffect(() => { carregar(); carregarRacas(); }, [carregar, carregarRacas]);

  const retrato = JSON.stringify({
    // A origem do turno e o deslocamento dos jogadores a API calcula sozinha
    colunas, linhas, terreno, marcas, regraMovimento, visivel,
    pecas: noCampo.map(({ c, casa, lado }) => ({
      id: c.id, tipo: c.tipo, nome: c.nome, src: c.src ?? null, emoji: c.emoji ?? null,
      x: casa.x, y: casa.y, lado, hp: c.hp, hpMax: c.hpMax, deslocamento: mov.deslocamentoDe(c).casas,
    })),
  });

  useEffect(() => {
    if (!carregado) return;
    const t = setTimeout(() => {
      api.put('/tabuleiro', JSON.parse(retrato)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [retrato, carregado]);
}
