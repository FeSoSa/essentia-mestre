export type Rarity = 'branco' | 'verde' | 'azul' | 'roxo' | 'amarelo' | 'rosa';

export const RARITY_COLORS: Record<Rarity, string> = {
  branco:  '#e4e4e7',
  verde:   '#4ade80',
  azul:    '#3b82f6',
  roxo:    '#a855f7',
  amarelo: '#eab308',
  rosa:    '#ec4899',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  branco:  'Comum',
  verde:   'Incomum',
  azul:    'Raro',
  roxo:    'Épico',
  amarelo: 'Lendário',
  rosa:    'Mítico',
};

export const RARITY_ORDER: Rarity[] = ['branco', 'verde', 'azul', 'roxo', 'amarelo', 'rosa'];

export function rarityColor(rarity?: string): string | undefined {
  if (rarity && rarity in RARITY_COLORS) return RARITY_COLORS[rarity as Rarity];
  return undefined;
}
