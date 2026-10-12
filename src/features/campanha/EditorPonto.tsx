'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, MapPin, RefreshCw, Trash2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import { mensagemErro } from '@/lib/api';
import { useCampanhaStore } from './campanhaStore';
import { juntar, mesmoConteudo } from './merge';
import { NOME_STATUS, TIPOS, tipoDe } from './registroTipos';
import type { Capitulo, Ponto, PontoEstado } from './types';
import BlocoEncontro from './vinculos/BlocoEncontro';
import BlocoItem from './vinculos/BlocoItem';

interface Props {
  ponto: Ponto;
  estado: PontoEstado;
  avisos: string[];
  capitulos: Capitulo[];
  pontos: Ponto[];
  currentMapId: string;
  nomeMapa: (id?: string | null) => string;
  onIrParaMapa: (p: Ponto) => void;
  onFechar: () => void;
}

const rotulo = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';
const campo = 'w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2';

export default function EditorPonto({ ponto, estado, avisos, capitulos, pontos, currentMapId, nomeMapa, onIrParaMapa, onFechar }: Props) {
  const store = useCampanhaStore();
  const [base, setBase] = useState(ponto);
  const [draft, setDraft] = useState(ponto);
  const [conflitos, setConflitos] = useState<string[]>([]);
  const [remoto, setRemoto] = useState<Ponto | null>(null);
  const [modoTexto, setModoTexto] = useState<'escrever' | 'ler'>('escrever');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmaApagar, setConfirmaApagar] = useState(false);
  const [visto, setVisto] = useState(ponto);

  const sujo = !mesmoConteudo(draft, base);

  // Chegou uma versão nova do arquivo (do Claude, de outro editor ou de um arraste).
  // O componente é montado com key = id do ponto, então aqui é sempre o mesmo ponto.
  if (ponto !== visto) {
    setVisto(ponto);
    if (!salvando && ponto.hash !== base.hash) {
      if (!sujo) { setBase(ponto); setDraft(ponto); }
      else {
        const r = juntar(base, draft, ponto);
        if (r.conflitos.length === 0) { setBase(ponto); setDraft(r.ponto); }
        else { setConflitos(r.conflitos); setRemoto(ponto); }
      }
    }
  }

  const mudar = (p: Partial<Ponto>) => setDraft((d) => ({ ...d, ...p }));
  const setExtra = (chave: string, valor: unknown) => setDraft((d) => {
    const extras = { ...d.extras };
    if (valor === '' || valor == null || (Array.isArray(valor) && valor.length === 0)) delete extras[chave];
    else extras[chave] = valor;
    return { ...d, extras };
  });

  async function salvar() {
    setSalvando(true); setErro(null);
    try {
      await store.salvarPonto({ ...draft, hash: base.hash });
      const novo = useCampanhaStore.getState().snap?.pontos.find((p) => p.id === draft.id);
      if (novo) { setBase(novo); setDraft(novo); }
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) { setSalvando(false); await store.fetch(); return; } // a sincronização acima junta ou mostra o conflito
      else setErro(mensagemErro(e, 'Não deu para salvar'));
    } finally {
      setSalvando(false);
    }
  }

  function usarRemoto() { if (remoto) { setBase(remoto); setDraft(remoto); } setConflitos([]); setRemoto(null); }
  function manterMeu() { if (remoto) setBase(remoto); setConflitos([]); setRemoto(null); }

  const tipo = tipoDe(draft.tipo);
  const noMapa = draft.mapa?.id;
  const acao = async (f: () => Promise<void>) => { try { setErro(null); await f(); } catch (e) { setErro(mensagemErro(e, 'Não deu certo')); } };

  return (
    <aside aria-label="Ponto selecionado" className="flex flex-col min-h-0 rounded-xl border border-e-border bg-e-surface overflow-hidden">
      {conflitos.length > 0 && (
        <div role="status" className="m-3 mb-0 p-3 rounded-xl bg-e-flow/10 border border-e-flow/40">
          <p className="text-sm font-semibold text-e-text flex items-center gap-2"><RefreshCw size={14} /> Arquivo mudou fora do painel</p>
          <p className="text-xs text-e-sub mt-1">{draft.arquivo} foi editado e você também mexeu em: {conflitos.join(', ')}.</p>
          <div className="flex gap-2 mt-2.5">
            <Button size="sm" variant="primary" onClick={usarRemoto}>Usar a versão nova</Button>
            <Button size="sm" variant="ghost" onClick={manterMeu}>Manter a minha</Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className="flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1" style={{ color: tipo.cor, background: tipo.cor + '22' }}>
          <tipo.Icon size={12} /> {tipo.nome}
        </span>
        <span className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${estado.status === 'ativo' ? 'bg-e-accent/15 text-e-accent' : estado.status === 'concluido' ? 'bg-e-card text-e-faint' : 'bg-e-card text-e-sub'}`}>
          {NOME_STATUS[estado.status] ?? estado.status}
        </span>
        <div className="flex-1" />
        <button onClick={onFechar} aria-label="Fechar" className="p-1 rounded-lg text-e-faint hover:text-e-text hover:bg-e-card cursor-pointer"><X size={16} /></button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        <input aria-label="Título" value={draft.titulo} onChange={(e) => mudar({ titulo: e.target.value })}
          className="bg-transparent border-0 border-b border-e-border text-e-text text-xl font-bold pb-2 outline-none focus:border-e-border2" />

        {avisos.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {avisos.map((a) => (
              <p key={a} className="flex items-start gap-2 text-xs text-e-text p-2.5 rounded-lg bg-e-card border border-e-border2">
                <AlertTriangle size={14} className="text-e-gold shrink-0 mt-px" /> {a}
              </p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className={rotulo}>Tipo</span>
            <Select value={draft.tipo} onChange={(v) => mudar({ tipo: v })} options={TIPOS.map((t) => ({ value: t.id, label: t.nome }))} />
          </div>
          <div>
            <span className={rotulo}>Capítulo</span>
            <Select value={draft.capitulo || '_'} onChange={(v) => mudar({ capitulo: v === '_' ? '' : v })}
              options={[{ value: '_', label: 'Sem capítulo' }, ...capitulos.map((c) => ({ value: c.id, label: c.titulo }))]} />
          </div>
          <p className="col-span-2 -mt-1 text-[11px] text-e-sub leading-relaxed">{tipo.descricao}</p>
        </div>

        {/* Onde fica: ações diretas, não dependem de salvar */}
        <div className="p-3 rounded-xl bg-e-card border border-e-border">
          <span className={rotulo}>Onde fica</span>
          <p className="text-sm font-semibold text-e-text flex items-center gap-1.5">
            <MapPin size={13} className="text-e-sub" /> {noMapa ? nomeMapa(noMapa) : 'Sem mapa (só na lista)'}
          </p>
          {noMapa && draft.x != null && draft.y != null && (
            <p className="text-[11px] text-e-faint mt-0.5">x {draft.x.toFixed(2)} · y {draft.y.toFixed(2)} na imagem desse mapa</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {noMapa && noMapa !== currentMapId && <Button size="sm" variant="subtle" onClick={() => onIrParaMapa(draft)}>Ir para o mapa</Button>}
            {noMapa !== currentMapId && (
              <Button size="sm" variant="subtle" onClick={() => acao(() => store.moverPonto(draft.id, { id: currentMapId, nome: nomeMapa(currentMapId) }, 0.5, 0.5))}>
                Trazer para este mapa
              </Button>
            )}
            {noMapa && <Button size="sm" variant="subtle" onClick={() => acao(() => store.moverPonto(draft.id, null))}>Tirar do mapa</Button>}
          </div>
        </div>

        {tipo.campos.map((c) => (
          <div key={c.chave}>
            <span className={rotulo}>{c.rotulo}</span>
            {c.multilinha ? (
              <textarea rows={2} className={campo} placeholder={c.placeholder} value={String(draft.extras[c.chave] ?? '')}
                onChange={(e) => setExtra(c.chave, e.target.value)} />
            ) : (
              <input className={campo} placeholder={c.placeholder} value={String(draft.extras[c.chave] ?? '')}
                onChange={(e) => setExtra(c.chave, e.target.value)} />
            )}
          </div>
        ))}

        {draft.tipo === 'encontro' && <BlocoEncontro ponto={draft} estado={estado} setExtra={setExtra} sujo={sujo} />}
        {draft.tipo === 'item' && <BlocoItem ponto={draft} estado={estado} setExtra={setExtra} />}

        <div>
          <div role="tablist" aria-label="Modo do texto" className="flex gap-1 border-b border-e-border mb-2">
            {([['escrever', 'Escrever'], ['ler', 'Ler']] as const).map(([m, l]) => (
              <button key={m} role="tab" aria-selected={modoTexto === m} onClick={() => setModoTexto(m)}
                className={`px-2.5 py-1.5 text-xs cursor-pointer ${modoTexto === m ? 'text-e-text font-semibold shadow-[inset_0_-2px_0_var(--color-e-accent)]' : 'text-e-sub'}`}>{l}</button>
            ))}
          </div>
          {modoTexto === 'escrever' ? (
            <textarea aria-label="Texto do ponto" rows={10} value={draft.corpo} onChange={(e) => mudar({ corpo: e.target.value })}
              placeholder="Texto livre em markdown: cena, falas, o que acontece se..."
              className={`${campo} font-mono text-[13px] leading-relaxed resize-y`} />
          ) : (
            <div className="text-sm leading-relaxed text-e-text min-h-24 [&_p]:mb-2 [&_strong]:font-semibold [&_em]:text-e-sub [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-e-border2 [&_blockquote]:pl-3 [&_blockquote]:text-e-sub [&_code]:font-mono [&_code]:text-e-gold">
              {draft.corpo.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.corpo}</ReactMarkdown> : <p className="text-e-faint">Sem texto.</p>}
            </div>
          )}
        </div>

        <div>
          <span className={rotulo}>Leva para</span>
          <div className="flex flex-wrap gap-1.5">
            {draft.ligadoA.map((id) => (
              <span key={id} className="flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-e-card border border-e-border text-xs text-e-text">
                {pontos.find((p) => p.id === id)?.titulo ?? id}
                <button aria-label="Desligar" onClick={() => mudar({ ligadoA: draft.ligadoA.filter((x) => x !== id) })} className="p-0.5 text-e-faint hover:text-e-danger cursor-pointer"><X size={12} /></button>
              </span>
            ))}
          </div>
          <div className="mt-1.5">
            <Select variant="action" value="" onChange={(v) => v && !draft.ligadoA.includes(v) && mudar({ ligadoA: [...draft.ligadoA, v] })} placeholder="Ligar a outro ponto"
              options={pontos.filter((p) => p.id !== draft.id && !draft.ligadoA.includes(p.id)).map((p) => ({ value: p.id, label: p.titulo }))} />
          </div>
        </div>

        <Switch checked={draft.revelado} onChange={(revelado) => mudar({ revelado })}
          className="p-3 rounded-xl bg-e-card border border-e-border hover:border-e-border2 transition-colors"
          label="Revelado aos jogadores" desc="Por enquanto só marca; o app do jogador ainda não mostra pontos" />

        <div className="flex flex-wrap gap-1.5">
          {estado.status !== 'ativo' && <Button size="sm" variant="subtle" onClick={() => acao(() => store.ativar(draft.id))}>Ativar</Button>}
          {estado.status === 'ativo' && <Button size="sm" variant="subtle" onClick={() => acao(() => store.concluir(draft.id))}>Concluir</Button>}
          {estado.status === 'concluido' && <Button size="sm" variant="subtle" onClick={() => acao(() => store.reabrir(draft.id))}>Reabrir</Button>}
          <div className="flex-1" />
          {confirmaApagar ? (
            <>
              <Button size="sm" variant="danger" onClick={() => acao(async () => { await store.removerPonto(draft.id); onFechar(); })}>Apagar mesmo</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmaApagar(false)}>Não</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmaApagar(true)} aria-label="Apagar ponto"><Trash2 size={13} /></Button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-e-border flex items-center gap-2">
        <span className="flex-1 min-w-0 truncate text-[11px] font-mono text-e-faint" title={draft.arquivo}>{draft.arquivo}</span>
        {erro && <span className="text-xs text-e-danger">{erro}</span>}
        {sujo && <Button size="sm" variant="ghost" onClick={() => setDraft(base)} disabled={salvando}>Desfazer</Button>}
        <Button size="sm" variant="primary" onClick={salvar} disabled={!sujo || salvando || conflitos.length > 0}>
          {salvando ? 'Salvando…' : sujo ? 'Salvar' : 'Salvo'}
        </Button>
      </div>
    </aside>
  );
}
