'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useDocumentsStore } from '@/store/documentsStore';
import Button from '@/components/ui/Button';
import { normalizeGdriveUrl, proxyUrl } from '@/lib/gdrive';
import type { DocumentEntry } from '@/store/types';

export default function AddDocumentModal({ document, onClose }: { document?: DocumentEntry; onClose: () => void }) {
  const [title, setTitle] = useState(document?.title ?? '');
  const [url,   setUrl]   = useState(document?.url   ?? '');
  const [loading, setLoading] = useState(false);
  const { addDocument, updateDocument } = useDocumentsStore();

  const normalized = normalizeGdriveUrl(url);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      if (document) {
        await updateDocument(document.id, { url: normalized, title });
      } else {
        await addDocument({ title, url: normalized });
      }
      onClose();
    } catch {}
    finally { setLoading(false); }
  }

  const label = "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-md shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border">
          <h3 className="font-semibold text-e-text">{document ? 'Editar Documento' : 'Novo Documento'}</h3>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer transition-colors p-1 rounded-lg hover:bg-e-card">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className={label}>Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Pergaminho Antigo" required />
          </div>
          <div>
            <label className={label}>URL da imagem</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL direta ou link do Google Drive" required />
          </div>
          {normalized && (
            <div className="rounded-xl overflow-hidden border border-e-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proxyUrl(url)} alt="preview" className="w-full h-40 object-cover block" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="ghost"   size="md" className="w-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={loading}>
              {loading ? 'Salvando…' : document ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
