'use client';

import { useEffect, useState } from 'react';
import { Dices, ChevronRight, Zap, Square, Loader2, Moon } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore, useFastAction } from '@/store';
import { useMesaStore } from '@/store/mesaStore';
import type { Essencia, Player, InitiativeEntry } from '@/store/types';
import AcaoRapidaModal from '@/components/sections/Mesa/AcaoRapidaModal';
import AddEnemyModal from '@/components/sections/Mesa/AddEnemyModal';
import AddBossModal from '@/components/sections/Mesa/AddBossModal';
import AddAllyModal from '@/components/sections/Mesa/AddAllyModal';
import InitiativeEditorModal from '@/components/sections/Turno/InitiativeEditorModal';
import TurnTrack from './TurnTrack';
import GrupoBox from './GrupoBox';
import EmFoco from './EmFoco';
import Pendencias from './Pendencias';
import CampoBatalha from './CampoBatalha';
import PlayerSheet from './PlayerSheet';
import { useCombatentes } from './combatentes';

type Modal = 'acao' | 'inimigo' | 'boss' | 'aliado' | 'iniciativa' | null;

/**
 * Mesa. De cima para baixo, na ordem em que o mestre precisa:
 * a trilha do turno, quem está na vez (com a decisão do momento), o que espera
 * aprovação e o campo de batalha. Os jogadores ficam no quadro do Grupo e a ficha
 * abre numa gaveta lateral.
 */
export default function MesaNova() {
  const fastAction = useFastAction();
  const { setPlayers, setCurrentTurn, setInitiative } = useStore();
  const { selecionado, selecionar, foraDoCombate, carregar } = useMesaStore();
  const { players, enemies, bosses, allies, emCombate } = useCombatentes();
  const [avancando, setAvancando] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [essencias, setEssencias] = useState<Essencia[]>([]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { api.get<Player[]>('/master/players').then((r) => setPlayers(r.data)).catch(() => {}); }, [setPlayers]);
  useEffect(() => { api.get<Essencia[]>('/master/essencias').then((r) => setEssencias(r.data)).catch(() => {}); }, []);

  const participantes = players.filter((p) => !foraDoCombate.includes(p.id));
  const aberto = players.find((p) => p.id === selecionado);

  async function proximoTurno() {
    setAvancando(true);
    try { await api.post('/master/next-turn'); } catch {} finally { setAvancando(false); }
  }

  async function confirmarIniciativa(entries: InitiativeEntry[]) {
    setInitiative(entries);
    setModal(null);
    await api.put('/master/initiative', entries).catch(() => {});
  }

  async function encerrarCombate() {
    if (!confirm('Encerrar o combate? A iniciativa é limpa e as recargas voltam a zero.')) return;
    setCurrentTurn(0);
    setInitiative([]);
    await api.put('/master/initiative', []).catch(() => {});
  }

  const adicionar = (t: 'inimigo' | 'boss' | 'aliado') => setModal(t);

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      {/* Trilha do turno */}
      <header className="shrink-0 h-[92px] px-6 flex items-center gap-6 border-b border-white/[0.07] bg-[#131316]">
        <div className="flex-1 min-w-0">
          {emCombate ? <TurnTrack /> : (
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-e-faint">Mesa</span>
              <span className="text-lg font-bold text-e-text">Sem combate em andamento</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" title="Fim do dia: zera o Escudo de todos os jogadores"
            onClick={async () => {
              if (!confirm('Fim do dia: zerar o Escudo de todos os jogadores?')) return;
              try { await api.post('/master/fim-do-dia'); } catch {}
            }}
            className="h-10 px-3.5 rounded-xl border border-white/10 text-e-sub hover:text-e-text hover:bg-white/5 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors">
            <Moon size={14} /> Fim do dia
          </button>
          <button type="button" onClick={() => setModal('acao')} title="Votação rápida para os jogadores"
            className={`h-10 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              fastAction ? 'border-e-accent/50 bg-e-accent/10 text-e-accent' : 'border-white/10 text-e-sub hover:text-e-text hover:bg-white/5'}`}>
            <Zap size={14} /> {fastAction ? 'Votação aberta' : 'Ação rápida'}
            {fastAction && <span className="w-2 h-2 rounded-full bg-e-accent animate-pulse" />}
          </button>
          {emCombate ? (
            <>
              <button type="button" onClick={encerrarCombate} title="Encerrar combate"
                className="h-10 px-3.5 rounded-xl border border-red-500/25 text-xs font-semibold text-red-300 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer">
                <Square size={13} /> Encerrar
              </button>
              <button type="button" onClick={proximoTurno} disabled={avancando}
                className="h-10 pl-4 pr-3 rounded-xl bg-e-accent text-black text-sm font-black flex items-center gap-1.5 hover:bg-e-accent/90 disabled:opacity-60 cursor-pointer shadow-[0_0_24px_rgba(163,230,53,0.25)]">
                {avancando ? <Loader2 size={15} className="animate-spin" /> : null} Próximo turno <ChevronRight size={17} />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setModal('iniciativa')}
              disabled={participantes.length + enemies.length + bosses.length + allies.length === 0}
              className="h-10 px-4 rounded-xl bg-e-accent text-black text-sm font-black flex items-center gap-2 hover:bg-e-accent/90 disabled:opacity-40 cursor-pointer">
              <Dices size={15} /> Iniciar combate
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full px-6 2xl:px-8 py-6 flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)] gap-5 items-start">
            <GrupoBox />
            <EmFoco onIniciativa={() => setModal('iniciativa')} onAdicionar={adicionar} />
          </div>
          <Pendencias />
          <CampoBatalha onAdicionar={adicionar} />
        </div>
      </div>

      {aberto && <PlayerSheet key={aberto.id} player={aberto} essencias={essencias} onClose={() => selecionar(null)} />}

      {modal === 'acao' && <AcaoRapidaModal onClose={() => setModal(null)} />}
      {modal === 'inimigo' && <AddEnemyModal onClose={() => setModal(null)} />}
      {modal === 'boss' && <AddBossModal onClose={() => setModal(null)} />}
      {modal === 'aliado' && <AddAllyModal onClose={() => setModal(null)} />}
      {modal === 'iniciativa' && (
        <InitiativeEditorModal players={participantes} enemies={enemies} bosses={bosses} allies={allies}
          onConfirm={confirmarIniciativa} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
