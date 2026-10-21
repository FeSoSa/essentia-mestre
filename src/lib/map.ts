export const ROOT_MAP_ID = 'essentia-root';

/**
 * Marcador com imagem própria (dá para entrar nele). Sem imagem o regionId fica
 * vazio; nos dados antigos, um ponto sem imagem apontava para o próprio mapa.
 */
export function temImagemPropria(m: { mapId: string; regionId: string }): boolean {
  return !!m.regionId && m.regionId !== m.mapId;
}
