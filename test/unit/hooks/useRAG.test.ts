import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reactive, nextTick, ref } from 'vue';
import { useRAG } from '@/hooks/useRAG';
import { generateUUID } from '@/utils/helpers';
import { injectLocal } from '@vueuse/core';

vi.mock('@vueuse/core', async (orig) => {
  return {
    ...(await orig()),
    provideLocal: vi.fn((key, value) => value),
    injectLocal: vi.fn((key, value) => value),
  };
});

// Mock dependencies
vi.mock('@/utils/helpers', () => ({
  generateUUID: vi.fn().mockReturnValue('mocked-uuid'),
}));

class MockWebSocket {
  listeners = {};

  constructor() {
    this.listeners = {
      message: [],
      send: [],
      close: [],
    };
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  simulateMessage(data) {
    if (this.listeners['message']) {
      for (const callback of this.listeners['message']) {
        callback({ data: JSON.stringify(data) });
      }
    }
  }

  send = vi.fn((data) => {
    if (this.listeners['send']) {
      for (const callback of this.listeners['send']) {
        callback(data);
      }
    }
  });

  close() {
    if (this.listeners['close']) {
      for (const callback of this.listeners['close']) callback();
    }
  }
}

const mockWebSocket = new MockWebSocket();
vi.mock('@/hooks/useWebSockets', () => ({
  useWebSockets: vi.fn().mockImplementation(() => {
    return {
      socket: mockWebSocket,
      send: mockWebSocket.send,
    };
  }),
}));

describe('useRAG', () => {
  let history: ReturnType<typeof useRAG>['history'];
  let submitQuestion: ReturnType<typeof useRAG>['submitQuestion'];

  beforeEach(() => {
    vi.clearAllMocks();
    const rag = useRAG(ref(), ref());
    history = rag.history;
    submitQuestion = rag.submitQuestion;

    injectLocal.mockReturnValue({
      socket: mockWebSocket,
      message: ref(),
    });
  });

  it('initializes history as an empty array', () => {
    expect(history.value).toEqual([]);
  });

  it.skip('adds a new question to history when submitQuestion is called', async () => {
    submitQuestion('Test question');
    await nextTick();
    expect(history.value).toHaveLength(1);
    expect(history.value[0]).toEqual({
      messageId: 'mocked-uuid',
      actor: 'user',
      content: 'Test question',
      collectionId: undefined,
      conversationId: 'mocked-uuid',
    });
    expect(mockWebSocket.send).toHaveBeenCalledWith({
      type: 'rag.conversation',
      message: {
        question: 'Test question',
        collectionId: undefined,
        conversationId: 'mocked-uuid',
      },
    });
  });

  it('does not add a question to history when submitQuestion is called with an empty string', async () => {
    submitQuestion('');
    await nextTick();
    expect(history.value).toHaveLength(0);
    expect(mockWebSocket.send).not.toHaveBeenCalled();
  });
});
