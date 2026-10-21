'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plus, Search, Trash2, Save, FileText, FolderOpen, RotateCcw, Globe, HelpCircle } from 'lucide-react';
import { api, mensagemErro } from '@/lib/api';
import { useStore } from '@/store';
import Button from '@/components/ui/Button';

interface Pagina { id: string; titulo: string; categoria: string; corpo: string; arquivo: string; atualizadoEm: number; hash?: string | null }
interface Snapshot { pasta: string; categorias: string[]; paginas: Pagina[]; erros: string[] }
interface Rascunho { id: string | null; titulo: string; categoria: string; corpo: string; hash?: string | null }

const NOVA: Rascunho = { id: null, titulo: '', categoria: '', corpo: '' };
const campo = 'w-full bg-e-bg border border-e-border rounded-lg px-3 py-2 text-sm text-e-text outline-none focus:border-e-border2';
const prosa = 'text-[15px] leading-relaxed text-e-text [&_p]:mb-3 [&_strong]:font-semibold [&_em]:text-e-sub [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-e-border2 [&_blockquote]:pl-3 [&_blockquote]:text-e-sub [&_blockquote]:mb-3 [&_code]:font-mono [&_code]:text-e-gold [&_table]:mb-3 [&_th]:text-left [&_th]:pr-4 [&_th]:text-e-sub [&_td]:pr-4 [&_td]:py-0.5 [&_hr]:border-e-border [&_hr]:my-4';

/** [[Título]] vira link para a página com esse título (ou id); sem página, fica marcado como faltando. */
function ligarPaginas(corpo: string, paginas: Pagina[]): string {
  return corpo.replace(/\[\[([^\]\n]+)\]\]/g, (_, nome: string) => {
    const alvo = nome.trim().toLowerCase();
    const p = paginas.find((x) => x.titulo.toLowerCase() === alvo || x.id === alvo);
    return p ? `[${nome}](#mundo:${p.id})` : `[${nome}](#mundo-faltando)`;
  });
}

const AJUDA: [string, string][] = [
  ['Páginas', 'Texto livre para o que não é ponto do mapa nem do grafo: lugares, facções, história, como algo funciona. Só o mestre vê.'],
  ['Categorias', 'Digite o nome no campo de categoria da página; se não existir, ela é criada. Categoria vazia some pela lixeira ao lado do nome.'],
  ['Escrever e Ler', 'Escrever mostra o markdown cru (veja os comandos abaixo). Ler mostra formatado.'],
  ['Links', 'Escreva [[Título de outra página]] para criar um link. Em dourado tracejado: a página ainda não existe.'],
  ['Salvar', 'Botão Salvar ou Ctrl+S. Trocar de página com mudanças pede confirmação.'],
  ['Busca', 'Procura no título e no texto de todas as páginas.'],
  ['Arquivos', 'Cada página é um .md na pasta mostrada no rodapé; cada subpasta é uma categoria. Dá para editar pelo VS Code: o painel relê ao abrir a aba e avisa se o arquivo mudou enquanto você editava aqui.'],
];

/** Comando de markdown e como ele aparece no modo Ler. */
const MARKDOWN: [string, React.ReactNode][] = [
  ['## Título', <b key="t" className="text-sm">Título</b>],
  ['### Subtítulo', <b key="s">Subtítulo</b>],
  ['**negrito**', <b key="b">negrito</b>],
  ['*itálico*', <em key="i" className="text-e-sub">itálico</em>],
  ['~~riscado~~', <s key="r">riscado</s>],
  ['- item', <span key="l">• item</span>],
  ['1. item', <span key="n">1. item</span>],
  ['- [ ] tarefa', <span key="c">☐ tarefa</span>],
  ['> citação', <span key="q" className="border-l-2 border-e-border2 pl-2 text-e-sub">citação</span>],
  ['`código`', <code key="k" className="font-mono text-e-gold">código</code>],
  ['---', <span key="h" className="block w-16 border-t border-e-border" />],
  ['[[Página]]', <span key="p" className="text-e-accent underline">Página</span>],
  ['[texto](https://…)', <span key="u" className="text-e-accent underline">texto</span>],
  ['| A | B |\n|---|---|\n| 1 | 2 |', <span key="tb">tabela</span>],
];

/** Botão "?" com o resumo do que a aba faz. */
function Ajuda() {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fechar);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fechar); document.removeEventListener('keydown', esc); };
  }, [aberto]);
  return (
    <div ref={ref} className="relative">
      <button type="button" title="Como funciona" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}
        className={`p-1 rounded-md cursor-pointer transition-colors ${aberto ? 'text-e-accent bg-e-accent/10' : 'text-e-faint hover:text-e-text'}`}>
        <HelpCircle size={15} />
      </button>
      {aberto && (
        <div className="absolute left-0 top-8 z-30 w-[360px] max-h-[75vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface shadow-2xl p-4 flex flex-col gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint">Como funciona</span>
          {AJUDA.map(([t, d]) => (
            <div key={t} className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-e-text">{t}</span>
              <span className="text-xs text-e-sub leading-snug">{d}</span>
            </div>
          ))}
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint mt-2 pt-3 border-t border-e-border">Comandos de markdown</span>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 items-center text-xs text-e-text">
            {MARKDOWN.map(([cmd, res]) => (
              <div key={cmd} className="contents">
                <code className="font-mono text-[11px] text-e-sub bg-e-bg border border-e-border rounded px-1.5 py-0.5 whitespace-pre">{cmd}</code>
                <span>{res}</span>
              </div>
            ))}
          </div>
          <span className="text-[11px] text-e-faint leading-snug">Deixe uma linha em branco para começar um parágrafo novo.</span>
        </div>
      )}
    </div>
  );
}

export default function Mundo() {
  const ativa = useStore((s) => s.activeSection) === 'mundo';
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [draft, setDraft] = useState<Rascunho | null>(null);
  const [original, setOriginal] = useState<Rascunho | null>(null);
  const [modo, setModo] = useState<'ler' | 'escrever'>('ler');
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [conflito, setConflito] = useState(false);

  const sujo = !!draft && !!original && (draft.titulo !== original.titulo || draft.categoria !== original.categoria || draft.corpo !== original.corpo);

  const carregar = useCallback(async () => {
    try { setSnap((await api.get<Snapshot>('/mundo')).data); } catch (e) { setErro(mensagemErro(e, 'Não deu para carregar as páginas')); }
  }, []);

  // Relê ao abrir a aba: pega o que foi escrito pelo VS Code enquanto isso
  useEffect(() => { if (ativa) carregar(); }, [ativa, carregar]);

  function abrir(p: Pagina | null, categoria = '') {
    if (sujo && !confirm('Descartar as mudanças desta página?')) return;
    const r: Rascunho = p ? { id: p.id, titulo: p.titulo, categoria: p.categoria, corpo: p.corpo, hash: p.hash } : { ...NOVA, categoria };
    setDraft(r); setOriginal(r); setErro(null); setConflito(false);
    setModo(p ? 'ler' : 'escrever');
  }

  async function salvar() {
    if (!draft || salvando) return;
    if (!draft.titulo.trim()) { setErro('Dê um título à página.'); return; }
    setSalvando(true); setErro(null);
    try {
      const corpo = { titulo: draft.titulo, categoria: draft.categoria, corpo: draft.corpo, hash: draft.hash };
      const s = draft.id
        ? (await api.put<Snapshot>(`/mundo/paginas/${draft.id}`, corpo)).data
        : (await api.post<Snapshot>('/mundo/paginas', corpo)).data;
      setSnap(s);
      // Página nova: acha pelo título mais recente na categoria
      const salva = draft.id
        ? s.paginas.find((p) => p.id === draft.id)
        : s.paginas.filter((p) => p.titulo === draft.titulo.trim() && p.categoria === (draft.categoria.trim()))
          .sort((a, b) => b.atualizadoEm - a.atualizadoEm)[0];
      if (salva) {
        const r: Rascunho = { id: salva.id, titulo: salva.titulo, categoria: salva.categoria, corpo: salva.corpo, hash: salva.hash };
        setDraft(r); setOriginal(r);
      }
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409 && draft.id) setConflito(true);
      setErro(mensagemErro(e, 'Não deu para salvar'));
    } finally { setSalvando(false); }
  }

  async function apagar() {
    if (!draft?.id || !confirm(`Apagar a página "${original?.titulo}"? O arquivo é removido.`)) return;
    try { setSnap((await api.delete<Snapshot>(`/mundo/paginas/${draft.id}`)).data); setDraft(null); setOriginal(null); }
    catch (e) { setErro(mensagemErro(e, 'Não deu para apagar')); }
  }

  async function apagarCategoria(nome: string) {
    if (!confirm(`Apagar a categoria "${nome}"?`)) return;
    try { setSnap((await api.delete<Snapshot>(`/mundo/categorias/${encodeURIComponent(nome)}`)).data); }
    catch (e) { setErro(mensagemErro(e, 'Não deu para apagar a categoria')); }
  }

  /** Conflito: descarta o que foi digitado e pega a versão do disco. */
  async function recarregarDoDisco() {
    const s = (await api.get<Snapshot>('/mundo')).data;
    setSnap(s);
    const p = s.paginas.find((x) => x.id === draft?.id);
    const r: Rascunho | null = p ? { id: p.id, titulo: p.titulo, categoria: p.categoria, corpo: p.corpo, hash: p.hash } : null;
    setDraft(r); setOriginal(r); setConflito(false); setErro(null);
  }

  // Ctrl+S salva
  useEffect(() => {
    if (!ativa) return;
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); salvar(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const grupos = useMemo(() => {
    const paginas = snap?.paginas ?? [];
    const q = busca.trim().toLowerCase();
    const filtradas = q ? paginas.filter((p) => p.titulo.toLowerCase().includes(q) || p.corpo.toLowerCase().includes(q)) : paginas;
    const cats = ['', ...(snap?.categorias ?? [])];
    return cats
      .map((c) => ({ categoria: c, paginas: filtradas.filter((p) => p.categoria === c) }))
      .filter((g) => g.paginas.length > 0 || (!q && g.categoria !== ''));
  }, [snap, busca]);

  const total = snap?.paginas.length ?? 0;

  return (
    <div className="flex-1 min-h-0 flex">
      {/* Lista */}
      <aside className="w-[300px] shrink-0 border-r border-white/[0.06] flex flex-col min-h-0">
        <div className="p-4 flex flex-col gap-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-e-accent" />
            <h1 className="font-bold text-e-text">Mundo</h1>
            <span className="text-xs text-e-faint tabular-nums">{total}</span>
            <Ajuda />
            <Button variant="primary" size="sm" className="ml-auto" onClick={() => abrir(null, draft?.categoria ?? '')}>
              <Plus size={14} /> Página
            </Button>
          </div>
          <label className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-e-faint" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no título e no texto"
              className={`${campo} !pl-8 !py-1.5`} />
          </label>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-3">
          {grupos.map((g) => (
            <div key={g.categoria || '_'} className="flex flex-col gap-0.5">
              <div className="group flex items-center gap-1.5 px-2 pt-1 pb-0.5">
                <FolderOpen size={12} className="text-e-faint" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint truncate">{g.categoria || 'Sem categoria'}</span>
                {g.categoria && g.paginas.length === 0 && !busca && (
                  <button type="button" title="Apagar categoria vazia" onClick={() => apagarCategoria(g.categoria)}
                    className="ml-auto opacity-0 group-hover:opacity-100 text-e-faint hover:text-e-danger cursor-pointer"><Trash2 size={11} /></button>
                )}
              </div>
              {g.paginas.map((p) => (
                <button key={p.id} type="button" onClick={() => abrir(p)}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-sm truncate cursor-pointer transition-colors ${
                    draft?.id === p.id ? 'bg-e-accent/10 text-e-accent font-semibold' : 'text-e-sub hover:text-e-text hover:bg-white/[0.04]'}`}>
                  {p.titulo}
                </button>
              ))}
              {g.categoria && g.paginas.length === 0 && !busca && <span className="px-2.5 text-xs text-e-faint">vazia</span>}
            </div>
          ))}
          {total === 0 && <p className="text-xs text-e-faint px-2 py-6 text-center">Nenhuma página ainda. Comece por um lugar, uma facção ou como algo funciona no mundo.</p>}
          {total > 0 && grupos.length === 0 && <p className="text-xs text-e-faint px-2 py-6 text-center">Nada encontrado.</p>}
          {snap && snap.erros.length > 0 && (
            <div className="mx-1 rounded-lg border border-e-danger/30 bg-e-danger/5 p-2 text-[11px] text-e-danger flex flex-col gap-0.5">
              {snap.erros.map((x) => <span key={x}>{x}</span>)}
            </div>
          )}
        </nav>
        {snap && <p className="px-4 py-2 text-[10px] text-e-faint truncate border-t border-white/[0.06]" title={snap.pasta}>Arquivos em {snap.pasta}</p>}
      </aside>

      {/* Página */}
      <section className="flex-1 min-w-0 flex flex-col min-h-0">
        {!draft ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-e-faint p-8 text-center">
            <FileText size={28} />
            <p className="text-sm">Escolha uma página na lista ou crie uma nova.</p>
            <p className="text-xs max-w-sm">Para ligar uma página a outra, escreva o título dela entre colchetes duplos, como [[Floresta de Verdália]].</p>
          </div>
        ) : (
          <>
            <header className="px-8 pt-6 pb-4 flex flex-col gap-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <input aria-label="Título" value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
                  placeholder="Título da página" className="flex-1 min-w-0 bg-transparent text-2xl font-bold text-e-text outline-none placeholder:text-e-faint" />
                {draft.id && (
                  <button type="button" title="Apagar página" onClick={apagar}
                    className="p-2 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-card cursor-pointer"><Trash2 size={15} /></button>
                )}
                <Button variant="primary" size="sm" onClick={salvar} disabled={salvando || (!sujo && !!draft.id)}>
                  <Save size={14} /> {salvando ? 'Salvando…' : sujo || !draft.id ? 'Salvar' : 'Salvo'}
                </Button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-e-faint">
                  <FolderOpen size={13} />
                  <input list="mundo-categorias" value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}
                    placeholder="Sem categoria" className={`${campo} !w-56 !py-1 !text-xs`} />
                  <datalist id="mundo-categorias">{snap?.categorias.map((c) => <option key={c} value={c} />)}</datalist>
                </label>
                <div role="tablist" className="flex border-b border-e-border ml-auto">
                  {([['ler', 'Ler'], ['escrever', 'Escrever']] as const).map(([m, l]) => (
                    <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => setModo(m)}
                      className={`px-3 py-1.5 text-xs cursor-pointer ${modo === m ? 'text-e-text font-semibold shadow-[inset_0_-2px_0_var(--color-e-accent)]' : 'text-e-sub'}`}>{l}</button>
                  ))}
                </div>
              </div>
              {erro && (
                <p className="text-xs text-e-danger flex items-center gap-2">
                  {erro}
                  {conflito && (
                    <button type="button" onClick={recarregarDoDisco} className="flex items-center gap-1 underline cursor-pointer">
                      <RotateCcw size={11} /> Descartar o meu e recarregar
                    </button>
                  )}
                </p>
              )}
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {modo === 'escrever' ? (
                <textarea aria-label="Texto da página" value={draft.corpo} onChange={(e) => setDraft({ ...draft, corpo: e.target.value })}
                  autoFocus={!draft.id}
                  placeholder={'Texto livre em markdown.\n\n## Como funciona\n...\n\nLigue a outra página com [[Título dela]].'}
                  className="w-full h-full min-h-[60vh] bg-transparent px-8 py-6 font-mono text-[13.5px] leading-relaxed text-e-text outline-none resize-none" />
              ) : (
                <article className={`max-w-3xl px-8 py-6 ${prosa}`}>
                  {draft.corpo.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      a: ({ href, children }) => {
                        if (href?.startsWith('#mundo:')) {
                          const p = snap?.paginas.find((x) => x.id === href.slice(7));
                          return <button type="button" onClick={() => p && abrir(p)} className="text-e-accent underline decoration-e-accent/40 underline-offset-2 cursor-pointer">{children}</button>;
                        }
                        if (href === '#mundo-faltando')
                          return <span title="Ainda não existe página com esse título" className="text-e-gold border-b border-dashed border-e-gold/60">{children}</span>;
                        return <a href={href} target="_blank" rel="noreferrer" className="text-e-accent underline">{children}</a>;
                      },
                    }}>
                      {ligarPaginas(draft.corpo, snap?.paginas ?? [])}
                    </ReactMarkdown>
                  ) : (
                    <button type="button" onClick={() => setModo('escrever')} className="text-e-faint text-sm cursor-pointer hover:text-e-text">Sem texto. Clique para escrever.</button>
                  )}
                </article>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
