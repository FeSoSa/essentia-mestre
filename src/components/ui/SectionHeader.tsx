interface Props {
  title: string;
  subtitle?: string;
  /** Total exibido ao lado do título (ex.: quantidade de itens no catálogo). */
  count?: number;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, count, action }: Props) {
  return (
    <div className="flex items-end justify-between gap-6 mb-6 pb-5 border-b border-white/[0.06]">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-e-text tracking-tight flex items-baseline gap-2.5">
          {title}
          {count != null && <span className="text-sm font-semibold text-e-faint tabular-nums">{count}</span>}
        </h1>
        {subtitle && <p className="text-sm text-e-sub mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}

/** Moldura padrão das seções: mesma largura e respiro em todas as telas. */
export function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-8 py-7 max-w-[1320px] mx-auto w-full ${className}`}>{children}</div>;
}
