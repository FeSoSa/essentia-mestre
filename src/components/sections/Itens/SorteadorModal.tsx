'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Dices, Send, Check, SlidersHorizontal, RotateCcw, Users } from 'lucide-react';
import { api, mensagemErro } from '@/lib/api';
import { useActivePlayers } from '@/store';
import { divisorArma } from '@/store/combateStore';
import type { AchadoConfig, ClassKit, ItemCatalog } from '@/store/types';
import { RARITY_COLORS, RARITY_LABELS, RARITY_ORDER, rarityColor, type Rarity } from '@/lib/rarity';
import { siglaAtributo } from '@/lib/atributos';
import { ACHADO_PADRAO, TIPO_LABEL, chancesAchado, sortearAchado, type Achado, type Chances, type ResultadoSorteio, type TipoAchado } from '@/lib/achado';
import { Avatar } from '@/components/sections/MesaNova/ui';
import Button from '@/components/ui/Button';
import { ItemIcon } from './ItemCard';

const TIPOS: TipoAchado[] = ['qualquer', 'arma', 'armadura', 'acessorio', 'consumivel', 'material'];

const PLURAL: Record<Rarity, string> = {
  branco: 'comuns', verde: 'incomuns', azul: 'raros', roxo: 'épicos', amarelo: 'lendários', rosa: 'míticos',
};

// O aviso de troca de raridade vale para todos; na lista mostra o motivo próprio do item
const motivoPrincipal = (a: Achado) => a.motivos.find((m) => !m.startsWith('Saiu '));

/** Barra com a chance de cada raridade de um nível. */
function BarraChances({ pesos }: { pesos: Record<string, number> }) {
  const total = RARITY_ORDER.reduce((s, r) => s + (pesos[r] ?? 0), 0) || 1;
  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/5">
      {RARITY_ORDER.map((r) => (pesos[r] ?? 0) > 0 && (
        <div key={r} style={{ width: `${((pesos[r] ?? 0) / total) * 100}%`, background: RARITY_COLORS[r] }} />
      ))}
    </div>
  );
}

function Resumo({ item }: { item: ItemCatalog }) {
  const linhas: string[] = [];
  if (item.type === 'weapon' && item.damageBase != null)
    linhas.push(`Dano ${item.damageBase}${item.damageAttribute ? ` + d20×${item.damageAttribute.split('/').map(siglaAtributo).join('/')}/${divisorArma(item)}` : ''}`);
  if (item.damageReduction) linhas.push(`Reduz ${item.damageReduction} de dano${item.armorWeight ? ` · ${item.armorWeight}` : ''}`);
  const bonus = Object.entries(item.attributeBonus ?? {}).filter(([, v]) => v);
  return (
    <div className="flex flex-col gap-1.5 text-xs text-e-sub">
      {linhas.map((l) => <p key={l} className="font-mono text-e-text">{l}</p>)}
      {bonus.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {bonus.map(([k, v]) => <span key={k} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/[0.06] text-e-text">{siglaAtributo(k)} {v > 0 ? '+' : ''}{v}</span>)}
        </div>
      )}
      {item.desc && <p className="text-e-faint leading-snug line-clamp-3">{item.desc}</p>}
    </div>
  );
}

export default function SorteadorModal({ catalogo, onClose }: { catalogo: ItemCatalog[]; onClose: () => void }) {
  const players = useActivePlayers();
  const [aba, setAba] = useState<'sortear' | 'niveis'>('sortear');
  const [config, setConfig] = useState<AchadoConfig>(ACHADO_PADRAO);
  const [kits, setKits] = useState<ClassKit[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nivelId, setNivelId] = useState('comum');
  const [tipo, setTipo] = useState<TipoAchado>('qualquer');
  const [resultado, setResultado] = useState<ResultadoSorteio | null>(null);
  const [vazio, setVazio] = useState(false);
  const [entregando, setEntregando] = useState(false);
  const [entregue, setEntregue] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get<AchadoConfig>('/config/achado').then((r) => setConfig(r.data)).catch(() => {});
    api.get<ClassKit[]>('/master/kits').then((r) => setKits(r.data)).catch(() => {});
  }, []);

  const player = players.find((p) => p.id === playerId) ?? null;
  const nivel = config.niveis.find((n) => n.id === nivelId) ?? config.niveis[0];

  function sortear() {
    setEntregue(null); setErro(null);
    const r = sortearAchado({ catalogo, config, nivelId: nivel?.id ?? '', tipo, player, kits });
    setResultado(r);
    setVazio(!r);
  }

  /** Troca o escolhido por uma das alternativas. */
  function escolher(a: Achado) {
    if (!resultado) return;
    setEntregue(null);
    setResultado({ escolhido: a, alternativas: [resultado.escolhido, ...resultado.alternativas.filter((x) => x !== a)] });
  }

  // Sem jogador escolhido no sorteio, o mestre ainda pode entregar para qualquer um
  async function entregar(destino = player) {
    if (!destino || !resultado) return;
    setEntregando(true); setErro(null);
    const { item, qty } = resultado.escolhido;
    try {
      await api.post(`/master/players/${destino.id}/items`, { ...item, qty });
      setEntregue(`${qty > 1 ? `${qty}× ` : ''}${item.name} foi para ${destino.char.name}.`);
    } catch (e) { setErro(mensagemErro(e, 'Não deu para entregar')); }
    finally { setEntregando(false); }
  }

  const chip = (on: boolean) => `h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
    on ? 'border-e-accent/50 bg-e-accent/10 text-e-accent' : 'border-white/10 text-e-sub hover:text-e-text hover:bg-white/5'}`;
  const rotulo = 'text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint mb-2';

  const chances = useMemo(
    () => (player ? chancesAchado({ catalogo, config, nivelId: nivel?.id ?? '', tipo, player, kits }) : null),
    [catalogo, config, nivel, tipo, player, kits],
  );

  const e = resultado?.escolhido;
  const cor = e ? rarityColor(e.item.rarity) ?? '#e4e4e7' : '#e4e4e7';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(ev) => { if (ev.target === ev.currentTarget) onClose(); }}>
      <div className="w-full max-w-[1080px] max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-e-surface shadow-2xl text-e-text">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
          <span className="w-9 h-9 rounded-xl bg-e-accent/10 text-e-accent flex items-center justify-center"><Dices size={18} /></span>
          <div className="flex-1">
            <h2 className="font-bold">Sortear achado</h2>
            <p className="text-xs text-e-faint">O sistema escolhe um item do catálogo pensando em quem vai receber.</p>
          </div>
          <div className="flex gap-0.5 rounded-lg p-0.5 bg-white/[0.04] border border-white/[0.06]">
            {(['sortear', 'niveis'] as const).map((a) => (
              <button key={a} type="button" onClick={() => setAba(a)}
                className={`h-7 px-3 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${aba === a ? 'bg-white/10 text-e-text' : 'text-e-faint hover:text-e-text'}`}>
                {a === 'sortear' ? <><Dices size={12} /> Sortear</> : <><SlidersHorizontal size={12} /> Níveis</>}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer ml-1"><X size={18} /></button>
        </div>

        {aba === 'niveis' ? (
          <EditorNiveis config={config} onSalvo={setConfig} />
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-y-auto p-5 flex flex-col gap-5">
            <div>
              <p className={rotulo}>Para quem</p>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setPlayerId(null)} className={chip(playerId === null)}>
                  <Users size={13} /> Ninguém em especial
                </button>
                {players.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPlayerId(p.id)} className={`${chip(playerId === p.id)} pl-1`}>
                    <Avatar src={p.char.portraitUrl} nome={p.char.name} size={22} /> {p.char.name}
                    <span className="text-e-faint font-medium">{p.char.skillClass} · Nv {p.char.level}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-e-faint mt-2">
                {player ? 'Considera a classe, os atributos, o nível, o que ele já carrega e o estado de PV e ES.' : 'Sem jogador, o sorteio só segue a raridade e o tipo.'}
              </p>
            </div>

            <div>
              <p className={rotulo}>Nível do achado</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {config.niveis.map((n) => (
                  <button key={n.id} type="button" onClick={() => setNivelId(n.id)}
                    className={`rounded-xl border p-3 flex flex-col gap-2 text-left cursor-pointer transition-colors ${
                      nivelId === n.id ? 'border-e-accent/50 bg-e-accent/[0.07]' : 'border-white/10 hover:bg-white/[0.04]'}`}>
                    <span className={`text-sm font-bold ${nivelId === n.id ? 'text-e-accent' : 'text-e-text'}`}>{n.nome}</span>
                    <BarraChances pesos={n.pesos} />
                  </button>
                ))}
              </div>
              {nivel && (
                <p className="text-[11px] text-e-faint mt-2 flex flex-wrap gap-x-3">
                  {(() => {
                    const total = RARITY_ORDER.reduce((s, r) => s + (nivel.pesos[r] ?? 0), 0) || 1;
                    return RARITY_ORDER.filter((r) => (nivel.pesos[r] ?? 0) > 0).map((r) => (
                      <span key={r}><span style={{ color: RARITY_COLORS[r] }}>{RARITY_LABELS[r]}</span> {Math.round(((nivel.pesos[r] ?? 0) / total) * 100)}%</span>
                    ));
                  })()}
                </p>
              )}
            </div>

            <div>
              <p className={rotulo}>Tipo</p>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS.map((t) => <button key={t} type="button" onClick={() => setTipo(t)} className={chip(tipo === t)}>{TIPO_LABEL[t]}</button>)}
              </div>
            </div>

            <Button variant="primary" onClick={sortear} className="self-start">
              <Dices size={15} /> {resultado ? 'Sortear de novo' : 'Sortear'}
            </Button>

            {vazio && <p className="text-sm text-e-faint">Nenhum item do catálogo serve com essas escolhas. Tente outro tipo ou nível.</p>}

            {e && (
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border p-4 flex flex-col gap-3" style={{ borderColor: cor + '55', background: `linear-gradient(135deg, ${cor}12, transparent 60%)` }}>
                  <div className="flex items-start gap-3">
                    <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ color: cor, background: cor + '1a' }}>
                      <ItemIcon name={e.item.icon || 'Package'} size={24} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold leading-tight" style={{ color: cor }}>{e.qty > 1 && <span className="text-e-text">{e.qty}× </span>}{e.item.name}</p>
                      <p className="text-[11px] font-bold uppercase tracking-wider mt-1">
                        <span style={{ color: cor }}>{RARITY_LABELS[e.raridadeFinal as Rarity]}</span>
                        <span className="text-e-faint"> · {TIPO_LABEL[e.tipo]}</span>
                        {e.item.goldValue != null && <span className="text-amber-400"> · {e.item.goldValue} Tyd</span>}
                      </p>
                    </div>
                    {player && e.chance > 0 && (
                      <span className="text-[11px] text-e-faint text-right shrink-0" title="Chance deste item entre os candidatos da mesma raridade">
                        <span className="block text-sm font-bold text-e-text tabular-nums">{Math.round(e.chance * 100)}%</span>entre os {PLURAL[e.raridadeFinal]}
                      </span>
                    )}
                  </div>
                  <Resumo item={e.item} />
                  {e.motivos.length > 0 && (
                    <div className="pt-3 border-t border-white/[0.06]">
                      <p className={rotulo}>Por que este item</p>
                      <ul className="flex flex-col gap-1">
                        {e.motivos.map((m) => <li key={m} className="text-xs text-e-sub flex gap-2"><span className="text-e-accent">•</span>{m}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {player ? (
                      <Button variant="primary" size="sm" onClick={() => entregar()} disabled={entregando || !!entregue}>
                        {entregue ? <><Check size={14} /> Entregue</> : <><Send size={13} /> {entregando ? 'Entregando…' : `Entregar para ${player.char.name}`}</>}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entregue ? <span className="text-xs font-semibold text-e-accent flex items-center gap-1"><Check size={14} /> Entregue</span> : (
                          <>
                            <span className="text-xs text-e-faint">Entregar para</span>
                            {players.map((p) => (
                              <button key={p.id} type="button" disabled={entregando} onClick={() => entregar(p)}
                                title={`Entregar para ${p.char.name}`}
                                className="h-8 pl-1 pr-2.5 rounded-lg border border-white/10 text-xs font-semibold text-e-sub hover:text-e-accent hover:border-e-accent/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
                                <Avatar src={p.char.portraitUrl} nome={p.char.name} size={22} /> {p.char.name}
                              </button>
                            ))}
                            {players.length === 0 && <span className="text-xs text-e-faint">nenhum jogador ativo</span>}
                          </>
                        )}
                      </div>
                    )}
                    <Button variant="ghost" size="sm" onClick={sortear}><RotateCcw size={13} /> Outro</Button>
                    {entregue && <span className="text-xs text-e-accent">{entregue}</span>}
                    {erro && <span className="text-xs text-e-danger">{erro}</span>}
                  </div>
                </div>

                {resultado.alternativas.length > 0 && (
                  <div>
                    <p className={rotulo}>Outras opções da mesma raridade</p>
                    <div className="flex flex-col gap-1.5">
                      {resultado.alternativas.map((a) => {
                        const c = rarityColor(a.item.rarity) ?? '#e4e4e7';
                        return (
                          <button key={a.item.id} type="button" onClick={() => escolher(a)}
                            className="flex items-center gap-3 rounded-xl border border-white/[0.07] px-3 py-2 text-left hover:bg-white/[0.04] cursor-pointer">
                            <span style={{ color: c }}><ItemIcon name={a.item.icon || 'Package'} size={16} /></span>
                            <span className="flex-1 min-w-0">
                              <span className="text-sm font-semibold block truncate" style={{ color: c }}>{a.item.name}</span>
                              {motivoPrincipal(a) && <span className="text-[11px] text-e-faint block truncate">{motivoPrincipal(a)}</span>}
                            </span>
                            {player && <span className="text-xs text-e-faint tabular-nums">{Math.round(a.chance * 100)}%</span>}
                            <span className="text-[11px] font-semibold text-e-sub">Usar este</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <PainelChances chances={chances} nome={player?.char.name} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Edição das chances de cada nível e de cada tipo. */
function EditorNiveis({ config, onSalvo }: { config: AchadoConfig; onSalvo: (c: AchadoConfig) => void }) {
  const [rascunho, setRascunho] = useState<AchadoConfig>(config);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setPeso = (i: number, r: string, v: number) => setRascunho((c) => ({
    ...c, niveis: c.niveis.map((n, j) => (j === i ? { ...n, pesos: { ...n.pesos, [r]: Math.max(0, v) } } : n)),
  }));
  const setNome = (i: number, nome: string) => setRascunho((c) => ({ ...c, niveis: c.niveis.map((n, j) => (j === i ? { ...n, nome } : n)) }));
  const setTipo = (t: string, v: number) => setRascunho((c) => ({ ...c, pesosTipo: { ...c.pesosTipo, [t]: Math.max(0, v) } }));

  async function salvar() {
    setSalvando(true); setMsg(null);
    try {
      const r = await api.put<AchadoConfig>('/master/achado-config', rascunho);
      onSalvo(r.data); setMsg('Salvo.');
    } catch (e) { setMsg(mensagemErro(e, 'Não deu para salvar')); }
    finally { setSalvando(false); }
  }

  const num = { width: 54, padding: '4px 6px', fontSize: 13, textAlign: 'center' as const };
  const totalTipo = Object.values(rascunho.pesosTipo).reduce((s, v) => s + v, 0) || 1;

  return (
    <>
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        <div>
          <p className="text-sm text-e-sub mb-3">
            Cada número é o peso da raridade naquele nível. Não precisa somar 100: a chance é o peso dividido pela soma da linha.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-e-faint pb-2">Nível</th>
                  {RARITY_ORDER.map((r) => (
                    <th key={r} className="text-[10px] font-bold uppercase tracking-wider pb-2" style={{ color: RARITY_COLORS[r] }}>{RARITY_LABELS[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rascunho.niveis.map((n, i) => (
                  <tr key={n.id} className="border-t border-white/[0.05]">
                    <td className="py-2 pr-2">
                      <input type="text" value={n.nome} onChange={(e) => setNome(i, e.target.value)} style={{ width: 110, padding: '4px 8px', fontSize: 13 }} />
                      <div className="mt-1.5" style={{ width: 110 }}><BarraChances pesos={n.pesos} /></div>
                    </td>
                    {RARITY_ORDER.map((r) => (
                      <td key={r} className="py-2 text-center">
                        <input type="number" min={0} value={n.pesos[r] ?? 0} onChange={(e) => setPeso(i, r, Number(e.target.value))} style={num} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint mb-1">Quando o tipo é Qualquer</p>
          <p className="text-xs text-e-faint mb-3">Chance de cada tipo de item sair.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.keys(ACHADO_PADRAO.pesosTipo).map((t) => (
              <label key={t} className="flex flex-col gap-1">
                <span className="text-xs text-e-sub">{TIPO_LABEL[t as TipoAchado]}</span>
                <input type="number" min={0} value={rascunho.pesosTipo[t] ?? 0} onChange={(e) => setTipo(t, Number(e.target.value))} style={{ ...num, width: '100%' }} />
                <span className="text-[10px] text-e-faint">{Math.round(((rascunho.pesosTipo[t] ?? 0) / totalTipo) * 100)}%</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end px-5 py-4 border-t border-white/[0.06] shrink-0">
        {msg && <span className="text-xs text-e-sub mr-auto">{msg}</span>}
        <Button variant="ghost" size="sm" onClick={() => setRascunho(ACHADO_PADRAO)}>Voltar ao padrão</Button>
        <Button variant="primary" size="sm" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar níveis'}</Button>
      </div>
    </>
  );
}

const pct = (v: number) => (v >= 0.995 ? '100%' : v >= 0.1 ? `${Math.round(v * 100)}%` : v >= 0.001 ? `${(v * 100).toFixed(1).replace('.', ',')}%` : '<0,1%');

/** Chances reais do jogador escolhido: por raridade, por tipo e item a item. */
function PainelChances({ chances, nome }: { chances: Chances | null; nome?: string }) {
  const [todos, setTodos] = useState(false);
  const rotulo = 'text-[10px] font-bold uppercase tracking-[0.14em] text-e-faint mb-2';

  return (
    <aside className="overflow-y-auto p-5 border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-[#141417] flex flex-col gap-5">
      {!chances ? (
        <div className="flex flex-col items-center text-center gap-2 py-10 text-e-faint">
          <Users size={26} className="opacity-50" />
          <p className="text-sm">Escolha um jogador para ver as chances dele com esse nível e tipo.</p>
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-bold text-e-text">Chances de {nome}</p>
            <p className="text-[11px] text-e-faint mt-0.5">Mudam com o nível, o tipo e o que ele tem agora.</p>
          </div>

          <div>
            <p className={rotulo}>Raridade</p>
            <BarraChances pesos={Object.fromEntries(Object.entries(chances.porRaridade).map(([r, v]) => [r, Math.round((v ?? 0) * 1000)]))} />
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
              {RARITY_ORDER.filter((r) => (chances.porRaridade[r] ?? 0) > 0).map((r) => (
                <span key={r}><span style={{ color: RARITY_COLORS[r] }}>{RARITY_LABELS[r]}</span> <span className="text-e-sub tabular-nums">{pct(chances.porRaridade[r]!)}</span></span>
              ))}
            </div>
          </div>

          {Object.keys(chances.porTipo).length > 1 && (
            <div>
              <p className={rotulo}>Tipo</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                {Object.entries(chances.porTipo).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).map(([t, v]) => (
                  <span key={t} className="text-e-sub">{TIPO_LABEL[t as TipoAchado]} <span className="text-e-text tabular-nums">{pct(v ?? 0)}</span></span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className={rotulo}>Itens mais prováveis</p>
            {chances.itens.length === 0 ? (
              <p className="text-xs text-e-faint">Nenhum item serve com essas escolhas.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {(todos ? chances.itens : chances.itens.slice(0, 10)).map((c) => {
                  const cor = rarityColor(c.item.rarity) ?? '#e4e4e7';
                  const max = chances.itens[0].chance || 1;
                  return (
                    <div key={c.item.id} className="relative rounded-lg px-2.5 py-1.5 overflow-hidden" title={c.motivos.join('\n') || undefined}>
                      <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${(c.chance / max) * 100}%`, background: cor + '14' }} />
                      <div className="relative flex items-center gap-2">
                        <span style={{ color: cor }} className="shrink-0"><ItemIcon name={c.item.icon || 'Package'} size={13} /></span>
                        <span className="flex-1 min-w-0 text-xs font-semibold truncate" style={{ color: cor }}>{c.item.name}</span>
                        <span className="text-[11px] text-e-text tabular-nums shrink-0">{pct(c.chance)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {chances.itens.length > 10 && (
              <button type="button" onClick={() => setTodos((v) => !v)} className="mt-2 text-[11px] text-e-sub hover:text-e-text cursor-pointer">
                {todos ? 'Mostrar só os 10 primeiros' : `Ver todos (${chances.itens.length}); os outros ${chances.itens.length - 10} somam ${pct(chances.itens.slice(10).reduce((s, c) => s + c.chance, 0))}`}
              </button>
            )}
          </div>

          {chances.foraDoFiltro > 0 && (
            <p className="text-[11px] text-e-faint">
              {chances.foraDoFiltro} {chances.foraDoFiltro === 1 ? 'item ficou' : 'itens ficaram'} de fora: pedem nível maior ou ele já tem.
            </p>
          )}
        </>
      )}
    </aside>
  );
}
