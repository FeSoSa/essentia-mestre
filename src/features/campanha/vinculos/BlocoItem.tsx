'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Stepper from '@/components/ui/Stepper';
import { api, mensagemErro } from '@/lib/api';
import { useActivePlayers } from '@/store';
import type { ItemCatalog } from '@/store/types';
import { useCampanhaStore } from '../campanhaStore';
import { refsDe, type CampanhaRef, type Ponto, type PontoEstado } from '../types';
import ListaRefs from './ListaRefs';
import { useCatalogoCampanha } from './essentia';

const COR_ITEM = { fundo: '#232327', borda: '#45454d', texto: '#fafafa', fraco: '#a1a1aa' };

interface Props {
  ponto: Ponto;
  estado: PontoEstado;
  setExtra: (chave: string, valor: unknown) => void;
}

export default function BlocoItem({ ponto, estado, setExtra }: Props) {
  const cat = useCatalogoCampanha();
  const [entregando, setEntregando] = useState<ItemCatalog | null>(null);
  useEffect(() => { if (!cat.carregado) cat.carregar(); }, [cat]);

  const itens = refsDe(ponto.extras.itens);
  const achadoDe = (r: CampanhaRef) => estado.achados.filter((a) => a.itemId === r.id);

  return (
    <div className="flex flex-col gap-3">
      <ListaRefs titulo="Itens · do catálogo" refs={itens} cor={COR_ITEM} onChange={(refs) => setExtra('itens', refs)}
        opcoes={cat.items.map((i) => ({ id: i.id, nome: i.name }))} adicionarRotulo="+ Item do catálogo"
        extra={(r, existe) => {
          const item = cat.items.find((i) => i.id === r.id);
          const ja = achadoDe(r).length > 0;
          return existe && item ? (
            <Button size="sm" variant={ja ? 'subtle' : 'gold'} onClick={() => setEntregando(item)}>
              {ja ? <><Check size={12} /> De novo</> : 'Achado por...'}
            </Button>
          ) : null;
        }} />

      {estado.achados.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint">Já achados</p>
          {estado.achados.map((a, i) => (
            <p key={i} className="text-xs text-e-sub">
              <span className="text-e-text font-medium">{a.nome}</span> × {a.qtd} · {a.playerNome ?? 'jogador'}
            </p>
          ))}
        </div>
      )}

      {entregando && <AchadoPorModal pontoId={ponto.id} item={entregando} qtdSugerida={itens.find((r) => r.id === entregando.id)?.qtd ?? 1} onClose={() => setEntregando(null)} />}
    </div>
  );
}

function AchadoPorModal({ pontoId, item, qtdSugerida, onClose }: { pontoId: string; item: ItemCatalog; qtdSugerida: number; onClose: () => void }) {
  const players = useActivePlayers();
  const registrarAchado = useCampanhaStore((s) => s.registrarAchado);
  const [playerId, setPlayerId] = useState('');
  const [qtd, setQtd] = useState(qtdSugerida);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entregar() {
    const p = players.find((x) => x.id === playerId);
    if (!p) return;
    setEnviando(true); setErro(null);
    try {
      // Mesmo caminho do "Enviar item" do catálogo, com os dados atuais do item
      await api.post(`/master/players/${p.id}/items`, { ...item, qty: qtd });
      await registrarAchado(pontoId, { itemId: item.id, nome: item.name, playerId: p.id, playerNome: p.char.name, qtd });
      onClose();
    } catch (e) {
      setErro(mensagemErro(e, 'Não deu para entregar'));
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) onClose(); }}>
      <div role="dialog" aria-label={`Quem achou ${item.name}`} className="bg-e-surface border border-e-border rounded-2xl w-full max-w-sm shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-e-text">Quem achou {item.name}?</h3>
            <p className="text-xs text-e-sub mt-0.5">O item vai direto para o inventário e fica registrado no ponto.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-e-faint hover:text-e-text cursor-pointer p-1"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {players.map((p) => (
            <button key={p.id} type="button" onClick={() => setPlayerId(p.id)}
              className={`h-11 rounded-xl border text-sm cursor-pointer ${playerId === p.id ? 'border-e-gold bg-e-gold/10 text-e-text font-semibold' : 'border-e-border text-e-sub hover:text-e-text'}`}>
              {p.char.name}
            </button>
          ))}
          {players.length === 0 && <p className="col-span-2 text-sm text-e-faint">Nenhum jogador ativo.</p>}
        </div>
        <div className="flex items-center gap-2 text-xs text-e-sub">
          Quantidade
          <Stepper label="Quantidade" value={qtd} onChange={setQtd} />
        </div>
        {erro && <p className="text-xs text-e-danger">{erro}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={enviando}>Cancelar</Button>
          <Button variant="primary" onClick={entregar} disabled={!playerId || enviando}>{enviando ? 'Entregando…' : 'Entregar'}</Button>
        </div>
      </div>
    </div>
  );
}
