import { Sprite, Texture } from 'pixi.js';
import KDBush from 'kdbush';
import * as turf from '@turf/turf';
import type * as L from 'leaflet';
import type { Feature, Point, Properties } from '@turf/turf';
import moment from 'moment';
import { templates, colors } from '../../icons/icons_templates';
import type Worksite from '@/models/Worksite';
import type { PixiLayer } from '@/utils/types/map';
import { SVG_STROKE_WIDTH } from '@/constants';
import { store } from '@/store';

const INTERACTIVE_ZOOM_LEVEL = 12;
const TEXTURE_CACHE_SIZE = 500;

interface KDBushPoint {
  x: number;
  y: number;
  id: string;
  case_number: string;
  address: string;
  work_types: any[];
}

// Simple texture cache without complex LRU for debugging
class TextureCache {
  private cache = new Map<string, Texture>();

  get(key: string): Texture | undefined {
    return this.cache.get(key);
  }

  set(key: string, texture: Texture): void {
    if (this.cache.size > TEXTURE_CACHE_SIZE) {
      // Simple cleanup - remove oldest entries
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        const oldTexture = this.cache.get(firstKey);
        if (oldTexture) {
          oldTexture.destroy(true);
        }
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, texture);
  }

  clear(): void {
    for (const texture of this.cache.values()) {
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
  const textureCache = new TextureCache();
  let workTypes: Record<string, any> = {};
  let points: KDBushPoint[] = [];
  let kdBushIndex: KDBush;

  // Convert visibleMarkerIds to Set for O(1) lookup instead of O(n) array.includes
  const visibleMarkerSet = new Set(visibleMarkerIds.map((id) => id.toString()));

  function renderMarkerSprite(marker: Sprite & Worksite, index: number) {
    map.eachLayer((layer: L.Layer) => {
      if ((layer as L.Layer & PixiLayer).key === 'marker_layer') {
        const markerTemplate = templates.circle;
        let sprite = new Sprite() as any;

        const workType = marker.key_work_type || marker.work_types[0];
        const colorsKey = `${workType.status}_${
          workType.claimed_by ? 'claimed' : 'unclaimed'
        }`;
        const spriteColors = colors[colorsKey];
        const { fillColor, strokeColor } = spriteColors;

        const { location } = marker;
        const patientCoords = (
          layer as L.Layer & PixiLayer
        ).utils.latLngToLayerPoint([
          location.coordinates[1],
          location.coordinates[0],
        ]);

        sprite = new Sprite();
        sprite.index = index;
        sprite.id = marker.id;

        // Use Set lookup instead of array.includes for O(1) performance
        const markerId = marker.id.toString();
        const isFilteredMarker = !visibleMarkerSet.has(markerId);

        // Get fresh visited worksite IDs from store for each marker to ensure updates
        const visitedWorksiteIds = store.getters['worksite/visitedWorksiteIds'];
        const isVisitedMarker = visitedWorksiteIds.includes(marker.id);

        if (isFilteredMarker) {
          sprite.zIndex = 0;
          sprite.alpha = 0.3;
        }

        sprite.svi = marker.svi;
        sprite.work_types = marker.work_types;
        sprite.updated_at = marker.updated_at;
        sprite.photos_count = (marker as any).photos_count || 0;
        sprite.flags = marker.flags || [];
        sprite.favorite_id = marker.favorite_id;
        sprite.updated_at_moment = moment(marker.updated_at);
        sprite.x = patientCoords.x;
        sprite.y = patientCoords.y;
        sprite.x0 = patientCoords.x;
        sprite.y0 = patientCoords.y;
        sprite.anchor.set(0.5, 0.5);

        // Generate basic texture with caching
        const basicTextureKey = `${fillColor}_${isFilteredMarker}_${isVisitedMarker}_basic`;
        let texture = textureCache.get(basicTextureKey);

        if (!texture) {
          const svg = markerTemplate
            .replaceAll('{{fillColor}}', isFilteredMarker ? 'white' : fillColor)
            .replaceAll(
              '{{strokeWidth}}',
              isVisitedMarker ? '2' : SVG_STROKE_WIDTH.toString(),
            )
            .replaceAll(
              '{{strokeColor}}',
              isVisitedMarker
                ? '#9370db'
                : isFilteredMarker
                  ? fillColor
                  : 'white',
            );

          texture = Texture.from(svg);
          textureCache.set(basicTextureKey, texture);
        }

        sprite.texture = texture;
        sprite.visible = true;
        sprite.color = fillColor;
        sprite.strokeColor = strokeColor;
        sprite.workTypeKey = workType?.work_type;

        if (workType?.work_type) {
          workTypes[workType?.work_type] = true;
          workTypes = { ...workTypes };
        }

        // Determine detailed template
        let detailedTemplate =
          templates[workType?.work_type] || templates.unknown;
        const flags = sprite.flags || [];
        const isHighPriority = flags.some(
          (flag: { is_high_priority: boolean }) => flag.is_high_priority,
        );

        if (sprite.favorite || sprite.favorite_id) {
          detailedTemplate = templates.favorite;
        } else if (isHighPriority) {
          detailedTemplate = templates.important;
        }

        // Generate detailed texture with caching
        const detailedTextureKey = `${fillColor}_${isFilteredMarker}_${isVisitedMarker}_${workType?.work_type}_detailed`;
        let detailedTexture = textureCache.get(detailedTextureKey);

        if (!detailedTexture) {
          const typeSvg = detailedTemplate
            .replaceAll('{{fillColor}}', isFilteredMarker ? 'white' : fillColor)
            .replaceAll(
              '{{strokeWidth}}',
              isVisitedMarker ? '5' : SVG_STROKE_WIDTH.toString(),
            )
            .replaceAll(
              '{{strokeColor}}',
              isVisitedMarker
                ? '#9370db'
                : isFilteredMarker
                  ? fillColor
                  : 'white',
            )
            .replaceAll(
              '{{multiple}}',
              sprite.work_types.length > 1 ? templates.plus : '',
            )
            .replaceAll(
              '{{camera}}',
              sprite.photos_count > 0 ? templates.camera : '',
            );

          detailedTexture = Texture.from(typeSvg);
          textureCache.set(detailedTextureKey, detailedTexture);
        }

        sprite.basicTexture = texture;
        sprite.detailedTexture = detailedTexture;

        (layer as L.Layer & PixiLayer)._pixiContainer.addChild(sprite);
      }
    });
  }

  function calculateKdBushIndex() {
    points = markers.map(function (marker) {
      return {
        x: Number.parseFloat(marker.location.coordinates[1]),
        y: Number.parseFloat(marker.location.coordinates[0]),
        id: marker.id.toString(),
        case_number: marker.case_number,
        address: marker.address,
        work_types: marker.work_types,
      };
    });

    kdBushIndex = new KDBush(points.length, 64, Float64Array);
    for (const { x, y } of points) {
      kdBushIndex.add(x, y);
    }
    kdBushIndex.finish();
  }

  function calcDist(a: Feature<Point>, b: Feature<Point>) {
    const p1 = map.latLngToContainerPoint([
      a.geometry.coordinates[1],
      a.geometry.coordinates[0],
    ]);
    const p2 = map.latLngToContainerPoint([
      b.geometry.coordinates[1],
      b.geometry.coordinates[0],
    ]);

    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.hypot(dx, dy);
  }

  function findMarker(latlng: L.LatLng) {
    if (map.getZoom() < INTERACTIVE_ZOOM_LEVEL) {
      return null;
    }

    const results = kdBushIndex
      ?.within(latlng.lat, latlng.lng, 5)
      .map((id: number) => points[id]);
    let minDist = Number.MAX_VALUE;
    let minpxDist = 0;
    let minDistItem = null;
    if (results.length > 0) {
      for (const d of results) {
        const mouseCursor = turf.point([latlng.lng, latlng.lat]);
        const toPoint = turf.point([d.y, d.x]);

        const dist = turf.distance(mouseCursor, toPoint);
        const pxDist = calcDist(mouseCursor, toPoint);
        if (dist < minDist) {
          minDist = dist;
          minDistItem = d;
          minpxDist = pxDist;
        }
      }
    }

    if (minpxDist < 25) {
      return minDistItem;
    }

    return null;
  }

  calculateKdBushIndex();

  // Render all markers at once - no batching needed
  for (const [i, marker] of markers.entries()) {
    try {
      renderMarkerSprite(marker, i);
    } catch (error) {
      console.log('Error rendering marker:', error);
    }
  }

  // Single refresh after all markers are rendered
  map.panBy([1, 0]);

  return {
    workTypes,
    findMarker,
    renderMarkerSprite,
  };
};
