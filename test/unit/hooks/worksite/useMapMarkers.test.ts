import * as L from 'leaflet';
import { Container } from 'pixi.js';
import useMapMarkers from '@/hooks/worksite/useMapMarkers';
import type Worksite from '@/models/Worksite';

vi.mock('@/utils/map', () => ({ getMarkerLayer: vi.fn() }));
vi.mock('@/hooks/worksite/useRenderedMarkers', () => ({ default: vi.fn() }));
vi.mock('@/store', () => ({ store: { commit: vi.fn() } }));
vi.mock('leaflet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('leaflet')>()),
  popup: vi.fn(),
}));

it('renders case names as text in map popups', async () => {
  vi.useFakeTimers();
  const popup = {
    setLatLng: vi.fn().mockReturnThis(),
    setContent: vi.fn().mockReturnThis(),
    openOn: vi.fn().mockReturnThis(),
  };
  vi.mocked(L.popup).mockReturnValue(popup as unknown as L.Popup);
  const map = {
    once: vi.fn(),
    setView: vi.fn(),
    panBy: vi.fn(),
    closePopup: vi.fn(),
  } as unknown as L.Map;
  const utils = useMapMarkers(map, vi.fn(), () => new Container(), vi.fn());
  try {
    await utils.jumpToCase(
      {
        id: 1,
        name: '<img src=x onerror=alert(1)>',
        case_number: 'AB-123',
        latitude: 35,
        longitude: -80,
      } as Worksite,
      true,
    );
    const content = popup.setContent.mock.calls[0][0] as HTMLElement;
    expect(content.textContent).toBe('<img src=x onerror=alert(1)> (AB-123)');
    expect(content.children).toHaveLength(0);
  } finally {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  }
});
