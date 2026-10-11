'use client';

import { useState, useEffect } from 'react';
import { Radio, Pencil, Trash2 } from 'lucide-react';
import { useDocumentsStore } from '@/store/documentsStore';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import { proxyUrl } from '@/lib/gdrive';
import type { DocumentEntry } from '@/store/types';
import AddDocumentModal from './AddDocumentModal';

export default function DocumentosList() {
  const { documents, fetchDocuments, toggleDocument, removeDocument } = useDocumentsStore();
  const [showModal, setShowModal] = useState(false);
  const [editDocument, setEditDocument] = useState<DocumentEntry | null>(null);
  const [previewDocument, setPreviewDocument] = useState<DocumentEntry | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleToggle(id: string) {
    setToggling(id);
    try {
      await toggleDocument(id);
    } catch {}
    finally { setToggling(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este documento?')) return;
    setDeleting(id);
    try {
      await removeDocument(id);
    } catch {}
    finally { setDeleting(null); }
  }

  const activeCount = documents.filter((d) => d.active).length;

  return (
    <div className="mt-12">
      <SectionHeader
        title="Documentos"
        subtitle="Libere documentos na tela dos jogadores"
        action={<Button variant="primary" onClick={() => setShowModal(true)}>+ Novo documento</Button>}
      />

      {activeCount > 0 && (
        <div className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-xl bg-e-gold/8 border border-e-gold/20">
          <Radio size={14} className="text-e-gold shrink-0" />
          <p className="text-sm text-e-sub">
            <span className="text-e-gold font-semibold">{activeCount}</span> documento{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''} — visível para os jogadores
          </p>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-2 text-e-faint">
          <p className="text-sm">Nenhum documento cadastrado.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {documents.map((doc) => (
            <div key={doc.id} className={[
              'bg-e-surface border rounded-xl overflow-hidden transition-colors',
              doc.active ? 'border-e-gold/40' : 'border-e-border hover:border-e-border2',
            ].join(' ')}>
              <div className="relative">
                {doc.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proxyUrl(doc.url)}
                    alt={doc.title}
                    className="w-full h-28 object-cover block cursor-zoom-in"
                    onClick={() => setPreviewDocument(doc)}
                  />
                ) : (
                  <div
                    className="w-full h-28 flex items-center justify-center bg-e-card text-e-faint text-xs cursor-pointer"
                    onClick={() => setEditDocument(doc)}
                  >
                    Sem URL — clique em editar
                  </div>
                )}
                {doc.active && (
                  <span className="absolute top-2 right-2 text-[9px] font-black tracking-widest uppercase bg-e-gold text-black px-2 py-0.5 rounded-md">
                    LIVE
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2">
                <p className="text-sm font-medium text-e-text truncate">{doc.title}</p>
                <Button
                  variant={doc.active ? 'gold' : 'subtle'}
                  size="sm"
                  disabled={toggling === doc.id}
                  onClick={() => handleToggle(doc.id)}
                  className="w-full"
                >
                  {toggling === doc.id ? '…' : doc.active ? 'Desativar' : 'Exibir'}
                </Button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEditDocument(doc)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-e-faint hover:text-e-text hover:bg-e-card transition-colors cursor-pointer text-xs"
                  >
                    <Pencil size={11} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-e-faint hover:text-e-danger hover:bg-e-danger/10 transition-colors cursor-pointer text-xs disabled:opacity-40"
                  >
                    <Trash2 size={11} /> {deleting === doc.id ? '…' : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddDocumentModal onClose={() => setShowModal(false)} />}
      {editDocument && <AddDocumentModal document={editDocument} onClose={() => setEditDocument(null)} />}

      {previewDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 cursor-zoom-out"
          onClick={() => setPreviewDocument(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxyUrl(previewDocument.url)}
            alt={previewDocument.title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/60 pointer-events-none">
            {previewDocument.title}
          </span>
        </div>
      )}
    </div>
  );
}
