'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Link2, Map as MapIcon, Pin, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { CheckField } from '@/components/ui/Checkbox';
import { mensagemErro } from '@/lib/api';
import { useCampanhaStore } from './campanhaStore';
import { tipoDe, type TipoPonto } from './registroTipos';
import { ESTADO_PADRAO, type CampanhaSnapshot, type Ponto, type PosicaoGrafo } from './types';

/**
 * Visão em grafo da campanha, no estilo do Obsidian: pontos são nós, "Leva para"
 * são setas e (opcional) cada local/região vira um nó ligado aos pontos de lá.
 * Os nós se arrumam por física; arrastar um nó prende ele ali (salvo em _grafo.json).
 */

interface No {
  id: string;
  rotulo: string;
  tipo: TipoPonto | null;       // null = nó de mapa (local/região)
  ponto?: Ponto;
  mapaId?: string;
}
interface Aresta { de: string; para: string; local: boolean }
interface Corpo { x: number; y: number; vx: number; vy: number }
type Sim = Record<string, Corpo>;
interface Vista { k: number; tx: number; ty: number }

type Arrasto =
  | { tipo: 'no'; id: string; x: number; y: number; moveu: boolean }
  | { tipo: 'pan'; sx: number; sy: number; tx0: number; ty0: number; moveu: boolean }
  | { tipo: 'ligar'; de: string; x: number; y: number };

const R = 16;
const idMapa = (id: string) => `mapa:${id}`;

/** Número estável a partir do id: o mesmo nó nasce sempre no mesmo lugar. */
function semente(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Um passo da física: repulsão entre todos, mola nas arestas e um puxão leve para o centro. */
function passoFisica(prev: Sim, nos: No[], arestas: Aresta[], presos: Record<string, PosicaoGrafo>, alpha: number, arrasto: Arrasto | null): Sim {
  const s: Sim = {};
  for (const n of nos) {
    const p = prev[n.id];
    if (p) { s[n.id] = { ...p }; continue; }
    const salvo = presos[n.id];
    if (salvo) { s[n.id] = { x: salvo.x, y: salvo.y, vx: 0, vy: 0 }; continue; }
    // Nasce perto de um vizinho que já existe, ou numa espiral em volta do centro
    const viz = arestas.find((a) => (a.de === n.id && prev[a.para]) || (a.para === n.id && prev[a.de]));
    const base = viz ? prev[viz.de === n.id ? viz.para : viz.de] : { x: 0, y: 0 };
    const ang = semente(n.id) * Math.PI * 2;
    const raio = viz ? 60 : 80 + semente(n.id + '#') * 240;
    s[n.id] = { x: base.x + Math.cos(ang) * raio, y: base.y + Math.sin(ang) * raio, vx: 0, vy: 0 };
  }
  const ids = Object.keys(s);
  for (let i = 0; i < ids.length; i++) {
    const a = s[ids[i]];
    for (let j = i + 1; j < ids.length; j++) {
      const b = s[ids[j]];
      let dx = b.x - a.x, dy = b.y - a.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1) { dx = semente(ids[i] + ids[j]) - 0.5; dy = 0.5; d2 = 1; }
      if (d2 > 250000) continue;
      const f = (-1400 * alpha) / d2;
      a.vx += dx * f; a.vy += dy * f;
      b.vx -= dx * f; b.vy -= dy * f;
    }
  }
  for (const e of arestas) {
    const a = s[e.de], b = s[e.para];
    if (!a || !b) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const k = ((d - (e.local ? 90 : 130)) / d) * 0.08 * alpha;
    a.vx += dx * k; a.vy += dy * k;
    b.vx -= dx * k; b.vy -= dy * k;
  }
  for (const id of ids) {
    const c = s[id];
    if (arrasto?.tipo === 'no' && arrasto.id === id) { c.x = arrasto.x; c.y = arrasto.y; c.vx = 0; c.vy = 0; continue; }
    const salvo = presos[id];
    if (salvo) { c.x = salvo.x; c.y = salvo.y; c.vx = 0; c.vy = 0; continue; }
    c.vx -= c.x * 0.004 * alpha; c.vy -= c.y * 0.004 * alpha;
    c.vx *= 0.6; c.vy *= 0.6;
    c.x += c.vx; c.y += c.vy;
  }
  return s;
}

interface Props {
  snap: CampanhaSnapshot;
  selecionadoId: string | null;
  onSelecionar: (id: string | null) => void;
  nomeMapa: (id?: string | null) => string;
  /** Clique num nó de local: abre aquele mapa na visão Mapa. */
  onAbrirMapa: (mapId: string) => void;
}

export default function GrafoCampanha({ snap, selecionadoId, onSelecionar, nomeMapa, onAbrirMapa }: Props) {
  const { salvarPonto, criarPonto, moverPonto, posicionarGrafo, soltarGrafo, fetch } = useCampanhaStore();
  const [mostrarLocais, setMostrarLocais] = useState(true);
  const [modoLigar, setModoLigar] = useState(false);
  const [capitulo, setCapitulo] = useState('');
  const [sim, setSim] = useState<Sim>({});
  const [vista, setVista] = useState<Vista>({ k: 1, tx: 0, ty: 0 });
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [arestaSel, setArestaSel] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const caixaRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Sim>({});
  const alphaRef = useRef(1);
  const rafRef = useRef(0);
  const ajustadoRef = useRef(false);
  const arrastoRef = useRef<Arrasto | null>(null);
  const dadosRef = useRef<{ nos: No[]; arestas: Aresta[]; presos: Record<string, PosicaoGrafo> }>({ nos: [], arestas: [], presos: {} });
  const passoRef = useRef<() => void>(() => {});
  /** Posição de um nó recém-solto, até a API confirmar (para ele não escorregar). */
  const pendentesRef = useRef<Record<string, PosicaoGrafo>>({});

  const presos = snap.grafo?.posicoes ?? {};

  const { nos, arestas } = useMemo(() => {
    const pontos = snap.pontos.filter((p) => !capitulo || p.capitulo === capitulo);
    const ids = new Set(pontos.map((p) => p.id));
    const nos: No[] = pontos.map((p) => ({ id: p.id, rotulo: p.titulo, tipo: tipoDe(p.tipo), ponto: p }));
    const arestas: Aresta[] = [];
    for (const p of pontos) for (const alvo of p.ligadoA) if (ids.has(alvo) && alvo !== p.id) arestas.push({ de: p.id, para: alvo, local: false });
    if (mostrarLocais) {
      const mapas = new Set(pontos.map((p) => p.mapa?.id).filter((x): x is string => !!x));
      for (const m of mapas) nos.push({ id: idMapa(m), rotulo: nomeMapa(m), tipo: null, mapaId: m });
      for (const p of pontos) if (p.mapa?.id) arestas.push({ de: idMapa(p.mapa.id), para: p.id, local: true });
    }
    return { nos, arestas };
  }, [snap.pontos, capitulo, mostrarLocais, nomeMapa]);

  // Os callbacks da física leem sempre os dados mais novos
  useEffect(() => { dadosRef.current = { nos, arestas, presos: { ...presos, ...pendentesRef.current } }; });

  const reaquecer = useCallback((a: number) => {
    alphaRef.current = Math.max(alphaRef.current, a);
    if (!rafRef.current) rafRef.current = requestAnimationFrame(() => passoRef.current());
  }, []);

  useEffect(() => {
    passoRef.current = () => {
      rafRef.current = 0;
      const { nos, arestas, presos } = dadosRef.current;
      const prox = passoFisica(simRef.current, nos, arestas, presos, alphaRef.current, arrastoRef.current);
      simRef.current = prox;
      setSim(prox);
      alphaRef.current *= 0.975;
      // Na primeira arrumação, enquadra tudo na tela
      if (!ajustadoRef.current && alphaRef.current < 0.35 && caixaRef.current) {
        ajustadoRef.current = true;
        setVista(enquadrar(prox, caixaRef.current.clientWidth, caixaRef.current.clientHeight));
      }
      if (alphaRef.current > 0.004 || arrastoRef.current?.tipo === 'no') rafRef.current = requestAnimationFrame(() => passoRef.current());
    };
  });

  // Mudou o conjunto de nós ou arestas: a física volta a trabalhar
  const chave = nos.map((n) => n.id).join('|') + '#' + arestas.map((a) => a.de + '>' + a.para).join('|');
  useEffect(() => { reaquecer(0.5); }, [chave, reaquecer]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Zoom pela roda do mouse, em volta do cursor (listener nativo para poder impedir a rolagem)
  useEffect(() => {
    const el = caixaRef.current;
    if (!el) return;
    function roda(e: WheelEvent) {
      e.preventDefault();
      const r = el!.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      setVista((v) => {
        const k = Math.min(3, Math.max(0.2, v.k * Math.exp(-e.deltaY * 0.0015)));
        return { k, tx: mx - ((mx - v.tx) / v.k) * k, ty: my - ((my - v.ty) / v.k) * k };
      });
    }
    el.addEventListener('wheel', roda, { passive: false });
    return () => el.removeEventListener('wheel', roda);
  }, []);

  function enquadrar(s: Sim, w: number, h: number): Vista {
    const cs = Object.values(s);
    if (cs.length === 0) return { k: 1, tx: w / 2, ty: h / 2 };
    const xs = cs.map((c) => c.x), ys = cs.map((c) => c.y);
    const minX = Math.min(...xs) - 80, maxX = Math.max(...xs) + 80, minY = Math.min(...ys) - 60, maxY = Math.max(...ys) + 80;
    const k = Math.min(1.4, Math.max(0.25, Math.min(w / (maxX - minX), h / (maxY - minY))));
    return { k, tx: w / 2 - ((minX + maxX) / 2) * k, ty: h / 2 - ((minY + maxY) / 2) * k };
  }

  function mundo(e: React.PointerEvent | React.MouseEvent, v = vista) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left - v.tx) / v.k, y: (e.clientY - r.top - v.ty) / v.k };
  }

  function definirArrasto(a: Arrasto | null) { arrastoRef.current = a; setArrasto(a); }

  const noEm = (x: number, y: number) =>
    nos.find((n) => { const c = sim[n.id]; return c && (c.x - x) ** 2 + (c.y - y) ** 2 < (R + 6) ** 2; });

  /**
   * Liga dois nós, em qualquer região ou capítulo. Ponto com ponto vira "Leva para";
   * ponto com local coloca o ponto naquele mapa (no meio da imagem, para arrumar depois).
   */
  async function ligar(de: No, para: No) {
    if (de.id === para.id) return;
    const ponto = de.ponto ?? para.ponto;
    const local = de.mapaId ? de : para.mapaId ? para : null;
    try {
      if (de.ponto && para.ponto) {
        if (de.ponto.ligadoA.includes(para.id)) return;
        await salvarPonto({ ...de.ponto, ligadoA: [...de.ponto.ligadoA, para.id] });
      } else if (ponto && local?.mapaId && ponto.mapa?.id !== local.mapaId) {
        await moverPonto(ponto.id, { id: local.mapaId, nome: nomeMapa(local.mapaId) }, 0.5, 0.5);
      }
    } catch (e) { setErro(mensagemErro(e, 'Não deu para ligar; tente de novo')); fetch(); }
  }

  /** Desliga uma seta: tira o "Leva para", ou tira o ponto do mapa quando é a linha até um local. */
  async function desligar(de: string, para: string) {
    try {
      if (de.startsWith('mapa:')) await moverPonto(para, null);
      else {
        const p = snap.pontos.find((x) => x.id === de);
        if (p) await salvarPonto({ ...p, ligadoA: p.ligadoA.filter((x) => x !== para) });
      }
      setArestaSel(null);
    } catch (e) { setErro(mensagemErro(e, 'Não deu para desligar; tente de novo')); fetch(); }
  }

  /* ── Ponteiro ─────────────────────────────────────────────────── */

  function aoApertarNo(e: React.PointerEvent, n: No) {
    e.stopPropagation();
    ((e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as Element)).setPointerCapture?.(e.pointerId);
    const c = sim[n.id];
    if (!c) return;
    if (e.shiftKey || modoLigar) definirArrasto({ tipo: 'ligar', de: n.id, x: c.x, y: c.y });
    else definirArrasto({ tipo: 'no', id: n.id, x: c.x, y: c.y, moveu: false });
  }

  function aoApertarFundo(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    definirArrasto({ tipo: 'pan', sx: e.clientX, sy: e.clientY, tx0: vista.tx, ty0: vista.ty, moveu: false });
  }

  function aoMover(e: React.PointerEvent<SVGSVGElement>) {
    const a = arrastoRef.current;
    if (!a) return;
    if (a.tipo === 'pan') {
      const dx = e.clientX - a.sx, dy = e.clientY - a.sy;
      setVista((v) => ({ ...v, tx: a.tx0 + dx, ty: a.ty0 + dy }));
      if (!a.moveu && dx * dx + dy * dy > 9) definirArrasto({ ...a, moveu: true });
    } else {
      const p = mundo(e);
      definirArrasto({ ...a, x: p.x, y: p.y, ...(a.tipo === 'no' ? { moveu: true } : {}) } as Arrasto);
      if (a.tipo === 'no') reaquecer(0.25);
    }
  }

  async function aoSoltar(e: React.PointerEvent<SVGSVGElement>) {
    const a = arrastoRef.current;
    definirArrasto(null);
    if (!a) return;
    if (a.tipo === 'pan') { if (!a.moveu) { setArestaSel(null); onSelecionar(null); } return; }
    if (a.tipo === 'ligar') {
      const p = mundo(e);
      const alvo = noEm(p.x, p.y);
      const origem = nos.find((x) => x.id === a.de);
      if (alvo && origem) await ligar(origem, alvo);
      return;
    }
    const n = nos.find((x) => x.id === a.id);
    if (a.moveu) {
      // Prende onde soltou
      pendentesRef.current = { ...pendentesRef.current, [a.id]: { x: a.x, y: a.y } };
      dadosRef.current = { ...dadosRef.current, presos: { ...dadosRef.current.presos, [a.id]: { x: a.x, y: a.y } } };
      try { await posicionarGrafo({ [a.id]: { x: a.x, y: a.y } }); } catch (err) { setErro(mensagemErro(err, 'Não deu para salvar a posição')); }
      finally { const resto = { ...pendentesRef.current }; delete resto[a.id]; pendentesRef.current = resto; }
    } else if (n?.ponto) onSelecionar(n.id);
    else if (n?.mapaId) onAbrirMapa(n.mapaId);
  }

  async function aoDuploClique(e: React.MouseEvent<SVGSVGElement>) {
    if (e.target !== e.currentTarget) return;
    const p = mundo(e);
    try {
      const novo = await criarPonto({ titulo: 'Novo ponto', tipo: 'narrativo', capitulo });
      if (novo) { await posicionarGrafo({ [novo.id]: p }); onSelecionar(novo.id); }
    } catch (err) { setErro(mensagemErro(err, 'Não deu para criar')); }
  }

  /* ── Desenho ──────────────────────────────────────────────────── */

  const foco = hover ?? selecionadoId;
  const vizinhos = useMemo(() => {
    if (!foco) return null;
    const s = new Set([foco]);
    for (const a of arestas) { if (a.de === foco) s.add(a.para); if (a.para === foco) s.add(a.de); }
    return s;
  }, [foco, arestas]);

  const arrastandoNo = arrasto?.tipo === 'no' ? arrasto.id : null;
  const ligando = arrasto?.tipo === 'ligar' ? arrasto : null;
  const presosNaTela = Object.keys(presos).filter((id) => nos.some((n) => n.id === id)).length;

  return (
    <div ref={caixaRef} className="relative flex-1 min-h-[560px] rounded-xl border border-e-border overflow-hidden select-none"
      style={{ background: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0) 0 0 / 24px 24px, #0e0e11' }}>
      <svg className={`absolute inset-0 w-full h-full ${arrasto?.tipo === 'pan' ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={aoApertarFundo} onPointerMove={aoMover} onPointerUp={aoSoltar} onDoubleClick={aoDuploClique}>
        <defs>
          <marker id="seta-grafo" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#a1a1aa" />
          </marker>
          <marker id="seta-grafo-foco" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#fafafa" />
          </marker>
        </defs>
        <g transform={`translate(${vista.tx} ${vista.ty}) scale(${vista.k})`}>
          {arestas.map((a) => {
            const p = sim[a.de], q = sim[a.para];
            if (!p || !q) return null;
            const dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
            // A seta termina na borda do nó, não no centro
            const x2 = q.x - (dx / d) * (R + 3), y2 = q.y - (dy / d) * (R + 3);
            const chaveA = a.de + '>' + a.para;
            const emFoco = !!vizinhos && vizinhos.has(a.de) && vizinhos.has(a.para);
            const apagada = !!vizinhos && !emFoco;
            const sel = arestaSel === chaveA;
            return (
              <g key={chaveA} opacity={apagada ? 0.15 : 1}>
                <line x1={p.x} y1={p.y} x2={a.local ? q.x : x2} y2={a.local ? q.y : y2}
                  stroke={sel ? '#a3e635' : a.local ? '#d4a84e' : emFoco ? '#fafafa' : '#71717a'}
                  strokeOpacity={sel ? 1 : a.local ? 0.35 : 0.9} strokeWidth={(sel ? 2.5 : a.local ? 1 : 1.5) / Math.sqrt(vista.k)}
                  strokeDasharray={a.local ? '3 4' : undefined}
                  markerEnd={a.local ? undefined : emFoco || sel ? 'url(#seta-grafo-foco)' : 'url(#seta-grafo)'} />
                {/* Área larga e invisível para facilitar o clique na linha */}
                <line x1={p.x} y1={p.y} x2={x2} y2={y2} stroke="transparent" strokeWidth={12 / vista.k} className="cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setArestaSel(sel ? null : chaveA); }}>
                  <title>{a.local ? 'Clique para tirar o ponto deste mapa' : 'Clique para desligar'}</title>
                </line>
              </g>
            );
          })}

          {ligando && sim[ligando.de] && (
            <line x1={sim[ligando.de].x} y1={sim[ligando.de].y} x2={ligando.x} y2={ligando.y}
              stroke="#a3e635" strokeWidth={2 / vista.k} strokeDasharray="6 5" markerEnd="url(#seta-grafo-foco)" pointerEvents="none" />
          )}

          {nos.map((n) => {
            const c = sim[n.id];
            if (!c) return null;
            const apagado = !!vizinhos && !vizinhos.has(n.id);
            const preso = !!presos[n.id];
            if (!n.tipo) {
              return (
                <g key={n.id} transform={`translate(${c.x} ${c.y})`} opacity={apagado ? 0.2 : 1} className="cursor-pointer"
                  onPointerDown={(e) => aoApertarNo(e, n)} onPointerEnter={() => setHover(n.id)} onPointerLeave={() => setHover(null)}>
                  <rect x={-12} y={-12} width={24} height={24} rx={6} transform="rotate(45)" fill="#2a2410" stroke="#d4a84e" strokeWidth={1.5} />
                  <MapIcon x={-7} y={-7} size={14} color="#e7c47c" />
                  <text y={30} textAnchor="middle" className="text-[11px] font-semibold" fill="#e7c47c" stroke="#0e0e11" strokeWidth={3} paintOrder="stroke">{n.rotulo}</text>
                  {preso && <Pin x={10} y={-22} size={10} color="#a1a1aa" />}
                </g>
              );
            }
            const t = n.tipo;
            const st = (snap.estado[n.id] ?? ESTADO_PADRAO).status;
            const sel = selecionadoId === n.id;
            const temAviso = (snap.avisos[n.id]?.length ?? 0) > 0;
            return (
              <g key={n.id} transform={`translate(${c.x} ${c.y})`} opacity={apagado ? 0.2 : st === 'concluido' ? 0.5 : 1}
                className={arrastandoNo === n.id ? 'cursor-grabbing' : 'cursor-pointer'}
                onPointerDown={(e) => aoApertarNo(e, n)} onPointerEnter={() => setHover(n.id)} onPointerLeave={() => setHover(null)}>
                {st === 'ativo' && <circle r={R + 9} fill="rgba(163,230,53,0.22)" />}
                {sel && <circle r={R + 5} fill="none" stroke="#fafafa" strokeWidth={2} />}
                <circle r={R} fill={t.fundo} stroke={t.cor} strokeWidth={2} strokeDasharray={n.ponto?.tipo === 'segredo' ? '4 3' : undefined} />
                <t.Icon x={-7} y={-7} size={14} color={t.cor} />
                <text y={R + 15} textAnchor="middle" className="text-[11px] font-semibold" fill="#fafafa" stroke="#0e0e11" strokeWidth={3} paintOrder="stroke">
                  {n.rotulo.length > 28 ? n.rotulo.slice(0, 27) + '…' : n.rotulo}
                </text>
                {temAviso && <circle cx={R - 2} cy={-R + 2} r={4} fill="#d4a84e" stroke="#0e0e11" strokeWidth={1.5} />}
                {preso && <Pin x={-R - 6} y={-R - 4} size={10} color="#a1a1aa" />}
              </g>
            );
          })}

          {/* Botão para desligar a seta escolhida, no meio dela */}
          {arestaSel && (() => {
            const [de, para] = arestaSel.split('>');
            const p = sim[de], q = sim[para];
            if (!p || !q) return null;
            return (
              <g transform={`translate(${(p.x + q.x) / 2} ${(p.y + q.y) / 2}) scale(${1 / vista.k})`} className="cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); desligar(de, para); }}>
                <circle r={11} fill="#e05050" stroke="#0e0e11" strokeWidth={2} />
                <X x={-6} y={-6} size={12} color="#fff" />
                <title>{de.startsWith('mapa:') ? 'Tirar o ponto deste mapa' : 'Desligar'}</title>
              </g>
            );
          })()}
        </g>
      </svg>

      {/* Barra do grafo */}
      <div className="absolute left-3 right-3 top-3 flex items-center gap-2 flex-wrap pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 h-10 px-3 rounded-xl bg-[#0c0c0e]/90 border border-e-border">
          <CheckField checked={mostrarLocais} onChange={setMostrarLocais} label="Locais" color="amber" />
        </div>
        <button type="button" aria-pressed={modoLigar} onClick={() => setModoLigar((m) => !m)}
          title="Com o modo ligar, arrastar de um nó até outro cria uma ligação (o mesmo que Shift + arrastar)"
          className={`pointer-events-auto h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
            modoLigar ? 'bg-e-accent/15 border-e-accent text-e-accent' : 'bg-[#0c0c0e]/90 border-e-border text-e-sub hover:text-e-text'}`}>
          <Link2 size={14} /> Modo ligar
        </button>
        <div className="pointer-events-auto w-52">
          <Select value={capitulo || '_'} onChange={(v) => setCapitulo(v === '_' ? '' : v)}
            options={[{ value: '_', label: 'Todos os capítulos' }, ...snap.capitulos.map((c) => ({ value: c.id, label: c.titulo }))]} />
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="subtle" className="pointer-events-auto"
          onClick={() => caixaRef.current && setVista(enquadrar(sim, caixaRef.current.clientWidth, caixaRef.current.clientHeight))}>
          <Crosshair size={13} /> Enquadrar
        </Button>
        <Button size="sm" variant="subtle" className="pointer-events-auto" disabled={presosNaTela === 0}
          title="Solta todos os nós presos e deixa a física arrumar de novo"
          onClick={async () => { try { await soltarGrafo(); reaquecer(1); } catch (e) { setErro(mensagemErro(e, 'Não deu certo')); } }}>
          <Pin size={13} /> Soltar todos{presosNaTela ? ` (${presosNaTela})` : ''}
        </Button>
      </div>

      <div className="absolute left-3 bottom-3 max-w-[calc(100%-24px)] text-[11px] leading-relaxed text-e-sub bg-[#0c0c0e]/85 border border-e-border rounded-lg px-3 py-2 pointer-events-none">
        {modoLigar
          ? <>Modo ligar: arraste de um nó até outro. Ponto com ponto vira <b className="text-e-text">Leva para</b>, ponto com local coloca o ponto naquele mapa.</>
          : <>Arraste um nó para prender · <b className="text-e-text">Shift + arrastar</b> liga dois nós, de qualquer região · clique numa linha para desligar · clique duplo no vazio cria um ponto · roda do mouse dá zoom</>}
      </div>
      {erro && (
        <button type="button" onClick={() => setErro(null)} className="absolute right-3 bottom-3 text-xs text-e-danger bg-[#0c0c0e]/90 border border-e-danger/40 rounded-lg px-3 py-2 cursor-pointer">
          {erro} ✕
        </button>
      )}
      {nos.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm text-e-faint">
          Nenhum ponto {capitulo ? 'neste capítulo' : 'ainda'}. Clique duas vezes para criar.
        </div>
      )}
    </div>
  );
}
