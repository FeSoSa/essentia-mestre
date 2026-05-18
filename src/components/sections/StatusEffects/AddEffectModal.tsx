'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import type { AutoEffect, Player } from '@/store/types';
import { STATUS_ICONS } from '@/lib/statusIcons';
import EffectBuilder from './EffectBuilder';

export default function AddEffectModal({ playerId, onClose }: { playerId: string; onClose: () => void }) {
  const { setPlayer } = useStore();
  const [name, setName]           = useState('');
  const [icon, setIcon]           = useState('');
  const [duration, setDuration]   = useState(3);
  const [permanent, setPermanent] = useState(false);
  const [effects, setEffects]     = useState<AutoEffect[]>([]);
  const [saving, setSaving]       = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      // POST /api/master/status-effect com { playerId, effect }
      const res = await api.post<Player>('/master/status-effect', {
        playerId,
        effect: {
          name,
          icon: icon || undefined,
          desc: '',
          durationTurns: permanent ? -1 : duration,
          effects,
        },
      });
      setPlayer(res.data);
      onClose();
    } catch {}
    finally { setSaving(false); }
  }

  const label = "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <h3 className="font-semibold text-e-text">Adicionar Status Effect</h3>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-5 flex-1">
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
                <span className="text-sm text-e-faint">turnos</span>
              </div>
            )}
          </div>

          <div>
            <label className={label}>Efeitos automáticos</label>
            <EffectBuilder effects={effects} onChange={setEffects} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-e-border mt-1">
            <Button type="button" variant="ghost"   size="md" className="w-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={saving}>
              {saving ? 'Aplicando…' : 'Aplicar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
