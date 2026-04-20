/// <reference types="google.maps" />
import { loadScript } from './scriptLoader';

type GoogleMapsNs = typeof google.maps;
type GoogleWindow = typeof window & { google?: { maps?: GoogleMapsNs } };

let mapsPromise: Promise<GoogleMapsNs> | null = null;

const FALLBACK_KEY = 'AIzaSyBuQPeETkH_q3QE00PeC3g8bHAyVseh7FY';

export function loadGoogleMaps(): Promise<GoogleMapsNs> {
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise<GoogleMapsNs>((resolve, reject) => {
    const w = window as GoogleWindow;
    if (w.google?.maps) {
      resolve(w.google.maps);
      return;
    }
    const cbName = '__ccuMapsCallback';
    (window as unknown as Record<string, unknown>)[cbName] = () => {
      resolve((window as GoogleWindow).google.maps);
    };
    const key = import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY || FALLBACK_KEY;
    loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${cbName}`,
      { async: true, defer: true },
    ).catch(reject);
  });
  return mapsPromise;
}
