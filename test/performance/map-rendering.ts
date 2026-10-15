import * as L from 'leaflet';
import type { Sprite } from 'pixi.js';
import useMapMarkers from '../../src/hooks/worksite/useMapMarkers';
import useMapLayers from '../../src/hooks/worksite/useMapLayers';
import type Worksite from '../../src/models/Worksite';

const map = L.map('benchmark-map', {
  zoomAnimation: false,
  maxZoom: 18,
}).setView([35, -80], 12);
const layers = useMapLayers(map);
const markers = Array.from({ length: 10_000 }, (_, id) => ({
  id,
  case_number: `BENCH-${id}`,
  location: {
    coordinates: [-81 + (id % 100) * 0.02, 34 + Math.floor(id / 100) * 0.02],
  },
  work_types: [{ work_type: 'tree', status: 'open_unassigned' }],
  updated_at: '2026-09-08',
})) as unknown as Array<Sprite & Worksite>;
const ids = markers.map(({ id }) => String(id));
const filteredIds = ids.filter((_, index) => index % 2 === 0);
const controls = useMapMarkers(
  map,
  () => {},
  layers.getPixiContainer,
  layers.removeLayer,
);
let renders = 0;
let renderMs = 0;
let lastRender = 0;
const instrumented = new WeakSet();
const addLayer = map.addLayer;
map.addLayer = function (layer: L.Layer) {
  const pixiLayer = layer as any;
  if (pixiLayer._drawCallback) {
    const draw = pixiLayer._drawCallback;
    pixiLayer._drawCallback = function (utils: any, ...args: any[]) {
      const renderer = utils.getRenderer();
      if (!instrumented.has(renderer)) {
        instrumented.add(renderer);
        const render = renderer.render;
        renderer.render = function (...renderArgs: any[]) {
          const start = performance.now();
          try {
            return render.apply(this, renderArgs);
          } finally {
            renders++;
            renderMs += performance.now() - start;
            lastRender = performance.now();
          }
        };
      }
      return draw(utils, ...args);
    };
  }
  return addLayer.call(this, layer);
};

async function measure(action: () => void) {
  renders = 0;
  renderMs = 0;
  const start = performance.now();
  lastRender = start;
  action();
  const synchronousMs = performance.now() - start;
  // Wait for texture loads and animation frames, without counting the idle tail.
  await new Promise<void>((resolve) => {
    const check = () => {
      if (
        performance.now() - start >= 500 &&
        performance.now() - lastRender >= 100
      )
        resolve();
      else setTimeout(check, 25);
    };
    check();
  });
  if (renders === 0) {
    throw new Error('No frames rendered. Check browser animation scheduling.');
  }
  return {
    synchronousMs,
    untilLastRenderMs: lastRender - start,
    renderMs,
    renders,
  };
}

async function run() {
  layers.removeLayer('marker_layer');
  map.setView([35, -80], 12, { animate: false });
  const initial = await measure(() => controls.setupMarkers(markers, ids));
  const samples = [];
  for (let iteration = 0; iteration < 7; iteration++) {
    const pan = await measure(() =>
      map.panBy([iteration % 2 ? -80 : 80, 0], { animate: false }),
    );
    const filter = await measure(() =>
      controls.setupMarkers(markers, iteration % 2 ? ids : filteredIds),
    );
    const zoom = await measure(() =>
      map.setZoom(iteration % 2 ? 12 : 13, { animate: false }),
    );
    samples.push({ pan, filter, zoom });
  }
  const result = {
    userAgent: navigator.userAgent,
    size: map.getSize(),
    count: markers.length,
    initial,
    samples,
  };
  document.querySelector('#results')!.textContent = JSON.stringify(
    result,
    undefined,
    2,
  );
  return result;
}

Object.assign(window, {
  benchmark: { run, map, controls, layers, markers, ids, filteredIds },
});
document.querySelector('#results')!.textContent =
  'Ready: await benchmark.run()';
