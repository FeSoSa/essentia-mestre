'use client';

import { Fragment, useState } from 'react';
import { X, Save } from 'lucide-react';
import { api, mensagemErro } from '@/lib/api';
import Button from '@/components/ui/Button';
import { useMaestriaStore } from '@/lib/maestria';
import { useCombateStore } from '@/store/combateStore';
import type { MaestriaConfig, CombateConfig, TierRegra } from '@/store/types';
import { TabelaNiveis } from './MaestriaEditor';

type Aba = 'maestria' | 'combate';

function Num({ label, value, onChange, step = 1, min = 0, hint }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-e-faint">{label}</span>
      <input type="number" value={value} step={step} min={min} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-sm rounded-xl px-3 py-2 bg-e-bg border border-e-border text-e-text outline-none focus:border-e-border2 tabular-nums" />
      {hint && <span className="text-[10px] text-e-faint">{hint}</span>}
    </label>
  );
}

/** Regras gerais editáveis: maestria por grupo (tabela de níveis) e combate (crítico, ataque básico, tiers, desvio). */
export default function RegrasModal({ onClose }: { onClose: () => void }) {
  const [aba, setAba] = useState<Aba>('maestria');
  const [maestria, setMaestria] = useState<MaestriaConfig>(useMaestriaStore.getState().cfg);
  const [combate, setCombate] = useState<CombateConfig>(useCombateStore.getState().cfg);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setM = (p: Partial<MaestriaConfig>) => { setMaestria({ ...maestria, ...p }); setMsg(null); };
  const setC = (p: Partial<CombateConfig>) => { setCombate({ ...combate, ...p }); setMsg(null); };

  async function salvar() {
    setSalvando(true);
    try {
      if (aba === 'maestria') {
        const r = await api.put<MaestriaConfig>('/master/maestria-config', maestria);
        setMaestria(r.data); useMaestriaStore.getState().setCfg(r.data);
      } else {
        const r = await api.put<CombateConfig>('/master/combate-config', combate);
        setCombate(r.data); useCombateStore.getState().setCfg(r.data);
      }
      setMsg('Salvo.');
    } catch (e) {
      setMsg(mensagemErro(e, 'Erro ao salvar'));
    } finally { setSalvando(false); }
  }

  // Exemplo do crítico: base 24, mod 3, equilíbrio 6, d20 médio
  // Exemplo do tier 2 (equilíbrio da tabela), base 6, mod 3, d20 13: floor só no resultado final
  const eqEx = combate.tiers?.find((t) => t.tier === 2)?.equilibrio ?? 3.5;
  const normal = Math.floor(6 + (13 * 3) / eqEx + 1e-9);
  const crit = Math.floor(6 * combate.critMultBase + (13 * combate.critMultDado * 3) / eqEx + 1e-9);
  const setTier = (tier: number, patch: Partial<TierRegra>) =>
    setC({ tiers: (combate.tiers ?? []).map((t) => (t.tier === tier ? { ...t, ...patch } : t)) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-[640px] max-w-[95vw] max-h-[92vh] overflow-y-auto rounded-xl border border-e-border bg-e-surface text-e-text flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="font-bold text-base">Regras</h2>
            <p className="text-[11px] text-e-faint mt-0.5">Valem para todas as habilidades e jogadores</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-e-faint hover:text-e-text hover:bg-e-card cursor-pointer">
            <X size={14} />
          </button>
        </div>

        <div className="flex gap-1.5 px-5 pb-3 border-b border-e-border">
          {(['maestria', 'combate'] as Aba[]).map((a) => (
            <button key={a} type="button" onClick={() => { setAba(a); setMsg(null); }}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                aba === a ? 'bg-e-accent/20 border-e-accent text-e-accent' : 'bg-e-bg border-e-border text-e-faint hover:border-e-border2'}`}>
              {a === 'maestria' ? 'Maestria' : 'Combate'}
            </button>
          ))}
        </div>

        <div className="p-5 flex flex-col gap-5">
          {aba === 'maestria' ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Níveis de maestria</p>
                <TabelaNiveis niveis={maestria.niveis} onChange={(n) => setM({ niveis: n })} />
              </div>
              <p className="text-[11px] text-e-faint">
                A maestria é por grupo: todas as skills de uma categoria de arma (ou de uma Essência) compartilham o nível.
                Todo uso em combate conta (skills do grupo e, na arma, o ataque com ela). Arma só conta com proficiência. Ao bater os usos, o nível fica disponível e você confirma na ficha do jogador.
              </p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Num label="Crítico: base ×" value={combate.critMultBase} step={0.25} onChange={(v) => setC({ critMultBase: v })} />
                <Num label="Crítico: d20 ×" value={combate.critMultDado} step={0.25} onChange={(v) => setC({ critMultDado: v })} />
                <Num label="Ataque básico com proficiência" value={combate.equilibrioComProficiencia} step={0.5} min={0.5}
                  onChange={(v) => setC({ equilibrioComProficiencia: v })}
                  hint="Equilíbrio do ataque básico com arma em que o personagem tem proficiência." />
                <Num label="Ataque básico sem proficiência" value={combate.equilibrioSemProficiencia} step={0.5} min={0.5}
                  onChange={(v) => setC({ equilibrioSemProficiencia: v })}
                  hint="Desarmado ou com arma sem proficiência." />
                <Num label="ES ao acertar ataque básico" value={combate.esPorAcertoBasico} onChange={(v) => setC({ esPorAcertoBasico: v })}
                  hint="Essência que o jogador recupera quando você aprova o dano de um ataque básico." />
                <Num label="Desvios por combate" value={combate.desviosPorCombate} onChange={(v) => setC({ desviosPorCombate: v })} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint">Tiers de skill</p>
                <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center text-xs">
                  <span className="text-e-faint">Tier</span><span className="text-e-faint">Equilíbrio</span><span className="text-e-faint">Custo base</span>
                  {(combate.tiers ?? []).slice().sort((a, b) => a.tier - b.tier).map((t) => (
                    <Fragment key={t.tier}>
                      <span className="font-bold text-e-text px-2">{t.tier}</span>
                      <input type="number" step={0.5} min={0.5} value={t.equilibrio}
                        onChange={(e) => setTier(t.tier, { equilibrio: Number(e.target.value) })}
                        className="text-sm rounded-xl px-3 py-1.5 bg-e-bg border border-e-border text-e-text tabular-nums" />
                      <input type="number" min={0} value={t.custoBase}
                        onChange={(e) => setTier(t.tier, { custoBase: Number(e.target.value) })}
                        className="text-sm rounded-xl px-3 py-1.5 bg-e-bg border border-e-border text-e-text tabular-nums" />
                    </Fragment>
                  ))}
                </div>
                <p className="text-[11px] text-e-faint">O tier define o equilíbrio da fórmula e o custo mínimo de Fluxo. Não trava quem pode ter a skill.</p>
              </div>
              <div className="rounded-xl bg-e-bg/60 border border-e-border px-3 py-2.5 text-xs text-e-sub">
                Dano: floor(base + d20 × mod / equilíbrio). Crítico: floor(base × {combate.critMultBase} + d20 × {combate.critMultDado} × mod / equilíbrio). O arredondamento é só no final; a maestria multiplica depois.
                <br />Exemplo (Tier 2, base 6, mod 3, d20 13): normal <b className="text-e-text">{normal}</b>, crítico <b className="text-e-gold">{crit}</b>.
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 justify-end py-4 px-5 border-t border-e-border bg-e-surface">
          {msg && <span className="text-xs text-e-sub mr-auto">{msg}</span>}
          <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
          <Button variant="primary" size="sm" onClick={salvar} disabled={salvando}>
            <Save size={13} /> {salvando ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
