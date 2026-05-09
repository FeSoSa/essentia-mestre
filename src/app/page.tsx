import SocketProvider from '@/components/SocketProvider';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import SobrecargaPanel from '@/components/sections/Mesa/SobrecargaPanel';

export default function Home() {
  return (
    <SocketProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <SobrecargaPanel />
    </SocketProvider>
  );
}
