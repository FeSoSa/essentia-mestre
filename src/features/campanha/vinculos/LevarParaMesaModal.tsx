'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { CheckField } from '@/components/ui/Checkbox';
import Stepper from '@/components/ui/Stepper';
import { api, mensagemErro } from '@/lib/api';
import { useBosses, useEnemies } from '@/store';
import { COR_DIF, instanciaDe, xpPorForca } from '@/lib/encontro';
import type { BossInstance, EnemyInstance } from '@/store/types';
import { useCampanhaStore } from '../campanhaStore';
import type { CampanhaRef, MesaEntrada } from '../types';
import { comoInimigo, inimigosParaSimular, instanciaDeChefe, simularDificuldade, useCatalogoCampanha, useGrupoEncontro } from './essentia';

interface Props {
  pontoId: string;
  titulo: string;
  inimigos: CampanhaRef[];
  chefes: CampanhaRef[];
  onClose: () => void;
}

interface Linha { tipo: 'inimigo' | 'chefe'; ref: CampanhaRef; existe: boolean; marcado: boolean; qtd: number }

/**
 * Nada vai para a Mesa sem passar por aqui: o mestre escolhe o que entra, quanto,
 * e o que fazer com quem já está lá. Os ids criados ficam no estado do ponto.
 */
export default function LevarParaMesaModal({ pontoId, titulo, inimigos, chefes, onClose }: Props) {
  const cat = useCatalogoCampanha();
  const grupo = useGrupoEncontro();
  const naMesa = useEnemies();
  const chefesNaMesa = useBosses();
  const registrarMesa = useCampanhaStore((s) => s.registrarMesa);

  const [linhas, setLinhas] = useState<Linha[]>(() => [
    ...inimigos.map((ref) => ({ tipo: 'inimigo' as const, ref, existe: cat.enemies.some((e) => e.id === ref.id), marcado: true, qtd: ref.qtd ?? 1 })),
    ...chefes.map((ref) => ({ tipo: 'chefe' as const, ref, existe: cat.bosses.some((b) => b.id === ref.id), marcado: true, qtd: ref.qtd ?? 1 })),
  ].map((l) => ({ ...l, marcado: l.existe })));
  const [modo, setModo] = useState<'somar' | 'tirar'>('somar');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const escolhidos = linhas.filter((l) => l.marcado && l.existe);
  const total = escolhidos.reduce((s, l) => s + l.qtd, 0);
  const jaTem = naMesa.length + chefesNaMesa.length;

  const resultado = useMemo(() => simularDificuldade(
    inimigosParaSimular(
      escolhidos.filter((l) => l.tipo === 'inimigo').map((l) => ({ ...l.ref, qtd: l.qtd })),
      escolhidos.filter((l) => l.tipo === 'chefe').map((l) => ({ ...l.ref, qtd: l.qtd })),
      cat,
    ),
    grupo, cat.config,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [linhas, grupo, cat]);

  const mudar = (i: number, l: Partial<Linha>) => setLinhas((ls) => ls.map((x, k) => (k === i ? { ...x, ...l } : x)));

  async function confirmar() {
    setEnviando(true); setErro(null);
    try {
      if (modo === 'tirar') {
        for (const e of naMesa) await api.delete(`/combat/enemies/${e.instanceId}`);
        for (const b of chefesNaMesa) await api.delete(`/combat/bosses/${b.instanceId}`);
      }
      const xpRef = xpPorForca(cat.enemies);
      const entradas: MesaEntrada[] = [];
      let idsInimigos = new Set(modo === 'tirar' ? [] : naMesa.map((e) => e.instanceId));
      let idsChefes = new Set(modo === 'tirar' ? [] : chefesNaMesa.map((b) => b.instanceId));

      for (const l of escolhidos) {
        for (let k = 0; k < l.qtd; k++) {
          if (l.tipo === 'inimigo') {
            const t = cat.enemies.find((e) => e.id === l.ref.id)!;
            const r = await api.post<EnemyInstance[]>('/combat/enemies', { templateId: t.id, enemy: instanciaDe(comoInimigo(t), xpRef) });
            const novo = r.data.find((x) => !idsInimigos.has(x.instanceId));
            idsInimigos = new Set(r.data.map((x) => x.instanceId));
            if (novo) entradas.push({ instanceId: novo.instanceId, tipo: 'inimigo', refId: t.id, nome: t.name });
          } else {
            const t = cat.bosses.find((b) => b.id === l.ref.id)!;
            const r = await api.post<BossInstance[]>('/combat/bosses', { templateId: t.id, boss: instanciaDeChefe(t) });
            const novo = r.data.find((x) => !idsChefes.has(x.instanceId));
            idsChefes = new Set(r.data.map((x) => x.instanceId));
            if (novo) entradas.push({ instanceId: novo.instanceId, tipo: 'chefe', refId: t.id, nome: t.name });
          }
        }
      }
      await registrarMesa(pontoId, entradas);
      onClose();
    } catch (e) {
      setErro(mensagemErro(e, 'Não deu para levar para a Mesa'));
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) onClose(); }}>
      <div role="dialog" aria-label="Levar para a Mesa" className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border">
          <div>
            <h3 className="font-semibold text-e-text">Levar para a Mesa</h3>
            <p className="text-xs text-e-sub mt-0.5">{titulo} · escolha o que entra agora</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card"><X size={16} /></button>
        </div>

        <div className="p-6 flex flex-col gap-3">
          {linhas.length === 0 && <p className="text-sm text-e-faint">Este encontro ainda não tem inimigos.</p>}
          {linhas.map((l, i) => {
            const chefe = l.tipo === 'chefe';
            const nome = (chefe ? cat.bosses : cat.enemies).find((x) => x.id === l.ref.id)?.name ?? l.ref.nome ?? '?';
            if (!l.existe) return (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-e-border2 bg-e-card">
                <AlertTriangle size={16} className="text-e-gold shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-e-text">{nome} × {l.qtd}</p>
                  <p className="text-xs text-e-sub">Não existe no Bestiário. Crie o modelo ou troque no ponto para poder levar.</p>
                </div>
              </div>
            );
            return (
              <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-opacity ${chefe ? 'bg-e-boss-bg border-e-boss-border' : 'bg-e-enemy-bg border-e-enemy-border'} ${l.marcado ? '' : 'opacity-60'}`}>
                <CheckField checked={l.marcado} onChange={(marcado) => mudar(i, { marcado })} color={chefe ? 'amber' : 'default'} className="flex-1 min-w-0"
                  label={<span className={`font-semibold ${chefe ? 'text-e-boss-text' : 'text-e-enemy-text'}`}>{nome}</span>}
                  desc={`${chefe ? 'Chefe' : 'Inimigo'} com os dados atuais do Bestiário`} />
                <Stepper label={`Quantidade de ${nome}`} value={l.qtd} onChange={(qtd) => mudar(i, { qtd })}
                  cor={chefe ? { borda: '#6a5a20', texto: '#f0e8d0' } : { borda: '#4a2a2a', texto: '#e8d8d8' }} />
              </div>
            );
          })}

          {jaTem > 0 && (
            <div className="mt-1 p-3 rounded-xl bg-e-card border border-e-border">
              <p className="text-sm font-semibold text-e-text">A Mesa já tem {jaTem} {jaTem === 1 ? 'inimigo' : 'inimigos'}</p>
              <p className="text-xs text-e-sub mt-0.5 truncate">{[...naMesa.map((e) => e.name), ...chefesNaMesa.map((b) => b.name)].join(', ')}</p>
              <div role="radiogroup" aria-label="O que fazer com eles" className="grid grid-cols-2 gap-1 mt-2.5 p-1 rounded-xl bg-e-bg border border-e-border">
                {([['somar', 'Somar aos que estão'], ['tirar', 'Tirar os atuais antes']] as const).map(([m, rot]) => (
                  <button key={m} type="button" role="radio" aria-checked={modo === m} onClick={() => setModo(m)}
                    className={`h-8 px-3 rounded-lg text-xs cursor-pointer transition-colors ${modo === m ? 'bg-e-card text-e-text font-semibold shadow-[inset_0_0_0_1px_var(--color-e-border2)]' : 'text-e-sub hover:text-e-text'}`}>
                    {rot}
                  </button>
                ))}
              </div>
              {modo === 'tirar' && <p className="text-[11px] text-e-sub mt-2">Os atuais saem sem dar XP nem drop.</p>}
            </div>
          )}

          {resultado && (
            <p className="text-xs text-e-sub flex items-center gap-2">
              Com essa seleção, contra o grupo:
              <span className="font-bold text-black rounded-full px-2.5 py-0.5" style={{ background: COR_DIF[resultado.dif.id] ?? '#a1a1aa' }}>{resultado.dif.nome}</span>
            </p>
          )}
          {erro && <p className="text-xs text-e-danger">{erro}</p>}
        </div>

        <div className="px-6 py-4 border-t border-e-border flex items-center gap-3">
          <p className="flex-1 text-[11px] text-e-faint">O ponto vira Ativo e guarda quem entrou.</p>
          <Button variant="ghost" onClick={onClose} disabled={enviando}>Cancelar</Button>
          <Button variant="primary" onClick={confirmar} disabled={enviando || total === 0}>
            {enviando ? 'Colocando…' : `Colocar ${total} na Mesa`}
          </Button>
        </div>
      </div>
    </div>
  );
}
