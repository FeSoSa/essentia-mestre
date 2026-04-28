'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore, useLog, usePlayers } from '@/store';
import type { LogEntry } from '@/store/types';

export default function SessionLog() {
  const log = useLog();
  const players = usePlayers();
  const { setLog } = useStore();

  useEffect(() => {
    api.get<LogEntry[]>('/log').then((r) => setLog(r.data)).catch(() => {});
  }, [setLog]);

  function playerName(playerId: string) {
    return players.find((p) => p.id === playerId)?.char.name ?? playerId;
  }

  return (
    <div className="bg-e-surface border border-e-border rounded-xl flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-e-border shrink-0 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-e-faint">Log da Sessão</p>
        <span className="text-xs text-e-faint tabular-nums">{log.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {log.length === 0 ? (
          <div className="flex items-center justify-center h-full text-e-faint text-sm p-8">
            Nenhuma ação ainda.
          </div>
        ) : (
          log.map((entry, i) => (
            <div key={`${entry.timestamp}-${i}`}
              className="grid grid-cols-[72px_1fr] gap-3 px-5 py-2.5 border-b border-e-border/40 text-sm hover:bg-e-card/50 transition-colors">
              <span className="text-e-faint font-mono text-xs pt-px shrink-0">{entry.time}</span>
              <span>
                <span className="text-e-accent font-medium">{playerName(entry.playerId)}</span>
                <span className="text-e-sub"> {entry.text}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
