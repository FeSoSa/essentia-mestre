'use client';

import { useStore, useInitiative } from '@/store';

export default function InitiativeList() {
  const initiative = useInitiative();
  const { reorderInitiative, setInitiative } = useStore();

  if (initiative.length === 0)
    return <p className="text-sm text-e-faint text-center py-6">Nenhuma iniciativa ainda.</p>;

  return (
    <div className="flex flex-col gap-2">
      {initiative.map((entry, i) => {
        const active = i === 0;
        return (
          <div key={entry.playerId}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
              active ? 'bg-e-accent/12 border-e-accent/40 ring-1 ring-e-accent/20' : 'bg-e-card border-e-border',
            ].join(' ')}>
            <span className="text-xs font-mono text-e-faint w-4 text-center shrink-0">{i + 1}</span>
            <span className={`flex-1 text-sm font-medium truncate ${active ? 'text-e-text' : 'text-e-sub'}`}>
              {entry.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-e-faint">d20</span>
              <input
                type="number"
                value={entry.value}
                onChange={(e) =>
                  setInitiative(initiative.map((en, idx) => idx === i ? { ...en, value: Number(e.target.value) } : en))
                }
                className={`!w-14 !text-center !py-1 !px-1.5 !text-sm !font-bold ${active ? '!text-e-accent' : '!text-e-text'}`}
                min={1} max={20}
              />
            </div>
            <div className="flex flex-col gap-0.5 shrink-0">
              {([[-1, '▲'], [1, '▼']] as const).map(([dir, arrow]) => (
                <button key={arrow}
                  onClick={() => reorderInitiative(i, i + dir)}
                  disabled={dir < 0 ? i === 0 : i === initiative.length - 1}
                  className="text-e-faint hover:text-e-sub disabled:opacity-20 text-[9px] leading-none cursor-pointer disabled:cursor-default px-0.5">
                  {arrow}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
