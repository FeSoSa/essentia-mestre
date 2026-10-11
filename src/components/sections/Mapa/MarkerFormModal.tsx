'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useMapMarkersStore } from '@/store/mapMarkersStore';
import { useRegionsStore } from '@/store/regionsStore';
import type { MapMarker } from '@/store/types';

interface Props {
  mapId: string;
  x: number;
  y: number;
  marker?: MapMarker;
  onClose: () => void;
}

export default function MarkerFormModal({ mapId, x, y, marker, onClose }: Props) {
  const { regions } = useRegionsStore();
  const { addMarker, updateMarker } = useMapMarkersStore();
  const [label, setLabel] = useState(marker?.label ?? '');
  const [regionId, setRegionId] = useState(marker?.regionId ?? '');
  const [description, setDescription] = useState(marker?.description ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!regionId) return;
    setLoading(true);
    try {
      const payload = {
        mapId, x, y, label, regionId, description,
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
            <label className={labelClass}>Região vinculada</label>
            <Select
              value={regionId}
              onChange={setRegionId}
              options={regions.map((region) => ({ value: region.id, label: region.name }))}
              placeholder="Selecione uma região"
            />
          </div>
          <div>
            <label className={labelClass}>Descrição (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Notas sobre este ponto de interesse" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="ghost"   size="md" className="w-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" size="md" className="w-full" disabled={loading || !regionId}>
              {loading ? 'Salvando…' : marker ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
