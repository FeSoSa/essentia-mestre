'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useStore, useLog, useInitiative, usePlayers } from '@/store';
import type { LogEntry } from '@/store/types';

// Types that get collapsed when consecutive from same player (within 5s window)
const COLLAPSIBLE = new Set(['hp', 'flow', 'ether', 'attr']);

// Visual config per type
const TYPE_STYLE: Record<string, { dot: string; label: string }> = {
  skill:    { dot: 'bg-e-accent',   label: 'Habilidade' },
  level:    { dot: 'bg-e-gold',     label: 'Nível'      },
  item:     { dot: 'bg-orange-400', label: 'Item'       },
  essencia: { dot: 'bg-purple-400', label: 'Essência'   },
  hp:       { dot: 'bg-red-400',    label: 'Vida'       },
  flow:     { dot: 'bg-blue-400',   label: 'Fluxo'      },
  ether:    { dot: 'bg-purple-300', label: 'Éter'       },
  attr:     { dot: 'bg-yellow-400', label: 'Atributo'   },
  info:     { dot: 'bg-e-faint',    label: ''           },
};

interface CollapsedEntry extends LogEntry {
  count?: number;
}

function collapseLog(entries: LogEntry[]): CollapsedEntry[] {
  if (entries.length === 0) return [];
  const WINDOW_MS = 5000;
  const result: CollapsedEntry[] = [];

  for (const entry of entries) {
    const type = entry.type ?? 'info';
    if (!COLLAPSIBLE.has(type)) {
      result.push(entry);
      continue;
    }
    // Try to merge with last entry of same player + type within time window
    const last = result[result.length - 1];
    const tsEntry = new Date(entry.timestamp).getTime();
    const tsLast = last ? new Date(last.timestamp).getTime() : 0;
    if (
      last &&
      last.playerId === entry.playerId &&
      (last.type ?? 'info') === type &&
      Math.abs(tsEntry - tsLast) <= WINDOW_MS
    ) {
      // Merge: extract delta from text (e.g. "Ana HP +3" → +3)
      const deltaMatch = entry.text.match(/([+-]\d+)$/);
      const prevMatch = last.text.match(/([+-]\d+)$/);
      if (deltaMatch && prevMatch) {
        const total = Number(prevMatch[1]) + Number(deltaMatch[1]);
        const base = last.text.replace(/[+-]\d+$/, '').trim();
        result[result.length - 1] = {
          ...last,
          text: `${base} ${total >= 0 ? '+' : ''}${total}`,
          count: (last.count ?? 1) + 1,
          timestamp: entry.timestamp,
          time: entry.time,
        };
        continue;
      }
    }
    result.push({ ...entry });
  }

  return result;
}

export default function Log() {
  const log = useLog();
  const initiative = useInitiative();
  const players = usePlayers();
  const { setLog } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<LogEntry[]>('/log').then((r) => setLog(r.data)).catch(() => {});
  }, [setLog]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.char.name ?? id;
  }

  const collapsed = collapseLog([...log].reverse()).reverse();

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
          <span className="text-xs text-e-faint tabular-nums">
            {collapsed.length} eventos
            {collapsed.length !== log.length && (
              <span className="text-e-faint/60 ml-1">({log.length} raw)</span>
            )}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {collapsed.length === 0 ? (
            <div className="flex items-center justify-center h-full text-e-faint text-sm">
              Nenhuma ação ainda.
            </div>
          ) : (
            <>
              {collapsed.map((entry, i) => {
                const type = entry.type ?? 'info';
                const style = TYPE_STYLE[type] ?? TYPE_STYLE.info;
                return (
                  <div key={`${entry.timestamp}-${i}`}
                    className="flex items-start gap-3 px-5 py-2.5 border-b border-e-border/40 hover:bg-e-card/50 transition-colors">
                    {/* Dot */}
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                    {/* Time */}
                    <span className="text-e-faint font-mono text-xs pt-px w-10 shrink-0">{entry.time}</span>
                    {/* Text */}
                    <span className="flex-1 text-sm">
                      <span className="text-e-accent font-medium">{playerName(entry.playerId)}</span>
                      <span className="text-e-sub"> {entry.text.replace(playerName(entry.playerId), '').trim()}</span>
                      {(entry.count ?? 1) > 1 && (
                        <span className="ml-1.5 text-[10px] text-e-faint bg-e-card rounded px-1 py-0.5">
                          ×{entry.count}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
