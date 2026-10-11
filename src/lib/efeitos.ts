import type { Efeito } from '@/store/types';
import type { EffectPreset } from '@/store/effectPresetsStore';

const STAT_PARA_ATRIBUTO: Record<string, string> = {
  FOR: 'strength', AGI: 'agility', INT: 'intelligence', RES: 'resistance',
  FLX: 'flow', SAB: 'wisdom', PRE: 'presence', DEF: 'defense',
};

/**
 * Efeitos da skill que caem no alvo (ALVO e AREA), no formato de efeito de status aplicável.
 * Condição usa a cadastrada (com a duração da skill); modificador vira um efeito com o nome da skill.
 */
export function efeitosNoAlvo(skillNome: string, efeitos: Efeito[] | undefined, presets: EffectPreset[]): EffectPreset[] {
  return (efeitos ?? [])
    .filter((e) => (e.alvo === 'ALVO' || e.alvo === 'AREA') && e.tipo !== 'ESCUDO' && e.tipo !== 'CURA')
    .map((e, i) => {
      const turnos = e.duracao === 'PASSIVO' ? -1 : e.duracao ?? 1;
      if (e.tipo === 'CONDICAO') {
        const p = presets.find((x) => x.name.toLowerCase() === (e.condicao ?? '').toLowerCase());
        return { ...(p ?? { name: e.condicao ?? '?', effects: [] }), id: `${p?.id ?? 'cond'}-${i}`, durationTurns: turnos } as EffectPreset;
      }
      const atributo = STAT_PARA_ATRIBUTO[e.stat ?? ''];
      return {
        id: `mod-${i}`,
        name: skillNome,
        desc: `${e.stat} ${(e.valor ?? 0) >= 0 ? '+' : ''}${e.valor ?? 0}`,
        durationTurns: turnos,
        effects: atributo ? [{ trigger: 'on_turn_start', type: 'modify_attribute', attribute: atributo, value: e.valor ?? 0 }] : [],
        hitBonus: e.stat === 'ACERTO' ? e.valor : undefined,
      } as EffectPreset;
    });
}
