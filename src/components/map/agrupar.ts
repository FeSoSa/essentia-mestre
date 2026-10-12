/** Itens muito próximos na tela viram um grupo, para dar para clicar em cada um. */
export interface Grupo<T> { id: string; x: number; y: number; membros: T[] }

/**
 * Agrupa por distância em pixels (as posições são frações 0..1 de uma área w × h).
 * Guloso e estável: segue a ordem recebida e o centro do grupo é a média dos membros.
 */
export function agrupar<T extends { id: string; x: number; y: number }>(itens: T[], w: number, h: number, raioPx = 18): Grupo<T>[] {
  if (w <= 0 || h <= 0) return itens.map((i) => ({ id: i.id, x: i.x, y: i.y, membros: [i] }));
  const grupos: { x: number; y: number; membros: T[] }[] = [];
  for (const it of itens) {
    const alvo = grupos.find((g) => Math.hypot((g.x - it.x) * w, (g.y - it.y) * h) < raioPx);
    if (alvo) {
      alvo.membros.push(it);
      alvo.x = alvo.membros.reduce((s, m) => s + m.x, 0) / alvo.membros.length;
      alvo.y = alvo.membros.reduce((s, m) => s + m.y, 0) / alvo.membros.length;
    } else grupos.push({ x: it.x, y: it.y, membros: [it] });
  }
  return grupos.map((g) => ({
    ...g,
    id: g.membros.length === 1 ? g.membros[0].id : 'grupo:' + g.membros.map((m) => m.id).sort().join('|'),
  }));
}

/** Posição em leque (px, a partir do centro do grupo) do membro `i` de `n`. */
export function posicaoLeque(i: number, n: number) {
  const r = Math.max(36, n * 11);
  const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return { dx: Math.cos(ang) * r, dy: Math.sin(ang) * r, r };
}
