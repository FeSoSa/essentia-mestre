'use client';

import { useEffect, useMemo, useState } from 'react';
import { Shuffle, X, Users, Shield, Swords, SlidersHorizontal, Sparkles, Loader2 } from 'lucide-react';
import { api, mensagemErro } from '@/lib/api';
import { proxyUrl, normalizeGdriveUrl } from '@/lib/gdrive';
import { useStore, useActivePlayers, useAllies } from '@/store';
import { useMesaStore } from '@/store/mesaStore';
import { useCombateStore } from '@/store/combateStore';
import type { EncontroConfig, EnemyTemplate } from '@/store/types';
import {
  COR_DIF, ENCONTRO_PADRAO, NOME_DIFICULDADE, normalizarEncontro, danoMedio, gerarEncontro, golpeFinal, instanciaDe, membroDeAliado, membroDeJogador,
  pvFinal, semInimigo, trocarInimigo, xpDe, xpPorForca, type Encontro, type OpcoesEncontro,
} from '@/lib/encontro';

const COR = { texto: '#e8d8d8', fraco: '#9a7070', borda: '#4a2a2a', fundo: '#2a1818', fundo2: '#1e1616', destaque: '#e05050' };

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Frase para o perigo (parte do PV do grupo que se perde em média). */
function descrever(perigo: number) {
  if (perigo < 0.2) return 'Arranhões. O grupo passa sem susto.';
  if (perigo < 0.45) return 'Luta de verdade: alguém sai machucado.';
  if (perigo < 0.7) return 'Pesado: é provável que alguém caia.';
  if (perigo < 0.85) return 'Mortal: gente vai cair e o grupo pode perder.';
  return 'Massacre: o grupo provavelmente cai.';
}

export default function GeradorEncontro({ onClose }: { onClose: () => void }) {
  const [fonte, setFonte] = useState<'bestiario' | 'inventado'>('bestiario');
  const [templates, setTemplates] = useState<EnemyTemplate[]>([]);
  const [config, setConfig] = useState<EncontroConfig>(ENCONTRO_PADRAO);
  const [modo, setModo] = useState<'um' | 'horda'>('um');
  const [difId, setDifId] = useState('medio');
  const [encontro, setEncontro] = useState<Encontro | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [vazio, setVazio] = useState(false);
  const [ajustando, setAjustando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const players = useActivePlayers();
  const allies = useAllies();
  const initiative = useStore((s) => s.initiative);
  const foraDoCombate = useMesaStore((s) => s.foraDoCombate);
  const cfgCombate = useCombateStore((s) => s.cfg);

  useEffect(() => {
    api.get<EnemyTemplate[]>('/enemies').then((r) => setTemplates(r.data)).catch(() => {});
    api.get<EncontroConfig>('/config/encontro').then((r) => setConfig(normalizarEncontro(r.data))).catch(() => {});
  }, []);

  // Quem enfrenta: com combate rolando, quem está na iniciativa; antes disso, quem está marcado no Grupo da Mesa
  const emCombate = initiative.length > 0;
  const grupo = useMemo(() => {
    const ids = new Set(initiative.map((e) => e.playerId));
    const js = players.filter((p) => p.hp.current > 0 && (emCombate ? ids.has(p.id) : !foraDoCombate.includes(p.id)));
    const als = allies.filter((a) => a.hpCurrent > 0 && (!emCombate || ids.has(a.id)));
    return [...js.map((p) => membroDeJogador(p, cfgCombate)), ...als.map(membroDeAliado)];
  }, [players, allies, initiative, emCombate, foraDoCombate, cfgCombate]);

  const dif = config.dificuldades.find((d) => d.id === difId) ?? config.dificuldades[0];
  const xpRef = useMemo(() => xpPorForca(templates), [templates]);
  const opcoes: OpcoesEncontro = {
    grupo, templates, fonte, modo, difId: dif?.id ?? 'medio', perigo: dif?.perigo ?? 35,
    hordaMax: config.hordaMax, crit: cfgCombate,
  };

  // A simulação leva um instante: deixa o botão mostrar que está calculando
  function calcular(f: () => Encontro | null) {
    setCalculando(true); setErro(null);
    setTimeout(() => {
      const e = f();
      setEncontro(e); setVazio(!e); setCalculando(false);
    }, 20);
  }

  async function adicionar() {
    if (!encontro) return;
    setAdicionando(true); setErro(null);
    try {
      for (const i of encontro.inimigos)
        await api.post('/combat/enemies', { ...(i.inventado ? {} : { templateId: i.template.id }), enemy: instanciaDe(i, xpRef) });
      onClose();
    } catch (e) { setErro(mensagemErro(e, 'Não deu para adicionar')); setAdicionando(false); }
  }

  const botao = (on: boolean, cor = COR.destaque) => ({
    background: on ? cor + '22' : COR.fundo, borderColor: on ? cor : COR.borda, color: on ? cor : COR.fraco,
  });
  const rotulo = 'text-[10px] font-bold uppercase tracking-[0.14em] mb-2';

  if (ajustando) {
    return <AjusteDificuldades config={config} onSalvo={(c) => { setConfig(normalizarEncontro(c)); setAjustando(false); }} onCancelar={() => setAjustando(false)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg p-1 self-start" style={{ background: COR.fundo }}>
        {([['bestiario', 'Do bestiário'], ['inventado', 'Criatura inventada']] as const).map(([f, l]) => (
          <button key={f} type="button" onClick={() => { setFonte(f); setEncontro(null); }}
            className="text-xs font-semibold px-3 py-1.5 rounded cursor-pointer"
            style={fonte === f ? { background: COR.fundo2, color: COR.texto } : { color: COR.fraco }}>
            {l}
          </button>
        ))}
      </div>

      {/* Contra quem */}
      <div className="rounded-lg border p-3" style={{ background: COR.fundo, borderColor: COR.borda }}>
        <p className={rotulo} style={{ color: COR.fraco }}>
          Contra quem <span className="normal-case tracking-normal font-medium">({emCombate ? 'quem está na iniciativa' : 'quem está marcado no Grupo da Mesa'})</span>
        </p>
        {grupo.length === 0 ? (
          <p className="text-xs" style={{ color: COR.fraco }}>Ninguém de pé no grupo. Marque jogadores no Grupo da Mesa ou coloque aliados em campo.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {grupo.map((m) => (
              <span key={m.id} className="text-xs px-2 py-1 rounded-md flex items-center gap-1.5" style={{ background: COR.fundo2 }}>
                {m.aliado ? <Shield size={11} style={{ color: '#3dba72' }} /> : <Users size={11} style={{ color: COR.fraco }} />}
                <span className="font-semibold" style={{ color: COR.texto }}>{m.nome}</span>
                <span style={{ color: COR.fraco }}>{m.pv} PV · ~{Math.round(danoMedio(m.golpe))} por golpe · DEF {m.def}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {([['um', 'Um só', fonte === 'inventado' ? 'Uma criatura feita na medida' : 'Um inimigo do tamanho da luta'],
           ['horda', 'Horda', `De 2 a ${config.hordaMax}, conforme o tamanho do grupo`]] as const).map(([m, l, d]) => (
          <button key={m} type="button" onClick={() => setModo(m)} className="rounded-lg border px-3 py-2 text-left cursor-pointer" style={botao(modo === m)}>
            <span className="text-sm font-semibold flex items-center gap-1.5">{m === 'um' ? <Swords size={13} /> : <Users size={13} />} {l}</span>
            <span className="text-[11px] block mt-0.5" style={{ color: COR.fraco }}>{d}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className={rotulo} style={{ color: COR.fraco }}>Dificuldade</p>
          <button type="button" onClick={() => setAjustando(true)} className="text-[11px] flex items-center gap-1 cursor-pointer hover:underline" style={{ color: COR.fraco }}>
            <SlidersHorizontal size={11} /> Ajustar
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {config.dificuldades.map((d) => (
            <button key={d.id} type="button" onClick={() => setDifId(d.id)}
              className="py-2 rounded-lg text-sm font-semibold border cursor-pointer" style={botao(difId === d.id, COR_DIF[d.id] ?? COR.destaque)}>
              {d.nome}
            </button>
          ))}
        </div>
        {dif && <p className="text-[11px] mt-1.5" style={{ color: COR.fraco }}>{descrever(dif.perigo / 100)} O grupo perde em média {dif.perigo}% do PV.</p>}
      </div>

      <button type="button" onClick={() => calcular(() => gerarEncontro(opcoes))}
        disabled={calculando || grupo.length === 0 || (fonte === 'bestiario' && templates.length === 0)}
        className="h-10 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        style={{ background: COR.destaque, color: '#fff' }}>
        {calculando ? <><Loader2 size={15} className="animate-spin" /> Simulando a luta…</> : <><Sparkles size={15} /> {encontro ? 'Gerar outro' : 'Gerar encontro'}</>}
      </button>

      {vazio && <p className="text-xs" style={{ color: COR.fraco }}>Não deu para montar o encontro com o bestiário atual.</p>}

      {encontro && (
        <div className="flex flex-col gap-2">
          <Resumo enc={encontro} xp={encontro.inimigos.reduce((s, i) => s + xpDe(i, xpRef), 0)} />
          {encontro.inimigos.map((i, idx) => {
            const t = i.template;
            const pv = pvFinal(i);
            const ajustado = i.escala !== 1;
            return (
              <div key={idx} className="flex items-center gap-3 rounded-lg border px-3 py-2" style={{ background: COR.fundo, borderColor: COR.borda }}>
                <span className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center text-2xl shrink-0" style={{ background: COR.fundo2 }}>
                  {t.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={proxyUrl(normalizeGdriveUrl(t.imageUrl))} alt="" className="w-full h-full object-cover" />
                    : t.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: COR.texto }}>
                    {t.name} <span className="font-normal text-xs" style={{ color: COR.fraco }}>{i.inventado ? 'inventado' : t.type}</span>
                    {t.dificuldade && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: (COR_DIF[t.dificuldade] ?? '#888') + '22', color: COR_DIF[t.dificuldade] }}>
                        {NOME_DIFICULDADE[t.dificuldade]}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px]" style={{ color: COR.fraco }}>
                    <span style={{ color: ajustado && !i.inventado ? '#d4a84e' : undefined }} title={ajustado && !i.inventado ? `No bestiário: ${t.hpMax} PV` : undefined}>
                      {pv} PV{ajustado && !i.inventado && ` (${i.escala > 1 ? '+' : ''}${Math.round((i.escala - 1) * 100)}%)`}
                    </span>
                    {' · '}DEF {t.defesa ?? t.attributes.defense} · ~{Math.round(danoMedio(golpeFinal(i)))} por golpe · {xpDe(i, xpRef)} XP
                  </p>
                </div>
                <button type="button" onClick={() => calcular(() => trocarInimigo(encontro, idx, opcoes))} title="Trocar por outro"
                  className="w-7 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-white/5" style={{ color: COR.fraco }}><Shuffle size={13} /></button>
                <button type="button" onClick={() => setEncontro(semInimigo(encontro, idx, opcoes))} title="Tirar do encontro"
                  className="w-7 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-white/5" style={{ color: COR.fraco }}><X size={13} /></button>
              </div>
            );
          })}
          {encontro.inimigos.some((i) => i.escala !== 1 && !i.inventado) && (
            <p className="text-[11px]" style={{ color: COR.fraco }}>PV em amarelo foi ajustado (até metade ou o dobro) para a luta caber na dificuldade; a XP acompanha.</p>
          )}
          <button type="button" onClick={adicionar} disabled={adicionando}
            className="h-10 rounded-lg font-bold text-sm cursor-pointer disabled:opacity-50 border"
            style={{ borderColor: COR.destaque, color: COR.destaque, background: COR.destaque + '15' }}>
            {adicionando ? 'Adicionando…' : `Adicionar ${encontro.inimigos.length > 1 ? `os ${encontro.inimigos.length}` : ''} ao combate`}
          </button>
          {erro && <p className="text-xs" style={{ color: COR.destaque }}>{erro}</p>}
        </div>
      )}
    </div>
  );
}

/** Resultado da simulação e onde a luta caiu em relação ao alvo. */
function Resumo({ enc, xp }: { enc: Encontro; xp: number }) {
  const { perigo, pAlguemCai, pGrupoCai, rodadas } = enc.sim;
  const longe = Math.abs(perigo - enc.alvo) > 0.12;
  return (
    <div className="rounded-lg border p-3 flex flex-col gap-2.5" style={{ background: COR.fundo2, borderColor: COR.borda }}>
      <div className="grid grid-cols-4 gap-2 text-center">
        {([
          ['PV perdido', pct(perigo)], ['Alguém cai', pct(pAlguemCai)], ['Grupo todo cai', pct(pGrupoCai)], ['Duração', `~${Math.max(1, Math.round(rodadas))} rod.`],
        ] as const).map(([l, v]) => (
          <div key={l}>
            <p className="text-lg font-black tabular-nums" style={{ color: COR.texto }}>{v}</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: COR.fraco }}>{l}</p>
          </div>
        ))}
      </div>
      <div className="relative h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #3aaa60, #d4a84e 35%, #e05050 60%, #a855f7 85%)' }}>
        <span className="absolute -top-1 w-0.5 h-4 bg-white/70 rounded" style={{ left: pct(enc.alvo) }} title="Alvo da dificuldade" />
        <span className="absolute w-3 h-3 -ml-1.5 rounded-full border-2 border-white" style={{ left: pct(Math.min(1, perigo)), top: -2, background: COR.fundo2 }} title="Este encontro" />
      </div>
      <p className="text-[11px]" style={{ color: COR.fraco }}>
        {descrever(perigo)} · {xp} XP no total · simulado 300 vezes
        {longe && <span style={{ color: '#d4a84e' }}> · ficou longe do alvo: o bestiário não tem inimigo que encaixe melhor</span>}
      </p>
    </div>
  );
}

function AjusteDificuldades({ config, onSalvo, onCancelar }: { config: EncontroConfig; onSalvo: (c: EncontroConfig) => void; onCancelar: () => void }) {
  const [c, setC] = useState(config);
  const [msg, setMsg] = useState<string | null>(null);

  async function salvar() {
    try { onSalvo((await api.put<EncontroConfig>('/master/encontro-config', c)).data); }
    catch (e) { setMsg(mensagemErro(e, 'Não deu para salvar')); }
  }

  const inp = { background: COR.fundo2, borderColor: COR.borda, color: COR.texto, padding: '4px 8px', fontSize: 13 };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold" style={{ color: COR.texto }}>Ajustar dificuldades</p>
      <p className="text-xs" style={{ color: COR.fraco }}>
        Perigo é quanto do PV do grupo se perde em média na luta simulada (100% quando o grupo todo cai).
        Em 85% quase sempre alguém cai e o grupo pode perder.
      </p>
      {c.dificuldades.map((d, i) => (
        <div key={d.id} className="grid grid-cols-[1fr_110px] gap-2 items-center">
          <input type="text" value={d.nome} style={inp}
            onChange={(e) => setC({ ...c, dificuldades: c.dificuldades.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} />
          <div className="flex items-center gap-1">
            <input type="number" min={1} max={100} value={d.perigo} style={inp}
              onChange={(e) => setC({ ...c, dificuldades: c.dificuldades.map((x, j) => (j === i ? { ...x, perigo: Number(e.target.value) } : x)) })} />
            <span className="text-xs" style={{ color: COR.fraco }}>%</span>
          </div>
        </div>
      ))}
      <label className="grid grid-cols-[1fr_110px] gap-2 items-center text-sm" style={{ color: COR.texto }}>
        Máximo de inimigos numa horda
        <input type="number" min={2} value={c.hordaMax} style={inp} onChange={(e) => setC({ ...c, hordaMax: Number(e.target.value) })} />
      </label>
      <div className="flex gap-2 justify-end items-center">
        {msg && <span className="text-xs mr-auto" style={{ color: COR.destaque }}>{msg}</span>}
        <button type="button" onClick={() => setC(ENCONTRO_PADRAO)} className="text-xs px-3 py-1.5 cursor-pointer" style={{ color: COR.fraco }}>Voltar ao padrão</button>
        <button type="button" onClick={onCancelar} className="text-xs px-3 py-1.5 rounded border cursor-pointer" style={{ borderColor: COR.borda, color: COR.fraco }}>Cancelar</button>
        <button type="button" onClick={salvar} className="text-xs px-3 py-1.5 rounded font-semibold cursor-pointer" style={{ background: COR.destaque, color: '#fff' }}>Salvar</button>
      </div>
    </div>
  );
}
