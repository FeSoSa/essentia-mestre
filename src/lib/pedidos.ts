import { api } from '@/lib/api';
import { useStore } from '@/store';
import type { AllyEffectApprovalRequest, DamageApprovalRequest, EffectApprovalRequest, Player } from '@/store/types';

/** Ações sobre os pedidos dos jogadores (mesmas chamadas dos painéis flutuantes da Mesa antiga). */
export const pedidos = {
  async aprovarDano(req: DamageApprovalRequest) {
    await api.post('/master/damage/approve', {
      requestId: req.requestId, playerId: req.playerId, targetId: req.targetId, targetType: req.targetType,
      damage: req.damage, costs: req.costs ?? {}, onHitEffects: req.onHitEffects ?? [],
      slotId: req.slotId, skillId: req.skillId,
      critico: req.critico ?? false, danoSemCritico: req.danoSemCritico, ataqueBasico: req.ataqueBasico ?? false,
    });
    useStore.getState().removeDamageRequest(req.requestId);
  },
  async rejeitarDano(req: DamageApprovalRequest) {
    await api.post('/master/damage/reject', { requestId: req.requestId, playerId: req.playerId });
    useStore.getState().removeDamageRequest(req.requestId);
  },
  async aprovarEfeito(req: EffectApprovalRequest) {
    await api.post('/master/effect/approve', {
      requestId: req.requestId, playerId: req.playerId, targets: req.targets, onHitEffects: req.onHitEffects,
    });
    useStore.getState().removeEffectRequest(req.requestId);
  },
  async rejeitarEfeito(req: EffectApprovalRequest) {
    await api.post('/master/effect/reject', { requestId: req.requestId, playerId: req.playerId });
    useStore.getState().removeEffectRequest(req.requestId);
  },
  async aprovarAliados(req: AllyEffectApprovalRequest) {
    await api.post('/master/ally-effect/approve', {
      requestId: req.requestId, playerId: req.playerId, slotId: req.slotId, alvos: req.alvos.map((a) => a.id),
    });
    useStore.getState().removeAllyRequest(req.requestId);
  },
  async rejeitarAliados(req: AllyEffectApprovalRequest) {
    await api.post('/master/ally-effect/reject', { requestId: req.requestId, playerId: req.playerId });
    useStore.getState().removeAllyRequest(req.requestId);
  },
  async aprovarSobrecarga(playerId: string) {
    const r = await api.post<Player>(`/master/players/${playerId}/sobrecarga/approve`);
    useStore.getState().setPlayer(r.data);
    useStore.getState().removeSobrecargaRequest(playerId);
  },
  async rejeitarSobrecarga(playerId: string, roll: number, danoDado: string) {
    const r = await api.post<Player>(`/master/players/${playerId}/sobrecarga/reject`, { roll, danoDado });
    useStore.getState().setPlayer(r.data);
    useStore.getState().removeSobrecargaRequest(playerId);
  },
};

/** Tabela da Sobrecarga (espelha SobrecargaService.kt). */
export const SOBRECARGA_NIVEIS = [
  { nivel: 1, bonus: 2,  custoTurno: 3,  cd: 6,  danoDado: '2d6' },
  { nivel: 2, bonus: 4,  custoTurno: 4,  cd: 8,  danoDado: '3d6' },
  { nivel: 3, bonus: 6,  custoTurno: 6,  cd: 10, danoDado: '4d6' },
  { nivel: 4, bonus: 8,  custoTurno: 9,  cd: 16, danoDado: '5d6' },
  { nivel: 5, bonus: 10, custoTurno: 12, cd: 18, danoDado: '6d6' },
  { nivel: 6, bonus: 12, custoTurno: 18, cd: 20, danoDado: '8d6' },
];
