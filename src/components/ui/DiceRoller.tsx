'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onResult: (value: number) => void;
  sides?: number;
  disabled?: boolean;
  label?: string;
}

const SPIN_TICKS = 10;
const TICK_BASE_MS = 70;

function vibrate(ms: number) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

export default function DiceRoller({ onResult, sides = 20, disabled, label = 'ROLAR' }: Props) {
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [transitionMs, setTransitionMs] = useState(0);
  const [pop, setPop] = useState(false);
  const tickCount = useRef(0);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function tick(finalValue: number, startRotation: number) {
    if (!mountedRef.current) return;
    tickCount.current += 1;
    const delay = TICK_BASE_MS + tickCount.current * 15;
    vibrate(10);

    if (tickCount.current < SPIN_TICKS) {
      setDisplay(Math.ceil(Math.random() * sides));
      setTransitionMs(delay);
      setRotation((r) => r + 180);
      timerRef.current = setTimeout(() => tick(finalValue, startRotation), delay);
    } else {
      // último tick: o giro termina exatamente quando o número final aparece,
      // sempre num múltiplo de 360° para o dado terminar "de frente" (nunca torto)
      setDisplay(finalValue);
      setTransitionMs(delay);
      setRotation((r) => {
        const remainder = r % 360;
        const closingSpin = remainder === 0 ? 360 : 360 - remainder;
        return r + closingSpin;
      });
      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setRolling(false);
        setPop(true);
        setTimeout(() => mountedRef.current && setPop(false), 270);
        vibrate(finalValue === sides ? [15, 40, 15] as unknown as number : 25);
        onResult(finalValue);
      }, delay);
    }
  }

  function handleRoll() {
    if (rolling || disabled) return;
    const finalValue = Math.ceil(Math.random() * sides); // decidido ANTES da animação
    setRolling(true);
    tickCount.current = 0;
    setTransitionMs(0);
    setRotation(0); // reseta sem animar, para o giro repetir por completo a cada rolagem
    requestAnimationFrame(() => tick(finalValue, 0));
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="w-[88px] h-[88px] rounded-xl border-2 border-e-accent bg-e-bg flex items-center justify-center select-none"
        style={{
          transform: `rotate(${rotation}deg) scale(${pop ? 1.2 : 1})`,
          transition: `transform ${transitionMs}ms linear${pop ? ', transform 150ms ease-out' : ''}`,
        }}
      >
        <span className="font-mono text-3xl font-black text-e-accent">
          {display ?? `d${sides}`}
        </span>
      </div>
      <button
        type="button"
        onClick={handleRoll}
        disabled={rolling || disabled}
        className="w-full py-2 rounded-lg text-xs font-semibold tracking-wider cursor-pointer transition-colors bg-e-accent hover:bg-e-accent/85 text-black disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {rolling ? 'ROLANDO…' : label}
      </button>
    </div>
  );
}
