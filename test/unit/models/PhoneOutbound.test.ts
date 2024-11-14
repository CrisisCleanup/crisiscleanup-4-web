import { describe, expect, test, beforeEach, beforeAll, vi } from 'vitest';
import PhoneOutbound from '@/models/PhoneOutbound';
import * as VuexORM from '@vuex-orm/core';
import { Database } from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import type { Store } from 'vuex';

describe('models > PhoneOutbound', () => {
  let database: VuexORM.Database;
  let store: Store<any>;

  beforeAll(() => {
    database = new Database();
    database.register(PhoneOutbound);

    VuexORM.use(VuexORMAxios, {
      axios,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      baseURL: `${import.meta.env.VITE_APP_API_BASE_URL}`,
    });

    store = createStore({
      plugins: [VuexORM.install(database)],
    });
  });

  beforeEach(() => {
    PhoneOutbound.deleteAll();
  });

  test('PhoneOutbound model has the correct entity name', () => {
    expect(PhoneOutbound.entity).toBe('phone_outbound');
  });

  test('PhoneOutbound model has correct default fields', () => {
    const phoneOutbound = new PhoneOutbound();
    expect(phoneOutbound.id).toBe('');
    expect(phoneOutbound.phone_number).toBe('');
    expect(phoneOutbound.vm_url).toBe('');
    expect(phoneOutbound.call_type).toBe('');
    expect(phoneOutbound.completion).toBe('');
    expect(phoneOutbound.incident_id).toBe('');
    expect(phoneOutbound.inbound_at).toBe('');
    expect(phoneOutbound.created_at).toBe('');
    expect(phoneOutbound.updated_at).toBe('');
    expect(phoneOutbound.locked_at).toBe('');
    expect(phoneOutbound.locked_by).toBe('');
    expect(phoneOutbound.dnis1).toBe('');
    expect(phoneOutbound.dnis2).toBe('');
    expect(phoneOutbound.ani).toBe('');
    expect(phoneOutbound.worksite).toBe('');
    expect(phoneOutbound.pda).toBe('');
    expect(phoneOutbound.language).toBe('');
    expect(phoneOutbound.created_by).toBe('');
    expect(phoneOutbound.updated_by).toBe('');
    expect(phoneOutbound.latest_status).toBe('');
    expect(phoneOutbound.location_name).toBe('');
    expect(phoneOutbound.priority).toBe('');
    expect(phoneOutbound.external_id).toBe('');
  });

  test('api action: skipOutbound', async () => {
    const phoneOutbound = new PhoneOutbound({ id: 1 });
    const postMock = vi.fn(() => Promise.resolve({}));
    phoneOutbound.api = vi.fn(() => ({
      post: postMock,
    }));
    await phoneOutbound.skipOutbound();
    expect(postMock).toHaveBeenCalledWith('/phone_outbound/1/unlock', {
      skipped: true,
    });
    postMock.mockRestore();
  });

  test('api action: acceptCall', async () => {
    const actions = PhoneOutbound.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.acceptCall('outbound-id');

    expect(postMock).toHaveBeenCalledWith(
      '/phone_outbound/outbound-id/accept',
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: skipCall', async () => {
    const actions = PhoneOutbound.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.skipCall('outbound-id');

    expect(postMock).toHaveBeenCalledWith('/phone_outbound/outbound-id/skip', {
      save: false,
    });

    postMock.mockRestore();
  });

  test('api action: getNextOutbound', async () => {
    const actions = PhoneOutbound.api();
    const getMock = vi
      .spyOn(actions, 'get')
      .mockResolvedValue({ response: { data: {} } });

    await actions.getNextOutbound({
      incidentId: 199,
      agentId: 'agent-id',
      useCalldowns: true,
      isManual: true,
    });

    expect(getMock).toHaveBeenCalledWith(
      '/phone_outbound?next=199&agent=agent-id&use_calldowns=1&manual=1',
    );

    getMock.mockRestore();
  });

  test('api action: getRemainingCallbackCount', async () => {
    const actions = PhoneOutbound.api();
    const getMock = vi
      .spyOn(actions, 'get')
      .mockResolvedValue({ response: { data: { count: 10 } } });

    const count = await actions.getRemainingCallbackCount('incident-id');

    expect(getMock).toHaveBeenCalledWith(
      '/phone_outbound?incident_id=incident-id&completion__lt=1&limit=1&filter_ani=1&locked_at__isnull=True&call_type=callback',
    );
    expect(count).toBe(10);

    getMock.mockRestore();
  });

  test('api action: getRemainingCalldownCount', async () => {
    const actions = PhoneOutbound.api();
    const getMock = vi
      .spyOn(actions, 'get')
      .mockResolvedValue({ response: { data: { count: 5 } } });

    const count = await actions.getRemainingCalldownCount('incident-id');

    expect(getMock).toHaveBeenCalledWith(
      '/phone_outbound?incident_id=incident-id&completion__lt=1&limit=1&filter_ani=1&locked_at__isnull=True&call_type=calldown',
    );
    expect(count).toBe(5);

    getMock.mockRestore();
  });

  test('api action: updateStatus', async () => {
    const actions = PhoneOutbound.api();
    const postMock = vi.spyOn(actions, 'post').mockResolvedValue({ data: {} });

    await actions.updateStatus('outbound-id', {
      statusId: 'status-id',
      notes: 'some notes',
      dnisMeta: 'meta',
      agentId: 'agent-id',
      cases: 'case',
      worksiteId: 'worksite-id',
    });

    expect(postMock).toHaveBeenCalledWith(
      '/phone_outbound/outbound-id/update_status',
      {
        status: 'status-id',
        dnis_meta: 'meta',
        agent: 'agent-id',
        worksite: 'worksite-id',
        notes: 'some notes',
        cases: 'case',
      },
      { save: false },
    );

    postMock.mockRestore();
  });

  test('api action: createManual', async () => {
    const actions = PhoneOutbound.api();
    const postMock = vi
      .spyOn(actions, 'post')
      .mockResolvedValue({ entities: { phone_outbound: [{}] } });

    const outbound = await actions.createManual({
      number: '1234567890',
      incidentId: 'incident-id',
      ani: 'ani',
      language: 'en',
      userId: 'user-id',
    });

    expect(postMock).toHaveBeenCalledWith('/phone_outbound', {
      phone_number: '1234567890',
      incident_id: ['incident-id'],
      ani: 'ani',
      language: 'en',
      locked_by: 'user-id',
      completion: 1,
      call_type: 'manual',
    });
    expect(outbound).toEqual({});

    postMock.mockRestore();
  });
});
