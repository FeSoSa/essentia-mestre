'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'gold' | 'subtle';
type Size    = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-e-accent hover:bg-e-accent/85 text-black font-semibold border border-transparent',
  ghost:   'bg-transparent hover:bg-e-card border border-e-border text-e-sub hover:text-e-text',
  danger:  'bg-e-danger/10 hover:bg-e-danger/20 border border-e-danger/25 text-e-danger',
  gold:    'bg-e-gold/10 hover:bg-e-gold/20 border border-e-gold/25 text-e-gold',
  subtle:  'bg-e-card hover:bg-e-border border border-e-border text-e-sub hover:text-e-text',
};

const SIZES: Record<Size, string> = {
  sm: 'h-7  px-3   text-xs   rounded-lg  font-medium',
  md: 'h-9  px-4   text-sm   rounded-xl  font-medium',
  lg: 'h-11 px-5   text-base rounded-xl  font-semibold',
};

export default function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  children,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 cursor-pointer transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
