'use client';

import { useState, useEffect } from 'react';
import { Radio, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore, useImages } from '@/store';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import { proxyUrl } from '@/lib/gdrive';
import type { ImageEntry } from '@/store/types';
import AddImageModal from './AddImageModal';

export default function Imagens() {
  const images = useImages();
  const { setImages, setActiveImage } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editImage, setEditImage] = useState<ImageEntry | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.get<ImageEntry[]>('/images').then((r) => setImages(r.data)).catch(() => {});
  }, [setImages]);

  async function handleToggle(id: string) {
    setToggling(id);
    try {
      const res = await api.put<ImageEntry[]>(`/images/${id}/toggle`);
      setImages(res.data);
    } catch {}
    finally { setToggling(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta imagem?')) return;
    setDeleting(id);
    try {
      await api.delete(`/images/${id}`);
      setImages(images.filter((i) => i.id !== id));
    } catch {}
    finally { setDeleting(null); }
  }

  const activeCount = images.filter((i) => i.active).length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <SectionHeader
        title="Imagens"
        subtitle="Exiba imagens na tela dos jogadores"
        action={<Button variant="primary" onClick={() => setShowModal(true)}>+ Nova imagem</Button>}
      />

      {activeCount > 0 && (
        <div className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-xl bg-e-gold/8 border border-e-gold/20">
          <Radio size={14} className="text-e-gold shrink-0" />
          <p className="text-sm text-e-sub">
            <span className="text-e-gold font-semibold">{activeCount}</span> imagem{activeCount !== 1 ? 's' : ''} ativa{activeCount !== 1 ? 's' : ''} — jogadores podem navegar entre elas
          </p>
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
                <img src={proxyUrl(img.url)} alt={img.title} className="w-full h-28 object-cover block" />
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
                  disabled={toggling === img.id}
                  onClick={() => handleToggle(img.id)}
                  className="w-full"
                >
                  {toggling === img.id ? '…' : img.active ? 'Desativar' : 'Exibir'}
                </Button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEditImage(img)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-e-faint hover:text-e-text hover:bg-e-card transition-colors cursor-pointer text-xs"
                  >
                    <Pencil size={11} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={deleting === img.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-danger/10 transition-colors cursor-pointer text-xs disabled:opacity-40"
                  >
                    <Trash2 size={11} /> {deleting === img.id ? '…' : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddImageModal onClose={() => setShowModal(false)} />}
      {editImage  && <AddImageModal image={editImage} onClose={() => setEditImage(null)} />}
    </div>
  );
}
