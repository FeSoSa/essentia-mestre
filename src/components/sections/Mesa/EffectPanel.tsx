'use client';

import { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';

export default function EffectPanel() {
  const requests          = useStore((s) => s.effectRequests);
  const removeEffectRequest = useStore((s) => s.removeEffectRequest);
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  if (requests.length === 0) return null;

  async function handleApprove(req: typeof requests[0]) {
    setLoading(req.requestId);
    try {
      await api.post('/master/effect/approve', {
        requestId:    req.requestId,
        playerId:     req.playerId,
        targets:      req.targets,
        onHitEffects: req.onHitEffects,
      });
      removeEffectRequest(req.requestId);
    } catch {}
    finally { setLoading(null); }
  }

  async function handleReject(req: typeof requests[0]) {
    setLoading(req.requestId);
    try {
      await api.post('/master/effect/reject', {
        requestId: req.requestId,
        playerId:  req.playerId,
      });
      removeEffectRequest(req.requestId);
    } catch {}
    finally { setLoading(null); }
  }

  return (
    <div className="fixed bottom-4 left-80 z-50 w-72 bg-e-surface border border-purple-500/60 rounded-xl shadow-2xl overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/15 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <Sparkles size={14} className="text-purple-400 shrink-0" />
        <span className="flex-1 text-left text-sm font-bold text-purple-400 tracking-wide">
          EFEITOS — {requests.length} pedido{requests.length > 1 ? 's' : ''}
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
                  {req.targets.length === 1
                    ? `${req.targets[0].targetType === 'boss' ? '★' : '⚔'} ${req.targets[0].targetName}`
                    : `${req.targets.length} alvos: ${req.targets.map((t) => t.targetName).join(', ')}`}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {req.onHitEffects.map((eff) => (
                    <span key={eff.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 border border-purple-500/30 text-purple-300">
                      {eff.icon && <span>{eff.icon}</span>}
                      {eff.name}
                      <span className="opacity-60">{eff.durationTurns === -1 ? '∞' : `${eff.durationTurns}t`}</span>
                    </span>
                  ))}
                </div>
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
