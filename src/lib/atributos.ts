/** Sigla em português de cada atributo (o back-end guarda as chaves em inglês). */
export const ATTR_SHORT: Record<string, string> = {
  strength: 'FOR', agility: 'AGI', intelligence: 'INT', resistance: 'RES',
  flow: 'FLX', wisdom: 'SAB', presence: 'PRE', defense: 'DEF',
};

export const siglaAtributo = (attr: string) => ATTR_SHORT[attr] ?? attr.slice(0, 3).toUpperCase();

/** % do bônus total em cada nível, para Essência sem tabela própria (regra padrão da API). */
const PCT_PADRAO = [25, 50, 75, 100];

type BonusEssencia = { attributeBonus?: Record<string, number>; bonusPorNivel?: Record<string, number>[] };

/** Regra padrão: floor(bônus × % do nível / 100), sem mudar o sinal. */
function bonusPorPct(bonus: Record<string, number>, nivel: number): Record<string, number> {
  if (nivel < 1) return {};
  const pct = PCT_PADRAO[Math.min(4, nivel) - 1];
  return Object.fromEntries(Object.entries(bonus).map(([k, v]) => [k, Math.sign(v) * Math.floor((Math.abs(v) * pct) / 100)]));
}

/** Tabela por nível que reproduz a regra padrão (o que cada nível soma). Ponto de partida do editor. */
export function tabelaBonusPadrao(bonus: Record<string, number>): Record<string, number>[] {
  return [1, 2, 3, 4].map((n) => {
    const agora = bonusPorPct(bonus, n), antes = bonusPorPct(bonus, n - 1);
    return Object.fromEntries(Object.keys(agora).map((k) => [k, agora[k] - (antes[k] ?? 0)]).filter(([, v]) => v !== 0));
  });
}

/**
 * Bônus de atributo da Essência no nível do jogador: soma da tabela (bonusPorNivel) do nível 1 até o nível dele;
 * sem tabela, a regra padrão de %. Espelha EssenciaRules.bonusNoNivel da API.
 */
export function bonusEssenciaNoNivel(essencia: BonusEssencia, nivel: number): [string, number][] {
  const n = Math.min(4, Math.max(1, nivel));
  const tabela = essencia.bonusPorNivel ?? [];
  const soma: Record<string, number> = {};
  if (tabela.length) tabela.slice(0, n).forEach((m) => Object.entries(m).forEach(([k, v]) => { soma[k] = (soma[k] ?? 0) + v; }));
  else Object.assign(soma, bonusPorPct(essencia.attributeBonus ?? {}, n));
  return Object.entries(soma).filter(([, v]) => v !== 0);
}
