import { flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type * as VueRouter from 'vue-router';
import { defineComponent, h } from 'vue';
import BaseButton from '@/components/BaseButton.vue';
import VoiceReviewDetail from '@/components/admin/voice/VoiceReviewDetail.vue';
import {
  formChanges,
  missedCasePrefill,
  type FormFieldInfo,
  type MissedCaseDetails,
} from '@/hooks/voice/voiceReviews';
import { server } from '../../../setupTests';

const confirmDialog = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useDialogs', () => ({
  default: () => ({ confirm: confirmDialog }),
}));

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof VueRouter>()),
  useRouter: () => ({ resolve: (path: string) => ({ href: path }) }),
}));

const FIELDS: FormFieldInfo[] = [
  {
    field_key: 'tree_info',
    html_type: 'h5',
    if_selected_then_work_type: 'trees',
  },
  {
    field_key: 'num_trees_down',
    html_type: 'select',
    if_selected_then_work_type: 'trees',
  },
  { field_key: 'help_install_tarp', html_type: 'checkbox' },
  { field_key: 'flood_height_select', html_type: 'select' },
];

const DETAILS: MissedCaseDetails = {
  name: 'John Smith',
  phone1: '9185550142',
  phone2: '',
  email: '',
  address: {
    address: '21 Oak St',
    city: 'Tulsa',
    state: 'OK',
    postal_code: '74103',
  },
  form_answers: [
    { key: 'tree_info', value: 'true' },
    { key: 'not_on_this_form', value: 'x' },
  ],
  notes: 'Oak on the roof.',
};

describe('formChanges', () => {
  it('maps contact, form, and work type suggestions to form changes', () => {
    expect(
      formChanges({ kind: 'phone', field: 'phone1' }, '9185550142', FIELDS),
    ).toEqual([{ target: 'worksite', key: 'phone1', value: '9185550142' }]);
    expect(
      formChanges(
        { kind: 'form_field', field: 'help_install_tarp' },
        'true',
        FIELDS,
      ),
    ).toEqual([{ target: 'form', key: 'help_install_tarp', value: true }]);
    expect(
      formChanges(
        { kind: 'form_field', field: 'flood_height_select' },
        'formOptions.x',
        FIELDS,
      ),
    ).toEqual([
      { target: 'form', key: 'flood_height_select', value: 'formOptions.x' },
    ]);
    expect(
      formChanges({ kind: 'work_type', field: 'trees' }, 'add', FIELDS),
    ).toEqual([{ target: 'form', key: 'tree_info', value: true }]);
    expect(
      formChanges({ kind: 'work_type', field: 'trees' }, 'remove', FIELDS),
    ).toEqual([
      { target: 'form', key: 'tree_info', value: false },
      { target: 'form', key: 'num_trees_down', value: '' },
    ]);
  });

  it('has no form change for issues the form cannot hold', () => {
    expect(
      formChanges({ kind: 'work_type', field: 'roofing' }, 'add', FIELDS),
    ).toBeUndefined();
    expect(
      formChanges({ kind: 'form_field', field: 'unknown' }, 'x', FIELDS),
    ).toBeUndefined();
    expect(
      formChanges({ kind: 'missed_sms', field: '' }, 'x', FIELDS),
    ).toBeUndefined();
  });
});

describe('missedCasePrefill', () => {
  it('keeps only answers that the incident form has', () => {
    const prefill = missedCasePrefill(DETAILS, FIELDS);
    expect(prefill).toMatchObject({
      name: 'John Smith',
      phone1: '9185550142',
      address: '21 Oak St',
      postal_code: '74103',
      form_data: [{ field_key: 'tree_info', field_value: true }],
    });
    expect(prefill.notes).toEqual([
      expect.objectContaining({ note: 'Oak on the roof.', pending: true }),
    ]);
    expect(missedCasePrefill(undefined, FIELDS)).toEqual({});
  });
});

const baseUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_reviews`;

function correction(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    kind: 'work_type',
    simple: false,
    field: 'trees',
    current_value: '',
    suggested_value: 'add',
    reason: 'A tree fell on the house.',
    evidence: 'A big oak fell on the roof.',
    confidence: 0.9,
    status: 'open',
    ...overrides,
  };
}

function review(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    status: 'done',
    model: 'gpt-6-luna',
    summary: 'Tree work missing.',
    error: '',
    reviewed_at: '2026-10-11T12:00:00Z',
    session: {
      id: 3,
      call_id: 'call-3',
      status: 'completed',
      language: 'en',
      ended_at: undefined,
    },
    incident_id: 248,
    worksite: { id: 55, case_number: 'R12' },
    corrections: [correction()],
    case_snapshot: {},
    transcript: '',
    audio_url: undefined,
    ...overrides,
  };
}

function testId(id: string) {
  return `[data-testid="${id}"]`;
}

// The real case form needs the map and the store; this stand-in records
// what the auditor puts in it.
function stubCaseForm() {
  const applyChanges = vi.fn();
  const moveToIncident = vi.fn(() => Promise.resolve('T7'));
  const props: Record<string, unknown>[] = [];
  const stub = defineComponent({
    props: {
      incidentId: { type: Number, default: undefined },
      worksiteId: { type: Number, default: undefined },
      missedCase: { type: Object, default: undefined },
    },
    emits: ['saved'],
    setup(
      componentProps: Record<string, unknown>,
      {
        expose,
        emit,
      }: {
        expose: (exposed: Record<string, unknown>) => void;
        emit: (event: 'saved', worksite: { id: number }) => void;
      },
    ) {
      props.push({ ...componentProps });
      expose({
        applyChanges,
        moveToIncident,
        reload: vi.fn(),
        formFields: FIELDS,
      });
      return () =>
        h('button', {
          'data-testid': 'testStubSave',
          onClick: () => emit('saved', { id: 99 }),
        });
    },
  });
  return { stub, applyChanges, moveToIncident, props };
}

describe('VoiceReviewDetail with the case form', () => {
  it('puts a work type in the form and marks it fixed when the case saves', async () => {
    const resolved: string[] = [];
    server.use(
      rest.get(`${baseUrl}/7`, (_req, res, ctx) => res(ctx.json(review()))),
      rest.post(`${baseUrl}/corrections/1/resolve`, (req, res, ctx) => {
        resolved.push(req.url.pathname);
        return res(ctx.json(correction({ status: 'resolved' })));
      }),
    );
    const { stub, applyChanges, props } = stubCaseForm();
    const wrapper = mount(VoiceReviewDetail, {
      props: { reviewId: 7 },
      global: {
        components: { BaseButton },
        stubs: { Spinner: true, VoiceReviewCaseForm: stub },
      },
    });
    await flushPromises();
    expect(props[0]).toMatchObject({ incidentId: 248, worksiteId: 55 });

    await wrapper.get(testId('testVoiceCorrectionUseInForm')).trigger('click');
    await flushPromises();
    expect(applyChanges).toHaveBeenCalledWith(
      [{ target: 'form', key: 'tree_info', value: true }],
      false,
    );
    expect(wrapper.find(testId('testVoiceCorrectionInForm')).exists()).toBe(
      true,
    );

    await wrapper.get(testId('testStubSave')).trigger('click');
    await flushPromises();
    expect(resolved).toHaveLength(1);
  });

  it('creates a case for a missed call and links it', async () => {
    const linked: unknown[] = [];
    const missed = correction({
      kind: 'missed_case',
      field: '',
      suggested_value: { summary: 'Tree on roof', details: DETAILS },
    });
    server.use(
      rest.get(`${baseUrl}/7`, (_req, res, ctx) =>
        res(
          ctx.json(
            review({
              worksite: undefined,
              session: {
                id: 3,
                call_id: 'call-3',
                status: 'abandoned',
                language: 'en',
                ended_at: undefined,
              },
              corrections: [missed],
            }),
          ),
        ),
      ),
      rest.post(`${baseUrl}/corrections/1/link_case`, async (req, res, ctx) => {
        linked.push(await req.json());
        return res(ctx.json({ ...missed, status: 'resolved' }));
      }),
    );
    const { stub, props } = stubCaseForm();
    const wrapper = mount(VoiceReviewDetail, {
      props: { reviewId: 7 },
      global: {
        components: { BaseButton },
        stubs: { Spinner: true, VoiceReviewCaseForm: stub },
      },
    });
    await flushPromises();
    expect(wrapper.find(testId('testStubSave')).exists()).toBe(false);

    await wrapper.get(testId('testVoiceCorrectionCreateCase')).trigger('click');
    await flushPromises();
    expect(props.at(-1)).toMatchObject({
      incidentId: 248,
      missedCase: DETAILS,
    });
    expect(props.at(-1)?.worksiteId).toBeUndefined();

    await wrapper.get(testId('testStubSave')).trigger('click');
    await flushPromises();
    expect(linked).toEqual([{ worksite_id: 99 }]);
  });
});

describe('VoiceReviewDetail wrong incident', () => {
  it('moves the case after the admin confirms, and records the move', async () => {
    const wrong = correction({
      kind: 'wrong_incident',
      field: 'incident',
      suggested_value: {
        summary: 'Tulsa Tornado',
        incident_id: 501,
        incident_name: 'Tulsa Tornado',
      },
    });
    const resolved: unknown[] = [];
    server.use(
      rest.get(`${baseUrl}/7`, (_req, res, ctx) =>
        res(ctx.json(review({ corrections: [wrong] }))),
      ),
      rest.post(`${baseUrl}/corrections/1/resolve`, async (req, res, ctx) => {
        resolved.push(await req.json());
        return res(ctx.json({ ...wrong, status: 'resolved' }));
      }),
    );
    const { stub, moveToIncident } = stubCaseForm();
    const wrapper = mount(VoiceReviewDetail, {
      props: { reviewId: 7 },
      global: {
        components: { BaseButton },
        stubs: { Spinner: true, VoiceReviewCaseForm: stub },
      },
    });
    await flushPromises();

    confirmDialog.mockResolvedValueOnce('no');
    await wrapper.get(testId('testVoiceCorrectionMove')).trigger('click');
    await flushPromises();
    expect(moveToIncident).not.toHaveBeenCalled();

    confirmDialog.mockResolvedValueOnce('yes');
    await wrapper.get(testId('testVoiceCorrectionMove')).trigger('click');
    await flushPromises();
    expect(moveToIncident).toHaveBeenCalledWith(501);
    expect(resolved).toEqual([
      {
        applied_value: {
          incident_id: 501,
          incident_name: 'Tulsa Tornado',
          case_number: 'T7',
          summary: 'Tulsa Tornado (T7)',
        },
      },
    ]);
  });
});
