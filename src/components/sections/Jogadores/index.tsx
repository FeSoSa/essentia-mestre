'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore, usePlayers } from '@/store';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import type { Player } from '@/store/types';
import CharacterModal from './CharacterModal';

export default function Jogadores() {
  const players = usePlayers();
  const { setPlayers, removePlayer } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [expPlayerId, setExpPlayerId] = useState<string | null>(null);
  const [expAmount, setExpAmount] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.get<Player[]>('/master/players').then((r) => setPlayers(r.data)).catch(() => {});
  }, [setPlayers]);

  async function handleDelete(id: string) {
    if (!confirm('Deletar este personagem?')) return;
    setDeleting(id);
    try { await api.delete(`/master/players/${id}`); removePlayer(id); } catch {}
    finally { setDeleting(null); }
  }

  async function handleExp(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!expPlayerId) return;
    try { await api.put('/master/exp', { playerId: expPlayerId, amount: expAmount }); } catch {}
    finally { setExpPlayerId(null); setExpAmount(0); }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <SectionHeader
        title="Jogadores"
        subtitle={`${players.length} personagem${players.length !== 1 ? 's' : ''} cadastrado${players.length !== 1 ? 's' : ''}`}
        action={<Button variant="primary" onClick={() => setShowCreate(true)}>+ Novo Personagem</Button>}
      />

      {players.length === 0 ? (
        <div className="flex items-center justify-center py-32 text-e-faint text-sm">
          Nenhum personagem cadastrado.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 bg-e-surface border border-e-border rounded-xl px-5 py-4 hover:border-e-border2 transition-colors">
              <div className="min-w-0">
                <p className="font-semibold text-e-text truncate">{p.char.name}</p>
                <p className="text-sm text-e-sub mt-0.5">{p.char.race} · {p.char.skillClass} · Nv {p.char.level}</p>
              </div>
              <code className="text-xs text-e-accent bg-e-accent/10 border border-e-accent/15 px-2.5 py-1.5 rounded-lg font-mono whitespace-nowrap">
                {p.code}
              </code>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="gold"   size="sm" onClick={() => setExpPlayerId(p.id)}>EXP</Button>
                <Button variant="ghost"  size="sm" onClick={() => setEditPlayer(p)}>Editar</Button>
                <Button variant="danger" size="sm" disabled={deleting === p.id} onClick={() => handleDelete(p.id)}>
                  {deleting === p.id ? '…' : 'Deletar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {expPlayerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setExpPlayerId(null); }}>
          <form onSubmit={handleExp} className="bg-e-surface border border-e-border2 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-e-text">Liberar EXP</h3>
              <button type="button" onClick={() => setExpPlayerId(null)} className="text-e-faint hover:text-e-sub cursor-pointer text-lg leading-none">✕</button>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block">Quantidade</label>
              <input type="number" value={expAmount} onChange={(e) => setExpAmount(Number(e.target.value))} min={0} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="ghost" size="md" className="w-full" onClick={() => setExpPlayerId(null)}>Cancelar</Button>
              <Button type="submit" variant="gold"  size="md" className="w-full">Liberar</Button>
            </div>
          </form>
        </div>
      )}

      {showCreate && <CharacterModal onClose={() => setShowCreate(false)} />}
      {editPlayer && <CharacterModal player={editPlayer} onClose={() => setEditPlayer(null)} />}
    </div>
  );
}
