import * as L from 'leaflet';
import useMapLayers from '@/hooks/worksite/useMapLayers';
import type { PixiLayer } from '@/utils/types/map';

describe('useMapLayers', () => {
  it('registers the leaflet.heat plugin on the leaflet namespace', () => {
    // Regression: useMapLayers must import 'leaflet.heat' itself. Relying on
    // another chunk (e.g. useWorksiteMap) to register the plugin caused
    // "TypeError: L.heatLayer is not a function" at runtime.
    expect(typeof L.heatLayer).toBe('function');
  });

  it('addHeatMap adds a heat layer keyed as heat_layer', () => {
    const addLayer = vi.fn();
    const map = { addLayer } as unknown as L.Map;
    const { addHeatMap } = useMapLayers(map);

    addHeatMap([L.latLng(35.2271, -80.8431)]);

    expect(addLayer).toHaveBeenCalledTimes(1);
    const layer = addLayer.mock.calls[0][0] as L.Layer & PixiLayer;
    expect(layer.key).toBe('heat_layer');
  });
});
