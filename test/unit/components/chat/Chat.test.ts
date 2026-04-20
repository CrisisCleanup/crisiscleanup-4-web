import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Chat from '@/components/chat/Chat.vue';

const mockSendToWebsocket = vi.fn();
const mockUpdateUserStates = vi.fn().mockResolvedValue();
const mockSubmitQuestion = vi.fn();
const mockFetchConversations = vi.fn().mockResolvedValue();
const mockDeleteConversation = vi.fn().mockResolvedValue();

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
  useWebSockets: vi.fn(() => {
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

const buildWrapper = () =>
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
        ChatMessage: ChatMessageStub,
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
    mockDeleteConversation.mockClear();
    mockFetchConversations.mockClear();
    mockSendToWebsocket.mockClear();
    mockSubmitQuestion.mockClear();
    mockUpdateUserStates.mockClear();
  });

  it('should render messages', async () => {
    const wrapper = buildWrapper();

    await flushPromises();

    expect(wrapper.html()).toContain('Hello, how can I help you?');
    expect(wrapper.html()).toContain('I need assistance with my account.');

    wrapper.unmount();
  });

  it('should send a message', async () => {
    const wrapper = buildWrapper();

    await flushPromises();

    const messageInput = wrapper.find('textarea');
    const sendMessageButton = wrapper.find('button');

    await messageInput.setValue('Test message');
    await sendMessageButton.trigger('click');
    await flushPromises();

    expect(mockSubmitQuestion).toHaveBeenCalledWith('Test message');
    expect(mockSendToWebsocket).toHaveBeenCalledWith({
      content: 'Test message',
      is_urgent: false,
      parent_message_id: null,
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
});
