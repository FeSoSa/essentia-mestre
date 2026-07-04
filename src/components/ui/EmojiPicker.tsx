'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CATEGORIES = [
  {
    label: 'Criaturas',
    emojis: ['👹','👺','👿','💀','☠️','👻','🧟','🧛','🧌','🐉','🐲','🦁','🐺','🐗','🦊','🐻','🦂','🕷️','🐍','🦅','🦇','🐊','🐙','🦑','🧙'],
  },
  {
    label: 'Elementos',
    emojis: ['🔥','💧','❄️','⚡','🌿','💫','🌀','✨','🩸','🌑','🌊','🌪️','🌋','☀️','🌙','⭐','💥','🌫️','🫧','🌈'],
  },
  {
    label: 'Itens & Drops',
    emojis: ['🎁','💎','🗡️','⚔️','🛡️','👑','📜','🔑','💰','⚗️','🧪','🍖','🧿','💍','🏺','📿','🔮','🧲','⚙️','🪄','🗺️','🎴'],
  },
];

const POPOVER_W = 224;

interface Props {
  value: string;
  onChange: (emoji: string) => void;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

export default function EmojiPicker({ value, onChange, size = 'md', align = 'left' }: Props) {
  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState({ top: 0, left: 0 });
  const [custom, setCustom] = useState('');
  const btnRef    = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  function applyCustom() {
    const v = custom.trim();
    if (!v) return;
    onChange(v);
    setCustom('');
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !portalRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function toggle() {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const left = align === 'right'
      ? Math.max(4, r.right - POPOVER_W)
      : Math.min(r.left, window.innerWidth - POPOVER_W - 4);
    setPos({ top: r.bottom + 4, left });
    setOpen((v) => !v);
  }

  const btnCls = size === 'sm' ? 'w-9 h-9 text-lg rounded-lg' : 'w-11 h-11 text-xl rounded-xl';

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="Escolher ícone"
        className={`${btnCls} shrink-0 flex items-center justify-center bg-e-bg border transition-colors
          ${open ? 'border-e-accent bg-e-accent/10' : 'border-e-border hover:border-e-border2'}`}
      >
        {value || <span className="text-e-faint text-sm">?</span>}
      </button>

      {open && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: POPOVER_W }}
          className="bg-e-surface border border-e-border rounded-xl shadow-2xl p-2.5 flex flex-col gap-2.5"
        >
          {CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint mb-1.5 px-0.5">
                {cat.label}
              </p>
              <div className="flex flex-wrap gap-0.5">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { onChange(emoji); setOpen(false); }}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors
                      ${value === emoji ? 'bg-e-accent/20 ring-1 ring-inset ring-e-accent' : 'hover:bg-e-card'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-e-faint mb-1.5 px-0.5">
              Outro
            </p>
            <div className="flex gap-1.5">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyCustom(); }}
                placeholder="Cole um emoji…"
                className="flex-1 w-0 text-sm rounded-lg px-2 py-1.5 bg-e-bg border border-e-border text-e-text placeholder:text-e-faint outline-none focus:border-e-border2"
              />
              <button
                type="button"
                onClick={applyCustom}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-e-accent/15 text-e-accent hover:bg-e-accent/25 transition-colors shrink-0"
              >
                Usar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
