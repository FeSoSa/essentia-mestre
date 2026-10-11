'use client';

import { useEffect, useState } from 'react';
import { X, Bookmark, Save, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { genId } from '@/lib/id';
import { useStore, useFastAction, useActivePlayers } from '@/store';
import Button from '@/components/ui/Button';
import type { FastAction, FastActionOption, FastActionTemplate } from '@/store/types';

function OptionBuilder({
  options, onChange,
}: { options: FastActionOption[]; onChange: (o: FastActionOption[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2">
          <input type="color" value={opt.color}
            onChange={(e) => onChange(options.map((o) => o.id === opt.id ? { ...o, color: e.target.value } : o))}
            className="!w-10 shrink-0" />
          <input type="text" value={opt.text} placeholder="Texto da opção…"
            onChange={(e) => onChange(options.map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o))} />
          <button type="button" onClick={() => onChange(options.filter((o) => o.id !== opt.id))}
            className="text-e-faint hover:text-e-danger cursor-pointer transition-colors text-lg shrink-0">✕</button>
        </div>
      ))}
      <button type="button"
        onClick={() => onChange([...options, { id: genId(), text: '', color: '#a3e635' }])}
        className="py-2 rounded-xl border border-dashed border-e-border text-e-faint hover:border-e-border2 hover:text-e-sub text-sm transition-colors cursor-pointer">
        + Adicionar opção
      </button>
    </div>
  );
}

export default function AcaoRapidaModal({ onClose }: { onClose: () => void }) {
  const fastAction = useFastAction();
  const players = useActivePlayers();
  const { setFastAction } = useStore();
  const [title, setTitle] = useState('');
  const [lockOne, setLockOne] = useState(false);
  const [options, setOptions] = useState<FastActionOption[]>([]);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<FastActionTemplate[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    api.get<FastActionTemplate[]>('/fast-action-templates').then((r) => setTemplates(r.data)).catch(() => {});
  }, []);

  function applyTemplate(t: FastActionTemplate) {
    setTitle(t.title);
    setOptions(t.options.map((o) => ({ ...o, id: genId() })));
  }

  async function saveAsTemplate() {
    if (!title.trim() || options.length === 0) return;
    const name = window.prompt('Nome do template:', title);
    if (!name || !name.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await api.post<FastActionTemplate>('/fast-action-templates', { name: name.trim(), title, options });
      setTemplates((prev) => [...prev, res.data]);
    } catch {}
    finally { setSavingTemplate(false); }
  }

  async function deleteTemplate(id: string) {
    try {
      await api.delete(`/fast-action-templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  }

  async function handleSend(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || options.length === 0) return;
    setSending(true);
    try {
      const res = await api.put<FastAction>('/fast-action', {
        active: true, title, lockOnePerPlayer: lockOne,
        lockedPlayers: [], options, answers: {},
      });
      setFastAction(res.data);
      setTitle(''); setLockOne(false); setOptions([]);
    } catch {}
    finally { setSending(false); }
  }

  async function handleClose() {
    await api.delete('/fast-action').catch(() => {});
    setFastAction(null);
  }

  const votesFor = (id: string) =>
    fastAction ? Object.values(fastAction.answers).filter((oid) => oid === id).length : 0;
  const votersFor = (id: string) =>
    fastAction
      ? Object.entries(fastAction.answers)
          .filter(([, oid]) => oid === id)
          .map(([pid]) => players.find((p) => p.id === pid)?.char.name ?? pid)
      : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border shrink-0">
          <h3 className="font-semibold text-e-text">Ação Rápida</h3>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {fastAction ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1">Votação ativa</p>
                  <p className="text-lg font-semibold text-e-text">{fastAction.title}</p>
                </div>
                <Button variant="danger" size="sm" onClick={handleClose}>Encerrar</Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-e-card rounded-full overflow-hidden">
                  <div className="h-full bg-e-accent rounded-full transition-all duration-500"
                    style={{ width: `${players.length > 0 ? (Object.keys(fastAction.answers).length / players.length) * 100 : 0}%` }} />
                </div>
                <span className="text-sm text-e-sub tabular-nums shrink-0">
                  {Object.keys(fastAction.answers).length}/{players.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {fastAction.options.map((opt) => {
                  const votes = votesFor(opt.id);
                  const voters = votersFor(opt.id);
                  const pct = players.length > 0 ? (votes / players.length) * 100 : 0;
                  return (
                    <div key={opt.id} className="bg-e-card border border-e-border rounded-xl p-3.5 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: opt.color }} />
                        <span className="flex-1 font-medium text-e-text text-sm">{opt.text}</span>
                        <span className="text-xl font-black tabular-nums" style={{ color: opt.color }}>{votes}</span>
                      </div>
                      <div className="h-1.5 bg-e-surface rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: opt.color }} />
                      </div>
                      {voters.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {voters.map((name) => (
                            <span key={name} className="text-[11px] bg-e-surface border border-e-border rounded-full px-2 py-0.5 text-e-sub">{name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {templates.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-2 block">Templates salvos</label>
                  <div className="flex flex-col gap-1.5">
                    {templates.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 bg-e-card border border-e-border rounded-xl px-3 py-2">
                        <Bookmark size={13} className="text-e-faint shrink-0" />
                        <button type="button" onClick={() => applyTemplate(t)}
                          className="flex-1 text-left text-sm text-e-sub hover:text-e-text cursor-pointer transition-colors truncate">
                          {t.name}
                        </button>
                        <button type="button" onClick={() => deleteTemplate(t.id)}
                          className="text-e-faint hover:text-e-danger cursor-pointer transition-colors shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <form onSubmit={handleSend} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block">Título</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Qual caminho vocês seguem?" required />
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
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="lg" className="gap-1.5"
                    disabled={savingTemplate || !title.trim() || options.length === 0}
                    onClick={saveAsTemplate}>
                    <Save size={14} /> {savingTemplate ? 'Salvando…' : 'Salvar template'}
                  </Button>
                  <Button type="submit" variant="primary" size="lg" className="flex-1"
                    disabled={sending || !title.trim() || options.length === 0}>
                    {sending ? 'Enviando…' : 'Enviar para a Mesa'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

