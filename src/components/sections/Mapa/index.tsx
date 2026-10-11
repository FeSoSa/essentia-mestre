'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LogIn, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useImages } from '@/store';
import { useMapMarkersStore } from '@/store/mapMarkersStore';
import { useRegionsStore } from '@/store/regionsStore';
import { proxyUrl } from '@/lib/gdrive';
import { ROOT_MAP_ID } from '@/lib/map';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import type { MapMarker, Region } from '@/store/types';
import MarkerFormModal from './MarkerFormModal';
import RegionFormModal from './RegionFormModal';
import AddImageModal from '@/components/sections/Imagens/AddImageModal';

export default function Mapa() {
  const images = useImages();
  const { regions, fetchAll: fetchAllRegions, removeRegion } = useRegionsStore();
  const { markers, fetchByMap, updateMarker, removeMarker, toggleVisible } = useMapMarkersStore();
  const [mapStack, setMapStack] = useState<string[]>([ROOT_MAP_ID]);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [editingMarker, setEditingMarker] = useState<MapMarker | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [showRegions, setShowRegions] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [creatingRegion, setCreatingRegion] = useState(false);
  const [editingRootMap, setEditingRootMap] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  function relativePosition(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (draggingId) return;
    const pos = relativePosition(e.clientX, e.clientY);
    if (!pos) return;
    setPendingPoint(pos);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingId) return;
    const pos = relativePosition(e.clientX, e.clientY);
    if (!pos) return;
    setDragPreview(pos);
  }

  async function handlePointerUp(marker: MapMarker) {
    const pos = dragPreview;
    setDraggingId(null);
    setDragPreview(null);
    if (!pos) return;
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

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex-1 min-h-0 flex flex-col overflow-y-auto">
      <SectionHeader
        title="Mapa"
        subtitle="Clique na imagem para adicionar um marcador. Arraste um marcador para reposicioná-lo."
        action={
          <div className="flex items-center gap-3">
            {mapStack.length > 1 && (
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-e-sub hover:text-e-text cursor-pointer">
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
            {isRootMap && (
              <Button variant="ghost" size="sm" onClick={() => setEditingRootMap(true)}>
                <Pencil size={13} /> Editar mapa
              </Button>
            )}
            <Button variant={showRegions ? 'gold' : 'ghost'} size="sm" onClick={() => setShowRegions((s) => !s)}>
              <MapPin size={13} /> Regiões
            </Button>
          </div>
        }
      />

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
        <div
          ref={containerRef}
          onClick={handleImageClick}
          className="relative w-full rounded-xl overflow-hidden border border-e-border cursor-crosshair select-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxyUrl(currentImage.url)}
            alt={currentImage.title}
            className="w-full h-auto block pointer-events-none"
            draggable={false}
          />

          {markers.map((marker) => {
            const pos = draggingId === marker.id && dragPreview
              ? dragPreview
              : { x: marker.x, y: marker.y };
            return (
              <div
                key={marker.id}
                style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                className="group absolute -translate-x-1/2 w-4 h-14"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); setDraggingId(marker.id); }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={(e) => { e.stopPropagation(); e.currentTarget.releasePointerCapture(e.pointerId); handlePointerUp(marker); }}
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
            );
          })}
        </div>
      )}

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
