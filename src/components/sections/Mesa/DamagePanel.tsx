'use client';

import { useState } from 'react';
import { Sword, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';

export default function DamagePanel() {
  const requests         = useStore((s) => s.damageRequests);
  const removeDamageRequest = useStore((s) => s.removeDamageRequest);
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  if (requests.length === 0) return null;

  async function handleApprove(req: typeof requests[0]) {
    setLoading(req.requestId);
    try {
      await api.post('/master/damage/approve', {
        requestId:  req.requestId,
        playerId:   req.playerId,
        targetId:   req.targetId,
        targetType: req.targetType,
        damage:     req.damage,
        costs:      req.costs ?? {},
      });
      removeDamageRequest(req.requestId);
    } catch {}
    finally { setLoading(null); }
  }

  async function handleReject(req: typeof requests[0]) {
    setLoading(req.requestId);
    try {
      await api.post('/master/damage/reject', {
        requestId: req.requestId,
        playerId:  req.playerId,
      });
      removeDamageRequest(req.requestId);
    } catch {}
    finally { setLoading(null); }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 bg-e-surface border border-red-500/60 rounded-xl shadow-2xl overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/15 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <Sword size={14} className="text-red-400 shrink-0" />
        <span className="flex-1 text-left text-sm font-bold text-red-400 tracking-wide">
          DANO — {requests.length} pedido{requests.length > 1 ? 's' : ''}
        </span>
        <span className="text-e-faint text-xs">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="flex flex-col divide-y divide-e-border max-h-80 overflow-y-auto">
          {requests.map((req) => (
            <div key={req.requestId} className="p-4 flex flex-col gap-3">
              <div>
                <p className="font-semibold text-e-text text-sm">{req.playerName}</p>
                <p className="text-xs text-e-sub mt-0.5">
                  {req.targetType === 'boss' ? '★' : '⚔'} {req.targetName}
                </p>
                <p className="text-2xl font-black text-red-400 mt-1">{req.damage} dano</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(req)}
                  disabled={loading === req.requestId}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 text-xs font-bold hover:bg-green-500/25 disabled:opacity-40 transition-colors"
                >
                  <Check size={12} /> APROVAR
                </button>
                <button
                  onClick={() => handleReject(req)}
                  disabled={loading === req.requestId}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/25 disabled:opacity-40 transition-colors"
                >
                  <X size={12} /> REJEITAR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
