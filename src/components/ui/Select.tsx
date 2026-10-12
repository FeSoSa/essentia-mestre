'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Plus, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  /**
   * `field` (padrão) é um campo de escolha; `action` é um botão de "+ Adicionar"
   * que abre a lista e não guarda valor.
   */
  variant?: 'field' | 'action';
}

const ALTURA_MAX = 280;
/** Com mais opções que isso, a lista ganha um campo de busca. */
const BUSCA_A_PARTIR = 8;

export default function Select({ value, onChange, options, placeholder = 'Selecionar…', className = '', variant = 'field' }: Props) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number; acima: boolean } | null>(null);
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const temBusca = options.length > BUSCA_A_PARTIR;
  const q = busca.trim().toLowerCase();
  const filtradas = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current && !btnRef.current.contains(target) && dropRef.current && !dropRef.current.contains(target)) setOpen(false);
    }
    // A posição é calculada na abertura; rolar ou redimensionar fecha para não ficar solta
    function fechar(e: Event) { if (!dropRef.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', fechar, true);
    window.addEventListener('resize', fechar);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', fechar, true);
      window.removeEventListener('resize', fechar);
    };
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const acima = window.innerHeight - rect.bottom < ALTURA_MAX + 16 && rect.top > window.innerHeight - rect.bottom;
      const width = Math.max(rect.width, 200);
      setDropPos({
        top: acima ? rect.top + window.scrollY - 6 : rect.bottom + window.scrollY + 6,
        // Não deixa a lista vazar pela borda direita da tela
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)) + window.scrollX,
        width,
        acima,
      });
      setBusca('');
      setAtivo(Math.max(0, options.findIndex((o) => o.value === value)));
    }
    setOpen((o) => !o);
  }

  function escolher(v: string) {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btnRef.current?.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo((i) => Math.min(filtradas.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAtivo((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const o = filtradas[ativo]; if (o) escolher(o.value); }
  }

  const selected = variant === 'field' ? options.find((o) => o.value === value) : undefined;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={variant === 'action'
          ? 'w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-e-border2 bg-transparent text-sm text-e-sub hover:text-e-text hover:border-e-accent/60 hover:bg-e-accent/5 transition-colors cursor-pointer focus:outline-none focus-visible:border-e-accent'
          : `w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-[#111113] text-sm text-e-text transition-colors cursor-pointer focus:outline-none focus-visible:border-e-accent ${
            open ? 'border-e-accent/70 ring-2 ring-e-accent/15' : 'border-[#303038] hover:border-e-border2'}`}
      >
        {variant === 'action' && <Plus size={14} className="shrink-0" />}
        <span className={`truncate ${selected ? 'text-e-text' : variant === 'action' ? '' : 'text-e-faint'}`}>
          {selected ? selected.label : variant === 'action' ? placeholder.replace(/^\+\s*/, '') : placeholder}
        </span>
        {variant === 'field' && (
          <ChevronDown size={14} className={`text-e-faint shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && dropPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropRef}
          onKeyDown={onKeyDown}
          className="bg-[#1c1c20] border border-e-border2/70 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col"
          style={{
            position: 'absolute',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            maxHeight: ALTURA_MAX,
            transform: dropPos.acima ? 'translateY(-100%)' : undefined,
            zIndex: 9999,
          }}
        >
          {temBusca && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-e-border">
              <Search size={13} className="text-e-faint shrink-0" />
              <input
                autoFocus
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setAtivo(0); }}
                placeholder="Buscar…"
                aria-label="Buscar opção"
                className="flex-1 min-w-0 bg-transparent border-0 p-0 text-sm text-e-text outline-none placeholder:text-e-faint"
              />
            </div>
          )}
          <div role="listbox" className="overflow-y-auto p-1">
            {filtradas.map((opt, i) => {
              const sel = variant === 'field' && opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={sel}
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => escolher(opt.value)}
                  className={`w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    sel ? 'text-e-accent' : i === ativo ? 'text-e-text' : 'text-e-sub'} ${i === ativo ? 'bg-white/[0.06]' : ''}`}
                >
                  <span className="flex-1 truncate">{opt.label}</span>
                  {sel && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
            {filtradas.length === 0 && <p className="px-2.5 py-2 text-sm text-e-faint">{options.length ? 'Nada encontrado' : 'Nada para escolher'}</p>}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
