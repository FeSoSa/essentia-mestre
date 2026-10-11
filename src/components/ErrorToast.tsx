'use client';

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useErrorToastStore } from '@/store/errorToastStore';

export default function ErrorToast() {
  const message = useErrorToastStore((s) => s.message);
  const clear = useErrorToastStore((s) => s.clear);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(clear, 6000);
    return () => clearTimeout(t);
  }, [message, clear]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm bg-e-surface border border-e-danger/40 rounded-xl shadow-2xl p-4 flex items-start gap-3">
      <AlertTriangle size={18} className="text-e-danger shrink-0 mt-0.5" />
      <p className="flex-1 text-sm text-e-text">{message}</p>
      <button onClick={clear} className="text-e-faint hover:text-e-text cursor-pointer shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
