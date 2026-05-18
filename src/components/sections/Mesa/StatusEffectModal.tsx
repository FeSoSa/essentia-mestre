'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { STATUS_ICONS, getStatusIcon } from '@/lib/statusIcons';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import EffectBuilder from '@/components/sections/StatusEffects/EffectBuilder';
import type { Player, AutoEffect } from '@/store/types';

export default function StatusEffectModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const { setPlayer } = useStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [duration, setDuration] = useState(3);
  const [permanent, setPermanent] = useState(false);
  const [effects, setEffects] = useState<AutoEffect[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post<Player>('/master/status-effect', {
        playerId: player.id,
        effect: { name, icon: icon || undefined, desc: '', durationTurns: permanent ? -1 : duration, effects },
      });
      setPlayer(res.data);
      setName(''); setIcon(''); setDuration(3); setPermanent(false); setEffects([]);
    } catch {}
    finally { setSaving(false); }
  }

  async function handleRemove(effectId: string) {
    setRemoving(effectId);
    try {
      const res = await api.delete<Player>(`/master/status-effect/${effectId}`, { data: { playerId: player.id } });
      setPlayer(res.data);
    } catch {}
    finally { setRemoving(null); }
  }

  const label = "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";

  const currentEffects = (player.statusEffects ?? []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <div>
            <h3 className="font-semibold text-e-text">Status Effects — {player.char.name}</h3>
            <p className="text-xs text-e-sub mt-0.5">{currentEffects.length} ativo{currentEffects.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
          {/* Efeitos ativos */}
          {currentEffects.length > 0 && (
            <div>
              <p className={label}>Ativos</p>
              <div className="flex flex-col gap-1.5">
                {currentEffects.map((effect) => {
                  const IconComp = getStatusIcon(effect.icon);
                  return (
                  <div key={effect.id} className="flex items-center gap-3 bg-e-card border border-e-border rounded-xl px-3 py-2.5">
                    {IconComp ? <IconComp size={15} className="text-e-sub shrink-0" /> : effect.icon ? <span className="text-base">{effect.icon}</span> : null}
                    <span className="flex-1 text-sm font-medium text-e-text">{effect.name}</span>
                    <span className="text-xs font-mono text-e-sub">{effect.durationTurns === -1 ? '∞' : `${effect.durationTurns}t`}</span>
                    <Button variant="danger" size="sm" disabled={removing === effect.id} onClick={() => handleRemove(effect.id)}>
                      {removing === effect.id ? '…' : 'Remover'}
                    </Button>
                  </div>
                );})}
              </div>
            </div>
          )}

          {/* Adicionar novo */}
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <p className={label}>Adicionar novo</p>
            <div>
              <label className={label}>Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Envenenado" required />
            </div>
            <div>
              <label className={label}>Ícone</label>
              <div className="grid grid-cols-9 gap-1.5">
                {STATUS_ICONS.map(({ name: iconName, Icon }) => (
                  <button key={iconName} type="button" title={iconName}
                    onClick={() => setIcon(icon === iconName ? '' : iconName)}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                      icon === iconName ? 'border-e-accent bg-e-accent/10 text-e-accent' : 'border-e-border hover:border-e-border2 text-e-faint hover:text-e-sub'
                    }`}>
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setPermanent((p) => !p)}>
                <Checkbox checked={permanent} onChange={setPermanent} />
                <span className="text-sm text-e-sub">Permanente</span>
              </label>
              {!permanent && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-e-sub shrink-0">Duração:</span>
                  <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="!w-20" min={1} />
                  <span className="text-sm text-e-faint">t</span>
                </div>
              )}
            </div>

            {/* Efeitos automáticos */}
            <div>
              <p className={label}>Efeitos automáticos</p>
              <EffectBuilder effects={effects} onChange={setEffects} />
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full" disabled={saving || !name.trim()}>
              {saving ? 'Aplicando…' : 'Aplicar Status Effect'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
