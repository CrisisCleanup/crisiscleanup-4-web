import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminVoiceConsole from '@/pages/admin/AdminVoiceConsole.vue';
import { createCallState } from '@/hooks/voice/voiceConsoleState';

vi.mock('axios');
const { connect, runSimulation, consoleState } = vi.hoisted(() => ({
  connect: vi.fn(),
  runSimulation: vi.fn(),
  consoleState: { current: undefined as unknown },
}));
vi.mock('@/hooks/voice/useVoiceConsole', () => ({
  voiceConsoleUrl: (path: string) => `/admins/voice_console/${path}`,
  useVoiceConsole: () => consoleState.current,
}));
vi.mock('vue-toastification', () => ({ useToast: () => ({ error: vi.fn() }) }));

// The page section is in the URL (?view=...).
const nav = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  replace: vi.fn(),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ query: nav.query }),
  useRouter: () => ({ replace: nav.replace }),
}));

const apiConfig = {
  targets: [{ key: 'local', label: 'Local', url: 'ws://localhost', agent: '' }],
  languages: { en: 'English', es: 'Español' },
  models: ['gpt-live-1', 'gpt-realtime-2.1-mini', 'gemini-live'],
  default_model: 'gpt-live-1',
  openai_voices: ['echo', 'alloy'],
  google_voices: ['Puck', 'Charon'],
  gpt_live_voices: ['marin', 'aster'],
  default_voice: 'marin',
  default_google_voice: 'Puck',
  flows: ['fields', 'questions'],
  default_flow: 'questions',
  backends: ['responses', 'decisions'],
  default_backend: 'decisions',
};

const buttonStub = {
  props: ['action', 'disabled', 'text'],
  template: '<button :disabled="disabled" @click="action">{{ text }}</button>',
};
function mountConsole() {
  return mount(AdminVoiceConsole, {
    global: {
      stubs: {
        BaseButton: buttonStub,
        BaseCheckbox: true,
        VoiceCasePanel: true,
        VoiceToolLog: true,
        VoiceMetrics: true,
        VoiceCallHistory: true,
        VoiceOverviewMetrics: true,
      },
    },
  });
}

describe('AdminVoiceConsole model settings', () => {
  const status = ref('idle');
  beforeEach(() => {
    vi.clearAllMocks();
    nav.query = { view: 'test' };
    status.value = 'idle';
    consoleState.current = {
      call: reactive(createCallState()),
      status,
      agentState: ref(''),
      elapsed: ref(0),
      muted: ref(false),
      log: ref([]),
      simulation: reactive({ running: false, status: '' }),
      connect,
      disconnect: vi.fn(),
      setMuted: vi.fn(),
      runSimulation,
      stopSimulation: vi.fn(),
    };
    vi.mocked(axios.get).mockImplementation(async (url) => ({
      data: url.endsWith('/config') ? apiConfig : { scenarios: [] },
    }));
  });

  it('uses server defaults, explains Live and Luna, and sends Decisions with questions', async () => {
    const wrapper = mountConsole();
    await flushPromises();
    expect(
      wrapper.get<HTMLSelectElement>('[data-testid="testVoiceVoiceSelect"]')
        .element.value,
    ).toBe('marin');
    expect(
      wrapper.get<HTMLSelectElement>('[data-testid="testVoiceBackendSelect"]')
        .element.value,
    ).toBe('decisions');
    const flow = wrapper.get<HTMLSelectElement>(
      '[data-testid="testVoiceFlowSelect"]',
    );
    expect(flow.element.value).toBe('questions');
    expect(flow.element.disabled).toBe(true);
    expect(wrapper.text()).toContain('gpt-live-1');
    expect(wrapper.text()).toContain('gpt-6-luna');
    expect(wrapper.text()).toContain('Decisions');
    await wrapper
      .get('[data-testid="testVoiceStartCallButton"]')
      .trigger('click');
    expect(connect).toHaveBeenCalledWith({
      language: 'en',
      model: 'gpt-live-1',
      voice: 'marin',
      backend: 'decisions',
      flow: 'questions',
    });
    wrapper.unmount();
  });

  it('prefers GPT-Live when the API defaults to Realtime Mini', async () => {
    vi.mocked(axios.get).mockImplementation(async (url) => ({
      data: url.endsWith('/config')
        ? {
            ...apiConfig,
            models: ['gpt-realtime-2.1-mini', 'gpt-live-1'],
            default_model: 'gpt-realtime-2.1-mini',
            default_voice: 'echo',
            default_backend: 'responses',
          }
        : { scenarios: [] },
    }));
    const wrapper = mountConsole();
    await flushPromises();
    expect(
      wrapper.get<HTMLSelectElement>('[data-testid="testVoiceModelSelect"]')
        .element.value,
    ).toBe('gpt-live-1');
    expect(
      wrapper.get<HTMLSelectElement>('[data-testid="testVoiceVoiceSelect"]')
        .element.value,
    ).toBe('marin');
    await wrapper
      .get('[data-testid="testVoiceStartCallButton"]')
      .trigger('click');
    expect(connect).toHaveBeenCalledWith({
      language: 'en',
      model: 'gpt-live-1',
      voice: 'marin',
      backend: 'responses',
      flow: 'questions',
    });
    wrapper.unmount();
  });

  it.each([
    {
      models: ['gpt-realtime-2.1-mini', 'gemini-live'],
      default_model: 'gemini-live',
      expected: 'gemini-live',
    },
    {
      models: ['gpt-realtime-2.1-mini'],
      default_model: 'gpt-live-1',
      expected: 'gpt-realtime-2.1-mini',
    },
    { models: [], default_model: 'gpt-live-1', expected: '' },
  ])(
    'uses an available fallback when GPT-Live is absent: $expected',
    async ({ models, default_model, expected }) => {
      vi.mocked(axios.get).mockImplementation(async (url) => ({
        data: url.endsWith('/config')
          ? { ...apiConfig, models, default_model }
          : { scenarios: [] },
      }));
      const wrapper = mountConsole();
      await flushPromises();
      expect(
        wrapper.get<HTMLSelectElement>('[data-testid="testVoiceModelSelect"]')
          .element.value,
      ).toBe(expected);
      expect(
        wrapper.get<HTMLButtonElement>(
          '[data-testid="testVoiceStartCallButton"]',
        ).element.disabled,
      ).toBe(models.length === 0);
      wrapper.unmount();
    },
  );

  it('allows the fields flow for Responses and forces questions again for Decisions', async () => {
    const wrapper = mountConsole();
    await flushPromises();
    const backend = wrapper.get('[data-testid="testVoiceBackendSelect"]');
    const flow = wrapper.get<HTMLSelectElement>(
      '[data-testid="testVoiceFlowSelect"]',
    );
    await backend.setValue('responses');
    expect(flow.element.disabled).toBe(false);
    await flow.setValue('fields');
    await wrapper
      .get('[data-testid="testVoiceStartCallButton"]')
      .trigger('click');
    expect(connect).toHaveBeenLastCalledWith(
      expect.objectContaining({ backend: 'responses', flow: 'fields' }),
    );
    await backend.setValue('decisions');
    expect(flow.element.value).toBe('questions');
    expect(flow.element.disabled).toBe(true);
    wrapper.unmount();
  });

  it('switches voice families and sends Responses for non-Live models', async () => {
    const wrapper = mountConsole();
    await flushPromises();
    const model = wrapper.get('[data-testid="testVoiceModelSelect"]');
    await model.setValue('gpt-realtime-2.1-mini');
    expect(
      wrapper.get<HTMLSelectElement>('[data-testid="testVoiceVoiceSelect"]')
        .element.value,
    ).toBe('echo');
    expect(
      wrapper.find('[data-testid="testVoiceBackendSelect"]').exists(),
    ).toBe(false);
    await wrapper
      .get('[data-testid="testVoiceStartCallButton"]')
      .trigger('click');
    expect(connect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        model: 'gpt-realtime-2.1-mini',
        voice: 'echo',
        backend: 'responses',
      }),
    );
    await model.setValue('gemini-live');
    expect(
      wrapper.get<HTMLSelectElement>('[data-testid="testVoiceVoiceSelect"]')
        .element.value,
    ).toBe('Puck');
    await model.setValue('gpt-live-1');
    expect(
      wrapper.get<HTMLSelectElement>('[data-testid="testVoiceVoiceSelect"]')
        .element.value,
    ).toBe('marin');
    wrapper.unmount();
  });

  it('sends the same valid settings for a simulated call', async () => {
    const wrapper = mountConsole();
    await flushPromises();
    await wrapper
      .get('[data-testid="testVoiceFacts"]')
      .setValue('Synthetic caller facts');
    await wrapper
      .get('[data-testid="testVoiceRunSimulationButton"]')
      .trigger('click');
    expect(runSimulation).toHaveBeenCalledWith(
      'Synthetic caller facts',
      expect.objectContaining({
        model: 'gpt-live-1',
        backend: 'decisions',
        flow: 'questions',
        voice: 'marin',
      }),
    );
    wrapper.unmount();
  });

  it('prevents calls before configuration is available and locks settings while connecting', async () => {
    const wrapper = mountConsole();
    expect(
      wrapper.get<HTMLButtonElement>('[data-testid="testVoiceStartCallButton"]')
        .element.disabled,
    ).toBe(true);
    await flushPromises();
    status.value = 'connecting';
    await flushPromises();
    expect(wrapper.get<HTMLFieldSetElement>('fieldset').element.disabled).toBe(
      true,
    );
    expect(
      wrapper.get<HTMLButtonElement>('[data-testid="testVoiceStartCallButton"]')
        .element.disabled,
    ).toBe(true);
    wrapper.unmount();
  });
});

describe('AdminVoiceConsole sections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleState.current = {
      call: reactive(createCallState()),
      status: ref('idle'),
      agentState: ref(''),
      elapsed: ref(0),
      muted: ref(false),
      log: ref([]),
      simulation: reactive({ running: false, status: '' }),
      connect,
      disconnect: vi.fn(),
      setMuted: vi.fn(),
      runSimulation,
      stopSimulation: vi.fn(),
    };
    vi.mocked(axios.get).mockImplementation(async (url) => ({
      data: url.endsWith('/config') ? apiConfig : { scenarios: [] },
    }));
  });

  it('opens on the call history, with the test call kept hidden', async () => {
    nav.query = {};
    const wrapper = mountConsole();
    await flushPromises();
    expect(wrapper.findComponent({ name: 'VoiceCallHistory' }).exists()).toBe(
      true,
    );
    expect(
      wrapper.findComponent({ name: 'VoiceOverviewMetrics' }).exists(),
    ).toBe(false);
    // v-show hides the section but keeps the call alive.
    expect(
      wrapper.get('[data-testid="testVoiceConsoleTestNotice"]').element
        .parentElement?.style.display,
    ).toBe('none');
    wrapper.unmount();
  });

  it('lists the sections as call history, overall metrics, test a call', async () => {
    nav.query = {};
    const wrapper = mountConsole();
    await flushPromises();
    const tabs = wrapper.findAll('[data-testid^="testVoiceConsoleView-"]');
    expect(tabs.map((tab) => tab.attributes('data-testid'))).toEqual([
      'testVoiceConsoleView-calls',
      'testVoiceConsoleView-metrics',
      'testVoiceConsoleView-test',
    ]);
    expect(tabs[0].attributes('aria-selected')).toBe('true');
    wrapper.unmount();
  });

  it('shows the overall metrics for ?view=metrics', async () => {
    nav.query = { view: 'metrics' };
    const wrapper = mountConsole();
    await flushPromises();
    expect(
      wrapper.findComponent({ name: 'VoiceOverviewMetrics' }).exists(),
    ).toBe(true);
    expect(wrapper.findComponent({ name: 'VoiceCallHistory' }).exists()).toBe(
      false,
    );
    wrapper.unmount();
  });

  it('shows the call history for ?view=calls and puts the section in the URL', async () => {
    nav.query = { view: 'calls' };
    const wrapper = mountConsole();
    await flushPromises();
    expect(wrapper.findComponent({ name: 'VoiceCallHistory' }).exists()).toBe(
      true,
    );
    await wrapper
      .get('[data-testid="testVoiceConsoleView-test"]')
      .trigger('click');
    expect(nav.replace).toHaveBeenCalledWith({ query: { view: 'test' } });
    wrapper.unmount();
  });
});
