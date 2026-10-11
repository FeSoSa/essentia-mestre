import type { CombateConfig, CombatAlly, EncontroConfig, EnemyAttack, EnemyInstance, EnemyTemplate, Player } from '@/store/types';

/**
 * Gerador de encontros: monta inimigos (do bestiário ou inventados) para o grupo em campo.
 *
 * A dificuldade é medida simulando a luta várias vezes com as regras do jogo:
 * d20 de acerto contra DEF, d20 de dano, crítico no 20 natural, iniciativa por AGI,
 * o grupo foca o inimigo mais ferido e os inimigos atacam o alvo de menor DEF (como o turno automático).
 * Perigo = quanto do PV do grupo se perde em média (100% quando o grupo todo cai).
 */

export const ENCONTRO_PADRAO: EncontroConfig = {
  dificuldades: [
    { id: 'facil',   nome: 'Fácil',   perigo: 15 },
    { id: 'medio',   nome: 'Médio',   perigo: 35 },
    { id: 'dificil', nome: 'Difícil', perigo: 60 },
    { id: 'mortal',  nome: 'Mortal',  perigo: 85 },
  ],
  hordaMax: 8,
};

export const ORDEM_DIFICULDADE = ['facil', 'medio', 'dificil', 'mortal'];
export const NOME_DIFICULDADE: Record<string, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil', mortal: 'Mortal' };
export const COR_DIF: Record<string, string> = { facil: '#3aaa60', medio: '#d4a84e', dificil: '#e05050', mortal: '#a855f7' };

const D20_MEDIO = 10.5;
const SIMULACOES = 300;
const RODADAS_MAX = 40;

/** Tabela de modificador do Essentia (a mesma do app do jogador). */
export function modificador(v: number): number {
  if (v <= 7) return -1;
  if (v <= 11) return 0;
  if (v <= 15) return 1;
  if (v <= 19) return 2;
  if (v <= 23) return 3;
  if (v <= 27) return 4;
  if (v <= 31) return 5;
  if (v <= 35) return 6;
  if (v <= 40) return 7;
  if (v <= 46) return 8;
  if (v <= 53) return 9;
  if (v <= 61) return 10;
  return 11;
}

type Attrs = { strength: number; agility: number; intelligence: number; [k: string]: number };
const SIGLA: Record<string, string> = {
  FOR: 'strength', AGI: 'agility', INT: 'intelligence', RES: 'resistance', FLX: 'flow', SAB: 'wisdom', PRE: 'presence', DEF: 'defense',
};

/** Modificador do atributo de dano ("FOR/AGI" usa o melhor dos dois). */
function modDoAtributo(attr: string | null | undefined, a: Attrs): number {
  const chaves = (attr ?? 'FOR').split('/').map((s) => SIGLA[s.trim().toUpperCase()] ?? s.trim());
  return Math.max(...chaves.map((k) => modificador(a[k] ?? a.strength)), 0);
}

export interface Golpe { base: number; mod: number; eq: number }

/** Lê um ataque ("16 + d20×FOR/4" ou campos estruturados) como base + d20 × mod ÷ equilíbrio. */
export function golpeDe(atk: { damage?: string; damageBase?: number; damageAttribute?: string; equilibrio?: number }, a: Attrs): Golpe {
  if (atk.damageBase != null && atk.damageAttribute && atk.equilibrio != null)
    return { base: atk.damageBase, mod: modDoAtributo(atk.damageAttribute, a), eq: Math.max(1, atk.equilibrio) };
  const m = (atk.damage ?? '').replace(/×/g, 'x').match(/(?:(\d+)\s*\+\s*)?d20x([A-Z/]+)\/(\d+)/i);
  if (!m) {
    const fixo = parseInt(atk.damage ?? '', 10);
    return { base: isNaN(fixo) ? 0 : fixo, mod: 0, eq: 1 };
  }
  return { base: m[1] ? parseInt(m[1], 10) : 0, mod: modDoAtributo(m[2], a), eq: Math.max(1, parseInt(m[3], 10)) };
}

export const danoMedio = (g: Golpe) => g.base + (D20_MEDIO * g.mod) / g.eq;

function melhorGolpe(ataques: { damage?: string; damageBase?: number; damageAttribute?: string; equilibrio?: number }[], a: Attrs): Golpe {
  const golpes = ataques.map((atk) => golpeDe(atk, a));
  return golpes.reduce((m, g) => (danoMedio(g) > danoMedio(m) ? g : m), golpes[0] ?? { base: 0, mod: 0, eq: 1 });
}

/* ── Quem luta ───────────────────────────────────────────────── */

export interface Membro {
  id: string; nome: string; aliado: boolean;
  pv: number; def: number; agi: number;
  golpe: Golpe; modAcerto: number;
}

/** cfg: equilíbrios do ataque básico (com e sem proficiência na arma). */
export function membroDeJogador(p: Player, cfg: { equilibrioComProficiencia: number; equilibrioSemProficiencia: number }): Membro {
  const a = (p.effectiveAttributes ?? p.attributes) as unknown as Attrs;
  const arma = p.equipment?.mainHand;
  const mod = modDoAtributo(arma?.damageAttribute ?? 'FOR', a);
  const proficiente = !!arma?.weaponType && (p.proficiencias ?? []).some((x) => x.toLowerCase() === arma.weaponType.toLowerCase());
  const eq = proficiente ? cfg.equilibrioComProficiencia : cfg.equilibrioSemProficiencia;
  return {
    id: p.id, nome: p.char.name, aliado: false, pv: p.hp.current, def: a.defense ?? 10, agi: a.agility,
    golpe: { base: arma?.damageBase ?? 0, mod, eq: Math.max(0.5, eq) }, modAcerto: mod,
  };
}

export function membroDeAliado(al: CombatAlly): Membro {
  const a = al.attributes as unknown as Attrs;
  return {
    id: al.id, nome: al.name, aliado: true, pv: al.hpCurrent, def: al.attributes.defense, agi: a.agility,
    golpe: melhorGolpe(al.attacks, a), modAcerto: modificador(Math.max(a.strength, a.agility)),
  };
}

export interface Inimigo {
  template: EnemyTemplate;
  inventado: boolean;
  /** Multiplicadores aplicados para encaixar na dificuldade (1 = como no modelo). */
  escala: number;
  escalaDano: number;
}

const pvDe = (i: Inimigo) => Math.max(1, Math.round(i.template.hpMax * i.escala));
const defDe = (t: EnemyTemplate) => t.defesa ?? t.attributes.defense;
const acertoDe = (t: EnemyTemplate) => t.modAcerto ?? modificador(Math.max(t.attributes.strength, t.attributes.agility));
function golpeInimigo(i: Inimigo): Golpe {
  const g = melhorGolpe(i.template.attacks, i.template.attributes as unknown as Attrs);
  return { ...g, base: Math.round(g.base * i.escalaDano) };
}

/* ── Simulação ───────────────────────────────────────────────── */

export interface Simulacao {
  /** 0 a 1: parte do PV do grupo perdida em média. */
  perigo: number;
  pAlguemCai: number;
  pGrupoCai: number;
  rodadas: number;
}

/** Sorteio com semente: as mesmas rolagens para comparar escalas diferentes sem ruído. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Lutador { lado: 0 | 1; pv: number; def: number; agi: number; golpe: Golpe; acerto: number }

export function simular(grupo: Membro[], inimigos: Inimigo[], crit: Pick<CombateConfig, 'critMultBase' | 'critMultDado'>, n = SIMULACOES, seed = 7): Simulacao {
  if (grupo.length === 0 || inimigos.length === 0) return { perigo: 0, pAlguemCai: 0, pGrupoCai: 0, rodadas: 0 };
  const rnd = mulberry32(seed);
  const d20 = () => 1 + Math.floor(rnd() * 20);
  const base: Lutador[] = [
    ...grupo.map((m) => ({ lado: 0 as const, pv: m.pv, def: m.def, agi: m.agi, golpe: m.golpe, acerto: m.modAcerto })),
    ...inimigos.map((i) => ({ lado: 1 as const, pv: pvDe(i), def: defDe(i.template), agi: i.template.attributes.agility, golpe: golpeInimigo(i), acerto: acertoDe(i.template) })),
  ];
  const pvGrupo = grupo.reduce((s, m) => s + m.pv, 0);
  let somaPerda = 0, alguemCai = 0, grupoCai = 0, somaRodadas = 0;

  for (let s = 0; s < n; s++) {
    const f = base.map((x) => ({ ...x }));
    const ordem = [...f].sort((a, b) => (d20() + Math.floor(modificador(b.agi) / 2)) - (d20() + Math.floor(modificador(a.agi) / 2)));
    let r = 0;
    for (; r < RODADAS_MAX; r++) {
      for (const atk of ordem) {
        if (atk.pv <= 0) continue;
        const vivos = f.filter((x) => x.lado !== atk.lado && x.pv > 0);
        if (vivos.length === 0) break;
        // Grupo foca o inimigo mais ferido; inimigos vão no de menor DEF (depois o mais ferido)
        const alvo = vivos.reduce((m, x) => (atk.lado === 0
          ? (x.pv < m.pv ? x : m)
          : (x.def < m.def || (x.def === m.def && x.pv < m.pv) ? x : m)));
        const dado = d20();
        if (dado === 1 || (dado !== 20 && dado + atk.acerto < alvo.def)) continue;
        const g = atk.golpe, dd = d20();
        const dano = dado === 20
          ? Math.round(g.base * crit.critMultBase) + Math.floor((dd * crit.critMultDado * g.mod) / g.eq)
          : g.base + Math.floor((dd * g.mod) / g.eq);
        alvo.pv -= Math.max(0, dano);
      }
      if (!f.some((x) => x.lado === 0 && x.pv > 0) || !f.some((x) => x.lado === 1 && x.pv > 0)) { r++; break; }
    }
    const membros = f.filter((x) => x.lado === 0);
    const restante = membros.reduce((s2, x) => s2 + Math.max(0, x.pv), 0);
    somaPerda += pvGrupo > 0 ? 1 - restante / pvGrupo : 0;
    if (membros.some((x) => x.pv <= 0)) alguemCai++;
    if (membros.every((x) => x.pv <= 0)) grupoCai++;
    somaRodadas += r;
  }
  return { perigo: somaPerda / n, pAlguemCai: alguemCai / n, pGrupoCai: grupoCai / n, rodadas: somaRodadas / n };
}

/* ── Montagem ────────────────────────────────────────────────── */

function sortearPeso<T>(opcoes: { valor: T; peso: number }[]): T | null {
  const total = opcoes.reduce((s, o) => s + Math.max(0, o.peso), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const o of opcoes) { r -= Math.max(0, o.peso); if (r <= 0) return o.valor; }
  return opcoes[opcoes.length - 1].valor;
}

/** Peso por proximidade do perigo alvo (0 a 1). */
const proximidade = (p: number, alvo: number) => Math.exp(-Math.abs(p - alvo) / 0.12);

/** Quanto a dificuldade declarada no bestiário combina com a escolhida. */
function pesoDeclarado(t: EnemyTemplate, difId: string, modo: 'um' | 'horda'): number {
  if (!t.dificuldade) return 1;
  // Numa horda cada inimigo é mais fraco: procura os declarados um degrau abaixo
  const alvo = Math.max(0, ORDEM_DIFICULDADE.indexOf(difId) - (modo === 'horda' ? 1 : 0));
  const dist = Math.abs(ORDEM_DIFICULDADE.indexOf(t.dificuldade) - alvo);
  return dist === 0 ? 6 : dist === 1 ? 0.6 : 0.15;
}

export interface Encontro {
  inimigos: Inimigo[];
  sim: Simulacao;
  /** Perigo alvo, 0 a 1. */
  alvo: number;
}

interface Contexto {
  grupo: Membro[];
  crit: Pick<CombateConfig, 'critMultBase' | 'critMultDado'>;
  alvo: number;
}

/**
 * Acha a escala que deixa o perigo no alvo (o perigo cresce com a escala).
 * Inimigo do bestiário só tem o PV ajustado, entre metade e o dobro, para continuar parecido com o original.
 * Criatura inventada ajusta PV e dano livremente.
 */
function encaixar(ctx: Contexto, inimigos: Inimigo[]): Inimigo[] {
  const inventado = inimigos.every((i) => i.inventado);
  const [min, max] = inventado ? [0.05, 30] : [0.5, 2];
  const aplicar = (s: number) => inimigos.map((i) => ({ ...i, escala: s, escalaDano: inventado ? Math.sqrt(s) : 1 }));
  const perigo = (s: number) => simular(ctx.grupo, aplicar(s), ctx.crit, 150).perigo;

  if (!inventado && Math.abs(perigo(1) - ctx.alvo) < 0.06) return aplicar(1); // perto do alvo, fica como no bestiário
  let lo = min, hi = max;
  if (perigo(lo) >= ctx.alvo) return aplicar(lo);
  if (perigo(hi) <= ctx.alvo) return aplicar(hi);
  for (let k = 0; k < 14; k++) {
    const mid = Math.sqrt(lo * hi);
    if (perigo(mid) < ctx.alvo) lo = mid; else hi = mid;
  }
  const s = Math.sqrt(lo * hi);
  return aplicar(inventado ? s : Math.round(s * 20) / 20);
}

function montar(ctx: Contexto, inimigos: Inimigo[]): Encontro {
  const ajustados = encaixar(ctx, inimigos);
  return { inimigos: ajustados, sim: simular(ctx.grupo, ajustados, ctx.crit), alvo: ctx.alvo };
}

const usaveis = (ts: EnemyTemplate[]) => ts.filter((t) => t.hpMax > 0 && t.attacks.length > 0 && danoMedio(melhorGolpe(t.attacks, t.attributes as unknown as Attrs)) > 0);
const comoInimigo = (t: EnemyTemplate, inventado = false): Inimigo => ({ template: t, inventado, escala: 1, escalaDano: 1 });

/** Quantos inimigos numa horda: perto de 1,5 por membro do grupo, variando um pouco. */
const tamanhoHorda = (grupo: number, max: number) =>
  Math.min(max, Math.max(2, Math.round(grupo * 1.5) + Math.floor(Math.random() * 3) - 1));

/* Criaturas inventadas: nomes e ícones por faixa de dificuldade */
const NOMES: Record<string, { nomes: string[]; icones: string[] }> = {
  facil:   { nomes: ['Goblin', 'Rato Gigante', 'Esqueleto', 'Aranha', 'Zumbi', 'Morcego', 'Cobra', 'Lobo Jovem', 'Verme', 'Sapo Venenoso'], icones: ['🐀', '🕷️', '🦇', '🐍', '💀', '👻', '🐺', '🐛', '🐸', '👾'] },
  medio:   { nomes: ['Orc', 'Gnoll', 'Fantasma', 'Lobisomem', 'Cultista', 'Kobold Guerreiro', 'Demônio Menor', 'Golem de Pedra', 'Vampiro Jovem', 'Troll'], icones: ['👹', '🧟', '🐗', '🧌', '👿', '🦴', '🦊', '🐻', '🐊', '🪲'] },
  dificil: { nomes: ['Dragão Jovem', 'Lich', 'Ogro de Elite', 'Demônio', 'Necromante', 'Vampiro Antigo', 'Gigante', 'Wyvern', 'Espectro', 'Golem de Ferro'], icones: ['🐉', '☠️', '🔥', '🦂', '🐲', '👁️', '🦁', '🐯', '🧿', '⚡'] },
  mortal:  { nomes: ['Lorde Demoníaco', 'Dragão Ancião', 'Lich Supremo', 'Titã das Sombras', 'Abominação', 'Colosso de Ferro', 'Ceifador', 'Leviatã', 'Arqui-Vampiro', 'Destruidor'], icones: ['🐉', '☠️', '💀', '👁️', '🔥', '⚡', '🌑', '🦂', '🧿', '💠'] },
};
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const entre = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/** Criatura inventada na medida do grupo: acerto e DEF parecidos com os do grupo; PV e dano depois são encaixados. */
function inventar(grupo: Membro[], difId: string, porMembro: number): EnemyTemplate {
  const media = (f: (m: Membro) => number) => grupo.reduce((s, m) => s + f(m), 0) / grupo.length;
  const acertoGrupo = Math.round(media((m) => m.modAcerto));
  const pvGrupo = media((m) => m.pv);
  const danoGrupo = media((m) => danoMedio(m.golpe));
  // Atributo principal que dá um mod de acerto próximo do grupo
  const principal = [8, 10, 13, 17, 21, 25, 29, 33][Math.min(7, Math.max(0, acertoGrupo + 1 + entre(-1, 1)))];
  const forte = Math.random() < 0.5;
  const str = forte ? principal : principal - entre(2, 5), agi = forte ? principal - entre(2, 5) : principal;
  const attr = forte ? 'FOR' : 'AGI';
  const base = Math.max(1, Math.round((pvGrupo / 10) * (0.7 + Math.random() * 0.6) / porMembro));
  const fonte = NOMES[difId] ?? NOMES.medio;
  return {
    id: `inventado-${Math.random().toString(36).slice(2, 9)}`,
    name: pick(fonte.nomes), type: 'Inventado', icon: pick(fonte.icones),
    hpMax: Math.max(5, Math.round((danoGrupo * grupo.length * 3) / porMembro)),
    attributes: { strength: str, agility: agi, intelligence: entre(4, 14), defense: Math.max(5, acertoGrupo + 10 + entre(-1, 1)) },
    attacks: [{ name: 'Ataque Básico', damage: `${base} + d20×${attr}/4`, damageBase: base, damageAttribute: attr, equilibrio: 4 }],
    drops: [], immunities: [], xp: 0, desc: '', notes: '',
  };
}

export interface OpcoesEncontro {
  grupo: Membro[];
  templates: EnemyTemplate[];
  fonte: 'bestiario' | 'inventado';
  modo: 'um' | 'horda';
  difId: string;
  /** Perigo alvo em %. */
  perigo: number;
  hordaMax: number;
  crit: Pick<CombateConfig, 'critMultBase' | 'critMultDado'>;
}

function gerarUmaVez(o: OpcoesEncontro): Encontro | null {
  const ctx: Contexto = { grupo: o.grupo, crit: o.crit, alvo: o.perigo / 100 };
  if (o.grupo.length === 0) return null;

  if (o.fonte === 'inventado') {
    const n = o.modo === 'um' ? 1 : tamanhoHorda(o.grupo.length, o.hordaMax);
    const t = inventar(o.grupo, o.difId, n);
    // Horda inventada é uma matilha: a mesma criatura repetida
    return montar(ctx, Array.from({ length: n }, () => comoInimigo(t, true)));
  }

  const pool = usaveis(o.templates);
  if (pool.length === 0) return null;
  if (o.modo === 'um') {
    const t = sortearPeso(pool.map((p) => ({
      valor: p,
      peso: proximidade(simular(o.grupo, [comoInimigo(p)], o.crit, 60).perigo, ctx.alvo) * pesoDeclarado(p, o.difId, 'um'),
    })));
    return t ? montar(ctx, [comoInimigo(t)]) : null;
  }

  const n = tamanhoHorda(o.grupo.length, o.hordaMax);
  // Âncora: o inimigo que, repetido n vezes, chega mais perto do alvo
  const ancora = sortearPeso(pool.map((p) => ({
    valor: p,
    peso: proximidade(simular(o.grupo, Array.from({ length: n }, () => comoInimigo(p)), o.crit, 40).perigo, ctx.alvo) * pesoDeclarado(p, o.difId, 'horda'),
  })));
  if (!ancora) return null;
  const forca = (t: EnemyTemplate) => Math.sqrt(t.hpMax * danoMedio(melhorGolpe(t.attacks, t.attributes as unknown as Attrs)));
  const lista = [ancora];
  while (lista.length < n) {
    const prox = sortearPeso(pool.map((p) => ({
      valor: p,
      // Mesmo tipo e força parecida com a âncora deixam a horda coerente
      peso: p.type === ancora.type ? 3 * Math.exp(-Math.abs(Math.log(forca(p) / forca(ancora)))) : 0.4 * Math.exp(-2 * Math.abs(Math.log(forca(p) / forca(ancora)))),
    })));
    if (!prox) break;
    lista.push(prox);
  }
  return montar(ctx, lista.map((t) => comoInimigo(t)));
}

/** Gera algumas vezes e fica com o encontro mais perto do alvo. */
export function gerarEncontro(o: OpcoesEncontro): Encontro | null {
  let melhor: Encontro | null = null;
  const dist = (e: Encontro) => Math.abs(e.sim.perigo - e.alvo);
  for (let i = 0; i < 6; i++) {
    const e = gerarUmaVez(o);
    if (!e) return melhor;
    if (!melhor || dist(e) < dist(melhor)) melhor = e;
    if (dist(e) < 0.05) break;
  }
  return melhor;
}

/** Troca um inimigo por outro e reencaixa o encontro. */
export function trocarInimigo(enc: Encontro, idx: number, o: OpcoesEncontro): Encontro {
  const ctx: Contexto = { grupo: o.grupo, crit: o.crit, alvo: enc.alvo };
  const atual = enc.inimigos[idx];
  const resto = enc.inimigos.map((i) => ({ ...i, escala: 1, escalaDano: 1 }));
  let novo: Inimigo | null;
  if (atual.inventado) {
    novo = comoInimigo(inventar(o.grupo, o.difId, enc.inimigos.length), true);
  } else {
    const pool = usaveis(o.templates).filter((t) => t.id !== atual.template.id);
    const t = sortearPeso(pool.map((p) => ({ valor: p, peso: pesoDeclarado(p, o.difId, o.modo) * (p.type === atual.template.type ? 3 : 1) })));
    novo = t ? comoInimigo(t) : null;
  }
  if (!novo) return enc;
  resto[idx] = novo;
  return montar(ctx, resto);
}

/** Recalcula depois de tirar um inimigo (sem reencaixar: o mestre vê a luta ficar mais leve). */
export function semInimigo(enc: Encontro, idx: number, o: OpcoesEncontro): Encontro | null {
  const inimigos = enc.inimigos.filter((_, i) => i !== idx);
  return inimigos.length ? { ...enc, inimigos, sim: simular(o.grupo, inimigos, o.crit) } : null;
}

/** XP de referência: a mesma proporção que o mestre usa no bestiário (XP por "força"). */
export function xpPorForca(templates: EnemyTemplate[]): number {
  const razoes = usaveis(templates).filter((t) => t.xp > 0)
    .map((t) => t.xp / Math.sqrt(t.hpMax * danoMedio(melhorGolpe(t.attacks, t.attributes as unknown as Attrs))))
    .sort((a, b) => a - b);
  return razoes.length ? razoes[Math.floor(razoes.length / 2)] : 1;
}

export function xpDe(i: Inimigo, xpRef: number): number {
  if (!i.inventado) return Math.round(i.template.xp * Math.sqrt(i.escala));
  return Math.max(1, Math.round(xpRef * Math.sqrt(pvDe(i) * danoMedio(golpeInimigo(i)))));
}

export const pvFinal = pvDe;
export const golpeFinal = golpeInimigo;

/** Instância pronta para entrar no combate (PV, dano e XP ajustados). */
export function instanciaDe(i: Inimigo, xpRef: number): EnemyInstance {
  const t = i.template;
  const pv = pvDe(i);
  const ataques = i.escalaDano === 1 ? t.attacks : t.attacks.map((a: EnemyAttack) => {
    const g = golpeDe(a, t.attributes as unknown as Attrs);
    const base = Math.round(g.base * i.escalaDano);
    const attr = a.damageAttribute ?? 'FOR';
    return { ...a, damageBase: base, damage: `${base} + d20×${attr}/${a.equilibrio ?? g.eq}` };
  });
  return {
    instanceId: '', templateId: i.inventado ? undefined : t.id, name: t.name, type: i.inventado ? 'Genérico' : t.type,
    icon: t.icon, imageUrl: t.imageUrl,
    hpCurrent: pv, hpMax: pv,
    attributes: t.attributes, attacks: ataques, drops: t.drops, immunities: t.immunities ?? [],
    xp: xpDe(i, xpRef),
    desc: t.desc, notes: t.notes, defesa: t.defesa, modAcerto: t.modAcerto,
    esMax: t.esMax ?? 0, negaCritico: t.negaCritico ?? false,
  };
}

/**
 * Completa a config vinda da API com os padrões de cada nível. Sem isso, uma config
 * antiga (sem perigo) fazia todos os níveis caírem no mesmo valor e virarem a mesma luta.
 */
export function normalizarEncontro(c: Partial<EncontroConfig> | null | undefined): EncontroConfig {
  const lista = c?.dificuldades?.length ? c.dificuldades : ENCONTRO_PADRAO.dificuldades;
  return {
    hordaMax: c?.hordaMax && c.hordaMax >= 2 ? c.hordaMax : ENCONTRO_PADRAO.hordaMax,
    dificuldades: lista.map((d, i) => {
      const padrao = ENCONTRO_PADRAO.dificuldades.find((p) => p.id === d.id) ?? ENCONTRO_PADRAO.dificuldades[Math.min(i, 3)];
      return { id: d.id ?? padrao.id, nome: d.nome || padrao.nome, perigo: typeof d.perigo === 'number' && d.perigo > 0 ? d.perigo : padrao.perigo };
    }),
  };
}
