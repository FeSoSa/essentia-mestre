'use client';

import { useMemo, useState } from 'react';
import { Star, RotateCcw, Coins, Package, X, Dices, Skull } from 'lucide-react';
import { api } from '@/lib/api';
import type { EnemyInstance, Player } from '@/store/types';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import { ItemIcon } from '@/components/sections/Itens/ItemCard';

interface Props {
  enemy: EnemyInstance;
  players: Player[];
  onClose: () => void;
}

type ModoXp = 'all' | 'specific' | 'none';

function sortearOuro(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Botões de escolha (segmentado). */
function Segmento<T extends string>({ valor, opcoes, onChange }: { valor: T; opcoes: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-e-bg border border-e-border">
      {opcoes.map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            valor === v ? 'bg-e-accent/15 text-e-accent' : 'text-e-faint hover:text-e-text'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Escolher um jogador. */
function Jogadores({ players, valor, onChange, cor = 'accent' }: { players: Player[]; valor: string; onChange: (id: string) => void; cor?: 'accent' | 'gold' }) {
  const ativo = cor === 'gold' ? 'border-e-gold bg-e-gold/10 text-e-gold' : 'border-e-accent bg-e-accent/10 text-e-accent';
  return (
    <div className="flex flex-wrap gap-1.5">
      {players.map((p) => (
        <button key={p.id} type="button" onClick={() => onChange(p.id)}
          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
            valor === p.id ? ativo : 'border-e-border text-e-sub hover:border-e-border2 hover:text-e-text'}`}>
          {p.char.name}
        </button>
      ))}
    </div>
  );
}

export default function DefeatModal({ enemy, players, onClose }: Props) {
  const itemDrops = enemy.drops.map((d, i) => ({ drop: d, idx: i })).filter(({ drop }) => !drop.goldDrop);
  const goldDrop  = enemy.drops.find((d) => d.goldDrop)?.goldDrop ?? null;

  // Itens que já vêm com dono marcado no inimigo começam selecionados
  const [selecionados, setSelecionados] = useState<Set<number>>(
    () => new Set(itemDrops.filter(({ drop }) => drop.targetPlayerId).map(({ idx }) => idx)),
  );
  const [donos, setDonos] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    itemDrops.forEach(({ drop, idx }) => { if (drop.targetPlayerId) init[idx] = drop.targetPlayerId; });
    return init;
  });
  const [ouro, setOuro] = useState(() => (goldDrop ? sortearOuro(goldDrop.min, goldDrop.max) : 0));
  const [modoOuro, setModoOuro] = useState<'todos' | 'um' | 'none'>('todos');
  const ouroDividir = modoOuro === 'todos';
  const [ouroDono, setOuroDono] = useState('');
  const [modoXp, setModoXp] = useState<ModoXp>('all');
  const [xpDono, setXpDono] = useState('');
  const [xp, setXp] = useState(String(enemy.xp));
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternarItem(i: number) {
    setSelecionados((prev) => {
      const prox = new Set(prev);
      if (prox.has(i)) prox.delete(i); else prox.add(i);
      return prox;
    });
  }

  const xpNum = parseInt(xp) || 0;
  const nome = (id: string) => players.find((p) => p.id === id)?.char.name ?? '';

  // O que falta escolher antes de confirmar
  const pendencias = useMemo(() => {
    const p: string[] = [];
    if (modoXp === 'specific' && !xpDono) p.push('quem ganha o XP');
    if (goldDrop && modoOuro === 'um' && !ouroDono) p.push('quem fica com o ouro');
    if ([...selecionados].some((i) => !donos[i])) p.push('o dono de cada item marcado');
    return p;
  }, [modoXp, xpDono, goldDrop, modoOuro, ouroDono, selecionados, donos]);

  // Resumo do que vai ser entregue
  const resumo = [
    enemy.xp > 0 && modoXp !== 'none' && xpNum > 0
      ? modoXp === 'all' ? `${xpNum} XP para cada jogador` : xpDono ? `${xpNum} XP para ${nome(xpDono)}` : null
      : null,
    goldDrop && modoOuro !== 'none' && ouro > 0
      ? ouroDividir ? `${ouro} Tyd divididos entre todos` : ouroDono ? `${ouro} Tyd para ${nome(ouroDono)}` : null
      : null,
    selecionados.size > 0 ? `${selecionados.size} ite${selecionados.size > 1 ? 'ns' : 'm'}` : null,
  ].filter(Boolean).join(' · ');

  async function confirmar() {
    setCarregando(true);
    setErro(null);
    try {
      await api.post(`/combat/enemies/${enemy.instanceId}/defeat`, {
        drops: [...selecionados].map((i) => ({
          itemName: enemy.drops[i].name,
          icon: enemy.drops[i].icon,
          itemId: enemy.drops[i].itemId ?? null,
          playerId: donos[i] ?? '',
        })),
        goldDrop: goldDrop && modoOuro !== 'none' ? { amount: ouro, distribute: ouroDividir, playerId: ouroDividir ? '' : ouroDono } : null,
        distributeXp: modoXp === 'all',
        xpPlayerId: modoXp === 'specific' ? xpDono : null,
        xpAmount: modoXp !== 'none' ? xpNum : 0,
      });
      onClose();
    } catch {
      setErro('Não deu para confirmar a derrota. Tente de novo.');
      setCarregando(false);
    }
  }

  const lbl = 'text-[10px] font-bold uppercase tracking-widest text-e-faint';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !carregando) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Topo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-e-border shrink-0">
          <div className="w-10 h-10 rounded-xl bg-e-danger/10 border border-e-danger/30 flex items-center justify-center text-lg shrink-0">
            {enemy.icon || <Skull size={18} className="text-e-danger" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-e-text truncate">Derrotar {enemy.name}</h3>
            <p className="text-xs text-e-faint">Escolha o que cada jogador recebe</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" disabled={carregando}
            className="text-e-faint hover:text-e-text cursor-pointer p-1 rounded-lg hover:bg-e-card transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex flex-col gap-4">

          {/* XP */}
          <section className="rounded-xl bg-e-card border border-e-border p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-emerald-400" />
              <span className={lbl}>Experiência</span>
              {enemy.xp > 0 && <span className="ml-auto text-xs text-e-faint">padrão do inimigo: {enemy.xp}</span>}
            </div>
            {enemy.xp === 0 ? (
              <p className="text-xs text-e-faint">Este inimigo não tem XP configurado.</p>
            ) : (
              <>
                <Segmento<ModoXp> valor={modoXp} onChange={setModoXp}
                  opcoes={[['all', 'Todos os jogadores'], ['specific', 'Um jogador'], ['none', 'Ninguém']]} />
                {modoXp === 'specific' && <Jogadores players={players} valor={xpDono} onChange={setXpDono} />}
                {modoXp !== 'none' && (
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} value={xp} onChange={(e) => setXp(e.target.value)} aria-label="Quantidade de XP"
                      className="!w-24 !text-center !text-sm !font-bold tabular-nums" />
                    <span className="text-xs text-e-sub">{modoXp === 'all' ? 'XP para cada um' : 'XP'}</span>
                    {xpNum !== enemy.xp && (
                      <button type="button" onClick={() => setXp(String(enemy.xp))}
                        className="ml-auto flex items-center gap-1 text-xs text-e-faint hover:text-e-text cursor-pointer">
                        <RotateCcw size={11} /> voltar para {enemy.xp}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Ouro */}
          {goldDrop && (
            <section className="rounded-xl bg-e-card border border-e-border p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-e-gold" />
                <span className={lbl}>Ouro</span>
                <span className="ml-auto text-xs text-e-faint">sorteio de {goldDrop.min} a {goldDrop.max} ({goldDrop.tier})</span>
              </div>
              <Segmento<'todos' | 'um' | 'none'> valor={modoOuro} onChange={setModoOuro}
                opcoes={[['todos', 'Dividir entre todos'], ['um', 'Um jogador'], ['none', 'Ninguém']]} />
              {modoOuro !== 'none' && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-e-gold tabular-nums">{ouro}</span>
                  <span className="text-xs text-e-sub">Tyd sorteados</span>
                  <button type="button" onClick={() => setOuro(sortearOuro(goldDrop.min, goldDrop.max))}
                    className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-e-sub hover:text-e-text border border-e-border hover:border-e-border2 rounded-lg px-2.5 py-1.5 cursor-pointer">
                    <Dices size={13} /> Sortear de novo
                  </button>
                </div>
              )}
              {modoOuro === 'um' && <Jogadores players={players} valor={ouroDono} onChange={setOuroDono} cor="gold" />}
            </section>
          )}

          {/* Itens */}
          {itemDrops.length > 0 && (
            <section className="rounded-xl bg-e-card border border-e-border p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-e-accent" />
                <span className={lbl}>Itens que caíram</span>
                <span className="ml-auto text-xs text-e-faint">marque os que vão ser entregues</span>
              </div>
              {itemDrops.map(({ drop, idx }) => {
                const marcado = selecionados.has(idx);
                return (
                  <div key={idx} className={`rounded-lg border p-2.5 flex flex-col gap-2 transition-colors ${
                    marcado ? (donos[idx] ? 'border-e-accent/40 bg-e-accent/5' : 'border-e-gold/50 bg-e-gold/5') : 'border-e-border'}`}>
                    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => alternarItem(idx)}>
                      <Checkbox checked={marcado} onChange={() => alternarItem(idx)} />
                      <span className="text-e-sub"><ItemIcon name={drop.icon || 'Package'} size={14} /></span>
                      <span className="flex-1 text-sm text-e-text">{drop.name}</span>
                      {marcado && !donos[idx] && <span className="text-[10px] font-semibold text-e-gold">escolha o dono</span>}
                    </div>
                    {marcado && (
                      <div className="pl-7">
                        <Jogadores players={players} valor={donos[idx] ?? ''} onChange={(id) => setDonos((d) => ({ ...d, [idx]: id }))} />
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </div>

        {/* Rodapé: resumo + confirmar */}
        <div className="px-5 py-4 border-t border-e-border shrink-0 flex flex-col gap-2.5">
          <p className="text-xs text-e-sub">
            {pendencias.length > 0
              ? <span className="text-e-gold">Falta escolher {pendencias.join(', ')}.</span>
              : resumo ? <>Vai entregar: <span className="text-e-text">{resumo}</span></> : 'Nada será entregue, só remove o inimigo.'}
          </p>
          {erro && <p className="text-xs text-e-danger">{erro}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="md" onClick={onClose} disabled={carregando}>Cancelar</Button>
            <Button variant="danger" size="md" onClick={confirmar} disabled={carregando || pendencias.length > 0}>
              {carregando ? 'Confirmando…' : 'Derrotar e entregar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
