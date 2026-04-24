import type { MaybeRef } from '@vueuse/core';
import { computed, unref } from 'vue';
import type PhoneOutbound from '@/models/PhoneOutbound';
import type { CallerVmHistoryItem, PhoneDnisResult } from '@/models/types';

export interface VoicemailContext {
  hasVoicemail: boolean;
  audioUrl: string | null;
  transcription: string | null;
  summary: string | null;
  isSummaryPending: boolean;
  priorCount: number;
  priorHistory: CallerVmHistoryItem[];
}

type OutboundSource =
  | Pick<PhoneOutbound, 'vm_url' | 'vm_transcription' | 'vm_summary'>
  | null
  | undefined;

type CallerSource =
  | Pick<PhoneDnisResult, 'caller_vm_count' | 'caller_vm_history'>
  | null
  | undefined;

export default function useVoicemailContext(
  outbound: MaybeRef<OutboundSource>,
  caller: MaybeRef<CallerSource> = null,
) {
  return computed<VoicemailContext>(() => {
    const ob = unref(outbound);
    const cl = unref(caller);
    const audioUrl = ob?.vm_url || null;
    const transcription = ob?.vm_transcription || null;
    const summary = ob?.vm_summary || null;
    const priorHistory = Array.isArray(cl?.caller_vm_history)
      ? (cl!.caller_vm_history as CallerVmHistoryItem[])
      : [];
    const priorCount =
      typeof cl?.caller_vm_count === 'number' ? cl.caller_vm_count : 0;
    const hasVoicemail = Boolean(
      audioUrl || transcription || summary || priorHistory.length > 0,
    );
    const isSummaryPending = Boolean((audioUrl || transcription) && !summary);
    return {
      hasVoicemail,
      audioUrl,
      transcription,
      summary,
      isSummaryPending,
      priorCount,
      priorHistory,
    };
  });
}
