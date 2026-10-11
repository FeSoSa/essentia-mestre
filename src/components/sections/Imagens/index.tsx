'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, FileText, Plus, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore, useImages } from '@/store';
import { useDocumentsStore } from '@/store/documentsStore';
import Button from '@/components/ui/Button';
import SectionHeader, { Page } from '@/components/ui/SectionHeader';
import { proxyUrl } from '@/lib/gdrive';
import { ROOT_MAP_ID } from '@/lib/map';
import type { ImageEntry } from '@/store/types';
import AddImageModal from './AddImageModal';
import DocumentosList from './DocumentosList';

export default function Imagens() {
  const images = useImages();
  const { setImages, setActiveImage } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editImage, setEditImage] = useState<ImageEntry | null>(null);
  const [previewImage, setPreviewImage] = useState<ImageEntry | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const { addDocument } = useDocumentsStore();

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

  async function handleSendToDocuments(img: ImageEntry) {
    setSending(img.id);
    try {
      await addDocument({ url: img.url, title: img.title });
    } catch {}
    finally { setSending(null); }
  }

  const activeCount = images.filter((i) => i.active).length;

  return (
    <Page>
      <SectionHeader
        title="Imagens"
        count={images.length}
        subtitle="Exiba imagens na tela dos jogadores. Clique na miniatura para ver em tela cheia."
        action={<Button variant="primary" onClick={() => setShowModal(true)}><Plus size={15} /> Nova imagem</Button>}
      />

      {activeCount > 0 && (
        <div className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-xl bg-e-gold/[0.06] border border-e-gold/20">
          <span className="relative flex w-2 h-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-e-gold opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-e-gold" />
          </span>
          <p className="text-sm text-e-sub">
            <span className="text-e-gold font-semibold">{activeCount}</span> imagem{activeCount !== 1 ? 's' : ''} no ar. Os jogadores podem navegar entre elas.
          </p>
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-2 text-e-faint">
          <ImageIcon size={36} className="opacity-40" />
          <p className="text-sm">Nenhuma imagem cadastrada.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
          {images.map((img) => (
            <div key={img.id} className={[
              'group bg-e-surface border rounded-2xl overflow-hidden transition-colors flex flex-col',
              img.active ? 'border-e-gold/50 shadow-[0_0_0_1px_rgba(212,168,78,0.25)]' : 'border-white/[0.07] hover:border-white/20',
            ].join(' ')}>
              <div className="relative aspect-[16/10] bg-[#141417]">
                <ImageIcon size={28} className="absolute inset-0 m-auto text-white/10" />
                {img.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proxyUrl(img.url)}
                    alt={img.title}
                    className="relative w-full h-full object-cover block cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.03]"
                    onClick={() => setPreviewImage(img)}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                  />
                ) : (
                  <div
                    className="relative w-full h-full flex items-end justify-center pb-3 text-e-faint text-xs cursor-pointer"
                    onClick={() => setEditImage(img)}
                  >
                    Sem link. Clique para editar
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />
                <p className="pointer-events-none absolute left-3 right-3 bottom-2 text-sm font-semibold text-white truncate drop-shadow">{img.title}</p>
                {img.active && (
                  <span className="absolute top-2 right-2 text-[9px] font-black tracking-widest uppercase bg-e-gold text-black px-2 py-0.5 rounded-md">
                    No ar
                  </span>
                )}
              </div>
              <div className="p-2.5 flex items-center gap-1">
                <Button
                  variant={img.active ? 'gold' : 'subtle'}
                  size="sm"
                  disabled={toggling === img.id}
                  onClick={() => handleToggle(img.id)}
                  className="flex-1"
                >
                  {toggling === img.id ? '…' : img.active ? 'Tirar do ar' : 'Exibir'}
                </Button>
                <button
                  onClick={() => setEditImage(img)}
                  title="Editar"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-e-faint hover:text-e-text hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Pencil size={13} />
                </button>
                {img.url && (
                  <button
                    onClick={() => handleSendToDocuments(img)}
                    disabled={sending === img.id}
                    title={sending === img.id ? 'Enviando…' : 'Enviar para documentos'}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-e-faint hover:text-e-text hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <FileText size={13} />
                  </button>
                )}
                {img.id !== ROOT_MAP_ID && (
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={deleting === img.id}
                    title="Excluir"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-e-faint hover:text-e-danger hover:bg-e-danger/10 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentosList />

      {showModal && <AddImageModal onClose={() => setShowModal(false)} />}
      {editImage  && <AddImageModal image={editImage} onClose={() => setEditImage(null)} />}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxyUrl(previewImage.url)}
            alt={previewImage.title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/60 pointer-events-none">
            {previewImage.title}
          </span>
        </div>
      )}
    </Page>
  );
}
