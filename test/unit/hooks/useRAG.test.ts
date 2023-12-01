import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRAG } from '@/hooks/useRAG';

vi.mock('@vueuse/integrations/useAxios', () => {
  return {
    useAxios: vi.fn(() => ({
      data: ref(null),
      isLoading: ref(false),
      execute: vi.fn(),
    })),
  };
});

describe('useRAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty history', () => {
    const { history } = useRAG();
    expect(history.value).toEqual([]);
  });

  it('should add user question to history when submitted', async () => {
    const { submitQuestion, history } = useRAG();
    const question = 'What is the capital of France?';
    await submitQuestion(question);
    expect(history.value).toEqual([{ actor: 'user', content: question }]);
  });

  it('should not add empty questions to history', async () => {
    const { submitQuestion, history } = useRAG();
    await submitQuestion('');
    expect(history.value).toEqual([]);
  });

  it('should expose loading state from useAxios', () => {
    const { loading } = useRAG();
    expect(loading.value).toBe(false);
  });
});
