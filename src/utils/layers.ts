export interface LayerOption {
  id: number | string;
  name: string;
}

/**
 * The layers whose name contains the query, ignoring case, each id once.
 */
export function searchLayers(
  layers: LayerOption[],
  query: string,
): LayerOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const seen = new Set<LayerOption['id']>();
  return layers.filter((layer) => {
    if (seen.has(layer.id) || !layer.name?.toLowerCase().includes(needle)) {
      return false;
    }

    seen.add(layer.id);
    return true;
  });
}
