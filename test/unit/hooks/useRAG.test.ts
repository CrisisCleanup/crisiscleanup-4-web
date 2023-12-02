import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reactive, nextTick } from 'vue';
import { useRAG } from '@/hooks/useRAG';
import { generateUUID } from '@/utils/helpers';

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
  useWebSockets: vi.fn().mockImplementation(() => ({
    socket: mockWebSocket,
    send: mockWebSocket.send,
  })),
}));

describe('useRAG', () => {
  let history: ReturnType<typeof useRAG>['history'];
  let submitQuestion: ReturnType<typeof useRAG>['submitQuestion'];

  beforeEach(() => {
    vi.clearAllMocks();
    const rag = useRAG();
    history = rag.history;
    submitQuestion = rag.submitQuestion;
  });

  it('initializes history as an empty array', () => {
    expect(history.value).toEqual([]);
  });

  it('adds a new question to history when submitQuestion is called', async () => {
    submitQuestion('Test question');
    await nextTick();
    expect(history.value).toHaveLength(1);
    expect(history.value[0]).toEqual({
      messageId: 'mocked-uuid',
      actor: 'user',
      content: 'Test question',
    });
    expect(mockWebSocket.send).toHaveBeenCalledWith({
      question: 'Test question',
    });
  });

  it('does not add a question to history when submitQuestion is called with an empty string', async () => {
    submitQuestion('');
    await nextTick();
    expect(history.value).toHaveLength(0);
    expect(mockWebSocket.send).not.toHaveBeenCalled();
  });
});
