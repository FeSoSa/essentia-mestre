'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Eye, EyeOff, LogIn, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useImages } from '@/store';
import { useMapMarkersStore } from '@/store/mapMarkersStore';
import { useRegionsStore } from '@/store/regionsStore';
import { ROOT_MAP_ID } from '@/lib/map';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import type { MapMarker, Region } from '@/store/types';
import MarkerFormModal from './MarkerFormModal';
import RegionFormModal from './RegionFormModal';
import AddImageModal from '@/components/sections/Imagens/AddImageModal';
import MapaCanvas from '@/components/map/MapaCanvas';
import CamadaCampanha from '@/features/campanha/CamadaCampanha';

type Camada = 'locais' | 'campanha';

export default function Mapa() {
  const images = useImages();
  const { regions, fetchAll: fetchAllRegions, removeRegion } = useRegionsStore();
  const { markers, fetchByMap, updateMarker, removeMarker, toggleVisible } = useMapMarkersStore();
  const [camada, setCamada] = useState<Camada>('locais');
  const [mapStack, setMapStack] = useState<string[]>([ROOT_MAP_ID]);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [editingMarker, setEditingMarker] = useState<MapMarker | null>(null);
  const [showRegions, setShowRegions] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [creatingRegion, setCreatingRegion] = useState(false);
  const [editingRootMap, setEditingRootMap] = useState(false);

  const currentMapId = mapStack[mapStack.length - 1];
  const isRootMap = currentMapId === ROOT_MAP_ID;
  const rootMapImage = images.find((i) => i.id === ROOT_MAP_ID);
  const currentImage = isRootMap
    ? rootMapImage
    : (() => {
        const region = regions.find((r) => r.id === currentMapId);
        return region ? { id: region.id, url: region.url, title: region.name } : undefined;
      })();

  useEffect(() => {
    fetchByMap(currentMapId);
  }, [currentMapId, fetchByMap]);

  useEffect(() => {
    fetchAllRegions();
  }, [fetchAllRegions]);

  async function moveMarker(marker: MapMarker, pos: { x: number; y: number }) {
    await updateMarker(marker.id, {
      mapId: marker.mapId, x: pos.x, y: pos.y,
      label: marker.label, regionId: marker.regionId,
      description: marker.description, visible: marker.visible,
    });
  }

  function enterRegion(marker: MapMarker) {
    setMapStack((s) => [...s, marker.regionId]);
  }

  function goBack() {
    setMapStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }

  const camadas: { id: Camada; label: string; Icon: typeof MapPin }[] = [
    { id: 'locais', label: 'Locais', Icon: MapPin },
    { id: 'campanha', label: 'Campanha', Icon: BookOpen },
  ];

  return (
    <div className={`p-8 mx-auto w-full flex-1 min-h-0 flex flex-col overflow-y-auto ${camada === 'campanha' ? 'max-w-[1800px]' : 'max-w-[1600px]'}`}>
      <SectionHeader
        title="Mapa"
        subtitle={camada === 'locais'
          ? 'Clique na imagem para adicionar um marcador. Arraste um marcador para reposicioná-lo.'
          : 'Clique no mapa para criar um ponto da campanha. Arraste para mover.'}
        action={
          <div className="flex items-center gap-3">
            {mapStack.length > 1 && (
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-e-sub hover:text-e-text cursor-pointer">
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
            <div role="group" aria-label="Camada em edição" className="flex gap-0.5 p-0.5 rounded-xl border border-e-border bg-e-surface">
              {camadas.map(({ id, label, Icon }) => (
                <button key={id} type="button" onClick={() => setCamada(id)} aria-pressed={camada === id}
                  className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    camada === id ? (id === 'locais' ? 'bg-e-gold/15 text-e-gold' : 'bg-e-flow/15 text-e-flow') : 'text-e-sub hover:text-e-text'}`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
            {camada === 'locais' && isRootMap && (
              <Button variant="ghost" size="sm" onClick={() => setEditingRootMap(true)}>
                <Pencil size={13} /> Editar mapa
              </Button>
            )}
            {camada === 'locais' && (
              <Button variant={showRegions ? 'gold' : 'ghost'} size="sm" onClick={() => setShowRegions((s) => !s)}>
                <MapPin size={13} /> Regiões
              </Button>
            )}
          </div>
        }
      />

      {camada === 'campanha' ? (
        <CamadaCampanha
          mapStack={mapStack}
          setMapStack={setMapStack}
          currentImage={currentImage}
          markers={markers}
          regions={regions}
        />
      ) : (<>
      {showRegions && (
        <div className="mb-6 p-4 rounded-xl border border-e-border bg-e-surface">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-e-text">Regiões cadastradas</h3>
            <Button variant="primary" size="sm" onClick={() => setCreatingRegion(true)}>+ Nova região</Button>
          </div>
          {regions.length === 0 ? (
            <p className="text-sm text-e-faint">Nenhuma região cadastrada.</p>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {regions.map((region) => (
                <div key={region.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-e-card border border-e-border">
                  <span className="text-sm text-e-text truncate">{region.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditingRegion(region)} className="text-e-faint hover:text-e-text cursor-pointer p-1">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => removeRegion(region.id)} className="text-e-faint hover:text-e-danger cursor-pointer p-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!currentImage ? (
        <div className="flex flex-col items-center justify-center py-32 gap-2 text-e-faint">
          <p className="text-sm">Imagem do mapa não encontrada.</p>
        </div>
      ) : !currentImage.url ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-e-faint">
          <p className="text-sm">Esta imagem ainda não tem uma URL definida.</p>
          {isRootMap && (
            <Button variant="primary" size="sm" onClick={() => setEditingRootMap(true)}>
              <Pencil size={13} /> Definir imagem do mapa
            </Button>
          )}
        </div>
      ) : (
        <MapaCanvas
          imageUrl={currentImage.url}
          alt={currentImage.title}
          items={markers}
          onCreateAt={setPendingPoint}
          onMove={moveMarker}
          renderItem={(marker, pos, alca) => (
            <div
              style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
              className="group absolute -translate-x-1/2 w-4 h-14"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                {...alca}
                className={[
                  'absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing',
                  marker.visible ? 'bg-e-gold' : 'bg-zinc-500',
                ].join(' ')}
                title={marker.label}
              />
              <div className="hidden group-hover:flex absolute top-3 left-1/2 -translate-x-1/2 items-center gap-2.5 bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 text-sm text-white whitespace-nowrap">
                <span className="font-medium">{marker.label}</span>
                <button onClick={() => toggleVisible(marker.id, !marker.visible)} className="hover:text-e-gold cursor-pointer">
                  {marker.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button onClick={() => enterRegion(marker)} className="hover:text-e-gold cursor-pointer">
                  <LogIn size={18} />
                </button>
                <button onClick={() => setEditingMarker(marker)} className="hover:text-e-gold cursor-pointer">
                  <Pencil size={18} />
                </button>
                <button onClick={() => removeMarker(marker.id)} className="hover:text-e-danger cursor-pointer">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}
        />
      )}
      </>)}

      {pendingPoint && (
        <MarkerFormModal
          mapId={currentMapId}
          x={pendingPoint.x}
          y={pendingPoint.y}
          onClose={() => setPendingPoint(null)}
        />
      )}

      {editingMarker && (
        <MarkerFormModal
          mapId={editingMarker.mapId}
          x={editingMarker.x}
          y={editingMarker.y}
          marker={editingMarker}
          onClose={() => setEditingMarker(null)}
        />
      )}

      {creatingRegion && <RegionFormModal onClose={() => setCreatingRegion(false)} />}
      {editingRegion && <RegionFormModal region={editingRegion} onClose={() => setEditingRegion(null)} />}
      {editingRootMap && <AddImageModal image={rootMapImage} onClose={() => setEditingRootMap(false)} />}
    </div>
  );
}
