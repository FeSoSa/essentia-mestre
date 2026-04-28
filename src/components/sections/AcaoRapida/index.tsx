'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useStore, useFastAction, usePlayers } from '@/store';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import type { FastAction, FastActionOption } from '@/store/types';
import OptionBuilder from './OptionBuilder';

export default function AcaoRapida() {
  const fastAction = useFastAction();
  const players = usePlayers();
  const { setFastAction } = useStore();
  const [title, setTitle] = useState('');
  const [lockOne, setLockOne] = useState(false);
  const [options, setOptions] = useState<FastActionOption[]>([]);
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || options.length === 0) return;
    setSending(true);
    try {
      const payload: FastAction = {
        active: true, title, lockOnePerPlayer: lockOne,
        lockedPlayers: [], options, answers: {},
      };
      const res = await api.put<FastAction>('/fast-action', payload);
      setFastAction(res.data);
      setTitle(''); setLockOne(false); setOptions([]);
    } catch {}
    finally { setSending(false); }
  }

  async function handleClose() {
    await api.delete('/fast-action').catch(() => {});
    setFastAction(null);
  }

  // Agrupa respostas por opção
  function answersForOption(optionId: string): string[] {
    if (!fastAction) return [];
    return Object.entries(fastAction.answers)
      .filter(([, oid]) => oid === optionId)
      .map(([pid]) => players.find((p) => p.id === pid)?.char.name ?? pid);
  }

  const totalAnswers = fastAction ? Object.keys(fastAction.answers).length : 0;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <SectionHeader title="Ação Rápida" subtitle="Envie opções para os jogadores responderem" />

      {fastAction ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4 p-5 bg-e-surface border border-e-border rounded-xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5">Votação ativa</p>
              <p className="text-xl font-semibold text-e-text">{fastAction.title}</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleClose}>Encerrar</Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-e-card rounded-full overflow-hidden">
              <div className="h-full bg-e-accent rounded-full transition-all duration-500"
                style={{ width: `${players.length > 0 ? (totalAnswers / players.length) * 100 : 0}%` }} />
            </div>
            <span className="text-sm text-e-sub tabular-nums shrink-0">{totalAnswers}/{players.length} votos</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {fastAction.options.map((opt) => {
              const voters = answersForOption(opt.id);
              const pct = players.length > 0 ? (voters.length / players.length) * 100 : 0;
              return (
                <div key={opt.id} className="bg-e-surface border border-e-border rounded-xl p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: opt.color }} />
                    <span className="flex-1 font-medium text-e-text">{opt.text}</span>
                    <span className="text-2xl font-black tabular-nums" style={{ color: opt.color }}>{voters.length}</span>
                  </div>
                  <div className="h-1.5 bg-e-card rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: opt.color }} />
                  </div>
                  {voters.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {voters.map((name) => (
                        <span key={name} className="text-xs bg-e-card border border-e-border rounded-full px-2.5 py-1 text-e-sub">{name}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block">Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Qual caminho vocês seguem?" required />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button type="button" onClick={() => setLockOne(!lockOne)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer border-0 ${lockOne ? 'bg-e-accent' : 'bg-e-card border border-e-border'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${lockOne ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-e-sub">Uma resposta por jogador</span>
          </label>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-2 block">Opções</label>
            <OptionBuilder options={options} onChange={setOptions} />
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={sending || !title.trim() || options.length === 0} className="w-full">
            {sending ? 'Enviando…' : 'Enviar para a Mesa'}
          </Button>
        </form>
      )}
    </div>
  );
}
