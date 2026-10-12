'use client';

import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useBosses, useEnemies } from '@/store';
import { COR_DIF } from '@/lib/encontro';
import { refsDe, type CampanhaRef, type Ponto, type PontoEstado } from '../types';
import ListaRefs from './ListaRefs';
import LevarParaMesaModal from './LevarParaMesaModal';
import { inimigosParaSimular, simularDificuldade, useCatalogoCampanha, useGrupoEncontro } from './essentia';

const COR_INIMIGO = { fundo: '#1e1616', borda: '#4a2a2a', texto: '#e8d8d8', fraco: '#b39a9a' };
const COR_CHEFE = { fundo: '#1a1810', borda: '#6a5a20', texto: '#f0e8d0', fraco: '#b8aa7e' };

interface Props {
  ponto: Ponto;
  estado: PontoEstado;
  setExtra: (chave: string, valor: unknown) => void;
  /** Há mudanças não salvas: a Mesa usa o que está na tela, mas avisamos. */
  sujo: boolean;
}

export default function BlocoEncontro({ ponto, estado, setExtra, sujo }: Props) {
  const cat = useCatalogoCampanha();
  const grupo = useGrupoEncontro();
  const enemies = useEnemies();
  const bosses = useBosses();
  const [levando, setLevando] = useState(false);

  useEffect(() => { if (!cat.carregado) cat.carregar(); }, [cat]);

  const inimigos = refsDe(ponto.extras.inimigos);
  const chefes = refsDe(ponto.extras.chefes);
  const alvo = typeof ponto.extras.dificuldade === 'string' ? ponto.extras.dificuldade : '';

  const extrasInimigos = ponto.extras.inimigos;
  const extrasChefes = ponto.extras.chefes;
  const resultado = useMemo(
    () => simularDificuldade(inimigosParaSimular(refsDe(extrasInimigos), refsDe(extrasChefes), cat), grupo, cat.config),
    [extrasInimigos, extrasChefes, cat, grupo],
  );

  // Quem este encontro colocou na Mesa e ainda está de pé
  const vivos = new Set([...enemies.map((e) => e.instanceId), ...bosses.map((b) => b.instanceId)]);
  const deFora = estado.mesa.filter((m) => vivos.has(m.instanceId)).length;

  const salvarRefs = (chave: string) => (refs: CampanhaRef[]) => setExtra(chave, refs);
  const ordem = cat.config.dificuldades;
  const idxAlvo = ordem.findIndex((d) => d.id === alvo);
  const idxSim = resultado ? ordem.findIndex((d) => d.id === resultado.dif.id) : -1;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5">Dificuldade alvo</p>
        <Select value={alvo} onChange={(v) => setExtra('dificuldade', v)} placeholder="Sem alvo"
          options={ordem.map((d) => ({ value: d.id, label: d.nome }))} />
      </div>

      <ListaRefs titulo="Inimigos · do Bestiário" refs={inimigos} cor={COR_INIMIGO} onChange={salvarRefs('inimigos')}
        opcoes={cat.enemies.map((e) => ({ id: e.id, nome: e.name }))} adicionarRotulo="+ Inimigo do Bestiário" />
      <ListaRefs titulo="Chefes" refs={chefes} cor={COR_CHEFE} onChange={salvarRefs('chefes')}
        opcoes={cat.bosses.map((b) => ({ id: b.id, nome: b.name }))} adicionarRotulo="+ Chefe do Bestiário" />

      <div className="p-3 rounded-xl bg-e-card border border-e-border">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-e-text">Contra o grupo de agora</span>
          <span className="text-[11px] text-e-sub">{grupo.grupo.length} em campo</span>
        </div>
        {resultado ? (<>
          <div className="grid grid-cols-4 gap-1 mt-2.5">
            {ordem.map((d, i) => (
              <div key={d.id} className="h-2 rounded-sm" style={{
                background: COR_DIF[d.id] ?? '#71717a', opacity: i === idxSim ? 1 : 0.3,
                outline: i === idxSim ? '2px solid #fafafa' : undefined, outlineOffset: 1,
              }} />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1 text-[10px] text-e-sub">
            {ordem.map((d, i) => (
              <span key={d.id} className={i === idxSim ? 'text-e-text font-bold' : ''}>{d.nome}{i === idxAlvo ? ' · alvo' : ''}</span>
            ))}
          </div>
          {idxAlvo >= 0 && idxSim !== idxAlvo && (
            <p className="text-xs mt-2" style={{ color: idxSim > idxAlvo ? '#f0b98a' : '#9fd0f7' }}>
              {idxSim > idxAlvo ? 'Acima do alvo.' : 'Abaixo do alvo.'}
            </p>
          )}
          {chefes.length > 0 && <p className="text-[11px] text-e-faint mt-1">Chefes entram no cálculo com o PV de todas as fases.</p>}
        </>) : (
          <p className="text-xs text-e-faint mt-1.5">
            {grupo.grupo.length === 0 ? 'Ninguém de pé no grupo da Mesa para comparar.' : 'Adicione inimigos do Bestiário para ver a dificuldade.'}
          </p>
        )}
      </div>

      {estado.mesa.length > 0 && (
        <p className="text-xs text-e-sub">
          Na Mesa: <span className="text-e-text font-semibold">{deFora} de {estado.mesa.length}</span> de pé
          {deFora === 0 && estado.status !== 'concluido' && ' · pode concluir o encontro'}
        </p>
      )}

      <Button variant="primary" onClick={() => setLevando(true)} disabled={inimigos.length + chefes.length === 0}>
        <LayoutDashboard size={14} /> Levar para a Mesa
      </Button>
      {sujo && inimigos.length + chefes.length > 0 && (
        <p className="text-[11px] text-e-faint -mt-1">Usa o que está na tela, mesmo sem salvar.</p>
      )}

      {levando && (
        <LevarParaMesaModal pontoId={ponto.id} titulo={ponto.titulo} inimigos={inimigos} chefes={chefes} onClose={() => setLevando(false)} />
      )}
    </div>
  );
}
