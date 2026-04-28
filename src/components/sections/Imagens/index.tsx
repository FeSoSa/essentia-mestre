'use client';

import { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore, useImages } from '@/store';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import type { ImageEntry } from '@/store/types';
import AddImageModal from './AddImageModal';

export default function Imagens() {
  const images = useImages();
  const { setImages, setActiveImage } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    api.get<ImageEntry[]>('/images').then((r) => setImages(r.data)).catch(() => {});
  }, [setImages]);

  async function handleActivate(id: string) {
    setActivating(id);
    try { await api.put(`/images/${id}/activate`); setActiveImage(id); } catch {}
    finally { setActivating(null); }
  }

  const active = images.find((i) => i.active);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <SectionHeader
        title="Imagens"
        subtitle="Exiba imagens na tela dos jogadores"
        action={<Button variant="primary" onClick={() => setShowModal(true)}>+ Nova imagem</Button>}
      />

      {active && (
        <div className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-xl bg-e-gold/8 border border-e-gold/20">
          <Radio size={14} className="text-e-gold shrink-0" />
          <p className="text-sm text-e-sub">Exibindo: <span className="text-e-gold font-semibold">{active.title}</span></p>
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-2 text-e-faint">
          <p className="text-sm">Nenhuma imagem cadastrada.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {images.map((img) => (
            <div key={img.id} className={[
              'bg-e-surface border rounded-xl overflow-hidden transition-colors',
              img.active ? 'border-e-gold/40' : 'border-e-border hover:border-e-border2',
            ].join(' ')}>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.title} className="w-full h-28 object-cover block" />
                {img.active && (
                  <span className="absolute top-2 right-2 text-[9px] font-black tracking-widest uppercase bg-e-gold text-black px-2 py-0.5 rounded-md">
                    LIVE
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2">
                <p className="text-sm font-medium text-e-text truncate">{img.title}</p>
                <Button
                  variant={img.active ? 'gold' : 'subtle'}
                  size="sm"
                  disabled={activating === img.id || img.active}
                  onClick={() => handleActivate(img.id)}
                  className="w-full"
                >
                  {activating === img.id ? '…' : img.active ? 'Ativo' : 'Exibir'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddImageModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
