'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useMapMarkersStore } from '@/store/mapMarkersStore';
import { useRegionsStore } from '@/store/regionsStore';
import { normalizeGdriveUrl, proxyUrl } from '@/lib/gdrive';
import type { MapMarker, Region } from '@/store/types';

interface Props {
  mapId: string;
  x: number;
  y: number;
  marker?: MapMarker;
  onClose: () => void;
}

/**
 * Cada marcador pode ter uma imagem própria; com imagem, dá para entrar nele.
 * Por baixo a imagem continua numa região (é ela que vira o mapId dos pontos de
 * dentro e é o que o app usa para navegar), mas o mestre cuida disso sozinho:
 * uma região por marcador.
 */
export default function MarkerFormModal({ mapId, x, y, marker, onClose }: Props) {
  const { regions, addRegion, updateRegion } = useRegionsStore();
  const { addMarker, updateMarker } = useMapMarkersStore();
  // Marcador que aponta para o próprio mapa onde está não tem imagem própria
  // (era o jeito antigo de criar um ponto sem imagem).
  const regiaoAtual: Region | undefined =
    marker && marker.regionId !== marker.mapId ? regions.find((r) => r.id === marker.regionId) : undefined;
  const [label, setLabel] = useState(marker?.label ?? '');
  const [imageUrl, setImageUrl] = useState(regiaoAtual?.url ?? '');
  const [description, setDescription] = useState(marker?.description ?? '');
  const [loading, setLoading] = useState(false);

  const normalized = normalizeGdriveUrl(imageUrl);

  /** Região onde fica a imagem deste marcador ('' = sem imagem). */
  async function regiaoDaImagem(): Promise<string> {
    if (!normalized) return '';
    if (!regiaoAtual) {
      return (await addRegion({ name: label, url: normalized, description: '' })).id;
    }
    // Região usada por mais de um marcador (dados antigos): só o dono, o de mesmo
    // nome, altera ela; os outros ganham uma região nova se trocarem a imagem.
    const todos = (await api.get<MapMarker[]>('/map-markers')).data;
    const compartilhada = todos.some((m) => m.id !== marker?.id && m.regionId === regiaoAtual.id && m.mapId !== regiaoAtual.id);
    const dono = !compartilhada || regiaoAtual.name === marker?.label;
    if (dono) {
      if (regiaoAtual.url !== normalized || regiaoAtual.name !== label) {
        await updateRegion(regiaoAtual.id, { ...regiaoAtual, name: label, url: normalized });
      }
      return regiaoAtual.id;
    }
    if (regiaoAtual.url === normalized) return regiaoAtual.id;
    return (await addRegion({ name: label, url: normalized, description: '' })).id;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        mapId, x, y, label, regionId: await regiaoDaImagem(), description,
        visible: marker?.visible ?? true,
      };
      if (marker) {
        await updateMarker(marker.id, payload);
      } else {
        await addMarker(payload);
      }
      onClose();
    } catch {}
    finally { setLoading(false); }
  }

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-e-faint mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-e-surface border border-e-border rounded-2xl w-full max-w-md shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-e-border">
          <h3 className="font-semibold text-e-text">{marker ? 'Editar Marcador' : 'Novo Marcador'}</h3>
          <button onClick={onClose} className="text-e-faint hover:text-e-text cursor-pointer transition-colors p-1 rounded-lg hover:bg-e-card">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Cidade de Aldenar" required />
          </div>
          <div>
            <label className={labelClass}>Imagem (opcional)</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL direta ou link do Google Drive" />
            {normalized ? (
              <div className="mt-2 rounded-xl overflow-hidden border border-e-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proxyUrl(imageUrl)} alt="preview" className="w-full aspect-video object-contain bg-black block" />
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-e-faint">Com imagem, dá para entrar no marcador e marcar os pontos de dentro.</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Descrição (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Notas sobre este ponto de interesse" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="ghost"   size="md" className="w-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={loading}>
              {loading ? 'Salvando…' : marker ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
