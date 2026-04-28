'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { usePlayers } from '@/store';
import type { ItemCatalog } from '@/store/types';
import Button from '@/components/ui/Button';

interface Props {
  item: ItemCatalog;
  onClose: () => void;
}

export default function SendItemModal({ item, onClose }: Props) {
  const players = usePlayers();
  const [playerId, setPlayerId] = useState('');
  const [qty, setQty]           = useState(1);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);

  const selectedPlayer = players.find((p) => p.id === playerId);

  async function send() {
    if (!playerId) return;
    setLoading(true);
    try {
      await api.post(`/master/players/${playerId}/items`, { ...item, qty });
      onClose();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-80 rounded-xl border border-e-border bg-e-surface flex flex-col gap-4 p-5 text-e-text">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm">
            Enviar — {item.icon && <span className="mr-1">{item.icon}</span>}{item.name}
          </h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5">Jogador</p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-e-bg border border-e-border rounded-xl text-sm text-left hover:border-e-border2 transition-colors"
              >
                <span className={`flex-1 ${selectedPlayer ? 'text-e-text' : 'text-e-faint'}`}>
                  {selectedPlayer?.char.name ?? 'Selecionar jogador…'}
                </span>
                <ChevronDown size={13} className={`text-e-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div className="absolute z-50 mt-1 w-full bg-e-surface border border-e-border rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                  {players.map((p) => (
                    <button key={p.id} type="button"
                      onClick={() => { setPlayerId(p.id); setOpen(false); }}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-e-card transition-colors ${p.id === playerId ? 'text-e-accent' : 'text-e-text'}`}
                    >
                      {p.char.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5">Quantidade</p>
            <input
              type="number"
              value={qty}
              min={1}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="w-28 text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text text-center outline-none focus:border-e-border2 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={send} disabled={!playerId || loading}>
            {loading ? 'Enviando…' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
