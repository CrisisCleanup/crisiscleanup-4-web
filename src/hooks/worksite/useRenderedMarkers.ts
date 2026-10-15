import { BaseTexture, Sprite, Texture } from 'pixi.js';
import KDBush from 'kdbush';
import type * as L from 'leaflet';
import moment from '@/utils/dates';
import { resolveStatusColors, templates } from '../../icons/icons_templates';
import { injectElevationFilter } from './useWorktypeImages';
import type Worksite from '@/models/Worksite';
import type { MarkerLayer } from '@/utils/types/map';
import { SVG_STROKE_WIDTH } from '@/constants';
import { store } from '@/store';

const INTERACTIVE_ZOOM_LEVEL = 12;
const HIT_RADIUS = 25;
const TEXTURE_CACHE_SIZE = 500;

interface IndexedPoint {
  x: number;
  y: number;
  id: string;
}

interface KDBushPoint extends IndexedPoint {
  case_number: string;
  address: string;
  work_types: Worksite['work_types'];
}

export interface MapMarkerSprite extends Sprite {
  id: Worksite['id'];
  svi: Worksite['svi'];
  updated_at: Worksite['updated_at'];
  updated_at_moment: ReturnType<typeof moment>;
  basicTexture?: Texture;
  detailedTexture?: Texture;
  basicTextureKey?: string;
  detailedTextureKey?: string;
}

interface CachedTexture {
  texture: Texture;
  users: number;
}

class TextureCache {
  private cache = new Map<string, CachedTexture>();

  constructor(private readonly onLoad: () => void) {}

  acquire(key: string, svg: () => string): Texture {
    let entry = this.cache.get(key);
    if (!entry) {
      // Own the base texture: Texture.from shares it globally with other maps.
      const texture = new Texture(new BaseTexture(svg()));
      if (!texture.baseTexture.valid) {
        texture.baseTexture.once('loaded', this.onLoad);
      }
      entry = { texture, users: 0 };
      this.cache.set(key, entry);
    }
    entry.users++;
    return entry.texture;
  }

  release(key: string | undefined): void {
    if (!key) return;
    const entry = this.cache.get(key);
    if (entry) entry.users--;
  }

  prune(): void {
    for (const [key, entry] of this.cache) {
      if (this.cache.size <= TEXTURE_CACHE_SIZE) break;
      if (entry.users > 0) continue;
      entry.texture.baseTexture.off('loaded', this.onLoad);
      entry.texture.destroy(true);
      this.cache.delete(key);
    }
  }

  clear(): void {
    for (const { texture } of this.cache.values()) {
      texture.baseTexture.off('loaded', this.onLoad);
      texture.destroy(true);
    }
    this.cache.clear();
  }
}

export default (
  map: L.Map,
  markers: Array<Sprite & Worksite>,
  visibleMarkerIds: string[],
) => {
  let markerLayer: MarkerLayer | undefined;
  map.eachLayer((candidate) => {
    if ((candidate as MarkerLayer).key === 'marker_layer') {
      markerLayer = candidate as MarkerLayer;
    }
  });
  if (!markerLayer)
    throw new Error('Marker layer must be added before its markers');
  const layer = markerLayer;
  const container = layer._pixiContainer;
  const textureCache = new TextureCache(() => layer.requestRedraw());
  const spritesById = new Map<string, MapMarkerSprite>();
  let markersById = new Map<string, Sprite & Worksite>();
  let pointsById = new Map<string, IndexedPoint>();
  let points: IndexedPoint[] = [];
  let kdBushIndex = new KDBush(0).finish();
  let visibleMarkerSet = new Set<string>();
  let sprites: MapMarkerSprite[] = [];
  let workTypes: Record<string, boolean> = {};
  let disposed = false;

  function updateTexture(
    sprite: MapMarkerSprite,
    marker: Sprite & Worksite,
    visited: Set<number>,
  ) {
    const workType = marker.key_work_type || marker.work_types[0];
    const { fill } = resolveStatusColors(
      workType.status,
      Boolean(workType.claimed_by),
    );
    const filtered = !visibleMarkerSet.has(String(marker.id));
    const isVisited = visited.has(Number(marker.id));
    sprite.alpha = filtered ? 0.3 : 1;
    const basicKey = `${fill}_${filtered}_${isVisited}_basic`;
    if (sprite.basicTextureKey !== basicKey) {
      const texture = textureCache.acquire(basicKey, () =>
        templates.circle
          .replaceAll('{{fillColor}}', filtered ? 'white' : fill)
          .replaceAll(
            '{{strokeWidth}}',
            isVisited ? '2' : String(SVG_STROKE_WIDTH),
          )
          .replaceAll(
            '{{strokeColor}}',
            isVisited ? '#9370db' : filtered ? fill : 'white',
          ),
      );
      textureCache.release(sprite.basicTextureKey);
      sprite.basicTextureKey = basicKey;
      sprite.basicTexture = texture;
    }
    if (map.getZoom() < INTERACTIVE_ZOOM_LEVEL) {
      sprite.texture = sprite.basicTexture!;
      return;
    }

    const highPriority = marker.flags?.some((flag) => flag.is_high_priority);
    const templateKey =
      marker.favorite || marker.favorite_id
        ? 'favorite'
        : highPriority
          ? 'important'
          : workType.work_type;
    const multiple = marker.work_types.length > 1;
    const photos =
      (marker as Worksite & { photos_count?: number }).photos_count! > 0;
    const detailedKey = `${basicKey}_${templateKey}_${multiple}_${photos}`;
    if (sprite.detailedTextureKey !== detailedKey) {
      const texture = textureCache.acquire(detailedKey, () =>
        injectElevationFilter(
          (templates[templateKey] || templates.unknown)
            .replaceAll('{{fillColor}}', filtered ? 'white' : fill)
            .replaceAll(
              '{{strokeWidth}}',
              isVisited ? '5' : String(SVG_STROKE_WIDTH),
            )
            .replaceAll(
              '{{strokeColor}}',
              isVisited ? '#9370db' : filtered ? fill : 'white',
            )
            .replaceAll('{{multiple}}', multiple ? templates.plus : '')
            .replaceAll('{{camera}}', photos ? templates.camera : ''),
        ),
      );
      textureCache.release(sprite.detailedTextureKey);
      sprite.detailedTextureKey = detailedKey;
      sprite.detailedTexture = texture;
    }
    sprite.texture = sprite.detailedTexture!;
  }

  function range(
    south: number,
    west: number,
    north: number,
    east: number,
  ): number[] {
    const width = east - west;
    if (width >= 360) return kdBushIndex.range(south, -180, north, 180);
    west = ((((west + 180) % 360) + 360) % 360) - 180;
    east = west + width;
    const candidates = kdBushIndex.range(
      south,
      west,
      north,
      Math.min(east, 180),
    );
    if (east > 180)
      candidates.push(...kdBushIndex.range(south, -180, north, east - 360));
    return candidates;
  }

  function prepareMarkers(): MapMarkerSprite[] {
    if (disposed) return [];
    const size = map.getSize();
    const padding = Math.max(size.x, size.y) * 0.1 + HIT_RADIUS;
    const nw = map.containerPointToLatLng([-padding, -padding]);
    const se = map.containerPointToLatLng([size.x + padding, size.y + padding]);
    const candidates = range(se.lat, nw.lng, nw.lat, se.lng);
    const visible = new Set<MapMarkerSprite>();
    const visited = new Set<number>(
      store.getters['worksite/visitedWorksiteIds'],
    );
    const center = map.getCenter().lng;
    for (const index of candidates) {
      const point = points[index];
      const sprite = spritesById.get(point.id)!;
      // Slider visibility belongs to the full case list, independently of the viewport.
      if (!sprite.visible) continue;
      visible.add(sprite);
      const longitude = point.y + 360 * Math.round((center - point.y) / 360);
      const position = layer.utils.latLngToLayerPoint([point.x, longitude]);
      sprite.position.set(position.x, position.y);
      updateTexture(sprite, markersById.get(point.id)!, visited);
      if (!sprite.parent) {
        sprite.scale.set(0.75 / layer.utils.getScale());
        container.addChild(sprite);
      }
    }
    for (const sprite of [...container.children] as MapMarkerSprite[]) {
      if (!visible.has(sprite)) {
        // Pixi sprites do not implement the DOM remove() method.
        // eslint-disable-next-line unicorn/prefer-dom-node-remove
        container.removeChild(sprite);
      }
    }
    textureCache.prune();
    return container.children as MapMarkerSprite[];
  }

  function removeSprite(id: string) {
    const sprite = spritesById.get(id)!;
    textureCache.release(sprite.basicTextureKey);
    textureCache.release(sprite.detailedTextureKey);
    sprite.destroy();
    spritesById.delete(id);
  }

  function updateMarkers(
    nextMarkers: Array<Sprite & Worksite>,
    visibleIds: string[],
  ) {
    if (disposed) return;
    const nextPoints = new Map<string, IndexedPoint>();
    const nextMarkersById = new Map<string, Sprite & Worksite>();
    const nextWorkTypes: Record<string, boolean> = {};
    let coordinatesChanged = false;
    for (const marker of nextMarkers) {
      const coordinates = marker.location?.coordinates;
      const workType = marker.key_work_type || marker.work_types?.[0];
      if (!coordinates || !workType) continue;
      const x = Number.parseFloat(String(coordinates[1]));
      const y = Number.parseFloat(String(coordinates[0]));
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        Math.abs(x) > 90 ||
        Math.abs(y) > 180
      )
        continue;
      const id = String(marker.id);
      const previousPoint = pointsById.get(id);
      const point =
        previousPoint?.x === x && previousPoint.y === y
          ? previousPoint
          : { id, x, y };
      if (point !== previousPoint) coordinatesChanged = true;
      nextPoints.set(id, point);
      nextMarkersById.set(id, marker);
      nextWorkTypes[workType.work_type] = true;
      let sprite = spritesById.get(id);
      if (!sprite) {
        sprite = new Sprite() as MapMarkerSprite;
        sprite.id = marker.id;
        sprite.anchor.set(0.5);
        spritesById.set(id, sprite);
      }
      sprite.svi = marker.svi;
      if (
        sprite.updated_at !== marker.updated_at ||
        !sprite.updated_at_moment
      ) {
        sprite.updated_at = marker.updated_at;
        sprite.updated_at_moment = moment(marker.updated_at);
      }
    }
    for (const id of spritesById.keys()) {
      if (!nextPoints.has(id)) removeSprite(id);
    }
    if (coordinatesChanged || nextPoints.size !== pointsById.size) {
      points = [...nextPoints.values()];
      kdBushIndex = new KDBush(points.length, 64, Float64Array);
      for (const { x, y } of points) kdBushIndex.add(x, y);
      kdBushIndex.finish();
    }
    pointsById = nextPoints;
    markersById = nextMarkersById;
    workTypes = nextWorkTypes;
    sprites = [...spritesById.values()];
    visibleMarkerSet = new Set(visibleIds.map(String));
    layer.requestRedraw();
  }

  function renderMarkerSprite(marker: Sprite & Worksite, _index: number) {
    const id = String(marker.id);
    const previous = pointsById.get(id);
    if (
      !(marker.key_work_type || marker.work_types?.[0]) ||
      !previous ||
      Number(marker.location?.coordinates[1]) !== previous.x ||
      Number(marker.location?.coordinates[0]) !== previous.y
    ) {
      const updated = new Map(markersById);
      updated.set(id, marker);
      updateMarkers([...updated.values()], [...visibleMarkerSet]);
    } else {
      markersById.set(id, marker);
      const sprite = spritesById.get(id)!;
      sprite.svi = marker.svi;
      sprite.updated_at = marker.updated_at;
      sprite.updated_at_moment = moment(marker.updated_at);
      layer.requestRedraw();
    }
  }

  function findMarker(latlng: L.LatLng): KDBushPoint | undefined {
    if (
      disposed ||
      !container.visible ||
      map.getZoom() < INTERACTIVE_ZOOM_LEVEL
    )
      return;
    const cursor = map.latLngToContainerPoint([latlng.lat, latlng.lng]);
    const nw = map.containerPointToLatLng([
      cursor.x - HIT_RADIUS,
      cursor.y - HIT_RADIUS,
    ]);
    const se = map.containerPointToLatLng([
      cursor.x + HIT_RADIUS,
      cursor.y + HIT_RADIUS,
    ]);
    const candidates = range(
      Math.min(nw.lat, se.lat),
      nw.lng,
      Math.max(nw.lat, se.lat),
      se.lng,
    );
    let nearest: IndexedPoint | undefined;
    let nearestDistance = HIT_RADIUS ** 2;
    for (const index of candidates) {
      const candidate = points[index];
      const sprite = spritesById.get(candidate.id);
      if (!sprite?.visible || !sprite.parent?.visible) continue;
      const longitude =
        candidate.y + 360 * Math.round((latlng.lng - candidate.y) / 360);
      const position = map.latLngToContainerPoint([candidate.x, longitude]);
      const distance =
        (position.x - cursor.x) ** 2 + (position.y - cursor.y) ** 2;
      if (distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }
    if (nearest) {
      const marker = markersById.get(nearest.id)!;
      return {
        ...nearest,
        case_number: marker.case_number,
        address: marker.address,
        work_types: marker.work_types,
      };
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const id of spritesById.keys()) removeSprite(id);
    textureCache.clear();
    markersById.clear();
    pointsById.clear();
    points = [];
    sprites = [];
    kdBushIndex = new KDBush(0).finish();
  }

  layer.prepareMarkers = prepareMarkers;
  layer.disposeMarkers = dispose;
  updateMarkers(markers, visibleMarkerIds);
  return {
    get workTypes() {
      return workTypes;
    },
    get sprites() {
      return sprites;
    },
    findMarker,
    renderMarkerSprite,
    updateMarkers,
    dispose,
  };
};
