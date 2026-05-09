'use client';

import { useState } from 'react';
import { Zap, X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';

const SOBRECARGA_LEVELS = [
  { nivel: 1, bonus: 2,  custo: 60,  cd: 10, danoDado: '2d6' },
  { nivel: 2, bonus: 4,  custo: 90,  cd: 12, danoDado: '3d6' },
  { nivel: 3, bonus: 6,  custo: 125, cd: 14, danoDado: '4d6' },
  { nivel: 4, bonus: 8,  custo: 165, cd: 16, danoDado: '5d6' },
  { nivel: 5, bonus: 10, custo: 210, cd: 18, danoDado: '6d6' },
  { nivel: 6, bonus: 12, custo: 260, cd: 20, danoDado: '8d6' },
];

export default function SobrecargaPanel() {
  const requests = useStore((s) => s.sobrecargaRequests);
  const removeSobrecargaRequest = useStore((s) => s.removeSobrecargaRequest);
  const setPlayer = useStore((s) => s.setPlayer);

  const [rollInputs, setRollInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  if (requests.length === 0) return null;

  async function handleApprove(playerId: string) {
    setLoading(playerId);
    try {
      const res = await api.post(`/master/players/${playerId}/sobrecarga/approve`);
      setPlayer(res.data);
      removeSobrecargaRequest(playerId);
    } catch {}
    finally { setLoading(null); }
  }

  async function handleReject(playerId: string, roll: number, cd: number, danoDado: string) {
    setLoading(playerId);
    try {
      const res = await api.post(`/master/players/${playerId}/sobrecarga/reject`, { roll, danoDado });
      setPlayer(res.data);
      removeSobrecargaRequest(playerId);
    } catch {}
    finally { setLoading(null); }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-e-surface border border-orange-500/60 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-2 px-4 py-3 bg-orange-500/10 hover:bg-orange-500/15 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <Zap size={14} className="text-orange-400 shrink-0" />
        <span className="flex-1 text-left text-sm font-bold text-orange-400 tracking-wide">
          SOBRECARGA — {requests.length} pedido{requests.length > 1 ? 's' : ''}
        </span>
        <span className="text-e-faint text-xs">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="flex flex-col divide-y divide-e-border max-h-96 overflow-y-auto">
          {requests.map((req) => {
            const lvl = SOBRECARGA_LEVELS.find((l) => l.nivel === req.nivel)!;
            const rollStr = rollInputs[req.playerId] ?? '';
            const roll = parseInt(rollStr, 10);
            const total = isNaN(roll) ? null : roll + req.sabMod;
            const passes = total !== null && total >= req.cd;

            return (
              <div key={req.playerId} className="p-4 flex flex-col gap-3">
                {/* Player + level info */}
                <div>
                  <p className="font-semibold text-e-text text-sm">{req.playerName}</p>
                  <p className="text-xs text-e-sub mt-0.5">
                    Nível {req.nivel} · +{lvl.bonus} atributos · {lvl.custo} ES/rod
                  </p>
                  <p className="text-xs text-e-faint mt-0.5">
                    CD {req.cd} · falha: {lvl.danoDado} · mod SAB {req.sabMod >= 0 ? `+${req.sabMod}` : req.sabMod}
                  </p>
                </div>

                {/* Roll input */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint whitespace-nowrap">
                    1d20 =
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={rollStr}
                    onChange={(e) => setRollInputs((prev) => ({ ...prev, [req.playerId]: e.target.value }))}
                    className="w-16 text-center text-sm rounded-lg px-2 py-1.5 bg-e-bg border border-e-border text-e-text outline-none focus:border-orange-500/60 transition-colors"
                    placeholder="—"
                  />
                  {total !== null && (
                    <span className={`text-sm font-bold ${passes ? 'text-green-400' : 'text-red-400'}`}>
                      = {total} {passes ? `≥ CD ${req.cd} ✓` : `< CD ${req.cd} ✗`}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(req.playerId)}
                    disabled={loading === req.playerId || total === null || !passes}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 text-xs font-bold hover:bg-green-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check size={12} /> APROVAR
                  </button>
                  <button
                    onClick={() => handleReject(req.playerId, roll, req.cd, lvl.danoDado)}
                    disabled={loading === req.playerId || total === null || passes}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <X size={12} /> REJEITAR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
