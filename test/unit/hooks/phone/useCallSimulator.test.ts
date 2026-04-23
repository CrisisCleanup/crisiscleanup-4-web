import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const hoisted = vi.hoisted(() => {
  const mockState: Record<string, any> = {
    'incident/currentIncidentId': 42,
    'phone/caller': null,
    'phone/call': null,
    'phone/callType': null,
    'phone/callState': 'AWAY',
    'phone/currentDnisHistoryRecord': null,
    'phone/incomingCall': null,
    'phone/outgoingCall': null,
    'phone/isOnCall': false,
  };

  const commit = vi.fn((mutation: string, payload: any) => {
    switch (mutation) {
      case 'phone/setCaller': {
        mockState['phone/caller'] = payload;
        break;
      }
      case 'phone/setCurrentCall': {
        mockState['phone/call'] = payload;
        break;
      }
      case 'phone/setCallType': {
        mockState['phone/callType'] = payload;
        break;
      }
      case 'phone/setState': {
        mockState['phone/callState'] = payload;
        mockState['phone/isOnCall'] =
          payload === 'ENGAGED-INBOUND' || payload === 'ENGAGED-OUTBOUND';
        break;
      }
      case 'phone/setIncomingCall': {
        mockState['phone/incomingCall'] = payload;
        break;
      }
      case 'phone/setOutgoingCall': {
        mockState['phone/outgoingCall'] = payload;
        break;
      }
      case 'phone/setCurrentDnisHistoryRecord': {
        mockState['phone/currentDnisHistoryRecord'] = payload;
        break;
      }
      case 'phone/clearCall': {
        mockState['phone/call'] = null;
        mockState['phone/caller'] = null;
        mockState['phone/incomingCall'] = null;
        mockState['phone/outgoingCall'] = null;
        mockState['phone/callType'] = null;
        mockState['phone/currentDnisHistoryRecord'] = null;
        break;
      }
      // No default
    }
  });

  const phoneService: { callInfo: any } = { callInfo: {} };
  const emitter = { emit: vi.fn() };
  const updateUserStates = vi.fn(async () => {});
  const createManual = vi.fn();
  const axiosGet = vi.fn();
  const axiosPost = vi.fn();
  const fetchById = vi.fn().mockResolvedValue({});

  return {
    mockState,
    commit,
    phoneService,
    emitter,
    updateUserStates,
    createManual,
    axiosGet,
    axiosPost,
    fetchById,
  };
});

vi.mock('@/store', () => ({
  store: {
    commit: hoisted.commit,
    getters: new Proxy(
      {},
      {
        get: (_t, key: string) => hoisted.mockState[key],
      },
    ),
  },
}));

vi.mock('@/hooks/phone/usePhoneService', () => ({
  default: () => hoisted.phoneService,
}));

vi.mock('@/hooks/useEmitter', () => ({
  default: () => ({ emitter: hoisted.emitter }),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  default: () => ({
    currentUser: ref({
      id: 7,
      organization: { id: 1 },
      primary_language: 2,
    }),
    updateUserStates: hoisted.updateUserStates,
  }),
}));

vi.mock('@/models/Incident', () => ({
  default: {
    all: () => [],
    api: () => ({ fetchById: hoisted.fetchById }),
  },
}));

vi.mock('@/models/PhoneOutbound', () => ({
  default: {
    api: () => ({ createManual: hoisted.createManual }),
  },
}));

vi.mock('axios', () => ({
  default: { get: hoisted.axiosGet, post: hoisted.axiosPost },
  get: hoisted.axiosGet,
  post: hoisted.axiosPost,
}));

import useCallSimulator from '@/hooks/phone/useCallSimulator';

beforeEach(() => {
  hoisted.commit.mockClear();
  hoisted.emitter.emit.mockClear();
  hoisted.updateUserStates.mockClear();
  hoisted.createManual.mockReset();
  hoisted.axiosGet.mockReset();
  hoisted.axiosPost.mockReset();
  hoisted.fetchById.mockClear();
  hoisted.phoneService.callInfo = {};
  Object.assign(hoisted.mockState, {
    'incident/currentIncidentId': 42,
    'phone/caller': null,
    'phone/call': null,
    'phone/callType': null,
    'phone/callState': 'AWAY',
    'phone/currentDnisHistoryRecord': null,
    'phone/incomingCall': null,
    'phone/outgoingCall': null,
    'phone/isOnCall': false,
  });
});

describe('useCallSimulator', () => {
  it('simulateInbound populates phone store from raw DNIS', async () => {
    const dnisRecord = {
      id: 101,
      dnis: '5551234567',
      location_name: 'Testville',
    };
    const inboundRecord = {
      id: 555,
      session_id: 'sim-abc',
      ani: '5551234567',
      incident_id: [42],
    };
    const historyRecord = { id: 900 };

    hoisted.axiosPost.mockImplementation(async (url: string) => {
      if (url.endsWith('/phone_inbound')) return { data: inboundRecord };
      if (url.endsWith('/phone/history')) return { data: historyRecord };
      return { data: {} };
    });
    hoisted.axiosGet.mockImplementation(async (url: string) => {
      if (url.includes('/phone_dnis?dnis=5551234567')) {
        return { data: { results: [dnisRecord] } };
      }
      throw new Error(`unexpected GET ${url}`);
    });

    const { simulateInbound } = useCallSimulator();
    const result = await simulateInbound({ dnis: '5551234567' });

    expect(hoisted.mockState['phone/callState']).toBe('ENGAGED-INBOUND');
    expect(hoisted.mockState['phone/callType']).toBe('INBOUND');
    expect(hoisted.mockState['phone/caller']).toEqual(dnisRecord);
    expect(hoisted.mockState['phone/incomingCall']).toEqual(inboundRecord);
    expect(hoisted.mockState['phone/call']).toEqual(inboundRecord);
    expect(hoisted.mockState['phone/currentDnisHistoryRecord']).toEqual(
      historyRecord,
    );
    expect(hoisted.phoneService.callInfo.callType).toBe('INBOUND');
    expect(hoisted.phoneService.callInfo.sessionId).toBe('sim-abc');
    expect(result.inbound).toEqual(inboundRecord);
  });

  it('simulateOutbound populates phone store and creates dummy outbound', async () => {
    const dnisRecord = { id: 202, dnis: '5559876543' };
    const outboundRecord = { id: 777, dnis1: 202, call_type: 'manual' };
    const historyRecord = { id: 901 };

    hoisted.createManual.mockResolvedValue(outboundRecord);

    hoisted.axiosGet.mockImplementation(async (url: string) => {
      if (url.includes('/phone_dnis?dnis=5559876543')) {
        return { data: { results: [dnisRecord] } };
      }
      if (url.endsWith('/phone_dnis/202')) return { data: dnisRecord };
      throw new Error(`unexpected GET ${url}`);
    });
    hoisted.axiosPost.mockImplementation(async (url: string) => {
      if (url.endsWith('/phone/history')) return { data: historyRecord };
      return { data: {} };
    });

    const { simulateOutbound } = useCallSimulator();
    await simulateOutbound({ dnis: '5559876543' });

    expect(hoisted.createManual).toHaveBeenCalledWith(
      expect.objectContaining({
        number: '5559876543',
        incidentId: 42,
        userId: 7,
        language: 2,
      }),
    );
    expect(hoisted.mockState['phone/callState']).toBe('ENGAGED-OUTBOUND');
    expect(hoisted.mockState['phone/callType']).toBe('OUTBOUND');
    expect(hoisted.mockState['phone/outgoingCall']).toEqual(outboundRecord);
    expect(hoisted.mockState['phone/call']).toEqual(outboundRecord);
    expect(hoisted.mockState['phone/caller']).toEqual(dnisRecord);
    expect(hoisted.mockState['phone/currentDnisHistoryRecord']).toEqual(
      historyRecord,
    );
    expect(hoisted.phoneService.callInfo.callType).toBe('OUTBOUND');
  });

  it('endSimulation preserves call/caller so UpdateStatus flow remains reachable', async () => {
    hoisted.mockState['phone/call'] = { id: 1 };
    hoisted.mockState['phone/caller'] = { id: 2 };
    hoisted.mockState['phone/incomingCall'] = { id: 3 };
    hoisted.mockState['phone/outgoingCall'] = { id: 4 };
    hoisted.mockState['phone/callState'] = 'ENGAGED-INBOUND';
    hoisted.phoneService.callInfo = {
      callType: 'INBOUND',
      sessionId: 'sim-x',
    };

    const { endSimulation } = useCallSimulator();
    await endSimulation();

    expect(hoisted.mockState['phone/callState']).toBe('AWAY');
    expect(hoisted.mockState['phone/incomingCall']).toBeNull();
    expect(hoisted.mockState['phone/outgoingCall']).toBeNull();
    // call + caller survive so PhoneOverlay surfaces the "Complete call" button
    expect(hoisted.mockState['phone/call']).toEqual({ id: 1 });
    expect(hoisted.mockState['phone/caller']).toEqual({ id: 2 });
    // callInfo.callType preserved so completeCall's branching still works
    expect(hoisted.phoneService.callInfo.callType).toBe('INBOUND');
  });

  it('throws if neither dnisId nor dnis provided for a create path', async () => {
    const { simulateInbound } = useCallSimulator();
    await expect(simulateInbound({})).rejects.toThrow(/dnisId or dnis/);
  });
});
