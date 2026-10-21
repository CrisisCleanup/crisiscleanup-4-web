import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Chat from '@/components/chat/Chat.vue';
import axios from 'axios';
import type { Message } from '@/models/types';
import ChatMessage from '@/components/chat/ChatMessage.vue';
import type { ChatSubmission } from '@/hooks/useChatDelivery';

const mockSendToWebsocket = vi.fn();
const mockUpdateUserStates = vi.fn().mockResolvedValue();
const mockSubmitQuestion = vi.fn();
const mockFetchConversations = vi.fn().mockResolvedValue();
const mockDeleteConversation = vi.fn().mockResolvedValue();
const mockToastError = vi.fn();
let receiveChatMessage: (message: Message) => void;

vi.mock('@/hooks', () => ({
  useRAGCollections: () => ({
    collections: ref([{ name: 'crisiscleanup-faq', uuid: 'faq-collection' }]),
  }),
  useRAGConversations: () => ({
    currentConversationEntries: ref([]),
    conversations: ref([]),
    fetchConversations: mockFetchConversations,
    deleteConversation: mockDeleteConversation,
  }),
  useRAG: () => ({
    history: ref([]),
    submitQuestion: mockSubmitQuestion,
    latestMessage: ref(),
    isStreamingMessage: ref(false),
  }),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  default: () => ({
    currentUser: ref({ id: 99, states: {} }),
    updateUserStates: mockUpdateUserStates,
    userStates: ref({}),
  }),
}));

vi.mock('@/hooks/useWebSockets', () => ({
  useWebSockets: vi.fn((url, _name, callback) => {
    if (url.startsWith('/ws/chat/')) receiveChatMessage = callback;
    const socket = {
      close: vi.fn(),
    };
    return {
      socket,
      send: mockSendToWebsocket,
      close: socket.close,
    };
  }),
}));

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    error: mockToastError,
  }),
}));

const BaseButtonStub = {
  props: ['action', 'disabled'],
  template: '<button :disabled="disabled" @click="action?.()" />',
};

const BaseCheckboxStub = {
  props: ['modelValue'],
  template:
    '<label><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" /><slot /></label>',
};

const BaseInputStub = {
  props: ['modelValue'],
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};

const EditorStub = {
  props: ['modelValue'],
  template:
    '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};

const PassThroughStub = {
  template: '<div><slot name="name" /><slot /></div>',
};

const ChatMessageStub = {
  props: ['message'],
  template: '<div>{{ message?.content }}</div>',
};

const buildWrapper = (showMessages = false) =>
  mount(Chat, {
    props: {
      chat: {
        id: '1',
        name: 'General Chat',
      },
    },
    global: {
      stubs: {
        Accordion: PassThroughStub,
        AccordionItem: PassThroughStub,
        Avatar: true,
        BaseInput: BaseInputStub,
        BaseText: true,
        ChatMessage: showMessages ? false : ChatMessageStub,
        Editor: EditorStub,
        MarkdownRenderer: true,
        UserDetailsTooltip: true,
        'base-button': BaseButtonStub,
        'base-checkbox': BaseCheckboxStub,
        'base-input': BaseInputStub,
        'ccu-icon': true,
        'font-awesome-icon': true,
        tab: PassThroughStub,
        tabs: PassThroughStub,
      },
    },
  });

describe('Chat.vue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockDeleteConversation.mockClear();
    mockFetchConversations.mockClear();
    mockSendToWebsocket.mockReset();
    mockSendToWebsocket.mockReturnValue(true);
    mockSubmitQuestion.mockClear();
    mockToastError.mockClear();
    mockUpdateUserStates.mockClear();
  });

  it('should render messages', async () => {
    const wrapper = buildWrapper();

    await flushPromises();

    expect(wrapper.html()).toContain('Hello, how can I help you?');
    expect(wrapper.html()).toContain('I need assistance with my account.');

    wrapper.unmount();
  });

  it('keeps the draft until the server confirms the message and displays duplicate acknowledgements once', async () => {
    const wrapper = buildWrapper();

    await flushPromises();

    const messageInput = wrapper.find('textarea');
    const sendMessageButton = wrapper.find(
      '[data-testid="testSendMessageButton"]',
    );

    await messageInput.setValue('Test message');
    await sendMessageButton.trigger('click');
    await flushPromises();

    expect((messageInput.element as HTMLTextAreaElement).value).toBe(
      'Test message',
    );
    expect(mockSubmitQuestion).not.toHaveBeenCalled();
    const uuid = mockSendToWebsocket.mock.calls[0][0].uuid;
    const message = {
      id: 99,
      uuid,
      content: 'Test message',
      created_by: 99,
      created_at: '2026-10-21T12:00:00Z',
    } as Message;
    receiveChatMessage(message);
    receiveChatMessage(message);
    await flushPromises();
    expect((messageInput.element as HTMLTextAreaElement).value).toBe('');
    expect(wrapper.text().match(/Test message/g)).toHaveLength(1);

    expect(mockSubmitQuestion).toHaveBeenCalledWith('Test message');
    expect(mockSendToWebsocket).toHaveBeenCalledWith({
      content: 'Test message',
      is_urgent: false,
      parent_message_id: undefined,
      uuid: expect.any(String),
    });
    expect(mockUpdateUserStates).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserStates).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_last_seen: expect.any(String),
      }),
      {},
    );

    wrapper.unmount();
  });

  it('keeps the draft and shows retry feedback when both delivery paths fail', async () => {
    mockSendToWebsocket.mockReturnValue(false);
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('offline'));
    const wrapper = buildWrapper();

    await flushPromises();

    const messageInput = wrapper.find('textarea');
    const sendMessageButton = wrapper.find(
      '[data-testid="testSendMessageButton"]',
    );

    await messageInput.setValue('Test message');
    await sendMessageButton.trigger('click');
    await flushPromises();

    expect(mockSubmitQuestion).not.toHaveBeenCalled();
    expect(mockUpdateUserStates).not.toHaveBeenCalled();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Message not confirmed. Your draft is kept.',
    );
    expect((messageInput.element as HTMLTextAreaElement).value).toBe(
      'Test message',
    );

    wrapper.unmount();
  });

  it('retains a failed reply and clears it only after the server confirms a retry', async () => {
    mockSendToWebsocket.mockReturnValue(false);
    const get = axios.get.bind(axios);
    vi.spyOn(axios, 'get').mockImplementation((url, options) =>
      url.endsWith('/my_favorites')
        ? Promise.resolve({ data: [] })
        : get(url, options),
    );
    const post = vi
      .spyOn(axios, 'post')
      .mockRejectedValue(new Error('offline'));
    const wrapper = buildWrapper(true);
    await flushPromises();
    const parent = wrapper
      .findAllComponents(ChatMessage)
      .find((message) => message.props('message').id === 1)!;
    await parent.find('.chat-message').trigger('mouseenter');
    await parent.find('[icon="reply"]').trigger('click');
    const input = parent.find('textarea');
    await input.setValue('My reply');
    await parent.find('[data-testid="testSendMessageButton"]').trigger('click');
    await flushPromises();
    expect((input.element as HTMLTextAreaElement).value).toBe('My reply');
    expect(parent.find('[role="alert"]').text()).toContain(
      'Message not confirmed',
    );
    const uuid = (post.mock.calls[0][1] as ChatSubmission).uuid;
    post.mockImplementation(async (_url, payload) => ({
      data: {
        id: 87,
        uuid: (payload as ChatSubmission).uuid,
        content: (payload as ChatSubmission).content,
        created_by: 99,
        created_at: '2026-10-21T12:00:00Z',
        parent_message: 1,
      },
    }));
    await parent.find('[data-testid="testSendMessageButton"]').trigger('click');
    await flushPromises();
    expect((post.mock.calls[1][1] as ChatSubmission).uuid).toBe(uuid);
    expect((input.element as HTMLTextAreaElement).value).toBe('');
    expect(parent.props('message').replies).toHaveLength(1);
    expect(mockSubmitQuestion).toHaveBeenCalledWith('My reply');
    expect(mockUpdateUserStates).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
});
