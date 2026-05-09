'use client';

import { useEffect } from 'react';
import { getStompClient } from '@/lib/socket';
import { useStore } from '@/store';
import type { Player, LogEntry, FastAction, InitiativeEntry, ImageEntry, EnemyInstance, BossInstance, SobrecargaRequest } from '@/store/types';

export function useSocket() {
  const {
    setPlayers, setPlayer, appendLog,
    setFastAction, setInitiative, setImages, setActiveImage, setEnemies, setBosses,
    addSobrecargaRequest,
  } = useStore();

  useEffect(() => {
    const client = getStompClient();

    client.onConnect = () => {
      console.log('[STOMP] conectado');

      // Todos os jogadores (broadcast em bulk)
      client.subscribe('/topic/players', (msg) => {
        const players: Player[] = JSON.parse(msg.body);
        setPlayers(players);
      });

      // Jogador individual (atualizações em tempo real)
      client.subscribe('/topic/player/*', (msg) => {
        const player: Player = JSON.parse(msg.body);
        setPlayer(player);
      });

      // Log da sessão
      client.subscribe('/topic/log', (msg) => {
        const entry: LogEntry = JSON.parse(msg.body);
        appendLog(entry);
      });

      // Fast action
      client.subscribe('/topic/fast-action', (msg) => {
        const fa: FastAction = JSON.parse(msg.body);
        setFastAction(fa.active ? fa : null);
      });

      // Iniciativa
      client.subscribe('/topic/initiative', (msg) => {
        const initiative: InitiativeEntry[] = JSON.parse(msg.body);
        setInitiative(initiative);
      });

      // Imagens
      client.subscribe('/topic/image', (msg) => {
        const data = JSON.parse(msg.body);
        if (Array.isArray(data)) setImages(data as ImageEntry[]);
        else setActiveImage((data as ImageEntry).id);
      });

      // Inimigos de combate
      client.subscribe('/topic/combat/enemies', (msg) => {
        const enemies: EnemyInstance[] = JSON.parse(msg.body);
        setEnemies(enemies);
      });

      // Bosses de combate
      client.subscribe('/topic/combat/bosses', (msg) => {
        const bosses: BossInstance[] = JSON.parse(msg.body);
        setBosses(bosses);
      });

      // Pedidos de Sobrecarga
      client.subscribe('/topic/sobrecarga-request', (msg) => {
        const req: SobrecargaRequest = JSON.parse(msg.body);
        addSobrecargaRequest(req);
      });
    };

    client.onDisconnect = () => console.log('[STOMP] desconectado');

    if (!client.active) client.activate();
  }, []); // singleton — não recria
}
