'use client';

import type { ReactNode } from 'react';
import { proxyUrl, normalizeGdriveUrl } from '@/lib/gdrive';

/** Cor da vida pela porcentagem restante. */
/** Fração de ES para o anel interno (null quando não há ES). */
export function fracEs(es?: number | null, max?: number | null): number | null {
  return max && max > 0 ? (es ?? 0) / max : null;
}

export function corVida(pct: number): string {
  return pct > 0.5 ? '#3dba72' : pct > 0.25 ? '#d4a84e' : '#e05050';
}

/** Cor da Essência (ES). */
export const COR_ES = '#4a9fe0';

/**
 * Retrato redondo com anéis de recurso: o de fora é a vida (cor muda com a porcentagem)
 * e o de dentro, opcional, é a Essência. Aceita imagem, emoji ou inicial.
 */
/** Cor do Escudo (PV temporário) no anel e nos selos. */
export const COR_ESCUDO = '#7dd3fc';

export function Avatar({ src, emoji, nome, pct, pctEs, escudo, size = 48, destaque, apagado }: {
  src?: string | null; emoji?: string; nome: string; pct?: number | null; pctEs?: number | null;
  /** Escudo em fração do PV máximo (0 a 0,25): arco azul-claro logo depois da vida, mais um selo. */
  escudo?: { frac: number; valor: number } | null;
  size?: number; destaque?: string; apagado?: boolean;
}) {
  const stroke = Math.max(3, Math.round(size / 14));
  const strokeEs = Math.max(2, stroke - 1);
  const temEs = pctEs != null;
  const r = size / 2 - stroke / 2;
  const rEs = r - stroke / 2 - 1.5 - strokeEs / 2;
  const anel = (raio: number, largura: number, frac: number, cor: string) => {
    const circ = 2 * Math.PI * raio;
    return (
      <>
        <circle cx={size / 2} cy={size / 2} r={raio} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={largura} />
        <circle cx={size / 2} cy={size / 2} r={raio} fill="none" stroke={cor} strokeWidth={largura}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.max(0, Math.min(1, frac)))} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 400ms ease' }} />
      </>
    );
  };
  const borda = temEs ? stroke + strokeEs + 3 : stroke + 2;
  const inner = size - borda * 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        {pct != null ? anel(r, stroke, pct, corVida(Math.max(0, Math.min(1, pct))))
          : <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />}
        {temEs && anel(rEs, strokeEs, pctEs!, COR_ES)}
        {escudo && escudo.valor > 0 && pct != null && (() => {
          // Arco do Escudo começa onde a vida termina, no mesmo anel, por cima
          const circ = 2 * Math.PI * r;
          const ini = Math.max(0, Math.min(1, pct)) * circ;
          const len = Math.max(0, Math.min(1, escudo.frac)) * circ;
          return (
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COR_ESCUDO} strokeWidth={stroke}
              strokeDasharray={`${len} ${circ}`} strokeDashoffset={-ini} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 400ms ease, stroke-dasharray 400ms ease' }} />
          );
        })()}
      </svg>
      <div className={`absolute rounded-full overflow-hidden flex items-center justify-center bg-[#1c1c20] ${apagado ? 'grayscale opacity-50' : ''}`}
        style={{ inset: borda, width: inner, height: inner, boxShadow: destaque ? `0 0 0 2px ${destaque}` : undefined }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proxyUrl(normalizeGdriveUrl(src))} alt={nome} className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        ) : emoji ? (
          <span style={{ fontSize: inner * 0.55 }} className="leading-none select-none">{emoji}</span>
        ) : (
          <span className="font-bold text-e-gold select-none" style={{ fontSize: inner * 0.42 }}>{nome[0]?.toUpperCase()}</span>
        )}
      </div>
      {escudo && escudo.valor > 0 && (
        <span title={`Escudo: ${escudo.valor} de PV temporário`}
          className="absolute -top-1 -right-1 rounded-full px-1 font-black tabular-nums leading-none border border-[#18181b] text-black"
          style={{ background: COR_ESCUDO, fontSize: Math.max(8, Math.round(size / 6)), paddingTop: 2, paddingBottom: 2 }}>
          +{escudo.valor}
        </span>
      )}
    </div>
  );
}

/** Escudo do jogador para o anel (fração do PV máximo e valor). */
export function escudoDe(p?: { escudo?: number; hp: { max: number } } | null): { frac: number; valor: number } | null {
  const valor = p?.escudo ?? 0;
  return valor > 0 && p && p.hp.max > 0 ? { frac: valor / p.hp.max, valor } : null;
}

/** Barra fina de recurso. */
export function Barra({ atual, max, cor, altura = 6, fundo = 'rgba(255,255,255,0.07)' }: {
  atual: number; max: number; cor: string; altura?: number; fundo?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0;
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: altura, background: fundo }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor, transition: 'width 400ms ease' }} />
    </div>
  );
}

/** Pílula pequena de informação (DEF, ES, nível…). */
export function Pilula({ children, cor = '#a1a1aa', title }: { children: ReactNode; cor?: string; title?: string }) {
  return (
    <span title={title} className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold tabular-nums whitespace-nowrap"
      style={{ color: cor, background: cor + '14', border: `1px solid ${cor}33` }}>
      {children}
    </span>
  );
}

/** Título de seção da Mesa. */
export function Secao({ titulo, contagem, acao, children, className = '' }: {
  titulo: string; contagem?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-2 min-h-7">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-e-sub">{titulo}</h2>
        {contagem != null && <span className="text-[11px] text-e-faint tabular-nums">{contagem}</span>}
        {acao && <div className="ml-auto flex items-center gap-1.5">{acao}</div>}
      </div>
      {children}
    </section>
  );
}

/** Botão de ação compacto com ícone (variante por intenção). */
export function Acao({ children, onClick, tom = 'neutro', disabled, title, className = '' }: {
  children: ReactNode; onClick?: () => void; tom?: 'neutro' | 'perigo' | 'sucesso' | 'destaque' | 'ouro';
  disabled?: boolean; title?: string; className?: string;
}) {
  const tons = {
    neutro:   'bg-white/[0.04] border-white/10 text-e-sub hover:text-e-text hover:bg-white/[0.08]',
    perigo:   'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20',
    sucesso:  'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20',
    destaque: 'bg-e-accent text-black border-transparent font-bold hover:bg-e-accent/90',
    ouro:     'bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/20',
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${tons[tom]} ${className}`}>
      {children}
    </button>
  );
}
