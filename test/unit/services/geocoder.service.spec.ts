import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks must be declared before importing the service under test.
const storeState: { autocompleteToken: unknown } = { autocompleteToken: null };
const commitSpy = vi.fn((mutation: string, value: unknown) => {
  if (mutation === 'map/setAutocompleteToken') {
    storeState.autocompleteToken = value;
  }
});

vi.mock('@/store', () => ({
  store: {
    getters: {
      get 'map/autocompleteToken'() {
        return storeState.autocompleteToken;
      },
    },
    commit: commitSpy,
  },
}));

const sentryCaptureMessageSpy = vi.fn();
vi.mock('@sentry/vue', () => ({
  captureMessage: sentryCaptureMessageSpy,
}));

// --- Google Maps Places stubs ---------------------------------------------

class FakeAutocompleteSessionToken {
  constructor() {}
}

let nextPredictionsResult: {
  results: unknown;
  status: string;
} = { results: [], status: 'OK' };
const getPlacePredictionsSpy = vi.fn(
  (
    _req: { input: string; sessionToken: unknown },
    cb: (results: unknown, status: string) => void,
  ) => {
    cb(nextPredictionsResult.results, nextPredictionsResult.status);
  },
);

class FakeAutocompleteService {
  getPlacePredictions = getPlacePredictionsSpy;
}

let nextDetailsResult: {
  place: unknown;
  status: string;
} = { place: null, status: 'OK' };
const getDetailsSpy = vi.fn(
  (_req: unknown, cb: (place: unknown, status: string) => void) => {
    cb(nextDetailsResult.place, nextDetailsResult.status);
  },
);

class FakePlacesService {
  getDetails = getDetailsSpy;
}

class FakeMap {
  constructor(_div: HTMLElement, _opts: unknown) {}
}

(global as any).google = {
  maps: {
    Map: FakeMap,
    Geocoder: class {
      geocode() {
        // not used in these tests
      }
    },
    GeocoderStatus: { OK: 'OK' },
    places: {
      AutocompleteService: FakeAutocompleteService,
      PlacesService: FakePlacesService,
      AutocompleteSessionToken: FakeAutocompleteSessionToken,
      PlacesServiceStatus: {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        INVALID_REQUEST: 'INVALID_REQUEST',
        OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
        REQUEST_DENIED: 'REQUEST_DENIED',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR',
        NOT_FOUND: 'NOT_FOUND',
      },
    },
  },
};

// Import AFTER mocks/stubs are in place.
const geocoderModule = await import('@/services/geocoder.service');
const GeocoderService = geocoderModule.default;

beforeEach(() => {
  storeState.autocompleteToken = null;
  commitSpy.mockClear();
  getPlacePredictionsSpy.mockClear();
  getDetailsSpy.mockClear();
  sentryCaptureMessageSpy.mockClear();
});

describe('GeocoderService — session token lifecycle', () => {
  it('creates a session token on the first getMatchingAddresses call', async () => {
    nextPredictionsResult = {
      results: [{ description: '1600 Amphitheatre Pkwy', placeId: 'p1' }],
      status: 'OK',
    };

    const out = await GeocoderService.getMatchingAddresses('1600 Amph', 'USA');

    expect(out).toHaveLength(1);
    expect(out[0].description).toBe('1600 Amphitheatre Pkwy');
    expect(storeState.autocompleteToken).toBeInstanceOf(
      FakeAutocompleteSessionToken,
    );
    expect(commitSpy).toHaveBeenCalledWith(
      'map/setAutocompleteToken',
      expect.any(FakeAutocompleteSessionToken),
    );
  });

  it('reuses the same session token across consecutive predictions calls', async () => {
    nextPredictionsResult = { results: [], status: 'OK' };
    await GeocoderService.getMatchingAddresses('foo', 'USA');
    const firstToken = storeState.autocompleteToken;

    await GeocoderService.getMatchingAddresses('foob', 'USA');
    const secondToken = storeState.autocompleteToken;

    expect(secondToken).toBe(firstToken);
    expect(getPlacePredictionsSpy.mock.calls[0][0].sessionToken).toBe(
      firstToken,
    );
    expect(getPlacePredictionsSpy.mock.calls[1][0].sessionToken).toBe(
      firstToken,
    );
  });

  it('clears the session token after getPlaceDetails (success path)', async () => {
    nextPredictionsResult = {
      results: [{ description: '1 Infinite Loop', placeId: 'p2' }],
      status: 'OK',
    };
    await GeocoderService.getMatchingAddresses('1 Inf', 'USA');
    expect(storeState.autocompleteToken).not.toBeNull();

    nextDetailsResult = {
      place: {
        address_components: [
          { types: ['street_number'], long_name: '1' },
          { types: ['route'], long_name: 'Infinite Loop' },
          { types: ['locality'], long_name: 'Cupertino' },
          { types: ['administrative_area_level_1'], long_name: 'CA' },
          { types: ['administrative_area_level_2'], long_name: 'Santa Clara' },
          { types: ['postal_code'], long_name: '95014' },
        ],
        geometry: {
          location: { lat: () => 37.331, lng: () => -122.031 },
        },
      },
      status: 'OK',
    };

    await GeocoderService.getPlaceDetails('1 Infinite Loop', 'p2');

    expect(storeState.autocompleteToken).toBeNull();
    expect(commitSpy).toHaveBeenCalledWith('map/setAutocompleteToken', null);
  });

  it('clears the token AND rejects (no uncaught throw) on getDetails failure', async () => {
    nextPredictionsResult = {
      results: [{ description: 'x', placeId: 'p3' }],
      status: 'OK',
    };
    await GeocoderService.getMatchingAddresses('x', 'USA');
    expect(storeState.autocompleteToken).not.toBeNull();

    nextDetailsResult = { place: null, status: 'NOT_FOUND' };

    await expect(GeocoderService.getPlaceDetails('x', 'p3')).rejects.toThrow(
      /NOT_FOUND|Place not found/,
    );

    expect(storeState.autocompleteToken).toBeNull();
    expect(sentryCaptureMessageSpy).toHaveBeenCalled();
  });

  it('clears stale token and warns on non-OK predictions status (self-heal)', async () => {
    // seed a stale token in the store
    storeState.autocompleteToken = new FakeAutocompleteSessionToken();
    nextPredictionsResult = { results: null, status: 'INVALID_REQUEST' };

    const out = await GeocoderService.getMatchingAddresses('y', 'USA');

    expect(out).toEqual([]);
    expect(storeState.autocompleteToken).toBeNull();
    expect(sentryCaptureMessageSpy).toHaveBeenCalledWith(
      expect.stringContaining('INVALID_REQUEST'),
      expect.anything(),
    );
  });

  it('returns [] without warning on ZERO_RESULTS', async () => {
    nextPredictionsResult = { results: null, status: 'ZERO_RESULTS' };

    const out = await GeocoderService.getMatchingAddresses('zzz', 'USA');

    expect(out).toEqual([]);
    expect(sentryCaptureMessageSpy).not.toHaveBeenCalled();
  });

  it('end-to-end: predictions → details → predictions issues a fresh token', async () => {
    nextPredictionsResult = {
      results: [{ description: 'a', placeId: 'pA' }],
      status: 'OK',
    };
    await GeocoderService.getMatchingAddresses('a', 'USA');
    const tokenA = storeState.autocompleteToken;
    expect(tokenA).toBeInstanceOf(FakeAutocompleteSessionToken);

    nextDetailsResult = {
      place: {
        address_components: [
          { types: ['street_number'], long_name: '1' },
          { types: ['route'], long_name: 'A St' },
          { types: ['locality'], long_name: 'Town' },
          { types: ['administrative_area_level_1'], long_name: 'ST' },
          { types: ['administrative_area_level_2'], long_name: 'Co' },
          { types: ['postal_code'], long_name: '00000' },
        ],
        geometry: { location: { lat: () => 0, lng: () => 0 } },
      },
      status: 'OK',
    };
    await GeocoderService.getPlaceDetails('a', 'pA');
    expect(storeState.autocompleteToken).toBeNull();

    nextPredictionsResult = {
      results: [{ description: 'b', placeId: 'pB' }],
      status: 'OK',
    };
    await GeocoderService.getMatchingAddresses('b', 'USA');
    const tokenB = storeState.autocompleteToken;

    expect(tokenB).toBeInstanceOf(FakeAutocompleteSessionToken);
    expect(tokenB).not.toBe(tokenA);
  });
});
