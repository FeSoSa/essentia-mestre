import type { AchadoConfig, ClassKit, ItemCatalog, Player, PlayerAttributes } from '@/store/types';
import { RARITY_ORDER, RARITY_LABELS, type Rarity } from '@/lib/rarity';

/**
 * Sorteador de achados: escolhe um item do catálogo para um jogador.
 * 1. sorteia a raridade pelas chances do nível de achado;
 * 2. separa os itens que fazem sentido (tipo, nível exigido, o que ele já tem);
 * 3. pesa cada candidato pelo perfil do jogador e sorteia com esses pesos.
 * Os motivos ficam guardados para o mestre ver por que o item saiu.
 */

export type TipoAchado = 'qualquer' | 'arma' | 'armadura' | 'acessorio' | 'consumivel' | 'material';

export const TIPO_LABEL: Record<TipoAchado, string> = {
  qualquer: 'Qualquer', arma: 'Arma', armadura: 'Armadura', acessorio: 'Acessório', consumivel: 'Consumível', material: 'Material',
};

export const ACHADO_PADRAO: AchadoConfig = {
  niveis: [
    { id: 'pobre',   nome: 'Pobre',   pesos: { branco: 70, verde: 25, azul: 5,  roxo: 0,  amarelo: 0,  rosa: 0 } },
    { id: 'comum',   nome: 'Comum',   pesos: { branco: 40, verde: 35, azul: 18, roxo: 6,  amarelo: 1,  rosa: 0 } },
    { id: 'rico',    nome: 'Rico',    pesos: { branco: 10, verde: 25, azul: 35, roxo: 22, amarelo: 7,  rosa: 1 } },
    { id: 'tesouro', nome: 'Tesouro', pesos: { branco: 0,  verde: 5,  azul: 25, roxo: 35, amarelo: 28, rosa: 7 } },
  ],
  pesosTipo: { arma: 25, armadura: 20, acessorio: 15, consumivel: 30, material: 10 },
};

export interface Achado {
  item: ItemCatalog;
  qty: number;
  raridadeSorteada: Rarity;
  /** Diferente da sorteada quando não havia item daquela raridade e o sorteador desceu ou subiu. */
  raridadeFinal: Rarity;
  tipo: Exclude<TipoAchado, 'qualquer'>;
  motivos: string[];
  /** Chance relativa entre os candidatos (0 a 1). */
  chance: number;
}

export interface ResultadoSorteio {
  escolhido: Achado;
  alternativas: Achado[];
}

const SIGLA_PARA_ATTR: Record<string, keyof PlayerAttributes> = {
  FOR: 'strength', AGI: 'agility', INT: 'intelligence', RES: 'resistance',
  FLX: 'flow', SAB: 'wisdom', PRE: 'presence', DEF: 'defense',
};
const ATTR_NOME: Record<string, string> = {
  strength: 'Força', agility: 'Agilidade', intelligence: 'Inteligência', resistance: 'Resistência',
  flow: 'Fluxo', wisdom: 'Sabedoria', presence: 'Presença', defense: 'Defesa',
};
const PESO_ARMADURA = ['leve', 'média', 'pesada'];

export function tipoDoItem(i: ItemCatalog): Exclude<TipoAchado, 'qualquer'> | null {
  if (i.type === 'weapon') return 'arma';
  if (i.type === 'armor') return 'armadura';
  if (i.type === 'accessory') return 'acessorio';
  if (i.subtype === 'chave' || i.type === 'chave') return null; // itens de história não saem no sorteio
  if (i.subtype === 'consumivel' || i.onUseEffect) return 'consumivel';
  return 'material';
}

const raridade = (i: ItemCatalog): Rarity => (RARITY_ORDER.includes(i.rarity as Rarity) ? i.rarity as Rarity : 'branco');

function sortearPeso<T>(opcoes: { valor: T; peso: number }[]): T | null {
  const total = opcoes.reduce((s, o) => s + Math.max(0, o.peso), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const o of opcoes) {
    r -= Math.max(0, o.peso);
    if (r <= 0) return o.valor;
  }
  return opcoes[opcoes.length - 1].valor;
}

/** Atributos do item de dano ("FOR/AGI", "strength") como chaves de PlayerAttributes. */
function atributosDeDano(attr?: string | null): (keyof PlayerAttributes)[] {
  if (!attr) return [];
  return attr.split('/').map((a) => SIGLA_PARA_ATTR[a.trim().toUpperCase()] ?? (a.trim() as keyof PlayerAttributes))
    .filter((a) => a in ATTR_NOME);
}

/**
 * Força relativa do atributo no personagem: 0 (o mais fraco) a 1 (o mais forte).
 * DEF fica de fora: sobe com a armadura e nenhuma arma escala com ela.
 */
function forcaRelativa(attrs: PlayerAttributes, a: keyof PlayerAttributes): number {
  const vals = (Object.entries(attrs) as [keyof PlayerAttributes, number][]).filter(([k]) => k !== 'defense').map(([, v]) => v);
  const min = Math.min(...vals), max = Math.max(...vals);
  return max === min ? 0.5 : ((attrs[a] ?? min) - min) / (max - min);
}

function principais(attrs: PlayerAttributes, n = 3): (keyof PlayerAttributes)[] {
  const vals = (Object.entries(attrs) as [keyof PlayerAttributes, number][]).filter(([k]) => k !== 'defense').map(([, v]) => v);
  if (Math.max(...vals) === Math.min(...vals)) return [];
  return (Object.keys(attrs) as (keyof PlayerAttributes)[]).filter((k) => k !== 'defense')
    .sort((a, b) => attrs[b] - attrs[a]).slice(0, n);
}

interface Contexto {
  player: Player;
  attrs: PlayerAttributes;
  armasDaClasse: string[];
  possui: Set<string>;
}

/** Peso do item para o jogador, com os motivos que puxaram para cima ou para baixo. */
function avaliar(item: ItemCatalog, tipo: Exclude<TipoAchado, 'qualquer'>, ctx: Contexto): { peso: number; motivos: string[] } {
  const { player, attrs } = ctx;
  let peso = 1;
  const motivos: string[] = [];

  // Exigência de atributo: dá para sortear, mas pesa menos se ele ainda não alcança
  const exig = Object.entries(item.requirements?.attributes ?? {}).filter(([, v]) => v);
  if (exig.length > 0) {
    const faltando = exig.filter(([k, v]) => (attrs[k as keyof PlayerAttributes] ?? 0) < v);
    if (faltando.length === 0) { peso *= 1.2; motivos.push('Ele já cumpre os requisitos'); }
    else { peso *= 0.35; motivos.push(`Ainda falta ${faltando.map(([k, v]) => `${ATTR_NOME[k] ?? k} ${v}`).join(', ')} para usar`); }
  }

  if (tipo === 'arma') {
    if (ctx.armasDaClasse.length > 0) {
      if (item.weaponType && ctx.armasDaClasse.includes(item.weaponType)) { peso *= 4; motivos.push(`Arma da classe ${player.char.skillClass}`); }
      else { peso *= 0.25; motivos.push(`Fora das armas da classe ${player.char.skillClass}`); }
    }
    const da = atributosDeDano(item.damageAttribute);
    if (da.length > 0) {
      const melhor = da.reduce((m, a) => (forcaRelativa(attrs, a) > forcaRelativa(attrs, m) ? a : m), da[0]);
      const f = forcaRelativa(attrs, melhor);
      peso *= 0.7 + f * 1.3;
      if (f >= 0.7) motivos.push(`Escala com ${ATTR_NOME[melhor]}, um ponto forte dele`);
      else if (f <= 0.3) motivos.push(`Escala com ${ATTR_NOME[melhor]}, um ponto fraco dele`);
    }
    const atual = player.equipment?.mainHand;
    if (atual && item.damageBase != null) {
      if (item.damageBase > atual.damageBase) { peso *= 1.4; motivos.push(`Mais dano que a ${atual.name} (${item.damageBase} contra ${atual.damageBase})`); }
      else if (item.damageBase < atual.damageBase) { peso *= 0.6; }
    } else if (!atual) { peso *= 1.3; motivos.push('Está sem arma na mão principal'); }
  }

  if (tipo === 'armadura') {
    const atual = player.equipment?.armor as { name: string; damageReduction?: number; armorWeight?: string } | undefined;
    if (!atual) { peso *= 1.5; motivos.push('Está sem armadura'); }
    else {
      const i = PESO_ARMADURA.indexOf(item.armorWeight ?? ''), j = PESO_ARMADURA.indexOf(atual.armorWeight ?? '');
      if (i >= 0 && j >= 0) {
        if (i === j) { peso *= 2; motivos.push(`Mesmo peso da armadura que usa (${item.armorWeight})`); }
        else if (Math.abs(i - j) === 2) peso *= 0.4;
      }
      const dr = item.damageReduction ?? 0, drAtual = atual.damageReduction ?? 0;
      if (dr > drAtual) { peso *= 1.5; motivos.push(`Protege mais que a ${atual.name} (${dr} contra ${drAtual})`); }
      else if (dr < drAtual) peso *= 0.5;
    }
  }

  if (tipo === 'acessorio') {
    const slot = item.equipSlot as 'amulet' | 'ring' | 'utility' | undefined;
    if (slot && !player.equipment?.[slot]) { peso *= 1.8; motivos.push('Ocupa um espaço que está vazio'); }
    const fortes = principais(attrs);
    const bate = Object.entries(item.attributeBonus ?? {}).filter(([k, v]) => v > 0 && fortes.includes(k as keyof PlayerAttributes));
    if (bate.length > 0) { peso *= 1 + bate.length * 0.6; motivos.push(`Reforça ${bate.map(([k]) => ATTR_NOME[k]).join(' e ')}`); }
  }

  if (tipo === 'consumivel') {
    const texto = `${item.name} ${item.desc}`;
    const hp = player.hp.max > 0 ? player.hp.current / player.hp.max : 1;
    const es = player.flow.max > 0 ? player.flow.current / player.flow.max : 1;
    if (/cura|PV|vida/i.test(texto) && hp < 0.7) { peso *= 1.6; motivos.push(`Está com ${Math.round(hp * 100)}% da vida`); }
    if (/fluxo|ES\b|essência/i.test(texto) && es < 0.7) { peso *= 1.6; motivos.push(`Está com ${Math.round(es * 100)}% de ES`); }
  }

  return { peso, motivos };
}

interface OpcoesAchado {
  catalogo: ItemCatalog[];
  config: AchadoConfig;
  nivelId: string;
  tipo: TipoAchado;
  player?: Player | null;
  kits?: ClassKit[];
}

interface Avaliado { item: ItemCatalog; peso: number; motivos: string[] }

/** Prepara o sorteio: nível, contexto do jogador e o pool avaliado de cada tipo e raridade. */
function preparar(opts: OpcoesAchado) {
  const { catalogo, config, player } = opts;
  const nivel = config.niveis.find((n) => n.id === opts.nivelId) ?? config.niveis[0];

  const ctx: Contexto | null = player ? {
    player,
    attrs: player.effectiveAttributes ?? player.attributes,
    armasDaClasse: opts.kits?.find((k) => k.skillClass === player.char.skillClass)?.allowedWeaponTypes ?? [],
    possui: new Set([
      ...(player.items ?? []).map((i) => i.name),
      ...Object.values(player.equipment ?? {}).filter(Boolean).map((e) => (e as { name: string }).name),
    ]),
  } : null;

  const tipos: { tipo: Exclude<TipoAchado, 'qualquer'>; peso: number }[] = opts.tipo !== 'qualquer'
    ? [{ tipo: opts.tipo, peso: 1 }]
    : Object.entries(config.pesosTipo).map(([t, peso]) => ({ tipo: t as Exclude<TipoAchado, 'qualquer'>, peso }));

  /** Itens que servem para o tipo, já filtrados pelo jogador. */
  const doTipo = (tipo: Exclude<TipoAchado, 'qualquer'>) => catalogo.filter((i) => {
    if (tipoDoItem(i) !== tipo) return false;
    if (ctx) {
      if ((i.requirements?.level ?? 0) > ctx.player.char.level) return false;
      // Equipamento repetido não serve; consumível e material podem repetir
      if ((tipo === 'arma' || tipo === 'armadura' || tipo === 'acessorio') && ctx.possui.has(i.name)) return false;
    }
    return true;
  });

  /** Pool avaliado para um tipo e uma raridade sorteada (com a troca para a raridade mais próxima). */
  const pool = (tipo: Exclude<TipoAchado, 'qualquer'>, sorteada: Rarity, itens = doTipo(tipo)): { final: Rarity; avaliados: Avaliado[] } | null => {
    const idx = RARITY_ORDER.indexOf(sorteada);
    // Sem item na raridade sorteada: procura a mais próxima, primeiro para baixo
    const ordem = [idx, ...Array.from({ length: RARITY_ORDER.length }, (_, d) => [idx - d - 1, idx + d + 1]).flat()]
      .filter((x) => x >= 0 && x < RARITY_ORDER.length);
    for (const k of ordem) {
      const candidatos = itens.filter((i) => raridade(i) === RARITY_ORDER[k]);
      if (candidatos.length > 0) {
        return {
          final: RARITY_ORDER[k],
          avaliados: candidatos.map((item) => ({ item, ...(ctx ? avaliar(item, tipo, ctx) : { peso: 1, motivos: [] }) })),
        };
      }
    }
    return null;
  };

  return { nivel, nivelIdx: Math.max(0, config.niveis.indexOf(nivel)), tipos, doTipo, pool };
}

export function sortearAchado(opts: OpcoesAchado): ResultadoSorteio | null {
  const { nivel, nivelIdx, tipos, pool } = preparar(opts);

  // 1. Tipo (se for "qualquer", sorteia pelas chances por tipo)
  const tipo = sortearPeso(tipos.map((t) => ({ valor: t.tipo, peso: t.peso })));
  if (!tipo) return null;

  // 2. Raridade pelas chances do nível
  const sorteada = sortearPeso(RARITY_ORDER.map((r) => ({ valor: r, peso: nivel.pesos[r] ?? 0 }))) ?? 'branco';

  // 3. Item, pesado pelo perfil do jogador
  const p = pool(tipo, sorteada);
  if (!p) return null;
  const { final, avaliados } = p;
  const total = avaliados.reduce((s, a) => s + a.peso, 0);
  const escolhido = sortearPeso(avaliados.map((a) => ({ valor: a, peso: a.peso })))!;

  const montar = (a: Avaliado): Achado => {
    const motivos = [...a.motivos];
    if (final !== sorteada) motivos.unshift(`Saiu ${RARITY_LABELS[sorteada]}, mas não há ${TIPO_LABEL[tipo].toLowerCase()} assim disponível; ficou ${RARITY_LABELS[final]}`);
    const empilha = tipo === 'consumivel' || tipo === 'material';
    return {
      item: a.item,
      qty: empilha ? 1 + Math.floor(Math.random() * Math.min(3, nivelIdx + 1)) : 1,
      raridadeSorteada: sorteada, raridadeFinal: final, tipo, motivos,
      chance: total > 0 ? a.peso / total : 0,
    };
  };

  const alternativas = avaliados.filter((a) => a !== escolhido).sort((a, b) => b.peso - a.peso).slice(0, 3).map(montar);
  return { escolhido: montar(escolhido), alternativas };
}

export interface ChanceItem { item: ItemCatalog; chance: number; motivos: string[] }

export interface Chances {
  /** Chance real de cada raridade sair (já com a troca quando falta item numa raridade). */
  porRaridade: Partial<Record<Rarity, number>>;
  porTipo: Partial<Record<Exclude<TipoAchado, 'qualquer'>, number>>;
  /** Todos os itens possíveis, do mais provável ao menos. */
  itens: ChanceItem[];
  /** Quantos itens do catálogo o filtro do jogador tirou (nível ou já possui). */
  foraDoFiltro: number;
}

/** Chance exata de cada item sair com essas escolhas, sem sortear nada. */
export function chancesAchado(opts: OpcoesAchado): Chances {
  const { nivel, tipos, doTipo, pool } = preparar(opts);
  const totalTipos = tipos.reduce((s, t) => s + Math.max(0, t.peso), 0) || 1;
  const totalRar = RARITY_ORDER.reduce((s, r) => s + Math.max(0, nivel.pesos[r] ?? 0), 0) || 1;

  const porItem = new Map<string, ChanceItem>();
  const porRaridade: Chances['porRaridade'] = {};
  const porTipo: Chances['porTipo'] = {};
  let foraDoFiltro = 0;

  for (const { tipo, peso } of tipos) {
    const pTipo = Math.max(0, peso) / totalTipos;
    if (pTipo <= 0) continue;
    const itens = doTipo(tipo);
    foraDoFiltro += opts.catalogo.filter((i) => tipoDoItem(i) === tipo).length - itens.length;
    for (const r of RARITY_ORDER) {
      const pRar = Math.max(0, nivel.pesos[r] ?? 0) / totalRar;
      if (pRar <= 0) continue;
      const p = pool(tipo, r, itens);
      if (!p) continue;
      const base = pTipo * pRar;
      porRaridade[p.final] = (porRaridade[p.final] ?? 0) + base;
      porTipo[tipo] = (porTipo[tipo] ?? 0) + base;
      const total = p.avaliados.reduce((s, a) => s + a.peso, 0) || 1;
      for (const a of p.avaliados) {
        const atual = porItem.get(a.item.id) ?? { item: a.item, chance: 0, motivos: a.motivos };
        atual.chance += base * (a.peso / total);
        porItem.set(a.item.id, atual);
      }
    }
  }

  return {
    porRaridade, porTipo, foraDoFiltro,
    itens: [...porItem.values()].sort((a, b) => b.chance - a.chance),
  };
}
