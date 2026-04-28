'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore, useLog, useInitiative, usePlayers } from '@/store';
import type { LogEntry } from '@/store/types';

export default function Log() {
  const log = useLog();
  const initiative = useInitiative();
  const players = usePlayers();
  const { setLog } = useStore();

  useEffect(() => {
    api.get<LogEntry[]>('/log').then((r) => setLog(r.data)).catch(() => {});
  }, [setLog]);

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.char.name ?? id;
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Iniciativa */}
      <div className="w-64 shrink-0 border-r border-e-border flex flex-col">
        <div className="px-5 py-3.5 border-b border-e-border shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-e-faint">Iniciativa</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {initiative.length === 0 ? (
            <p className="text-sm text-e-faint text-center py-6">Nenhuma iniciativa.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {initiative.map((entry, i) => (
                <div key={entry.playerId}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                    i === 0 ? 'bg-e-accent/12 text-e-text font-semibold' : 'bg-e-card text-e-sub'
                  }`}>
                  <span className="text-xs font-mono text-e-faint w-4 text-center">{i + 1}</span>
                  <span className="flex-1 truncate">{entry.name}</span>
                  <span className="text-xs font-bold tabular-nums text-e-faint">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-e-border shrink-0 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-e-faint">Log da Sessão</p>
          <span className="text-xs text-e-faint tabular-nums">{log.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {log.length === 0 ? (
            <div className="flex items-center justify-center h-full text-e-faint text-sm">
              Nenhuma ação ainda.
            </div>
          ) : (
            log.map((entry, i) => (
              <div key={`${entry.timestamp}-${i}`}
                className="grid grid-cols-[72px_1fr] gap-3 px-5 py-2.5 border-b border-e-border/40 text-sm hover:bg-e-card/50 transition-colors">
                <span className="text-e-faint font-mono text-xs pt-px">{entry.time}</span>
                <span>
                  <span className="text-e-accent font-medium">{playerName(entry.playerId)}</span>
                  <span className="text-e-sub"> {entry.text}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
