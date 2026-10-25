'use client';

import { useEffect, useLayoutEffect, useRef, useState, type DragEvent, type PointerEvent, type ReactNode } from 'react';
import { Crown, LayoutGrid, Minus, Plus, Shield, Wand2, Eraser, Skull, ChevronDown, ChevronUp, MousePointer2, BrickWall, Mountain, Trash2, UserMinus, Footprints, Smartphone, Highlighter, CircleDashed } from 'lucide-react';
import { useTabuleiroStore, type Casa, type Terreno } from '@/store/tabuleiroStore';
import { Avatar, Acao, escudoDe, fracEs } from './ui';
import { COR_TIPO, useCombatentes, type Combatente } from './combatentes';
import { casasDe, chaveCasa, useGrade } from './grade';
import { useMovimento } from './movimento';

const TIPO_DRAG = 'text/x-essentia-combatente';

type Ferramenta = 'mover' | Terreno | 'marcador' | 'area' | 'borracha';

const FERRAMENTAS: { f: Ferramenta; Icon: typeof Eraser; titulo: string }[] = [
  { f: 'mover', Icon: MousePointer2, titulo: 'Mover peças' },
  { f: 'parede', Icon: BrickWall, titulo: 'Parede: bloqueia a casa (clique e arraste)' },
  { f: 'dificil', Icon: Mountain, titulo: 'Terreno difícil: custa o dobro com a regra de movimento (clique e arraste)' },
  { f: 'marcador', Icon: Highlighter, titulo: 'Marcador: pinta casas só para mostrar (área, rota, aviso), não bloqueia nada' },
  { f: 'area', Icon: CircleDashed, titulo: 'Área: clique no centro e arraste para abrir um círculo marcado' },
  { f: 'borracha', Icon: Eraser, titulo: 'Borracha: apaga terreno e marcação' },
];

/** Cores do marcador (as mesmas dos tipos de peça, para conversar com o resto da mesa). */
const CORES_MARCA = ['#e05050', '#4a9fe0', '#e0b354', '#a78bfa'];

/** Casas dentro do círculo de raio r (em casas) em volta de c, dentro da grade. */
function casasDoCirculo(c: Casa, r: number, colunas: number, linhas: number): string[] {
  const out: string[] = [];
  for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
    const x = c.x + dx, y = c.y + dy;
    // r² + r arredonda a borda para o círculo não ficar com pontas
    if (x >= 0 && y >= 0 && x < colunas && y < linhas && dx * dx + dy * dy <= r * r + r) out.push(chaveCasa(x, y));
  }
  return out;
}

const FUNDO_TERRENO: Record<Terreno, string> = {
  parede: 'linear-gradient(135deg, #34343c 0%, #2a2a31 100%)',
  dificil: 'repeating-linear-gradient(45deg, rgba(212,168,78,0.18) 0 4px, transparent 4px 10px)',
};

/** Retrato redondo da peça, com o anel de quem está na vez ou selecionado. */
function Peca({ c, size, vez, selecionada }: { c: Combatente; size: number; vez: boolean; selecionada?: boolean }) {
  const cor = COR_TIPO[c.tipo];
  const anel = selecionada ? `0 0 0 3px #fafafa, 0 0 0 5px ${cor}` : vez ? `0 0 0 2px ${cor}, 0 0 16px ${cor}` : `0 0 0 2px ${cor}90`;
  return (
    <div className={`relative rounded-full ${vez && !selecionada ? 'animate-pulse' : ''}`} style={{ boxShadow: anel }}>
      <Avatar src={c.src} emoji={c.emoji} nome={c.nome} size={size} apagado={c.hp <= 0}
        pct={c.hpMax > 0 ? c.hp / c.hpMax : 0} pctEs={fracEs(c.es, c.esMax)} escudo={escudoDe(c.jogador)} />
      {c.tipo === 'boss' && <Crown size={Math.max(10, size / 5)} className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-e-gold drop-shadow" />}
      {c.tipo === 'aliado' && <Shield size={Math.max(9, size / 6)} className="absolute -bottom-1 -right-1 text-emerald-400 drop-shadow" />}
    </div>
  );
}

function BotaoMini({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" title={title} onClick={onClick} className="p-1 rounded hover:bg-white/5 hover:text-e-text cursor-pointer">{children}</button>;
}

/** Lado da casa que faz a grade inteira caber no elemento observado. */
function useLadoQueCabe(colunas: number, linhas: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [lado, setLado] = useState(56);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const { width, height } = el.getBoundingClientRect();
      setLado(Math.max(24, Math.floor(Math.min((width - 24) / colunas, (height - 24) / linhas))));
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [colunas, linhas]);
  return { ref, lado };
}

/**
 * Campo de batalha quadriculado. As peças podem cobrir várias casas, trocam de lugar
 * com outra do mesmo tamanho e não entram em parede. Com uma ferramenta de terreno,
 * clicar e arrastar desenha a sala. A grade ocupa toda a área e as casas se ajustam.
 */
export default function Tabuleiro({ selecionadoId, onSelecionar, onAbrir, onAdicionar, extras }: {
  selecionadoId?: string | null;
  onSelecionar: (c: Combatente) => void;
  onAbrir: (c: Combatente) => void;
  onAdicionar?: (t: 'inimigo' | 'boss' | 'aliado') => void;
  extras?: ReactNode;
}) {
  const { lista, vezId } = useCombatentes();
  const { carregar, carregarRacas, mover, tirar, limpar, posicionarVarios, redimensionar, pintar, limparTerreno, marcar, marcarVarias, limparMarcas, alternarRegra, alternarVisivel } = useTabuleiroStore();
  const marcas = useTabuleiroStore((s) => s.marcas);
  const visivel = useTabuleiroStore((s) => s.visivel);
  const mov = useMovimento();
  const { colunas, linhas, posicoes, terreno, tamanhoDe, noCampo, reserva, ocupacao, cabe } = useGrade(lista);
  const [ferramenta, setFerramenta] = useState<Ferramenta>('mover');
  const [previa, setPrevia] = useState<{ casa: Casa; lado: number; ok: boolean } | null>(null);
  const [cor, setCor] = useState(CORES_MARCA[0]);
  // Círculo da ferramenta Área enquanto o mestre arrasta
  const [areaPrev, setAreaPrev] = useState<{ centro: Casa; raio: number } | null>(null);
  const [reservaAberta, setReservaAberta] = useState(true);
  const [arrastando, setArrastando] = useState<{ id: string; livre: boolean } | null>(null);
  const { ref: areaRef, lado } = useLadoQueCabe(colunas, linhas);
  const gradeRef = useRef<HTMLDivElement>(null);
  // Peça sendo arrastada, em que casa dela o mestre segurou (dataTransfer não é legível no dragover)
  // e, com a regra de movimento, para onde ela pode ir
  const arrasto = useRef<{ id: string; dx: number; dy: number; lado: number; limite: Map<string, number> | null } | null>(null);
  // Traço do pincel: terreno, marcação ou os dois (borracha)
  const traco = useRef<{ camada: 'terreno' | 'marca' | 'tudo'; valor: string | null; ultima: string } | null>(null);
  const desenhando = ferramenta !== 'mover';

  useEffect(() => { carregar(); carregarRacas(); }, [carregar, carregarRacas]);

  function casaDoPonteiro(clientX: number, clientY: number): Casa | null {
    const r = gradeRef.current?.getBoundingClientRect();
    if (!r) return null;
    const x = Math.floor((clientX - r.left) / lado), y = Math.floor((clientY - r.top) / lado);
    return x >= 0 && y >= 0 && x < colunas && y < linhas ? { x, y } : null;
  }

  /** Destino do arrasto: livre, ou troca com uma única peça do mesmo tamanho no mesmo canto. */
  function destino(id: string, casa: Casa, ladoPeca: number): { ok: boolean; trocarCom?: string } {
    const r = cabe(id, casa, ladoPeca);
    const limite = arrasto.current?.limite;
    if (limite) return { ok: r.ok && limite.has(chaveCasa(casa.x, casa.y)) };
    if (r.ok) return { ok: true };
    if (r.parede || r.ocupantes.size !== 1) return { ok: false };
    const [outro] = r.ocupantes;
    const pOutro = posicoes[outro], origem = posicoes[id];
    const mesmoLugar = pOutro && pOutro.x === casa.x && pOutro.y === casa.y && tamanhoDe(outro) === ladoPeca;
    const separados = !origem || Math.abs(origem.x - casa.x) >= ladoPeca || Math.abs(origem.y - casa.y) >= ladoPeca;
    return mesmoLugar && separados ? { ok: true, trocarCom: outro } : { ok: false };
  }

  function iniciarArrasto(ev: DragEvent<HTMLDivElement>, c: Combatente, ladoPeca: number, naGrade: boolean) {
    // Com a regra ligada, quem não está na vez não anda; Alt move livre (empurrão, teleporte, correção)
    const livre = !naGrade || ev.altKey;
    if (!livre && mov.regraPara(c.id) === 'travado') { ev.preventDefault(); return; }
    const limite = livre ? null : mov.destinosDe(c.id);
    ev.dataTransfer.setData(TIPO_DRAG, c.id);
    ev.dataTransfer.effectAllowed = 'move';
    const r = ev.currentTarget.getBoundingClientRect();
    arrasto.current = naGrade
      ? { id: c.id, lado: ladoPeca, limite, dx: Math.floor((ev.clientX - r.left) / lado), dy: Math.floor((ev.clientY - r.top) / lado) }
      : { id: c.id, lado: ladoPeca, limite, dx: 0, dy: 0 };
    setArrastando({ id: c.id, livre: !limite });
  }

  function encerrarArrasto() { arrasto.current = null; setPrevia(null); setArrastando(null); }

  function sobreGrade(ev: DragEvent) {
    const a = arrasto.current;
    if (!a || !ev.dataTransfer.types.includes(TIPO_DRAG)) return;
    ev.preventDefault();
    const sob = casaDoPonteiro(ev.clientX, ev.clientY);
    if (!sob) { setPrevia(null); return; }
    const casa = { x: sob.x - a.dx, y: sob.y - a.dy };
    const { ok } = destino(a.id, casa, a.lado);
    ev.dataTransfer.dropEffect = ok ? 'move' : 'none';
    if (!previa || previa.casa.x !== casa.x || previa.casa.y !== casa.y || previa.ok !== ok || previa.lado !== a.lado) setPrevia({ casa, lado: a.lado, ok });
  }

  function soltarNaGrade(ev: DragEvent) {
    ev.preventDefault();
    const a = arrasto.current;
    const sob = casaDoPonteiro(ev.clientX, ev.clientY);
    if (a && sob) {
      const casa = { x: sob.x - a.dx, y: sob.y - a.dy };
      const d = destino(a.id, casa, a.lado);
      if (d.ok) mover(a.id, casa, d.trocarCom);
    }
    encerrarArrasto();
  }

  function aplicarTraco(k: string) {
    const t = traco.current;
    if (!t) return;
    t.ultima = k;
    if (t.camada !== 'terreno' && (marcas[k] ?? null) !== (t.camada === 'marca' ? t.valor : null)) marcar(k, t.camada === 'marca' ? t.valor : null);
    if (t.camada === 'marca') return;
    // Parede não entra debaixo de peça
    if (t.valor === 'parede' && ocupacao.has(k)) return;
    if ((terreno[k] ?? null) !== t.valor) pintar(k, t.valor as Terreno | null);
  }

  function comecarTraco(ev: PointerEvent<HTMLDivElement>) {
    if (!desenhando || ev.button !== 0) return;
    const casa = casaDoPonteiro(ev.clientX, ev.clientY);
    if (!casa) return;
    const k = chaveCasa(casa.x, casa.y);
    ev.currentTarget.setPointerCapture(ev.pointerId);
    if (ferramenta === 'area') { setAreaPrev({ centro: casa, raio: 0 }); return; }
    // Começar sobre o mesmo terreno (ou a mesma cor) apaga, para corrigir sem trocar de ferramenta
    if (ferramenta === 'marcador') traco.current = { camada: 'marca', valor: marcas[k] === cor ? null : cor, ultima: '' };
    else if (ferramenta === 'borracha') traco.current = { camada: 'tudo', valor: null, ultima: '' };
    else traco.current = { camada: 'terreno', valor: terreno[k] === ferramenta ? null : ferramenta, ultima: '' };
    aplicarTraco(k);
  }

  function continuarTraco(ev: PointerEvent<HTMLDivElement>) {
    if (areaPrev) {
      const casa = casaDoPonteiro(ev.clientX, ev.clientY);
      if (!casa) return;
      const raio = Math.round(Math.hypot(casa.x - areaPrev.centro.x, casa.y - areaPrev.centro.y));
      if (raio !== areaPrev.raio) setAreaPrev({ ...areaPrev, raio });
      return;
    }
    if (!traco.current) return;
    const casa = casaDoPonteiro(ev.clientX, ev.clientY);
    if (!casa) return;
    const k = chaveCasa(casa.x, casa.y);
    if (k !== traco.current.ultima) aplicarTraco(k);
  }

  function terminarTraco() {
    traco.current = null;
    if (areaPrev) {
      marcarVarias(casasDoCirculo(areaPrev.centro, areaPrev.raio, colunas, linhas), cor);
      setAreaPrev(null);
    }
  }

  /** Coloca quem está na reserva: grupo e aliados da esquerda para a direita, oponentes ao contrário. */
  function posicionarReserva() {
    const usadas = new Set<string>();
    const novas: Record<string, Casa> = {};
    for (const c of reserva) {
      const l = tamanhoDe(c.id);
      const xs = Array.from({ length: Math.max(0, colunas - l + 1) }, (_, i) => i);
      if (c.tipo !== 'jogador' && c.tipo !== 'aliado') xs.reverse();
      achou: for (const x of xs) for (let y = 0; y + l <= linhas; y++) {
        const casas = casasDe({ x, y }, l);
        if (cabe(c.id, { x, y }, l).ok && casas.every((k) => !usadas.has(k))) {
          novas[c.id] = { x, y };
          casas.forEach((k) => usadas.add(k));
          break achou;
        }
      }
    }
    posicionarVarios(novas);
  }

  // Casas que a peça arrastada (ou selecionada) alcança, pintadas na grade
  const idAlcance = arrastando?.id ?? selecionadoId ?? null;
  const destinos = mov.ativo && idAlcance && !arrastando?.livre ? mov.destinosDe(idAlcance) : null;
  const alcancavel = new Set<string>();
  if (destinos) {
    const l = tamanhoDe(idAlcance!);
    for (const k of destinos.keys()) {
      const [x, y] = k.split(',').map(Number);
      casasDe({ x, y }, l).forEach((q) => alcancavel.add(q));
    }
  }

  // Caminho até a casa sob o arrasto (só quando a regra limita a peça)
  const caminho = previa?.ok && arrastando && !arrastando.livre && mov.ativo ? mov.caminhoAte(arrastando.id, previa.casa) : [];
  // Etiqueta: total da vez depois deste passo (o que já andou + o caminho)
  const custoPasso = caminho.length && arrastando ? mov.destinosDe(arrastando.id)?.get(chaveCasa(previa!.casa.x, previa!.casa.y)) : undefined;
  const custoCaminho = custoPasso != null && arrastando ? mov.jaAndou(arrastando.id) + custoPasso : undefined;

  const ferramentas = (
    <>
      <button type="button" onClick={alternarVisivel}
        title={visivel ? 'Os jogadores estão vendo o tabuleiro no app (clique para esconder)' : 'Mostrar o tabuleiro no app dos jogadores'}
        className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
          visivel ? 'border-e-accent/40 bg-e-accent/10 text-e-accent' : 'border-white/10 text-e-faint hover:text-e-sub'}`}>
        <Smartphone size={13} /> {visivel ? 'No app' : 'Só aqui'}
      </button>
      <button type="button" onClick={alternarRegra}
        title={mov.ativo ? 'Regra de movimento ligada: cada peça anda o deslocamento da raça; em combate só a da vez. Alt move livre.' : 'Ligar a regra de movimento'}
        className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
          mov.ativo ? 'border-sky-400/40 bg-sky-400/10 text-sky-200' : 'border-white/10 text-e-faint hover:text-e-sub'}`}>
        <Footprints size={13} /> Movimento
        <span className={`w-1.5 h-1.5 rounded-full ${mov.ativo ? 'bg-sky-300' : 'bg-white/20'}`} />
      </button>
      <div className="flex items-center gap-0.5 text-[11px] text-e-faint">
        <LayoutGrid size={12} className="mr-1" />
        <BotaoMini title="Menos colunas" onClick={() => redimensionar(Math.max(4, colunas - 1), linhas, tamanhoDe)}><Minus size={11} /></BotaoMini>
        <span className="tabular-nums w-5 text-center text-e-sub">{colunas}</span>
        <BotaoMini title="Mais colunas" onClick={() => redimensionar(Math.min(40, colunas + 1), linhas, tamanhoDe)}><Plus size={11} /></BotaoMini>
        <span className="mx-0.5">×</span>
        <BotaoMini title="Menos linhas" onClick={() => redimensionar(colunas, Math.max(3, linhas - 1), tamanhoDe)}><Minus size={11} /></BotaoMini>
        <span className="tabular-nums w-5 text-center text-e-sub">{linhas}</span>
        <BotaoMini title="Mais linhas" onClick={() => redimensionar(colunas, Math.min(30, linhas + 1), tamanhoDe)}><Plus size={11} /></BotaoMini>
      </div>
      <div className="h-8 p-0.5 rounded-lg border border-white/10 flex items-center gap-0.5">
        {FERRAMENTAS.map(({ f, Icon, titulo }) => (
          <button key={f} type="button" title={titulo} onClick={() => setFerramenta(f)}
            className={`h-full w-7 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
              ferramenta === f ? 'bg-white/10 text-e-text' : 'text-e-faint hover:text-e-sub'}`}>
            <Icon size={13} />
          </button>
        ))}
        {(ferramenta === 'parede' || ferramenta === 'dificil') && (
          <button type="button" title="Apagar todo o terreno" onClick={() => { if (confirm('Apagar todo o terreno desenhado?')) limparTerreno(); }}
            className="h-full w-7 rounded-md flex items-center justify-center text-e-faint hover:text-red-300 cursor-pointer"><Trash2 size={13} /></button>
        )}
        {(ferramenta === 'marcador' || ferramenta === 'area') && (
          <>
            <span className="w-px h-4 bg-white/10 mx-0.5" />
            {CORES_MARCA.map((c) => (
              <button key={c} type="button" title="Cor da marcação" onClick={() => setCor(c)}
                className="h-full w-6 flex items-center justify-center cursor-pointer">
                <span className="w-3.5 h-3.5 rounded-full" style={{ background: c, boxShadow: cor === c ? `0 0 0 2px #18181b, 0 0 0 3.5px ${c}` : undefined }} />
              </button>
            ))}
            <button type="button" title="Apagar todas as marcações" onClick={() => { if (confirm('Apagar todas as marcações do tabuleiro?')) limparMarcas(); }}
              className="h-full w-7 rounded-md flex items-center justify-center text-e-faint hover:text-red-300 cursor-pointer"><Trash2 size={13} /></button>
          </>
        )}
      </div>
      {onAdicionar && (
        <div className="flex items-center gap-1.5">
          <Acao tom="perigo" title="Adicionar inimigo" onClick={() => onAdicionar('inimigo')}><Skull size={13} /> Inimigo</Acao>
          <Acao tom="ouro" title="Adicionar boss" onClick={() => onAdicionar('boss')}><Crown size={13} /></Acao>
          <Acao tom="sucesso" title="Adicionar aliado" onClick={() => onAdicionar('aliado')}><Shield size={13} /></Acao>
        </div>
      )}
      <Acao title="Coloca quem está na reserva: grupo à esquerda, oponentes à direita" onClick={posicionarReserva} disabled={reserva.length === 0}>
        <Wand2 size={13} /> Posicionar
      </Acao>
      <Acao title="Tira todas as peças do campo (o terreno fica)" onClick={() => { if (confirm('Tirar todas as peças do tabuleiro?')) limpar(); }}><UserMinus size={13} /></Acao>
    </>
  );

  const grade = (
    <div ref={gradeRef} className={`relative ${desenhando ? 'cursor-crosshair' : ''}`}
      style={{ width: colunas * lado, height: linhas * lado }}
      onDragOver={sobreGrade} onDrop={soltarNaGrade}
      onDragLeave={(ev) => { if (!ev.currentTarget.contains(ev.relatedTarget as Node | null)) setPrevia(null); }}
      onPointerDown={comecarTraco} onPointerMove={continuarTraco}
      onPointerUp={terminarTraco} onPointerCancel={() => { traco.current = null; setAreaPrev(null); }}>
      <div className="grid absolute inset-0" style={{ gridTemplateColumns: `repeat(${colunas}, ${lado}px)`, gridAutoRows: `${lado}px` }}>
        {Array.from({ length: colunas * linhas }, (_, i) => {
          const x = i % colunas, y = Math.floor(i / colunas);
          const k = chaveCasa(x, y);
          const t = terreno[k];
          return (
            <div key={i} className="border-r border-b border-white/[0.06]"
              style={{
                borderLeft: x === 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                borderTop: y === 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                backgroundImage: t ? FUNDO_TERRENO[t] : undefined,
                backgroundColor: alcancavel.has(k) ? 'rgba(74,159,224,0.16)' : (x + y) % 2 ? 'rgba(255,255,255,0.015)' : undefined,
                boxShadow: t === 'parede' ? 'inset 0 0 0 1px rgba(0,0,0,0.35)' : undefined,
              }} />
          );
        })}
      </div>

      {/* Marcações do mestre: só visuais, por cima do terreno e por baixo das peças */}
      {Object.entries(marcas).map(([k, c]) => {
        const [x, y] = k.split(',').map(Number);
        return (
          <div key={`m${k}`} className="absolute pointer-events-none"
            style={{ left: x * lado, top: y * lado, width: lado, height: lado, background: c + '3d', boxShadow: `inset 0 0 0 1px ${c}99` }} />
        );
      })}
      {areaPrev && (
        <>
          {casasDoCirculo(areaPrev.centro, areaPrev.raio, colunas, linhas).map((k) => {
            const [x, y] = k.split(',').map(Number);
            return <div key={`a${k}`} className="absolute pointer-events-none" style={{ left: x * lado, top: y * lado, width: lado, height: lado, background: cor + '55' }} />;
          })}
          <span className="absolute pointer-events-none text-[10px] font-black tabular-nums px-1.5 rounded text-black z-10"
            style={{ left: areaPrev.centro.x * lado + 2, top: areaPrev.centro.y * lado + 2, background: cor }}>raio {areaPrev.raio}</span>
        </>
      )}

      {/* Rota que a peça faz, casa a casa (contorna parede e oponente) */}
      {caminho.slice(0, -1).map((c, i) => (
        <div key={i} className="absolute pointer-events-none flex items-center justify-center"
          style={{ left: c.x * lado, top: c.y * lado, width: previa!.lado * lado, height: previa!.lado * lado }}>
          <span className="rounded-full bg-sky-300/80" style={{ width: Math.max(6, lado * 0.2), height: Math.max(6, lado * 0.2) }} />
        </div>
      ))}
      {previa && custoCaminho != null && (
        <span className="absolute pointer-events-none text-[10px] font-black tabular-nums px-1.5 rounded bg-sky-300 text-black z-10"
          style={{ left: previa.casa.x * lado + 2, top: previa.casa.y * lado + 2 }}>{custoCaminho}</span>
      )}

      {previa && (
        <div className="absolute rounded-md pointer-events-none"
          style={{
            left: previa.casa.x * lado, top: previa.casa.y * lado, width: previa.lado * lado, height: previa.lado * lado,
            background: previa.ok ? 'rgba(163,230,53,0.14)' : 'rgba(224,80,80,0.16)',
            boxShadow: `inset 0 0 0 2px ${previa.ok ? 'rgba(163,230,53,0.6)' : 'rgba(224,80,80,0.6)'}`,
          }} />
      )}

      {noCampo.map(({ c, casa, lado: l }) => {
        const travado = mov.regraPara(c.id) === 'travado';
        return (
        <div key={c.id} draggable={!desenhando}
          onDragStart={(ev) => iniciarArrasto(ev, c, l, true)} onDragEnd={encerrarArrasto}
          onClick={() => onSelecionar(c)} onDoubleClick={() => onAbrir(c)}
          title={`${c.nome} · ${c.hp}/${c.hpMax} PV${l > 1 ? ` · ${l}×${l}` : ''}`}
          className={`absolute flex items-center justify-center select-none ${desenhando ? 'pointer-events-none' : travado ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
          style={{ left: casa.x * lado, top: casa.y * lado, width: l * lado, height: l * lado }}>
          <Peca c={c} size={Math.round(l * lado * (l > 1 ? 0.9 : 0.84))} vez={vezId === c.id} selecionada={selecionadoId === c.id} />
        </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      <div className="shrink-0 flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-e-sub">Tabuleiro</span>
        <span className="text-[11px] text-e-faint tabular-nums">{noCampo.length} no campo</span>
        <div className="ml-auto flex items-center gap-2 flex-wrap">{ferramentas}{extras}</div>
      </div>

      <div ref={areaRef} className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-[#111114] flex items-center justify-center overflow-hidden">
        {grade}
      </div>

      <div onDragOver={(ev) => { if (ev.dataTransfer.types.includes(TIPO_DRAG)) ev.preventDefault(); }}
        onDrop={(ev) => { ev.preventDefault(); if (arrasto.current) tirar(arrasto.current.id); encerrarArrasto(); }}
        className="shrink-0 rounded-2xl border border-dashed border-white/15 bg-[#111114]/60">
        <button type="button" onClick={() => setReservaAberta((v) => !v)}
          className="w-full flex items-center gap-2 px-4 h-9 text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint hover:text-e-sub cursor-pointer">
          Reserva <span className="tabular-nums font-semibold normal-case tracking-normal">{reserva.length}</span>
          <span className="ml-auto">{reservaAberta ? <ChevronDown size={13} /> : <ChevronUp size={13} />}</span>
        </button>
        {reservaAberta && (
          <div className="flex items-center gap-3 px-4 pb-3 overflow-x-auto [scrollbar-width:thin]">
            {reserva.length === 0
              ? <span className="text-xs text-e-faint">Todos estão no campo. Arraste uma peça para cá para tirá-la.</span>
              : reserva.map((c) => (
                <div key={c.id} draggable onDragStart={(ev) => iniciarArrasto(ev, c, tamanhoDe(c.id), false)} onDragEnd={encerrarArrasto}
                  onClick={() => onSelecionar(c)} onDoubleClick={() => onAbrir(c)}
                  className="flex flex-col items-center gap-1 w-14 shrink-0 cursor-grab active:cursor-grabbing select-none">
                  <Peca c={c} size={44} vez={vezId === c.id} selecionada={selecionadoId === c.id} />
                  <span className="text-[10px] text-e-sub truncate w-full text-center">{c.nome}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
