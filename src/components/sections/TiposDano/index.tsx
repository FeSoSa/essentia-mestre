'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { mensagemErro } from '@/lib/api';
import SectionHeader, { Page } from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useTiposDano, CATEGORIAS, type TipoDano, type CategoriaDano } from '@/lib/tiposDano';

const lbl = 'text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block';
const inp = 'w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2 transition-colors';

export default function TiposDano() {
  const { tipos, carregar, remover } = useTiposDano();
  const [editando, setEditando] = useState<TipoDano | 'novo' | null>(null);
  const deEssencia = tipos.filter((t) => t.categoria === 'ESSENCIA');

  useEffect(() => { carregar(true); }, [carregar]);

  async function apagar(t: TipoDano) {
    if (!confirm(`Apagar o tipo "${t.nome}"? Skills, armas e traços que usam ele passam a contar como Neutro.`)) return;
    await remover(t.id).catch(() => {});
  }

  return (
    <Page>
      <SectionHeader
        title="Tipos de dano"
        count={tipos.length}
        subtitle="Usados nas skills, armas e ataques, e nas fraquezas e resistências de raças, criaturas e armaduras. Cada Essência já é um tipo: aqui ficam só os outros."
        action={<Button variant="primary" onClick={() => setEditando('novo')}><Plus size={15} /> Novo tipo</Button>}
      />

      <div className="flex flex-col gap-6">
        {CATEGORIAS.map((c) => {
          const lista = tipos.filter((t) => t.categoria === c.value);
          if (lista.length === 0) return null;
          return (
            <div key={c.value}>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-e-faint mb-2">{c.label}</h2>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {lista.map((t) => (
                  <div key={t.id} onClick={() => setEditando(t)}
                    className="group bg-e-surface border border-white/[0.07] rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:border-white/20">
                    <div className="min-w-0 flex-1 font-semibold text-sm truncate">{t.nome}</div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button type="button" title="Editar" onClick={() => setEditando(t)}
                        className="p-1.5 cursor-pointer rounded-lg text-e-faint hover:text-e-text hover:bg-e-card"><Pencil size={13} /></button>
                      <button type="button" title="Excluir" onClick={() => apagar(t)}
                        className="p-1.5 cursor-pointer rounded-lg text-e-faint hover:text-e-danger hover:bg-e-card"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {deEssencia.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-e-faint mb-2">
              Essências <span className="normal-case font-normal">(vêm da tela de Essências, um tipo para cada)</span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {deEssencia.map((t) => (
                <span key={t.id} className="text-xs font-semibold rounded-lg px-2.5 py-1 bg-white/[0.04] border border-e-border text-e-sub">{t.nome}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {editando && (
        <TipoDanoModal tipo={editando === 'novo' ? undefined : editando} onClose={() => setEditando(null)} />
      )}
    </Page>
  );
}

function TipoDanoModal({ tipo, onClose }: { tipo?: TipoDano; onClose: () => void }) {
  const salvar = useTiposDano((s) => s.salvar);
  const [nome, setNome] = useState(tipo?.nome ?? '');
  const [categoria, setCategoria] = useState<CategoriaDano>(tipo?.categoria ?? 'FISICO');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    if (!nome.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      await salvar({ id: tipo?.id, nome: nome.trim(), categoria });
      onClose();
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível salvar'));
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[400px] rounded-xl border border-e-border bg-e-surface text-e-text">
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">{tipo ? 'Editar tipo de dano' : 'Novo tipo de dano'}</h2>
            <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
          </div>
          <div>
            <label className={lbl}>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={inp} placeholder="ex: Corte, Veneno, Frio" />
          </div>
          <div>
            <label className={lbl}>Categoria</label>
            <Select value={categoria} onChange={(v) => setCategoria(v as CategoriaDano)} options={CATEGORIAS} />
          </div>
          {erro && <p className="text-xs text-e-danger">{erro}</p>}
          <div className="flex gap-2 justify-end pt-1 border-t border-e-border">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={salvando}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={confirmar} disabled={!nome.trim() || salvando}>
              {salvando ? 'Salvando…' : tipo ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
