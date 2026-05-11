'use client';

import { useEffect, useState } from 'react';
import { Dices, RotateCcw, ChevronRight, Zap, Skull } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore, usePlayers, useFastAction, useEnemies, useBosses } from '@/store';
import Button from '@/components/ui/Button';
import type { Essencia, Player } from '@/store/types';
import PlayerCard from './PlayerCard';
import AcaoRapidaModal from './AcaoRapidaModal';
import EnemyColumn from './EnemyColumn';
import AddEnemyModal from './AddEnemyModal';
import InitiativeEditorModal from '@/components/sections/Turno/InitiativeEditorModal';
import type { InitiativeEntry } from '@/store/types';

export default function Mesa() {
  const players = usePlayers();
  const fastAction = useFastAction();
  const enemies = useEnemies();
  const bosses  = useBosses();
  const { setPlayers, currentTurn, setCurrentTurn, initiative, setInitiative } = useStore();
  const [loading,   setLoading]   = useState(false);
  const [showAcao,       setShowAcao]       = useState(false);
  const [showAddEnemy,   setShowAddEnemy]   = useState(false);
  const [showInitEditor, setShowInitEditor] = useState(false);
  const [essencias, setEssencias] = useState<Essencia[]>([]);

  useEffect(() => {
    api.get<Player[]>('/master/players').then((r) => setPlayers(r.data)).catch(() => {});
  }, [setPlayers]);

  useEffect(() => {
    api.get<Essencia[]>('/master/essencias').then((r) => setEssencias(r.data)).catch(() => {});
  }, []);

  async function nextTurn() {
    setLoading(true);
    try {
      await api.post('/master/next-turn');
    } catch {}
    finally { setLoading(false); }
  }

  async function confirmInitiative(entries: InitiativeEntry[]) {
    setInitiative(entries);
    setShowInitEditor(false);
    await api.put('/master/initiative', entries).catch(() => {});
  }

  async function reset() {
    setCurrentTurn(0);
    setInitiative([]);
    await api.put('/master/initiative', []).catch(() => {});
  }

  const activePlayer = initiative.length > 0
    ? initiative[currentTurn % initiative.length]
    : null;
  const combatActive = initiative.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Barra de controle de turno */}
      <div className="shrink-0 bg-e-surface border-b border-e-border px-6 py-3 flex items-center gap-3">
        {/* Contador */}
        <div className="flex items-center gap-2 mr-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-e-faint">Turno</span>
          <span className="text-2xl font-black tabular-nums text-e-text leading-none w-8 text-center">
            {!combatActive ? '—' : currentTurn + 1}
          </span>
        </div>

        {/* Jogador atual */}
        {activePlayer && (
          <span className="text-sm text-e-sub border-l border-e-border pl-3">
            Vez de <span className="font-semibold text-e-text">{activePlayer.name}</span>
          </span>
        )}

        <div className="flex gap-2 ml-auto">
          <Button variant="subtle" size="sm" onClick={() => setShowInitEditor(true)} className="gap-1.5">
            <Dices size={14} /> {initiative.length > 0 ? 'Iniciativa' : 'Rolar'}
          </Button>
          <Button variant="danger" size="sm" disabled={currentTurn === 0 && initiative.length === 0} onClick={reset} className="gap-1.5">
            <RotateCcw size={13} /> Reset
          </Button>
          <Button variant="subtle" size="sm" onClick={() => setShowAcao(true)} className="gap-1.5">
            <Zap size={14} />
            {fastAction ? (
              <span className="flex items-center gap-1.5">
                Votação
                <span className="w-2 h-2 rounded-full bg-e-accent animate-pulse" />
              </span>
            ) : 'Ação Rápida'}
          </Button>
          <Button variant="subtle" size="sm" onClick={() => setShowAddEnemy(true)} className="gap-1.5">
            <Skull size={14} /> Inimigos
          </Button>
          <Button variant="primary" size="sm" disabled={loading || initiative.length === 0} onClick={nextTurn} className="gap-1.5">
            <ChevronRight size={14} />
            {loading ? 'Avançando…' : 'Próximo Turno'}
          </Button>
        </div>
      </div>

      {/* Grid de jogadores + coluna de inimigos */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {players.length === 0 ? (
            <div className="flex items-center justify-center h-full text-e-faint text-sm">
              Aguardando jogadores conectarem…
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {players.map((p) => <PlayerCard key={p.id} player={p} essencias={essencias} />)}
            </div>
          )}
        </div>

        {(enemies.length > 0 || bosses.length > 0) && (
          <EnemyColumn bosses={bosses} enemies={enemies} players={players} />
        )}
      </div>

      {showAcao && <AcaoRapidaModal onClose={() => setShowAcao(false)} />}
      {showAddEnemy && <AddEnemyModal onClose={() => setShowAddEnemy(false)} />}
      {showInitEditor && (
        <InitiativeEditorModal
          players={players}
          enemies={enemies}
          bosses={bosses}
          onConfirm={confirmInitiative}
          onClose={() => setShowInitEditor(false)}
        />
      )}
    </div>
  );
}
