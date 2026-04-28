'use client';

import { useState } from 'react';
import { Dices, RotateCcw, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore, usePlayers } from '@/store';
import Button from '@/components/ui/Button';
import InitiativeList from './InitiativeList';
import SessionLog from './SessionLog';

export default function Turno() {
  const { currentTurn, setCurrentTurn, initiative, setInitiative } = useStore();
  const players = usePlayers();
  const [loading, setLoading] = useState(false);

  async function nextTurn() {
    setLoading(true);
    try {
      await api.post('/master/next-turn');
      setCurrentTurn(currentTurn + 1);
    } catch {
      setCurrentTurn(currentTurn + 1);
    } finally { setLoading(false); }
  }

  async function rollInitiative() {
    if (players.length === 0) return;
    const rolled = players
      .map((p) => ({ playerId: p.id, name: p.char.name, value: Math.ceil(Math.random() * 20) }))
      .sort((a, b) => b.value - a.value);
    setInitiative(rolled);
    // Salva no backend
    await api.put('/master/initiative', rolled).catch(() => {});
  }

  async function reset() {
    setCurrentTurn(0);
    setInitiative([]);
    await api.put('/master/initiative', []).catch(() => {});
  }

  return (
    <div className="flex flex-col h-full p-8 gap-5">
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-e-text tracking-tight">Turno</h1>
          <p className="text-sm text-e-sub mt-1">Controle de combate</p>
        </div>
        <div className="flex flex-col items-center bg-e-surface border border-e-border rounded-xl px-5 py-3 min-w-[88px]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1">Turno</span>
          <span className="text-3xl font-black tabular-nums text-e-text leading-none">
            {currentTurn === 0 ? '—' : currentTurn}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 shrink-0">
        <Button variant="primary" size="lg" disabled={loading || initiative.length === 0} onClick={nextTurn} className="gap-2">
          <ChevronRight size={18} />
          {loading ? 'Avançando…' : 'Próximo'}
        </Button>
        <Button variant="subtle" size="lg" disabled={players.length === 0} onClick={rollInitiative} className="gap-2">
          <Dices size={18} />
          Rolar Iniciativa
        </Button>
        <Button variant="danger" size="lg" disabled={currentTurn === 0 && initiative.length === 0} onClick={reset} className="gap-2">
          <RotateCcw size={16} />
          Resetar
        </Button>
      </div>

      {initiative.length === 0 && (
        <div className="shrink-0 px-4 py-3 rounded-xl border border-dashed border-e-border text-sm text-e-faint text-center">
          Clique em <span className="text-e-text font-medium">Rolar Iniciativa</span> para sortear com d20
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
        <div className="bg-e-surface border border-e-border rounded-xl flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-e-border shrink-0 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-e-faint">Ordem de Iniciativa</p>
            {initiative.length > 0 && <span className="text-xs text-e-faint">{initiative.length}</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <InitiativeList />
          </div>
        </div>
        <SessionLog />
      </div>
    </div>
  );
}
