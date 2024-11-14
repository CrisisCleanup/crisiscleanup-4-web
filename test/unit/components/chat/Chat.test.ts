import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Chat from '@/components/chat/Chat.vue';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';

class MockWebSocket {
  addEventListener() {
    return;
  }

  removeEventListener() {
    return;
  }

  send() {
    expect(true);
  }

  close() {
    return;
  }
}

vi.mock('vue-router', async () =>
  // eslint-disable-next-line unicorn/no-await-expression-member
  (await import('../../fixtures/router')).buildMockRouter(),
);

describe('Chat.vue', () => {
  // @ts-expect-error ignore
  let origWebSocket;
  beforeEach(() => {
    origWebSocket = global.WebSocket;
    global.WebSocket = MockWebSocket as any;
  });
  afterEach(() => {
    // @ts-expect-error ignore
    global.WebSocket = origWebSocket;
  });
  it('should render messages', async () => {
    const mockChat = {
      id: '1',
      name: 'General Chat',
    };

    const wrapper = mount(Chat, {
      props: {
        chat: mockChat,
      },
    });

    await flushPromises();

    // Check if messages are rendered
    expect(wrapper.html()).toContain('Hello, how can I help you?');
  });

  it('should send a message', async () => {
    const mockChat = {
      id: '1',
      name: 'General Chat',
    };

    const wrapper = mount(Chat, {
      props: {
        chat: mockChat,
      },
      components: {
        BaseInput,
        BaseButton,
      },
    });

    await flushPromises();

    const messageInput = wrapper.find('textarea');
    const sendMessageButton = wrapper.find('button');

    await messageInput.setValue('Test message');
    await sendMessageButton.trigger('click');
    await flushPromises();
  });
});
