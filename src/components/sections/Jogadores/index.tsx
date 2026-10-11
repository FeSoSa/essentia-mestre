'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Star, RefreshCw, RotateCcw, Trash2, Copy, Check, ChevronDown, X, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore, usePlayers } from '@/store';
import Button from '@/components/ui/Button';
import SectionHeader, { Page } from '@/components/ui/SectionHeader';
import { Avatar, fracEs } from '@/components/sections/MesaNova/ui';
import type { Essencia, Player } from '@/store/types';
import CharacterModal from './CharacterModal';
import PlayerEssenciasModal from './PlayerEssenciasModal';

const XP_RAPIDO = [10, 25, 50, 100];

export default function Jogadores() {
  const players = usePlayers();
  const { setPlayers, removePlayer } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null);
  const editPlayer = editPlayerId ? (players.find(p => p.id === editPlayerId) ?? null) : null;
  const [expPlayerId, setExpPlayerId] = useState<string | null>(null);
  const expPlayer = expPlayerId ? players.find(p => p.id === expPlayerId) ?? null : null;
  const [expAmount, setExpAmount] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [verInativos, setVerInativos] = useState(false);
  // Essências e proficiências do jogador (nível de Essência e categorias de arma são definidos pelo mestre)
  const [essPlayerId, setEssPlayerId] = useState<string | null>(null);
  const essPlayer = essPlayerId ? players.find((p) => p.id === essPlayerId) ?? null : null;
  const [essencias, setEssencias] = useState<Essencia[]>([]);
  useEffect(() => {
    api.get<Player[]>('/master/players').then((r) => setPlayers(r.data)).catch(() => {});
    api.get<Essencia[]>('/master/essencias').then((r) => setEssencias(r.data)).catch(() => {});
  }, [setPlayers]);

  const ativos = players.filter((p) => p.active !== false);
  const inativos = players.filter((p) => p.active === false);

  async function handleDelete(p: Player) {
    if (!confirm(`Excluir ${p.char.name}? Isso não pode ser desfeito.`)) return;
    setDeleting(p.id);
    try { await api.delete(`/master/players/${p.id}`); removePlayer(p.id); } catch {}
    finally { setDeleting(null); }
  }

  async function handleToggleActive(p: Player) {
    setToggling(p.id);
    try {
      const res = await api.post<Player>(`/master/players/${p.id}/toggle-active`);
      setPlayers(players.map((pl) => (pl.id === p.id ? res.data : pl)));
    } catch {}
    finally { setToggling(null); }
  }

  async function handleExp(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!expPlayerId || expAmount <= 0) return;
    try { await api.put('/master/exp', { playerId: expPlayerId, amount: expAmount }); } catch {}
    finally { setExpPlayerId(null); setExpAmount(0); }
  }

  const card = (p: Player) => (
    <PlayerRow key={p.id} p={p}
      onExp={() => { setExpAmount(0); setExpPlayerId(p.id); }}
      onEdit={() => setEditPlayerId(p.id)}
      onEssencias={() => setEssPlayerId(p.id)}
      onToggle={() => handleToggleActive(p)} toggling={toggling === p.id}
      onDelete={() => handleDelete(p)} deleting={deleting === p.id} />
  );

  return (
    <Page>
      <SectionHeader
        title="Jogadores"
        count={players.length}
        subtitle="Personagens da campanha. Só os ativos aparecem na Mesa e no Inventário."
        action={<Button variant="primary" onClick={() => setShowCreate(true)}><Plus size={15} /> Novo personagem</Button>}
      />

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
          <p className="text-e-sub text-sm">Nenhum personagem cadastrado ainda.</p>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Criar o primeiro</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-e-sub">
              Na campanha <span className="text-e-faint tabular-nums ml-1">{ativos.length}</span>
            </h2>
            {ativos.length === 0
              ? <p className="text-sm text-e-faint py-6">Nenhum jogador ativo. Ative alguém da lista abaixo.</p>
              : ativos.map(card)}
          </section>

          {inativos.length > 0 && (
            <section className="flex flex-col gap-2">
              <button type="button" onClick={() => setVerInativos((v) => !v)}
                className="self-start flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-e-faint hover:text-e-sub cursor-pointer">
                <ChevronDown size={13} className={`transition-transform ${verInativos ? '' : '-rotate-90'}`} />
                Inativos <span className="tabular-nums">{inativos.length}</span>
              </button>
              {verInativos && inativos.map(card)}
            </section>
          )}
        </div>
      )}

      {expPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setExpPlayerId(null); }}>
          <form onSubmit={handleExp} className="bg-e-surface border border-e-border rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-e-text">Dar XP</h3>
                <p className="text-xs text-e-faint mt-0.5">{expPlayer.char.name} · {expPlayer.exp.total} XP · Nv {expPlayer.char.level}</p>
              </div>
              <button type="button" onClick={() => setExpPlayerId(null)} className="text-e-faint hover:text-e-sub cursor-pointer"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {XP_RAPIDO.map((n) => (
                <button key={n} type="button" onClick={() => setExpAmount((v) => v + n)}
                  className="h-9 rounded-lg border border-e-gold/25 bg-e-gold/5 text-e-gold text-sm font-semibold hover:bg-e-gold/15 cursor-pointer">
                  +{n}
                </button>
              ))}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block">Quantidade</label>
              <input type="number" autoFocus value={expAmount || ''} placeholder="0" onChange={(e) => setExpAmount(Number(e.target.value))} min={1} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="ghost" className="w-full" onClick={() => setExpPlayerId(null)}>Cancelar</Button>
              <Button type="submit" variant="gold" className="w-full" disabled={expAmount <= 0}>Dar {expAmount > 0 ? expAmount : ''} XP</Button>
            </div>
          </form>
        </div>
      )}

      {showCreate && <CharacterModal onClose={() => setShowCreate(false)} />}
      {essPlayer && <PlayerEssenciasModal player={essPlayer} essencias={essencias} onClose={() => setEssPlayerId(null)} />}
      {editPlayer && <CharacterModal player={editPlayer} onClose={() => setEditPlayerId(null)} />}
    </Page>
  );
}

function PlayerRow({ p, onExp, onEdit, onEssencias, onToggle, toggling, onDelete, deleting }: {
  p: Player; onExp: () => void; onEdit: () => void; onEssencias: () => void; onToggle: () => void; toggling: boolean; onDelete: () => void; deleting: boolean;
}) {
  const ativo = p.active !== false;
  const [copiado, setCopiado] = useState(false);
  const pct = p.hp.max > 0 ? p.hp.current / p.hp.max : 0;

  function copiar() {
    navigator.clipboard?.writeText(p.code).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1200); }).catch(() => {});
  }

  const icone = 'w-8 h-8 rounded-lg flex items-center justify-center text-e-faint hover:text-e-text hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40';

  return (
    <div className={`group flex items-center gap-4 rounded-2xl border px-4 py-3 transition-colors ${
      ativo ? 'bg-e-surface border-white/[0.07] hover:border-white/15' : 'bg-transparent border-white/[0.05]'}`}>
      <button type="button" onClick={onEdit} className="flex items-center gap-3.5 flex-1 min-w-0 text-left cursor-pointer">
        <Avatar src={p.char.portraitUrl} nome={p.char.name} pct={ativo ? pct : null} pctEs={ativo ? fracEs(p.flow.current, p.flow.max) : null} size={44} apagado={!ativo} />
        <div className="min-w-0">
          <p className={`font-semibold truncate ${ativo ? 'text-e-text' : 'text-e-sub'}`}>{p.char.name}</p>
          <p className="text-xs text-e-faint mt-0.5 truncate">
            {p.char.race} · {p.char.skillClass} · <span className="text-e-sub">Nv {p.char.level}</span>
            {ativo && <> · <span className="tabular-nums">{p.hp.current}/{p.hp.max} PV</span></>}
          </p>
        </div>
      </button>

      <button type="button" onClick={copiar} title="Código de acesso do jogador. Clique para copiar."
        className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/[0.08] text-xs font-mono text-e-sub hover:text-e-text hover:border-white/20 cursor-pointer">
        {p.code}
        {copiado ? <Check size={12} className="text-e-accent" /> : <Copy size={12} className="opacity-50" />}
      </button>

      <button type="button" onClick={onToggle} disabled={toggling}
        title={ativo ? 'Tirar da campanha (some da Mesa)' : 'Trazer de volta para a campanha'}
        className={`h-8 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 ${
          ativo ? 'border-e-accent/30 text-e-accent bg-e-accent/[0.06] hover:bg-e-accent/15' : 'border-white/10 text-e-faint hover:text-e-text hover:bg-white/5'}`}>
        {toggling ? '…' : ativo ? 'Ativo' : 'Ativar'}
      </button>

      <div className="flex items-center gap-0.5 shrink-0">
        <button type="button" onClick={onExp} title="Dar XP" className={`${icone} hover:!text-e-gold`}><Star size={15} /></button>
        <button type="button" onClick={onEdit} title="Editar personagem" className={icone}><Pencil size={15} /></button>
        <button type="button" onClick={onEssencias} title="Essências e proficiências"
          className={`${icone} ${p.essencia && p.essencia.excedente > 0 ? '!text-red-400' : ''}`}>
          <Sparkles size={15} />
        </button>
        <button type="button" title="Recalcular PV, ES e Éter a partir dos atributos" className={icone}
          onClick={async () => { try { await api.post(`/master/players/${p.id}/recalculate`); } catch {} }}>
          <RefreshCw size={15} />
        </button>
        <button type="button" title="Voltar os atributos ao inicial do kit" className={icone}
          onClick={async () => {
            if (!confirm(`Voltar os atributos de ${p.char.name} ao inicial do kit?`)) return;
            try { await api.post(`/master/players/${p.id}/reset-attributes`); } catch {}
          }}>
          <RotateCcw size={15} />
        </button>
        <button type="button" onClick={onDelete} disabled={deleting} title="Excluir personagem"
          className={`${icone} hover:!text-e-danger hover:!bg-e-danger/10 opacity-0 group-hover:opacity-100 focus:opacity-100`}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
