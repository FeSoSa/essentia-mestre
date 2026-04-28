'use client';

import { useState } from 'react';
import { Plus, Crown } from 'lucide-react';
import type { BossInstance, EnemyInstance, Player } from '@/store/types';
import BossCard from './BossCard';
import EnemyCard from './EnemyCard';
import AddEnemyModal from './AddEnemyModal';
import AddBossModal from './AddBossModal';

interface Props {
  bosses: BossInstance[];
  enemies: EnemyInstance[];
  players: Player[];
}

export default function EnemyColumn({ bosses, enemies, players }: Props) {
  const [showAddEnemy, setShowAddEnemy] = useState(false);
  const [showAddBoss, setShowAddBoss]   = useState(false);

  return (
    <div className="w-72 shrink-0 border-l border-e-enemy-border bg-e-enemy-bg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-e-enemy-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-e-enemy-muted">
          Combate
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowAddBoss(true)}
            title="Adicionar boss"
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{ color: '#7a7050' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#c8a050'; (e.currentTarget as HTMLElement).style.background = '#2a2410'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#7a7050'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Crown size={13} />
          </button>
          <button
            onClick={() => setShowAddEnemy(true)}
            title="Adicionar inimigo"
            className="w-6 h-6 rounded flex items-center justify-center transition-colors text-e-enemy-muted hover:text-e-enemy-text hover:bg-e-enemy-surface"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {bosses.map((b) => (
          <BossCard key={b.instanceId} boss={b} players={players} />
        ))}
        {bosses.length > 0 && enemies.length > 0 && (
          <div className="border-t" style={{ borderColor: '#4a2a2a' }} />
        )}
        {enemies.map((e) => (
          <EnemyCard key={e.instanceId} enemy={e} players={players} />
        ))}
      </div>

      {showAddEnemy && <AddEnemyModal onClose={() => setShowAddEnemy(false)} />}
      {showAddBoss  && <AddBossModal  onClose={() => setShowAddBoss(false)}  />}
    </div>
  );
}
