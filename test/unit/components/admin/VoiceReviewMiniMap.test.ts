import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import VoiceReviewMiniMap from '@/components/admin/voice/VoiceReviewMiniMap.vue';
import useEmitter from '@/hooks/useEmitter';

// A stand-in for Leaflet that records the pin and the boundary.
const leaflet = vi.hoisted(() => {
  const state = {
    pin: undefined as number[] | undefined,
    dragEnd: undefined as ((event: unknown) => void) | undefined,
    boundaries: [] as unknown[],
  };
  const layer = () => ({ addTo: () => layer(), remove: vi.fn() });
  const map = {
    setView: vi.fn(() => map),
    panTo: vi.fn(),
    invalidateSize: vi.fn(),
    getZoom: () => 4,
    fitBounds: vi.fn(),
    remove: vi.fn(),
  };
  return {
    state,
    module: {
      Map: vi.fn(() => map),
      tileLayer: vi.fn(layer),
      divIcon: vi.fn(),
      geoJSON: vi.fn((features: unknown[]) => {
        state.boundaries = features;
        const boundary = {
          addTo: () => boundary,
          remove: vi.fn(),
          getBounds: vi.fn(),
        };
        return boundary;
      }),
      marker: vi.fn((latLng: number[]) => {
        state.pin = latLng;
        const marker = {
          addTo: () => marker,
          getLatLng: () => state.pin,
          setLatLng: (next: number[]) => {
            state.pin = next;
          },
          on: (_event: string, handler: (event: unknown) => void) => {
            state.dragEnd = handler;
          },
          remove: vi.fn(),
        };
        return marker;
      }),
    },
  };
});
vi.mock('leaflet', () => leaflet.module);
// The real module loads Leaflet plugins that need the browser global `L`.
vi.mock('@/utils/map', () => ({ mapTileLayer: 'tiles', mapAttribution: '' }));

describe('VoiceReviewMiniMap', () => {
  it('follows the case location, shows the area, and sends pin drags to the form', async () => {
    const square = { type: 'Polygon', coordinates: [] };
    const wrapper = mount(VoiceReviewMiniMap, {
      props: { coordinates: [-95.99, 36.15], boundaries: [square] },
    });
    await flushPromises();
    expect(leaflet.state.pin).toEqual([36.15, -95.99]);
    expect(leaflet.state.boundaries).toEqual([
      { type: 'Feature', properties: {}, geometry: square },
    ]);

    await wrapper.setProps({ coordinates: [-95.98, 36.16] });
    expect(leaflet.state.pin).toEqual([36.16, -95.98]);

    const moved: unknown[] = [];
    useEmitter().emitter.on('updatedWorksiteLocation', (latLng) =>
      moved.push(latLng),
    );
    leaflet.state.dragEnd?.({
      target: { getLatLng: () => ({ lat: 36.2, lng: -95.9 }) },
    });
    expect(moved).toEqual([{ lat: 36.2, lng: -95.9 }]);
  });
});
