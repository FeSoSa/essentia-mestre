'use client';

import { useSocket } from '@/hooks/useSocket';

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  return <>{children}</>;
}
