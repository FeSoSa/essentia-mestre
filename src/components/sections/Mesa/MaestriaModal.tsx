'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import type { Player, SkillTreeEntry, PlayerSkill } from '@/store/types';

export default function MaestriaModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const [skills, setSkills] = useState<SkillTreeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [usesInput, setUsesInput] = useState<Record<string, number>>({});

  useEffect(() => {
    api.get<SkillTreeEntry[]>(`/players/${player.id}/skill-tree`)
      .then((r) => setSkills(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [player.id]);

  async function handleAddUses(ps: PlayerSkill) {
    const uses = usesInput[ps.id] ?? 0;
    if (uses <= 0) return;
    setSaving(ps.id);
    try {
      await api.put(`/master/players/${player.id}/maestria`, { playerSkillId: ps.id, uses });
      const r = await api.get<SkillTreeEntry[]>(`/players/${player.id}/skill-tree`);
      setSkills(r.data);
      setUsesInput((p) => ({ ...p, [ps.id]: 0 }));
    } catch {}
    finally { setSaving(null); }
  }

  const unlocked = skills.filter((e) => e.status === 'UNLOCKED' && e.playerSkill);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <div>
            <h3 className="font-semibold text-e-text">Maestria — {player.char.name}</h3>
            <p className="text-xs text-e-sub mt-0.5">{player.char.skillClass} · Nv {player.char.level}</p>
          </div>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <p className="text-center text-e-faint text-sm animate-pulse py-8">Carregando skills…</p>
          ) : unlocked.length === 0 ? (
            <p className="text-center text-e-faint text-sm py-8">Nenhuma skill desbloqueada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {unlocked.map((entry) => {
                const ps = entry.playerSkill!;
                const m = ps.maestria;
                const pct = m.nextLevelUses > 0 ? Math.min(100, (m.totalUses / m.nextLevelUses) * 100) : 100;
                const needsPath = (m.level === 2 || m.level === 4) && m.upgrades.length < m.level - 1;

                return (
                  <div key={ps.id} className="bg-e-card border border-e-border rounded-xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-e-text truncate">{entry.skill.name}</p>
                        <p className="text-xs text-e-sub mt-0.5 line-clamp-1">{entry.skill.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {needsPath && <AlertTriangle size={14} className="text-e-gold" />}
                        <span className="text-xs font-bold text-e-gold bg-e-gold/10 border border-e-gold/20 px-2 py-0.5 rounded-lg">Nv {m.level}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-e-faint">
                      <span>{m.totalUses} usos totais</span>
                      {m.nextLevelUses > 0 && (
                        <span>próximo nível: {m.nextLevelUses}</span>
                      )}
                    </div>

                    {m.nextLevelUses > 0 && (
                      <div className="h-1.5 bg-e-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-e-gold transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <input type="number" min={0}
                        value={usesInput[ps.id] ?? 0}
                        onChange={(e) => setUsesInput((p) => ({ ...p, [ps.id]: Number(e.target.value) }))}
                        className="!w-20 !text-center !py-1.5" />
                      <Button variant="gold" size="sm"
                        disabled={saving === ps.id || (usesInput[ps.id] ?? 0) <= 0}
                        onClick={() => handleAddUses(ps)}>
                        {saving === ps.id ? '…' : '+ Usos'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
