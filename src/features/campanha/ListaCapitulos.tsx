'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import { mensagemErro } from '@/lib/api';
import { useCampanhaStore } from './campanhaStore';
import { TIPOS, tipoDe } from './registroTipos';
import { ESTADO_PADRAO, type Capitulo, type CampanhaSnapshot, type Ponto } from './types';

interface Props {
  snap: CampanhaSnapshot;
  selecionadoId: string | null;
  currentMapId: string;
  nomeMapa: (id?: string | null) => string;
  onSelecionar: (p: Ponto) => void;
}

export default function ListaCapitulos({ snap, selecionadoId, currentMapId, nomeMapa, onSelecionar }: Props) {
  const criarCapitulo = useCampanhaStore((s) => s.criarCapitulo);
  const [soEsteMapa, setSoEsteMapa] = useState(false);
  const [tipo, setTipo] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [fechados, setFechados] = useState<Set<string>>(new Set());
  const [novoCap, setNovoCap] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const q = busca.trim().toLowerCase();
  const visiveis = snap.pontos.filter((p) =>
    (!soEsteMapa || p.mapa?.id === currentMapId) &&
    (!tipo || p.tipo === tipo) &&
    (!q || p.titulo.toLowerCase().includes(q) || p.corpo.toLowerCase().includes(q)));

  const grupos: { cap: Capitulo | null; pontos: Ponto[] }[] = [
    ...snap.capitulos.map((cap) => ({ cap, pontos: visiveis.filter((p) => p.capitulo === cap.id) })),
    { cap: null, pontos: visiveis.filter((p) => !p.capitulo || !snap.capitulos.some((c) => c.id === p.capitulo)) },
  ].filter((g) => g.cap || g.pontos.length > 0);

  const alternar = (id: string) => setFechados((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function criar() {
    if (!novoCap?.trim()) { setNovoCap(null); return; }
    try { await criarCapitulo(novoCap.trim()); setNovoCap(null); } catch (e) { setErro(mensagemErro(e, 'Não deu para criar')); }
  }

  return (
    <aside aria-label="Capítulos da campanha" className="flex flex-col min-h-0 rounded-xl border border-e-border bg-e-surface overflow-hidden">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-e-text">Campanha</p>
          <p className="text-[11px] text-e-sub">{snap.capitulos.length} capítulos · {snap.pontos.length} pontos</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setNovoCap('')}>+ Capítulo</Button>
      </div>

      {novoCap !== null && (
        <div className="px-3 pb-2 flex gap-1.5">
          <input autoFocus aria-label="Título do capítulo" value={novoCap} onChange={(e) => setNovoCap(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') criar(); if (e.key === 'Escape') setNovoCap(null); }}
            placeholder="Título do capítulo" className="flex-1 min-w-0 text-sm rounded-lg px-2.5 py-1.5 bg-e-bg border border-e-border text-e-text" />
          <Button size="sm" variant="primary" onClick={criar}>Criar</Button>
        </div>
      )}

      <div className="px-3 pb-2 flex flex-col gap-2">
        <input aria-label="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar título ou texto"
          className="text-sm rounded-lg px-2.5 py-1.5 bg-e-bg border border-e-border text-e-text" />
        <div className="flex gap-1 p-0.5 rounded-lg bg-e-bg border border-e-border">
          {([[false, 'Todos os mapas'], [true, 'Só este mapa']] as const).map(([v, l]) => (
            <button key={l} type="button" aria-pressed={soEsteMapa === v} onClick={() => setSoEsteMapa(v)}
              className={`flex-1 h-7 rounded-md text-xs cursor-pointer ${soEsteMapa === v ? 'bg-e-card text-e-text font-semibold' : 'text-e-sub'}`}>{l}</button>
          ))}
        </div>
        <div role="group" aria-label="Filtrar por tipo" className="flex gap-1 flex-wrap">
          <button type="button" onClick={() => setTipo(null)} aria-pressed={!tipo}
            className={`h-7 px-2.5 rounded-full border text-[11px] cursor-pointer ${!tipo ? 'border-e-border2 bg-e-card text-e-text font-semibold' : 'border-e-border text-e-sub'}`}>Todos</button>
          {TIPOS.map((t) => (
            <button key={t.id} type="button" aria-label={`Só ${t.nome}`} title={t.nome} aria-pressed={tipo === t.id} onClick={() => setTipo(tipo === t.id ? null : t.id)}
              className="w-7 h-7 rounded-full border flex items-center justify-center cursor-pointer"
              style={{ color: t.cor, borderColor: tipo === t.id ? t.cor : 'var(--color-e-border)', background: tipo === t.id ? t.cor + '22' : 'transparent' }}>
              <t.Icon size={13} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-1.5 pb-2">
        {grupos.map(({ cap, pontos }) => {
          const chave = cap?.id ?? '_';
          const aberto = !fechados.has(chave);
          const temAtivo = pontos.some((p) => snap.estado[p.id]?.status === 'ativo');
          return (
            <div key={chave} className="mb-1">
              <div className="flex items-center gap-1 px-1.5 pt-2 pb-1">
                <button type="button" onClick={() => alternar(chave)} className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer">
                  {aberto ? <ChevronDown size={13} className="text-e-sub shrink-0" /> : <ChevronRight size={13} className="text-e-sub shrink-0" />}
                  <span className={`text-sm font-bold truncate ${cap ? 'text-e-text' : 'text-e-sub'}`}>{cap ? cap.titulo : 'Sem capítulo'}</span>
                  {temAtivo && <span className="text-[9px] font-bold text-black bg-e-accent rounded-full px-1.5 py-px shrink-0">EM JOGO</span>}
                  <span className="text-[11px] text-e-faint ml-auto shrink-0">{pontos.length}</span>
                </button>
                {cap && <CapituloMenu cap={cap} vazio={!snap.pontos.some((p) => p.capitulo === cap.id)} />}
              </div>
              {aberto && pontos.map((p) => {
                const t = tipoDe(p.tipo);
                const st = (snap.estado[p.id] ?? ESTADO_PADRAO).status;
                const outroMapa = !soEsteMapa && p.mapa?.id !== currentMapId;
                return (
                  <button key={p.id} type="button" onClick={() => onSelecionar(p)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left cursor-pointer border ${selecionadoId === p.id ? 'bg-e-card border-e-border2' : 'border-transparent hover:bg-e-card/60'} ${st === 'concluido' ? 'opacity-55' : ''}`}>
                    <span className="w-4 text-right text-[10px] font-semibold text-e-faint tabular-nums shrink-0">{String(p.ordem).padStart(2, '0')}</span>
                    <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ color: t.cor, background: t.cor + '26' }}><t.Icon size={13} /></span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm truncate ${selecionadoId === p.id ? 'text-e-text font-semibold' : 'text-e-text/90'}`}>{p.titulo}</span>
                      {outroMapa && <span className="block text-[10px] text-e-faint truncate">{p.mapa?.id ? nomeMapa(p.mapa.id) : 'sem mapa'}</span>}
                    </span>
                    {snap.avisos[p.id]?.length ? <AlertTriangle size={12} className="text-e-gold shrink-0" aria-label="Tem avisos" /> : null}
                    {st === 'ativo' && <span aria-label="Ativo" className="w-2 h-2 rounded-full bg-e-accent shadow-[0_0_0_3px_rgba(163,230,53,0.25)] shrink-0" />}
                  </button>
                );
              })}
            </div>
          );
        })}
        {snap.pontos.length === 0 && (
          <p className="text-xs text-e-faint px-2 py-3 leading-relaxed">Nenhum ponto ainda. Clique no mapa para criar o primeiro, ou peça ao Claude para escrever na pasta.</p>
        )}
      </div>

      <div className="m-2 p-2.5 rounded-lg bg-e-bg border border-e-border text-[11px] leading-relaxed">
        {snap.erros.length > 0 ? (
          <div className="text-e-text">
            <p className="font-semibold text-e-gold flex items-center gap-1.5"><AlertTriangle size={12} /> Arquivos com problema</p>
            {snap.erros.map((e) => <p key={e} className="text-e-sub break-words">{e}</p>)}
          </div>
        ) : (
          <p className="text-e-sub"><span className="inline-block w-1.5 h-1.5 rounded-full bg-e-success mr-1.5 align-middle" />Pasta sincronizada</p>
        )}
        <p className="text-e-faint font-mono truncate mt-0.5" title={snap.pasta}>{snap.pasta}</p>
        {erro && <p className="text-e-danger mt-1">{erro}</p>}
      </div>
    </aside>
  );
}

function CapituloMenu({ cap, vazio }: { cap: Capitulo; vazio: boolean }) {
  const { atualizarCapitulo, removerCapitulo } = useCampanhaStore();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState(cap.titulo);
  const [resumo, setResumo] = useState(cap.resumo);
  const [erro, setErro] = useState<string | null>(null);

  const abrir = () => { setTitulo(cap.titulo); setResumo(cap.resumo); setErro(null); setAberto(true); };
  const fazer = async (f: () => Promise<void>) => { try { await f(); setAberto(false); } catch (e) { setErro(mensagemErro(e, 'Não deu certo')); } };

  return (
    <>
      <button type="button" aria-label={`Editar ${cap.titulo}`} onClick={abrir} className="p-1 rounded text-e-faint hover:text-e-text cursor-pointer"><MoreHorizontal size={14} /></button>
      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setAberto(false); }}>
          <div role="dialog" aria-label="Editar capítulo" className="bg-e-surface border border-e-border rounded-2xl w-full max-w-md shadow-2xl p-5 flex flex-col gap-3">
            <h3 className="font-semibold text-e-text">Capítulo</h3>
            <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Título
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1.5 w-full text-sm normal-case tracking-normal font-normal rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text" />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Resumo
              <textarea rows={5} value={resumo} onChange={(e) => setResumo(e.target.value)} className="mt-1.5 w-full text-sm normal-case tracking-normal font-normal rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text" />
            </label>
            <p className="text-[11px] text-e-faint font-mono">{cap.pasta}/_capitulo.md</p>
            {erro && <p className="text-xs text-e-danger">{erro}</p>}
            <div className="flex gap-2">
              <Button variant="danger" size="sm" disabled={!vazio} title={vazio ? undefined : 'Mova ou apague os pontos antes'}
                onClick={() => fazer(() => removerCapitulo(cap.id))}>Apagar</Button>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={() => setAberto(false)}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={() => fazer(() => atualizarCapitulo(cap.id, titulo, resumo))}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
