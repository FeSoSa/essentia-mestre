'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LogIn, Map as MapIcon, Network, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { CheckField } from '@/components/ui/Checkbox';
import MapaCanvas from '@/components/map/MapaCanvas';
import { agrupar, posicaoLeque, type Grupo } from '@/components/map/agrupar';
import { api, mensagemErro } from '@/lib/api';
import { ROOT_MAP_ID } from '@/lib/map';
import type { MapMarker, Region } from '@/store/types';
import { useCampanhaStore } from './campanhaStore';
import { TIPOS, tipoDe } from './registroTipos';
import { ESTADO_PADRAO, type Ponto } from './types';
import ListaCapitulos from './ListaCapitulos';
import EditorPonto from './EditorPonto';
import GrafoCampanha from './GrafoCampanha';

interface Props {
  mapStack: string[];
  setMapStack: (s: string[]) => void;
  currentImage?: { id: string; url: string; title: string };
  /** Locais (marcadores) do mapa aberto, desenhados apagados por baixo. */
  markers: MapMarker[];
  regions: Region[];
}

/** Camada Campanha da aba Mapa: lista de capítulos, pontos no mapa e editor do ponto. */
export default function CamadaCampanha({ mapStack, setMapStack, currentImage, markers, regions }: Props) {
  const { snap, carregado, fetch, criarPonto, moverPonto } = useCampanhaStore();
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [novoEm, setNovoEm] = useState<{ x: number; y: number } | null>(null);
  const [mostrarLocais, setMostrarLocais] = useState(true);
  const [visao, setVisao] = useState<'mapa' | 'grafo'>('mapa');
  const [focoGrafo, setFocoGrafo] = useState<{ id: string; n: number } | null>(null);
  const [todosMarcadores, setTodosMarcadores] = useState<MapMarker[]>([]);
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 });
  const [aberto, setAberto] = useState<string | null>(null);
  const fecharRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const aoTamanho = useCallback((w: number, h: number) => setTamanho({ w, h }), []);
  const [erro, setErro] = useState<string | null>(null);

  const currentMapId = mapStack[mapStack.length - 1];

  useEffect(() => { if (!carregado) fetch().catch((e) => setErro(mensagemErro(e, 'Não deu para ler a campanha'))); }, [carregado, fetch]);
  // Todos os marcadores servem para achar o caminho até um mapa (raiz > região > sub-região)
  useEffect(() => { api.get<MapMarker[]>('/map-markers').then((r) => setTodosMarcadores(r.data)).catch(() => {}); }, [markers]);

  const nomeMapa = (id?: string | null) =>
    !id ? 'Sem mapa' : id === ROOT_MAP_ID ? 'Essentia' : regions.find((r) => r.id === id)?.name ?? 'Região apagada';

  const pontos = useMemo(() => snap?.pontos ?? [], [snap]);
  const aqui = useMemo(() => pontos
    .filter((p) => p.mapa?.id === currentMapId && p.x != null && p.y != null)
    .map((p) => ({ id: p.id, x: p.x as number, y: p.y as number, ponto: p })), [pontos, currentMapId]);

  // Quantos pontos moram dentro de cada região (para o selo no local que leva a ela)
  const dentro = useMemo(() => {
    const m = new Map<string, { total: number; ativo: boolean }>();
    for (const p of pontos) {
      const id = p.mapa?.id;
      if (!id || id === currentMapId) continue;
      const c = m.get(id) ?? { total: 0, ativo: false };
      m.set(id, { total: c.total + 1, ativo: c.ativo || snap?.estado[p.id]?.status === 'ativo' });
    }
    return m;
  }, [pontos, currentMapId, snap]);

  function caminhoAte(mapId: string): string[] {
    const caminho = [mapId];
    let atual = mapId;
    for (let i = 0; i < 10 && atual !== ROOT_MAP_ID; i++) {
      const pai = todosMarcadores.find((m) => m.regionId === atual);
      if (!pai) { caminho.unshift(ROOT_MAP_ID); break; }
      atual = pai.mapId;
      caminho.unshift(atual);
    }
    return caminho[0] === ROOT_MAP_ID ? caminho : [ROOT_MAP_ID, ...caminho];
  }

  function selecionar(p: Ponto) {
    setSelecionadoId(p.id);
    setFocoGrafo({ id: p.id, n: Date.now() });
    if (p.mapa?.id && p.mapa.id !== currentMapId) setMapStack(caminhoAte(p.mapa.id));
  }

  const selecionado = pontos.find((p) => p.id === selecionadoId);
  const porId = new Map(aqui.map((a) => [a.id, a]));

  // Pontos quase no mesmo lugar viram um grupo; o grupo abre em leque no hover ou no clique
  const grupos = useMemo(() => agrupar(aqui, tamanho.w, tamanho.h), [aqui, tamanho]);
  const grupoDe = useMemo(() => {
    const m = new Map<string, Grupo<(typeof aqui)[number]>>();
    for (const g of grupos) if (g.membros.length > 1) for (const it of g.membros) m.set(it.id, g);
    return m;
  }, [grupos]);
  const grupoAberto = aberto ?? (selecionadoId ? grupoDe.get(selecionadoId)?.id : undefined) ?? null;
  type ItemMapa = { id: string; x: number; y: number; ponto?: Ponto; grupo?: Grupo<(typeof aqui)[number]> };
  // Grupos primeiro: os pontos são desenhados depois, por cima das linhas do leque
  const itensMapa: ItemMapa[] = [
    ...grupos.filter((g) => g.membros.length > 1).map((g) => ({ id: g.id, x: g.x, y: g.y, grupo: g })),
    ...aqui,
  ];

  function abrirGrupo(id: string) { clearTimeout(fecharRef.current); setAberto(id); }
  function agendarFechar() { clearTimeout(fecharRef.current); fecharRef.current = setTimeout(() => setAberto(null), 280); }
  function manterAberto() { clearTimeout(fecharRef.current); }

  if (!snap) {
    return <div className="flex-1 flex items-center justify-center text-sm text-e-faint">{erro ?? 'Carregando a campanha…'}</div>;
  }

  return (
    <div className="flex-1 min-h-[640px] grid gap-4" style={{ gridTemplateColumns: 'minmax(260px, 300px) minmax(0, 1fr) minmax(360px, 420px)' }}>
      <ListaCapitulos snap={snap} selecionadoId={selecionadoId} currentMapId={currentMapId} nomeMapa={nomeMapa} onSelecionar={selecionar} />

      <div className="min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap text-sm min-h-9">
          <div role="group" aria-label="Como ver" className="flex gap-0.5 p-0.5 rounded-xl border border-e-border bg-e-surface">
            {([['mapa', 'Mapa', MapIcon], ['grafo', 'Grafo', Network]] as const).map(([v, rot, Icon]) => (
              <button key={v} type="button" aria-pressed={visao === v} onClick={() => setVisao(v)}
                className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${visao === v ? 'bg-e-card text-e-text' : 'text-e-sub hover:text-e-text'}`}>
                <Icon size={13} /> {rot}
              </button>
            ))}
          </div>
          {visao === 'mapa' && (<>
          <nav aria-label="Caminho de mapas" className="flex items-center gap-1.5">
            {mapStack.map((id, i) => (
              <span key={id + i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-e-faint">›</span>}
                {i < mapStack.length - 1
                  ? <button type="button" onClick={() => setMapStack(mapStack.slice(0, i + 1))} className="text-e-sub hover:text-e-text cursor-pointer">{nomeMapa(id)}</button>
                  : <span className="font-semibold text-e-text">{nomeMapa(id)}</span>}
              </span>
            ))}
          </nav>
          <span className="text-xs text-e-faint">· {aqui.length} {aqui.length === 1 ? 'ponto' : 'pontos'} aqui</span>
          <div className="flex-1" />
          <div className="w-56">
            <Select value="" placeholder="Ir para região…" onChange={(id) => setMapStack(caminhoAte(id))}
              options={[{ value: ROOT_MAP_ID, label: 'Essentia (mapa raiz)' }, ...regions.map((r) => {
                const n = dentro.get(r.id)?.total ?? pontos.filter((p) => p.mapa?.id === r.id).length;
                return { value: r.id, label: n ? `${r.name} · ${n} ${n === 1 ? 'ponto' : 'pontos'}` : r.name };
              })]} />
          </div>
          <CheckField checked={mostrarLocais} onChange={setMostrarLocais} label="Mostrar locais" color="amber" />
          </>)}
        </div>

        {visao === 'grafo' ? (
          <GrafoCampanha
            snap={snap}
            selecionadoId={selecionadoId}
            onSelecionar={setSelecionadoId}
            foco={focoGrafo}
            nomeMapa={nomeMapa}
            onAbrirMapa={(mapId) => { setVisao('mapa'); setMapStack(caminhoAte(mapId)); }}
          />
        ) : !currentImage?.url ? (
          <div className="flex-1 flex items-center justify-center rounded-xl border border-e-border text-sm text-e-faint">Este mapa não tem imagem.</div>
        ) : (
          <MapaCanvas
            imageUrl={currentImage.url}
            alt={currentImage.title}
            items={itensMapa}
            onTamanho={aoTamanho}
            // Com um grupo aberto, clicar no vazio só fecha o grupo
            onCreateAt={(pos) => { if (aberto) setAberto(null); else setNovoEm(pos); }}
            onMove={(item, pos) => { if (item.ponto) moverPonto(item.id, { id: currentMapId, nome: nomeMapa(currentMapId) }, pos.x, pos.y).catch((e) => setErro(mensagemErro(e, 'Não deu para mover'))); }}
            fundo={<>
              {/* Caminho do grupo: ligações entre pontos deste mapa */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
                {aqui.flatMap((a) => a.ponto.ligadoA.map((alvo) => {
                  const b = porId.get(alvo);
                  return b ? <line key={a.id + '>' + alvo} x1={a.x * 100} y1={a.y * 100} x2={b.x * 100} y2={b.y * 100}
                    stroke="#fafafa" strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 6" vectorEffect="non-scaling-stroke" /> : null;
                }))}
              </svg>
              {mostrarLocais && markers.map((m) => {
                const d = dentro.get(m.regionId);
                return (
                  <div key={m.id} className="absolute" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}>
                    {/* O local é um botão: entra na região para escrever pontos lá dentro */}
                    <button type="button" aria-label={`Entrar em ${m.label}`} title={`Entrar em ${m.label}`}
                      onClick={(e) => { e.stopPropagation(); setMapStack([...mapStack, m.regionId]); }}
                      className="group pointer-events-auto absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-pointer hover:z-30">
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-white/70 bg-e-gold/70 group-hover:w-3.5 group-hover:h-3.5 group-hover:bg-e-gold group-hover:border-white transition-all" />
                      <span className="absolute top-6 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 text-[10px] text-white bg-black/85 rounded px-1.5 py-0.5 whitespace-nowrap">
                        {m.label} <LogIn size={10} />
                      </span>
                    </button>
                    {d && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setMapStack([...mapStack, m.regionId]); }}
                        title={`Entrar em ${m.label}`}
                        className={`pointer-events-auto absolute left-2 -top-7 flex items-center gap-1 h-[22px] px-2 rounded-full border text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                          d.ativo ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-[#1d3550] border-e-flow text-[#cfe6fa]'}`}>
                        {d.total} dentro <LogIn size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </>}
            renderItem={(item, pos, alca, arrastando) => {
              /* Grupo de pontos próximos: bolinha com o número; abre em leque */
              if (item.grupo) {
                const g = item.grupo;
                const abertoAqui = grupoAberto === g.id;
                const cores = g.membros.map((m) => tipoDe(m.ponto.tipo).cor);
                const anel = `conic-gradient(${cores.map((c, i) => `${c} ${(i / cores.length) * 360}deg ${((i + 1) / cores.length) * 360}deg`).join(', ')})`;
                const temAtivo = g.membros.some((m) => snap.estado[m.id]?.status === 'ativo');
                return (
                  <div className="absolute" style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                    onClick={(e) => e.stopPropagation()} onMouseEnter={() => abrirGrupo(g.id)} onMouseLeave={agendarFechar}>
                    {abertoAqui ? (<>
                      {/* Área invisível que segura o leque aberto enquanto o mouse está por perto */}
                      <span className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
                        style={{ width: posicaoLeque(0, g.membros.length).r * 2 + 36, height: posicaoLeque(0, g.membros.length).r * 2 + 36 }} />
                      {g.membros.map((m, i) => {
                        const { dx, dy } = posicaoLeque(i, g.membros.length);
                        return <span key={m.id} className="absolute left-0 top-0 h-px bg-white/50 origin-left pointer-events-none"
                          style={{ width: Math.hypot(dx, dy), transform: `rotate(${Math.atan2(dy, dx)}rad)` }} />;
                      })}
                      <button type="button" aria-label="Fechar grupo" onClick={() => setAberto(null)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 cursor-pointer" />
                    </>) : (<>
                      {temAtivo && <span className="absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-e-accent/25 pointer-events-none" />}
                      <button type="button" aria-label={`${g.membros.length} pontos juntos: ${g.membros.map((m) => m.ponto.titulo).join(', ')}`}
                        title={g.membros.map((m) => m.ponto.titulo).join('\n')}
                        onClick={() => setAberto(g.id)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full p-[2px] shadow-lg cursor-pointer" style={{ background: anel }}>
                        <span className="w-full h-full rounded-full bg-[#111113] text-[10px] font-bold text-white flex items-center justify-center">{g.membros.length}</span>
                      </button>
                    </>)}
                  </div>
                );
              }

              /* Ponto: bolinha pequena que abre no hover; aberto sempre quando selecionado ou ativo */
              const p = item.ponto!;
              const g = grupoDe.get(p.id);
              if (g && g.id !== grupoAberto && !arrastando) return null;
              const idx = g ? g.membros.findIndex((m) => m.id === p.id) : -1;
              const off = g && !arrastando ? posicaoLeque(idx, g.membros.length) : { dx: 0, dy: 0 };
              const t = tipoDe(p.tipo);
              const st = (snap.estado[p.id] ?? ESTADO_PADRAO).status;
              const sel = p.id === selecionadoId;
              // Três tamanhos: grande (selecionado, ativo, arrastando), médio no leque e bolinha no resto
              const grande = sel || st === 'ativo' || arrastando;
              const noLeque = !!g && !arrastando;
              const visual = grande
                ? 'w-7 h-7 bg-[var(--f)] border-[var(--c)]'
                : noLeque
                  ? 'w-5 h-5 bg-[var(--f)] border-[var(--c)] group-hover:w-7 group-hover:h-7'
                  : 'w-3 h-3 bg-[var(--c)] border-white/90 group-hover:w-7 group-hover:h-7 group-hover:bg-[var(--f)] group-hover:border-[var(--c)]';
              return (
                <div className={`group absolute ${st === 'concluido' ? 'opacity-55' : ''} ${sel || arrastando ? 'z-20' : 'z-10 hover:z-30'}`}
                  style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: `translate(${off.dx}px, ${off.dy}px)`, '--c': t.cor, '--f': t.fundo } as React.CSSProperties}
                  onClick={(e) => { e.stopPropagation(); setSelecionadoId(p.id); }}
                  onMouseEnter={g ? manterAberto : undefined} onMouseLeave={g ? agendarFechar : undefined}>
                  {st === 'ativo' && <span className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-e-accent/25 pointer-events-none ${noLeque ? 'w-8 h-8' : 'w-11 h-11'}`} />}
                  {sel && <span className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white pointer-events-none ${noLeque ? 'w-[34px] h-[34px]' : 'w-[38px] h-[38px]'}`} />}
                  {/* Área de toque maior que a bolinha, para pegar fácil */}
                  <span {...alca} title={p.titulo}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${noLeque ? 'w-6 h-6' : 'w-7 h-7'} ${arrastando ? 'cursor-grabbing' : 'cursor-grab'}`}>
                    <span className={`rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-150 ${visual}`}
                      style={{ borderStyle: p.tipo === 'segredo' ? 'dashed' : 'solid' }}>
                      <t.Icon size={grande ? 13 : 11} color={t.cor} className={grande || noLeque ? '' : 'hidden group-hover:block'} />
                    </span>
                  </span>
                  <span className={`absolute left-0 -translate-x-1/2 top-4 text-[11px] font-semibold text-white bg-black/80 rounded-md px-2 py-0.5 whitespace-nowrap pointer-events-none ${grande && !noLeque ? '' : sel ? '' : 'hidden group-hover:block'}`}>
                    {String(p.ordem).padStart(2, '0')} {p.titulo}{st === 'ativo' && <b className="text-e-accent"> · ativo</b>}
                  </span>
                </div>
              );
            }}
          />
        )}
        {erro && <p className="text-xs text-e-danger">{erro}</p>}
      </div>

      {selecionado ? (
        <EditorPonto
          key={selecionado.id}
          ponto={selecionado}
          estado={snap.estado[selecionado.id] ?? ESTADO_PADRAO}
          avisos={snap.avisos[selecionado.id] ?? []}
          capitulos={snap.capitulos}
          pontos={pontos}
          currentMapId={currentMapId}
          nomeMapa={nomeMapa}
          onIrParaMapa={(p) => p.mapa?.id && setMapStack(caminhoAte(p.mapa.id))}
          onFechar={() => setSelecionadoId(null)}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-e-border flex items-center justify-center p-6 text-center text-sm text-e-faint">
          Escolha um ponto na lista ou no mapa, ou clique no mapa para criar um.
        </div>
      )}

      {novoEm && (
        <NovoPontoModal
          capitulos={snap.capitulos.map((c) => ({ value: c.id, label: c.titulo }))}
          nomeMapa={nomeMapa(currentMapId)}
          onCancelar={() => setNovoEm(null)}
          onCriar={async (titulo, tipo, capitulo) => {
            const p = await criarPonto({ titulo, tipo, capitulo, mapa: { id: currentMapId, nome: nomeMapa(currentMapId) }, x: novoEm.x, y: novoEm.y });
            setNovoEm(null);
            if (p) setSelecionadoId(p.id);
          }}
        />
      )}
    </div>
  );
}

function NovoPontoModal({ capitulos, nomeMapa, onCriar, onCancelar }: {
  capitulos: { value: string; label: string }[];
  nomeMapa: string;
  onCriar: (titulo: string, tipo: string, capitulo: string) => Promise<void>;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('narrativo');
  const [capitulo, setCapitulo] = useState(capitulos[capitulos.length - 1]?.value ?? '_');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setEnviando(true); setErro(null);
    try { await onCriar(titulo.trim(), tipo, capitulo === '_' ? '' : capitulo); }
    catch (err) { setErro(mensagemErro(err, 'Não deu para criar')); setEnviando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}>
      <form onSubmit={enviar} role="dialog" aria-label="Novo ponto" className="bg-e-surface border border-e-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border">
          <div>
            <h3 className="font-semibold text-e-text">Novo ponto da campanha</h3>
            <p className="text-xs text-e-sub mt-0.5">Em {nomeMapa}</p>
          </div>
          <button type="button" onClick={onCancelar} aria-label="Fechar" className="text-e-faint hover:text-e-text cursor-pointer p-1"><X size={16} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Título
            <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} required placeholder="Ex: O teste do medo"
              className="mt-1.5 w-full text-sm normal-case tracking-normal font-normal" />
          </label>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5">Tipo</p>
            <div className="grid grid-cols-5 gap-1.5">
              {TIPOS.map((t) => (
                <button key={t.id} type="button" onClick={() => setTipo(t.id)} aria-pressed={tipo === t.id}
                  className="h-14 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer"
                  style={{ color: t.cor, borderColor: tipo === t.id ? t.cor : 'var(--color-e-border)', background: tipo === t.id ? t.cor + '1f' : 'transparent' }}>
                  <t.Icon size={16} /> {t.nome}
                </button>
              ))}
            </div>
            <p className="text-xs text-e-sub mt-2 leading-relaxed min-h-[2.5rem]">{tipoDe(tipo).descricao}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5">Capítulo</p>
            <Select value={capitulo} onChange={setCapitulo} options={[{ value: '_', label: 'Sem capítulo' }, ...capitulos]} />
          </div>
          {erro && <p className="text-xs text-e-danger">{erro}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="ghost" onClick={onCancelar}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={enviando || !titulo.trim()}>{enviando ? 'Criando…' : 'Criar'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
