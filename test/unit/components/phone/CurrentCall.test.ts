import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import * as VuexORM from '@vuex-orm/core';
import VuexORMAxios from '@vuex-orm/plugin-axios';
import axios from 'axios';
import { createStore } from 'vuex';
import CurrentCall from '@/components/phone/CurrentCall.vue';
import Worksite from '@/models/Worksite';
import type PhoneOutbound from '@/models/PhoneOutbound';
import { commonComponentStubs } from '../../../helpers';

const call = ref<
  Pick<PhoneOutbound, 'id' | 'dnis1' | 'phone_number'> & {
    call_type: 'callback' | 'manual';
  }
>();

vi.mock('@/hooks/useConnectFirst', () => ({
  default: () => ({
    call,
    callType: ref('OUTBOUND'),
    caller: ref(),
  }),
}));

vi.mock('@/hooks/phone/useScripts', () => ({
  default: () => ({ currentScript: ref('phoneDashboard.outbound_script') }),
}));

vi.mock('@/components/phone/PhoneFaqRAG.vue', () => ({
  default: { template: '<div />' },
}));

const outbound = {
  id: '7',
  dnis1: '55',
  phone_number: '+12025550123',
};

const worksite = {
  id: 123,
  name: 'Existing caller',
  case_number: 'TEST-123',
  short_address: '123 Main Street',
  full_address: '123 Main Street, Asheville, NC',
  state: 'NC',
  incident: 199,
  work_types: [{ work_type: 'debris', status: 'open_unassigned', phase: 4 }],
};

function mountCurrentCall() {
  const store = createStore({
    getters: { 'incident/currentIncidentId': () => worksite.incident },
  });

  return mount(CurrentCall, {
    global: {
      plugins: [store],
      stubs: commonComponentStubs,
    },
  });
}

enableAutoUnmount(afterEach);

beforeAll(() => {
  VuexORM.use(VuexORMAxios, { axios });
});

beforeEach(() => {
  call.value = undefined;
  vi.spyOn(Worksite, 'api');
  vi.mocked(Worksite.api, { partial: true }).mockReturnValue({
    get: vi.fn().mockResolvedValue({ entities: { worksites: [worksite] } }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CurrentCall.vue', () => {
  it('shows and selects an existing case when an outbound call is set before mounting', async () => {
    call.value = { ...outbound, call_type: 'callback' };

    const wrapper = mountCurrentCall();
    await flushPromises();

    expect(wrapper.findAll('[data-testid="testCaseNumberDiv"]')).toHaveLength(
      1,
    );
    const caseButton = wrapper.get('[data-testid="test123Content"]');
    expect(caseButton.text()).toContain('TEST-123');
    expect(caseButton.text()).toContain('Existing caller');
    await caseButton.trigger('click');
    expect(wrapper.emitted('setCase')).toEqual([
      [
        expect.objectContaining({
          id: worksite.id,
          incident: worksite.incident,
        }),
      ],
    ]);
  });

  it('shows an existing case when manual dialing starts after mounting', async () => {
    const wrapper = mountCurrentCall();
    await flushPromises();
    expect(wrapper.findAll('[data-testid="testCaseNumberDiv"]')).toHaveLength(
      0,
    );
    expect(wrapper.text()).toContain('currentCall.no_recent_cases');

    call.value = { ...outbound, call_type: 'manual' };
    await flushPromises();

    expect(wrapper.findAll('[data-testid="testCaseNumberDiv"]')).toHaveLength(
      1,
    );
    expect(wrapper.get('[data-testid="test123Content"]').text()).toContain(
      'TEST-123',
    );
  });
});
