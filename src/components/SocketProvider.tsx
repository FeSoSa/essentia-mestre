'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useEffectPresetsStore } from '@/store/effectPresetsStore';

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  const fetchPresets = useEffectPresetsStore((s) => s.fetchPresets);
  useEffect(() => { fetchPresets(); }, [fetchPresets]);
  return <>{children}</>;
}
