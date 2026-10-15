import * as L from 'leaflet';
import { Sprite, Texture } from 'pixi.js';
import { getMarkerLayer } from '@/utils/map';
import type { MarkerLayer } from '@/utils/types/map';

vi.mock('leaflet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('leaflet')>()),
  pixiOverlay: vi.fn(),
}));

function setup() {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  let zoom = 12;
  let scale = 1;
  let draw: () => void;
  const render = vi.fn();
  const destroy = vi.fn();
  const map = { hasLayer: () => true } as unknown as L.Map;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.mocked(L.pixiOverlay).mockImplementation((callback, container) => {
    const layer = new L.Layer() as MarkerLayer;
    layer.destroy = destroy;
    layer._pixiContainer = container;
    draw = () =>
      callback({
        getMap: () => ({ getZoom: () => zoom }),
        getScale: () => scale,
        getContainer: () => container,
        getRenderer: () => ({ render }),
      } as any);
    layer.redraw = draw;
    return layer as any;
  });
  const layer = getMarkerLayer([], map, {});
  const sprite = new Sprite(Texture.EMPTY);
  layer._pixiContainer.addChild(sprite);
  const frame = (timestamp: number) => {
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback(timestamp);
  };
  return {
    layer,
    sprite,
    render,
    destroy,
    frames,
    frame,
    draw: () => draw(),
    zoomTo: () => {
      zoom++;
      scale *= 2;
      draw();
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('renders unchanged zoom once and animates only a scale change', () => {
  const { draw, render, frames, zoomTo, frame, sprite } = setup();
  draw();
  expect(sprite.scale.x).toBe(0.75);
  render.mockClear();
  draw();
  expect(render).toHaveBeenCalledTimes(1);
  expect(frames.size).toBe(0);
  zoomTo();
  expect(frames.size).toBe(1);
  frame(0);
  frame(250);
  expect(sprite.scale.x).toBe(0.375);
  expect(frames.size).toBe(0);
});

it('coalesces redraws and cancels pending work when the layer is removed', () => {
  const { layer, frame, render, destroy, frames } = setup();
  layer.requestRedraw();
  layer.requestRedraw();
  layer.requestRedraw();
  expect(frames.size).toBe(1);
  frame(0);
  expect(render).toHaveBeenCalledTimes(1);
  layer.requestRedraw();
  layer.fire('remove');
  layer.destroy();
  layer.requestRedraw();
  frame(16);
  expect(render).toHaveBeenCalledTimes(1);
  expect(destroy).toHaveBeenCalledTimes(1);
  expect(frames.size).toBe(0);
});
