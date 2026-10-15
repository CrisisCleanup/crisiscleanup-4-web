import type { Sprite } from 'pixi.js';
import { Container } from 'pixi.js';
import KDBush from 'kdbush';
import { latLng, point, type Map as LeafletMap } from 'leaflet';
import useRenderedMarkers from '@/hooks/worksite/useRenderedMarkers';
import type Worksite from '@/models/Worksite';
import type { MarkerLayer } from '@/utils/types/map';
import { store } from '@/store';

vi.mock('@/store', () => ({
  store: { getters: { 'worksite/visitedWorksiteIds': [] } },
}));

const pendingTextures = vi.hoisted(() => ({ value: false }));

vi.mock('pixi.js', async (importOriginal) => {
  const pixi = await importOriginal<typeof import('pixi.js')>();
  return {
    ...pixi,
    BaseTexture: class extends pixi.BaseTexture {
      constructor() {
        super(
          new pixi.BufferResource(new Uint8Array(4), { width: 1, height: 1 }),
        );
        if (pendingTextures.value) this.valid = false;
      }
    },
  };
});

function marker(id: number, latitude = 0, longitude = 0) {
  return {
    id,
    case_number: `CASE-${id}`,
    location: { coordinates: [longitude, latitude] },
    work_types: [{ work_type: 'tree', status: 'open_unassigned' }],
    updated_at: '2026-09-08',
  } as unknown as Sprite & Worksite;
}

function setup(
  markers: Array<Sprite & Worksite>,
  initialLongitude = 0,
  initialZoom = 18,
) {
  const container = new Container();
  let longitude = initialLongitude;
  let zoom = initialZoom;
  const project = vi.fn(([lat, lng]: number[]) =>
    point(500 + (lng - longitude) * 1000, 350 - lat * 1000),
  );
  const layer = {
    key: 'marker_layer',
    _pixiContainer: container,
    utils: { latLngToLayerPoint: project, getScale: () => 1 },
    requestRedraw: vi.fn(),
  } as unknown as MarkerLayer;
  const map = {
    eachLayer: (cb: (value: MarkerLayer) => void) => cb(layer),
    getZoom: () => zoom,
    getCenter: () => latLng(0, longitude),
    getSize: () => point(1000, 700),
    latLngToContainerPoint: project,
    containerPointToLatLng: ([x, y]: number[]) =>
      latLng((350 - y) / 1000, (x - 500) / 1000 + longitude),
  } as unknown as LeafletMap;
  const renderer = useRenderedMarkers(
    map,
    markers,
    markers.map((m) => String(m.id)),
  );
  const draw = () => layer.prepareMarkers!();
  draw();
  project.mockClear();
  return {
    container,
    project,
    layer,
    renderer,
    draw,
    panTo: (lng: number) => {
      longitude = lng;
      draw();
    },
    zoomTo: (value: number) => {
      zoom = value;
      draw();
    },
  };
}

beforeEach(() => {
  pendingTextures.value = false;
  store.getters['worksite/visitedWorksiteIds'] = [];
});
afterEach(() => vi.restoreAllMocks());

it('updates a visited sprite without appending another sprite or revealing it', () => {
  const item = marker(1);
  const { container, renderer, draw } = setup([item]);
  const sprite = container.children[0];
  sprite.visible = false;
  store.getters['worksite/visitedWorksiteIds'] = [1];
  renderer.renderMarkerSprite(item, 0);
  renderer.renderMarkerSprite(item, 0);
  draw();
  expect(renderer.sprites).toEqual([sprite]);
  expect(sprite.visible).toBe(false);
  expect(container.children).toHaveLength(0);
});

it('limits hover projections to cases inside the pixel hit area', () => {
  const markers = Array.from({ length: 10_000 }, (_, id) =>
    marker(id, 1 + id / 10_000, 1),
  );
  markers.push(marker(10_001, 0.01, 0));
  const { renderer, project } = setup(markers);
  expect(renderer.findMarker(latLng(0, 0))?.id).toBe('10001');
  expect(project.mock.calls.length).toBeLessThan(10);
});

it('ignores hidden sprites and rejects points outside the circular hit area', () => {
  const { container, renderer } = setup([
    marker(1),
    marker(2, 0.01, 0),
    marker(3, 0.024, 0.024),
  ]);
  container.children[0].visible = false;
  expect(renderer.findMarker(latLng(0, 0))?.id).toBe('2');
  container.children[1].visible = false;
  expect(renderer.findMarker(latLng(0, 0))).toBeUndefined();
});

it('finds a nearby marker across the antimeridian and on a wrapped world', () => {
  const { renderer, panTo } = setup([marker(1, 0, -179.995)], 179.995);
  expect(renderer.findMarker(latLng(0, 179.995))?.id).toBe('1');
  panTo(539.995);
  expect(renderer.findMarker(latLng(0, 539.995))?.id).toBe('1');
});

it('reuses sprites and the spatial index when filters or record order change', () => {
  const items = [marker(1), marker(2, 0.01)];
  const { renderer, draw } = setup(items);
  const original = [...renderer.sprites];
  const finish = vi.spyOn(KDBush.prototype, 'finish');
  renderer.updateMarkers([...items].reverse(), ['2']);
  draw();
  expect(renderer.sprites).toEqual(original);
  expect(renderer.sprites.map((sprite) => sprite.alpha)).toEqual([0.3, 1]);
  renderer.updateMarkers(items, ['1', '2']);
  draw();
  expect(renderer.sprites.map((sprite) => sprite.alpha)).toEqual([1, 1]);
  expect(finish).not.toHaveBeenCalled();
});

it('keeps slider visibility independent of panning and includes newly visible cases', () => {
  const { container, renderer, panTo } = setup([
    marker(1),
    marker(2, 0, 5),
    marker(3, 0, 5.01),
  ]);
  expect(
    container.children.map((sprite) => (sprite as Sprite & Worksite).id),
  ).toEqual([1]);
  expect(renderer.sprites).toHaveLength(3);
  renderer.sprites[1].visible = false;
  panTo(5);
  expect(
    container.children.map((sprite) => (sprite as Sprite & Worksite).id),
  ).toEqual([3]);
  panTo(0);
  expect(
    container.children.map((sprite) => (sprite as Sprite & Worksite).id),
  ).toEqual([1]);
  expect(renderer.sprites[1].visible).toBe(false);
});

it('updates hit testing after moving a case and removes deleted or invalid cases', () => {
  const { renderer, draw } = setup([marker(1), marker(2, 0.1)]);
  renderer.renderMarkerSprite(marker(1, 0, 0.1), 0);
  draw();
  expect(renderer.findMarker(latLng(0, 0))).toBeUndefined();
  expect(renderer.findMarker(latLng(0, 0.1))?.id).toBe('1');
  const invalid = { ...marker(3), location: undefined } as unknown as Sprite &
    Worksite;
  renderer.updateMarkers([invalid, marker(4, Number.NaN)], []);
  draw();
  expect(renderer.sprites).toHaveLength(0);
  expect(renderer.findMarker(latLng(0, 0.1))).toBeUndefined();
});

it('creates detailed textures only at interactive zoom and destroys owned textures on disposal', () => {
  const { renderer, zoomTo, container } = setup(
    [marker(1), marker(2, 0.01)],
    0,
    10,
  );
  expect(renderer.sprites).toHaveLength(2);
  expect(renderer.sprites[0].detailedTexture).toBeUndefined();
  const basic = renderer.sprites[0].basicTexture!;
  expect(renderer.sprites[1].basicTexture).toBe(basic);
  zoomTo(12);
  const detailed = renderer.sprites[0].detailedTexture!;
  expect(detailed.valid).toBe(true);
  renderer.dispose();
  expect(basic.valid).toBe(false);
  expect(detailed.valid).toBe(false);
  expect(container.children).toHaveLength(0);
  renderer.dispose();
});

it('does not evict textures still used by sprites after the cache exceeds its limit', () => {
  const { renderer, draw } = setup([marker(1)]);
  const items = Array.from({ length: 520 }, (_, id) => {
    const item = marker(id);
    item.work_types[0].work_type = `type-${id}`;
    return item;
  });
  renderer.updateMarkers(
    items,
    items.map((item) => String(item.id)),
  );
  draw();
  expect(renderer.sprites).toHaveLength(520);
  expect(
    renderer.sprites.every((sprite) => sprite.detailedTexture?.valid),
  ).toBe(true);
  renderer.dispose();
});

it('redraws after asynchronous texture loading without moving the map', () => {
  pendingTextures.value = true;
  const { renderer, layer } = setup([marker(1)]);
  const baseTexture = renderer.sprites[0].basicTexture!.baseTexture;
  vi.mocked(layer.requestRedraw).mockClear();
  baseTexture.emit('loaded', baseTexture);
  expect(layer.requestRedraw).toHaveBeenCalledTimes(1);
  renderer.dispose();
  baseTexture.emit('loaded', baseTexture);
  expect(layer.requestRedraw).toHaveBeenCalledTimes(1);
});

it('keeps textures on a second map alive when the first map is removed', () => {
  const first = setup([marker(1)]);
  const second = setup([marker(1)]);
  const texture = second.renderer.sprites[0].basicTexture!;
  expect(texture).not.toBe(first.renderer.sprites[0].basicTexture);
  first.renderer.dispose();
  expect(texture.valid).toBe(true);
  second.renderer.dispose();
});
