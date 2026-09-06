import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, onMounted, reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import ErrorBoundary from '@/components/ErrorBoundary.vue';

/**
 * These pin the two behaviours that are easy to get wrong and impossible to
 * notice locally:
 *  - the boundary must NOT swallow (returning `false` from onErrorCaptured
 *    stops propagation to app.config.errorHandler, i.e. to Sentry);
 *  - it must only replace the subtree for bring-up failures, so a failed
 *    button click does not destroy a fully-rendered page.
 */

// Reactive: the boundary watches route.fullPath, and a plain object would
// never fire the watcher — the reset test would pass or fail for the wrong reason.
const route = reactive({
  fullPath: '/disasters/archived',
  meta: { layout: 'authenticated' },
});

vi.mock('vue-router', () => ({
  useRoute: () => route,
}));

vi.mock('@/layouts/Home.vue', () => ({
  default: defineComponent({
    name: 'HomeLayoutStub',
    setup:
      (_props, { slots }) =>
      () =>
        h('div', { 'data-home': '' }, slots.default?.()),
  }),
}));

/** Reproduces DisastersArchived.vue: async onMounted whose request rejects. */
const BrokenOnMount = defineComponent({
  name: 'BrokenOnMount',
  setup() {
    onMounted(async () => {
      await Promise.reject(new Error('Network Error'));
    });
    return () => h('div', { 'data-child': '' }, 'page content');
  },
});

const BrokenOnClick = defineComponent({
  name: 'BrokenOnClick',
  setup() {
    const onClick = async () => {
      await Promise.reject(new Error('Save failed'));
    };
    return () =>
      h('div', { 'data-child': '' }, [
        'IMPORTANT CONTENT',
        h('button', { 'data-save': '', onClick }, 'save'),
      ]);
  },
});

function mountBoundary(child: unknown, errorHandler = vi.fn()) {
  return mount(ErrorBoundary, {
    slots: { default: () => h(child as never) },
    global: {
      config: { errorHandler },
      stubs: {
        'base-button': {
          template: '<button @click="action"/>',
          props: ['action'],
        },
      },
      mocks: { $t: (k: string) => k },
    },
  });
}

describe('components > ErrorBoundary', () => {
  it('replaces the subtree when a page fails during mount', async () => {
    const wrapper = mountBoundary(BrokenOnMount);
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-child]').exists()).toBe(false);
    expect(
      wrapper.find('[data-testid="testErrorBoundaryRetryButton"]').exists(),
    ).toBe(true);
  });

  it('still forwards the error to app.config.errorHandler (Sentry must see it)', async () => {
    const errorHandler = vi.fn();
    mountBoundary(BrokenOnMount, errorHandler);
    await flushPromises();

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect((errorHandler.mock.calls[0][0] as Error).message).toBe(
      'Network Error',
    );
  });

  it('leaves a rendered page intact when a post-mount action fails', async () => {
    // The dangerous case: an ungated boundary would replace working UI (and
    // the user's unsaved context) because a save button rejected.
    const wrapper = mountBoundary(BrokenOnClick);
    await flushPromises();
    expect(wrapper.text()).toContain('IMPORTANT CONTENT');

    await wrapper.find('[data-save]').trigger('click');
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-child]').exists()).toBe(true);
    expect(wrapper.text()).toContain('IMPORTANT CONTENT');
  });

  it('recovers when the user retries', async () => {
    let attempts = 0;
    const FlakyOnce = defineComponent({
      name: 'FlakyOnce',
      setup() {
        onMounted(async () => {
          attempts += 1;
          if (attempts === 1) await Promise.reject(new Error('Network Error'));
        });
        return () => h('div', { 'data-child': '' }, 'recovered');
      },
    });

    const wrapper = mountBoundary(FlakyOnce);
    await flushPromises();
    await nextTick();
    expect(wrapper.find('[data-child]').exists()).toBe(false);

    await wrapper
      .find('[data-testid="testErrorBoundaryRetryButton"]')
      .trigger('click');
    await flushPromises();
    await nextTick();

    expect(attempts).toBe(2);
    expect(wrapper.find('[data-child]').exists()).toBe(true);
  });

  it('clears the fallback on navigation so the user is not stuck all session', async () => {
    // Fails only on the first mount: a permanently-broken child would re-fail
    // the instant the boundary reset, making a working reset indistinguishable
    // from a broken one.
    let mounts = 0;
    const FailsFirstMountOnly = defineComponent({
      name: 'FailsFirstMountOnly',
      setup() {
        onMounted(async () => {
          mounts += 1;
          if (mounts === 1) await Promise.reject(new Error('Network Error'));
        });
        return () => h('div', { 'data-child': '' }, 'next page');
      },
    });

    const wrapper = mountBoundary(FailsFirstMountOnly);
    await flushPromises();
    await nextTick();
    expect(wrapper.find('[data-child]').exists()).toBe(false);

    route.fullPath = '/disasters';
    await nextTick();
    await flushPromises();
    await nextTick();

    expect(
      wrapper.find('[data-testid="testErrorBoundaryRetryButton"]').exists(),
    ).toBe(false);
    expect(wrapper.find('[data-child]').exists()).toBe(true);
    route.fullPath = '/disasters/archived';
  });

  it('ignores a cancelled request', async () => {
    const CancelledRequest = defineComponent({
      name: 'CancelledRequest',
      setup() {
        onMounted(async () => {
          const error = new Error('canceled');
          (error as Error & { code?: string }).code = 'ERR_CANCELED';
          Object.assign(error, { __CANCEL__: true });
          await Promise.reject(error);
        });
        return () => h('div', { 'data-child': '' }, 'still here');
      },
    });

    const wrapper = mountBoundary(CancelledRequest);
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-child]').exists()).toBe(true);
  });

  it('ignores a stale-chunk error so the router can do its reload-once recovery', async () => {
    const ChunkFail = defineComponent({
      name: 'ChunkFail',
      setup() {
        onMounted(async () => {
          await Promise.reject(
            new Error(
              'Failed to fetch dynamically imported module: /assets/x.js',
            ),
          );
        });
        return () => h('div', { 'data-child': '' }, 'still here');
      },
    });

    const wrapper = mountBoundary(ChunkFail);
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-child]').exists()).toBe(true);
  });

  it('renders public-site chrome on unauthenticated routes', async () => {
    // Public pages render their own nav/footer, so a bare error card would
    // strip a survivor's way back and the hotline links.
    route.meta.layout = 'unauthenticated';
    const wrapper = mountBoundary(BrokenOnMount);
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-home]').exists()).toBe(true);
    route.meta.layout = 'authenticated';
  });
});
