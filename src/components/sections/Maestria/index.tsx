'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { usePlayers } from '@/store';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import type { SkillTreeEntry, PlayerSkill } from '@/store/types';

interface PlayerSkillState {
  playerId: string;
  skills: SkillTreeEntry[];
}

export default function Maestria() {
  const players = usePlayers();
  const [skillData, setSkillData] = useState<PlayerSkillState[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [usesInput, setUsesInput] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled(
        players.map((p) =>
          api.get<SkillTreeEntry[]>(`/players/${p.id}/skill-tree`).then((r) => ({
            playerId: p.id,
            skills: r.data,
          }))
        )
      );
      setSkillData(
        results
          .filter((r): r is PromiseFulfilledResult<PlayerSkillState> => r.status === 'fulfilled')
          .map((r) => r.value)
      );
    }
    if (players.length > 0) load();
  }, [players]);

  async function handleAddUses(playerId: string, playerSkill: PlayerSkill) {
    const uses = usesInput[playerSkill.id] ?? 0;
    if (uses <= 0) return;
    setSaving(playerSkill.id);
    try {
      await api.put(`/master/players/${playerId}/maestria`, {
        playerSkillId: playerSkill.id,
        uses,
      });
      // Recarrega skill tree do jogador
      const r = await api.get<SkillTreeEntry[]>(`/players/${playerId}/skill-tree`);
      setSkillData((prev) =>
        prev.map((d) => d.playerId === playerId ? { ...d, skills: r.data } : d)
      );
      setUsesInput((p) => ({ ...p, [playerSkill.id]: 0 }));
    } catch {}
    finally { setSaving(null); }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <SectionHeader title="Maestria" subtitle="Progresso de habilidades" />

      {players.length === 0 ? (
        <div className="flex items-center justify-center py-32 text-e-faint text-sm">
          Nenhum jogador na mesa.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {players.map((player) => {
            const data = skillData.find((d) => d.playerId === player.id);
            const unlockedSkills = (data?.skills ?? []).filter(
              (e) => e.status === 'UNLOCKED' && e.playerSkill
            );

            return (
              <div key={player.id} className="bg-e-surface border border-e-border rounded-xl p-5">
                <div className="mb-4">
                  <p className="font-semibold text-e-text">{player.char.name}</p>
                  <p className="text-xs text-e-sub mt-0.5">{player.char.skillClass}</p>
                </div>

                {unlockedSkills.length === 0 ? (
                  <p className="text-sm text-e-faint">
                    {data ? 'Nenhuma skill desbloqueada.' : 'Carregando…'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {unlockedSkills.map((entry) => {
                      const ps = entry.playerSkill!;
                      const maestria = ps.maestria;
                      const pct = maestria.nextLevelUses > 0
                        ? Math.min(100, (maestria.totalUses / maestria.nextLevelUses) * 100)
                        : 100;

                      // Alerta se nível 2 ou 4 (escolha de caminho)
                      const needsPath = maestria.level === 2 || maestria.level === 4;

                      return (
                        <div key={ps.id} className="bg-e-card border border-e-border rounded-xl p-4 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-e-text">{entry.skill.name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              {needsPath && (
                                <AlertTriangle size={14} className="text-e-gold" />
                              )}
                              <span className="text-xs font-bold text-e-gold">Nv {maestria.level}</span>
                              <span className="text-xs text-e-sub tabular-nums">
                                {maestria.totalUses}/{maestria.nextLevelUses === 0 ? '∞' : maestria.nextLevelUses}
                              </span>
                            </div>
                          </div>

                          {maestria.nextLevelUses > 0 && (
                            <div className="h-1.5 bg-e-border rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-e-gold transition-all duration-500"
                                style={{ width: `${pct}%` }} />
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={usesInput[ps.id] ?? 0}
                              onChange={(e) => setUsesInput((p) => ({ ...p, [ps.id]: Number(e.target.value) }))}
                              className="!w-20 !text-center !py-1.5"
                              min={0}
                            />
                            <Button
                              variant="gold" size="sm"
                              disabled={saving === ps.id || (usesInput[ps.id] ?? 0) <= 0}
                              onClick={() => handleAddUses(player.id, ps)}
                            >
                              {saving === ps.id ? '…' : '+ Usos'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
