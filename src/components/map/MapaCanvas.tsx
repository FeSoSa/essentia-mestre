'use client';

import { useState, type ReactNode } from 'react';
import { proxyUrl } from '@/lib/gdrive';

export interface PosicaoMapa { x: number; y: number }

/** Props para espalhar no elemento que o mestre arrasta (o "pino" de cada item). */
export interface AlcaArraste {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
}

interface Props<T extends { id: string; x: number; y: number }> {
  imageUrl: string;
  alt: string;
  items: T[];
  /**
   * Desenha um item. `pos` já é a posição de prévia durante o arraste. O item se
   * posiciona sozinho (left/top em %) e deve parar o clique (`stopPropagation`)
   * para não criar um item novo por baixo.
   */
  renderItem: (item: T, pos: PosicaoMapa, alca: AlcaArraste, arrastando: boolean) => ReactNode;
  onCreateAt?: (pos: PosicaoMapa) => void;
  onMove?: (item: T, pos: PosicaoMapa) => void;
  /** Camada de fundo não interativa (ex.: a outra camada, apagada). */
  fundo?: ReactNode;
}

/**
 * O mapa usado pela aba Mapa nas duas camadas (Locais e Campanha). Posições são
 * frações de 0 a 1 do container, que tem exatamente o tamanho da imagem
 * (largura cheia, altura natural): é isso que mantém os marcadores no mesmo
 * lugar no painel e no app do jogador. Não mudar a geometria daqui sem testar
 * os marcadores reais contra o app.
 */
export default function MapaCanvas<T extends { id: string; x: number; y: number }>({
  imageUrl, alt, items, renderItem, onCreateAt, onMove, fundo,
}: Props<T>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<PosicaoMapa | null>(null);

  /** Posição relativa ao container do mapa (achado a partir do elemento do evento). */
  function relativePosition(el: Element, clientX: number, clientY: number): PosicaoMapa | null {
    const rect = el.closest('[data-mapa-canvas]')?.getBoundingClientRect();
    if (!rect) return null;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (draggingId || !onCreateAt) return;
    const pos = relativePosition(e.currentTarget, e.clientX, e.clientY);
    if (pos) onCreateAt(pos);
  }

  function alcaDe(item: T): AlcaArraste {
    return {
      onPointerDown: (e) => {
        if (!onMove) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDraggingId(item.id);
      },
      onPointerMove: (e) => {
        if (draggingId !== item.id) return;
        const pos = relativePosition(e.currentTarget, e.clientX, e.clientY);
        if (pos) setDragPreview(pos);
      },
      onPointerUp: (e) => {
        if (draggingId !== item.id) return;
        e.stopPropagation();
        e.currentTarget.releasePointerCapture(e.pointerId);
        const pos = dragPreview;
        setDraggingId(null);
        setDragPreview(null);
        if (pos && onMove) onMove(item, pos);
      },
    };
  }

  return (
    <div
      data-mapa-canvas
      onClick={handleImageClick}
      className={`relative w-full rounded-xl overflow-hidden border border-e-border select-none ${onCreateAt ? 'cursor-crosshair' : ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={proxyUrl(imageUrl)} alt={alt} className="w-full h-auto block pointer-events-none" draggable={false} />
      {fundo && <div className="absolute inset-0 pointer-events-none">{fundo}</div>}
      {items.map((item) => {
        const arrastando = draggingId === item.id;
        const pos = arrastando && dragPreview ? dragPreview : { x: item.x, y: item.y };
        return <div key={item.id} className="contents">{renderItem(item, pos, alcaDe(item), arrastando)}</div>;
      })}
    </div>
  );
}
