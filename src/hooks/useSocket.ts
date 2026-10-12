'use client';

import { useEffect } from 'react';
import { getStompClient } from '@/lib/socket';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { useCombateStore } from '@/store/combateStore';
import { useMaestriaStore } from '@/lib/maestria';
import { useCampanhaStore } from '@/features/campanha/campanhaStore';
import type { CampanhaSnapshot } from '@/features/campanha/types';
import type { Player, LogEntry, FastAction, InitiativeEntry, ImageEntry, EnemyInstance, BossInstance, SobrecargaRequest, DamageApprovalRequest, EffectApprovalRequest, AllyEffectApprovalRequest, CombatAlly, Note, CombateConfig, EnemyAction, MaestriaConfig } from '@/store/types';

export function useSocket() {
  const {
    setPlayers, setPlayer, appendLog, setLog,
    setFastAction, setInitiative, setImages, setActiveImage, setEnemies, setBosses, setAllies,
    addSobrecargaRequest, setCurrentTurn, incrementTurn, addDamageRequest, addEffectRequest,
    setNotes,
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

      // Log da sessão limpo (por outro cliente/aba)
      client.subscribe('/topic/log-cleared', () => {
        setLog([]);
      });

      // Fast action
      client.subscribe('/topic/fast-action', (msg) => {
        const fa: FastAction = JSON.parse(msg.body);
        setFastAction(fa.active ? fa : null);
      });

      // Iniciativa — reseta turno só quando combate termina
      client.subscribe('/topic/initiative', (msg) => {
        const initiative: InitiativeEntry[] = JSON.parse(msg.body);
        setInitiative(initiative);
        if (initiative.length === 0) setCurrentTurn(0);
        else api.get<{ totalTurns: number }>('/master/turn-state').then((r) => setCurrentTurn(r.data.totalTurns)).catch(() => {});
      });

      // Turno — incrementa monotonicamente (nunca reseta, nunca vai para o índice)
      client.subscribe('/topic/turn', () => {
        incrementTurn();
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

      // Aliados de combate
      client.subscribe('/topic/combat/allies', (msg) => {
        const allies: CombatAlly[] = JSON.parse(msg.body);
        setAllies(allies);
      });

      // Pedidos de Sobrecarga
      client.subscribe('/topic/sobrecarga-request', (msg) => {
        const req: SobrecargaRequest = JSON.parse(msg.body);
        addSobrecargaRequest(req);
      });

      // Pedidos de aplicação de dano
      client.subscribe('/topic/damage-request', (msg) => {
        const req: DamageApprovalRequest = JSON.parse(msg.body);
        addDamageRequest(req);
      });

      // Pedidos de aplicação de efeitos
      client.subscribe('/topic/effect-request', (msg) => {
        const req: EffectApprovalRequest = JSON.parse(msg.body);
        addEffectRequest(req);
      });

      // Pedidos de skill em aliados (cura, Escudo, buffs)
      client.subscribe('/topic/ally-effect-request', (msg) => {
        useStore.getState().addAllyRequest(JSON.parse(msg.body) as AllyEffectApprovalRequest);
      });

      // Regras de combate editadas (por esta ou outra aba)
      client.subscribe('/topic/combate-config', (msg) => {
        useCombateStore.getState().setCfg(JSON.parse(msg.body) as CombateConfig);
      });

      // Regras de maestria editadas
      client.subscribe('/topic/maestria-config', (msg) => {
        useMaestriaStore.getState().setCfg(JSON.parse(msg.body) as MaestriaConfig);
      });

      // Turno automático dos inimigos
      client.subscribe('/topic/enemy-action', (msg) => {
        useCombateStore.getState().upsertAcao(JSON.parse(msg.body) as EnemyAction);
      });

      // Notas fixas
      client.subscribe('/topic/notes', (msg) => {
        const notes: Note[] = JSON.parse(msg.body);
        setNotes(notes);
      });

      // Campanha: arquivos da pasta mudaram (painel, Claude ou outro editor)
      client.subscribe('/topic/campanha', (msg) => {
        useCampanhaStore.getState().aplicar(JSON.parse(msg.body) as CampanhaSnapshot);
      });

      // Recupera estado de combate atual (perdido no refresh)
      Promise.all([
        api.get<EnemyInstance[]>('/combat/enemies').then(r => setEnemies(r.data)),
        api.get<BossInstance[]>('/combat/bosses').then(r => setBosses(r.data)),
        api.get<CombatAlly[]>('/combat/allies').then(r => setAllies(r.data)),
        api.get<{ initiative: InitiativeEntry[]; currentTurnIndex: number; totalTurns: number }>('/master/turn-state').then(r => {
          setInitiative(r.data.initiative);
          setCurrentTurn(r.data.totalTurns);
        }),
        api.get<Note[]>('/master/notes').then(r => setNotes(r.data)),
        useCombateStore.getState().carregar(),
        useMaestriaStore.getState().carregar(),
        useCampanhaStore.getState().fetch(),
      ]).catch(() => {});
    };

    client.onDisconnect = () => console.log('[STOMP] desconectado');

    if (!client.active) client.activate();
  }, []); // singleton — não recria
}
