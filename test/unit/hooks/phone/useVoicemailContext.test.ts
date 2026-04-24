import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import useVoicemailContext from '@/hooks/phone/useVoicemailContext';

const emptyOutbound = {
  vm_url: null,
  vm_transcription: null,
  vm_summary: null,
};

const emptyCaller = {
  caller_vm_count: 0,
  caller_vm_history: [],
};

describe('useVoicemailContext', () => {
  it('returns hasVoicemail=false when both outbound and caller are null', () => {
    const ctx = useVoicemailContext(null as any, null as any);
    expect(ctx.value.hasVoicemail).toBe(false);
    expect(ctx.value.audioUrl).toBeNull();
    expect(ctx.value.summary).toBeNull();
    expect(ctx.value.priorCount).toBe(0);
    expect(ctx.value.priorHistory).toEqual([]);
    expect(ctx.value.isSummaryPending).toBe(false);
  });

  it('returns hasVoicemail=false for empty outbound and caller', () => {
    const ctx = useVoicemailContext(
      { ...emptyOutbound } as any,
      { ...emptyCaller } as any,
    );
    expect(ctx.value.hasVoicemail).toBe(false);
    expect(ctx.value.isSummaryPending).toBe(false);
  });

  it('flags summary pending when audio exists on the outbound but summary is null', () => {
    const ctx = useVoicemailContext(
      { ...emptyOutbound, vm_url: 'https://example.com/vm.mp3' } as any,
      { ...emptyCaller } as any,
    );
    expect(ctx.value.hasVoicemail).toBe(true);
    expect(ctx.value.audioUrl).toBe('https://example.com/vm.mp3');
    expect(ctx.value.summary).toBeNull();
    expect(ctx.value.isSummaryPending).toBe(true);
  });

  it('flags summary pending when transcription exists but summary is null', () => {
    const ctx = useVoicemailContext(
      { ...emptyOutbound, vm_transcription: 'Raw transcript' } as any,
      { ...emptyCaller } as any,
    );
    expect(ctx.value.isSummaryPending).toBe(true);
  });

  it('does not flag pending once summary arrives', () => {
    const ctx = useVoicemailContext(
      {
        ...emptyOutbound,
        vm_url: 'https://example.com/vm.mp3',
        vm_summary: 'Short summary',
      } as any,
      { ...emptyCaller } as any,
    );
    expect(ctx.value.summary).toBe('Short summary');
    expect(ctx.value.isSummaryPending).toBe(false);
  });

  it('exposes prior history from the caller when populated', () => {
    const history = [
      {
        id: 1,
        source: 'inbound' as const,
        created_at: '2026-04-01T10:00:00Z',
        vm_summary: 'Earlier VM',
        vm_transcription: null,
      },
    ];
    const ctx = useVoicemailContext(
      { ...emptyOutbound } as any,
      { caller_vm_count: 4, caller_vm_history: history } as any,
    );
    expect(ctx.value.hasVoicemail).toBe(true);
    expect(ctx.value.priorCount).toBe(4);
    expect(ctx.value.priorHistory).toEqual(history);
  });

  it('defaults non-array caller history to an empty list', () => {
    const ctx = useVoicemailContext(
      { ...emptyOutbound } as any,
      { caller_vm_count: 2, caller_vm_history: null } as any,
    );
    expect(ctx.value.priorHistory).toEqual([]);
  });

  it('handles a null caller with a populated outbound', () => {
    const ctx = useVoicemailContext(
      {
        ...emptyOutbound,
        vm_url: 'https://example.com/vm.mp3',
        vm_summary: 'Summary',
      } as any,
      null as any,
    );
    expect(ctx.value.hasVoicemail).toBe(true);
    expect(ctx.value.priorCount).toBe(0);
    expect(ctx.value.priorHistory).toEqual([]);
  });

  it('tracks changes to the underlying refs', () => {
    const outbound = ref<any>({ ...emptyOutbound });
    const caller = ref<any>({ ...emptyCaller });
    const ctx = useVoicemailContext(outbound, caller);
    expect(ctx.value.hasVoicemail).toBe(false);
    outbound.value = { ...emptyOutbound, vm_summary: 'New summary' };
    expect(ctx.value.hasVoicemail).toBe(true);
    expect(ctx.value.summary).toBe('New summary');
    caller.value = {
      caller_vm_count: 2,
      caller_vm_history: [
        {
          id: 9,
          source: 'inbound',
          created_at: '2026-04-01T00:00:00Z',
          vm_summary: 'prior',
          vm_transcription: null,
        },
      ],
    };
    expect(ctx.value.priorCount).toBe(2);
    expect(ctx.value.priorHistory.length).toBe(1);
  });
});
