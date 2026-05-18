'use client';

type CheckboxColor = 'default' | 'teal' | 'amber' | 'sky' | 'orange' | 'purple' | 'green';

const COLOR_MAP: Record<CheckboxColor, string> = {
  default: 'bg-e-accent border-e-accent',
  teal:    'bg-teal-400 border-teal-400',
  amber:   'bg-amber-400 border-amber-400',
  sky:     'bg-sky-400 border-sky-400',
  orange:  'bg-orange-400 border-orange-400',
  purple:  'bg-purple-400 border-purple-400',
  green:   'bg-green-400 border-green-400',
};

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: CheckboxColor;
  className?: string;
}

export default function Checkbox({ checked, onChange, color = 'default', className = '' }: Props) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex items-center justify-center w-4 h-4 rounded-[4px] border transition-all duration-150 cursor-pointer shrink-0',
        checked ? COLOR_MAP[color] : 'bg-transparent border-e-border hover:border-e-border2',
        className,
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {checked && (
        <svg className="w-2.5 h-2.5 text-black pointer-events-none" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
