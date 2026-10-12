import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AdminIndex from '@/pages/admin/Index.vue';
import type { Tab } from '@/hooks/useTabs';

vi.mock('@/hooks', () => ({
  useCurrentUser: () => ({ currentUser: ref(null) }),
}));
vi.mock('@/hooks/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('@/hooks/useAcl', () => ({
  default: () => ({ $can: () => true }),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() }),
}));

describe('admin tab bar', () => {
  it('has one tab for the AI Call Console and none for the Call Auditor', () => {
    const wrapper = mount(AdminIndex, {
      global: {
        stubs: {
          PageTabBar: {
            name: 'PageTabBar',
            props: ['tabs'],
            template: '<div />',
          },
        },
      },
    });
    const tabs = wrapper
      .getComponent({ name: 'PageTabBar' })
      .props('tabs') as Tab[];
    expect(tabs.find((tab) => tab.key === 'nav.voice_console')?.title).toBe(
      '~~AI Call Console',
    );
    expect(tabs.map((tab) => tab.key)).not.toContain('nav.voice_reviews');
    expect(tabs.map((tab) => tab.title)).not.toContain('~~Call Auditor');
  });
});
