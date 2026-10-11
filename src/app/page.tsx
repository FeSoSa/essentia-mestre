import SocketProvider from '@/components/SocketProvider';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import SobrecargaPanel from '@/components/sections/Mesa/SobrecargaPanel';
import DamagePanel from '@/components/sections/Mesa/DamagePanel';
import EnemyTurnPanel from '@/components/sections/Mesa/EnemyTurnPanel';
import EffectPanel from '@/components/sections/Mesa/EffectPanel';
import ErrorToast from '@/components/ErrorToast';

export default function Home() {
  return (
    <SocketProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <SobrecargaPanel />
      <DamagePanel />
      <EnemyTurnPanel />
      <EffectPanel />
      <ErrorToast />
    </SocketProvider>
  );
}
