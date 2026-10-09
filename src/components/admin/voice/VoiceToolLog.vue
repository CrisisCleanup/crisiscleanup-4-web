<template>
  <PaneEmpty
    v-if="tools.length === 0"
    :title="t('voiceConsole.no_tools_title', 'No tool calls yet')"
    :description="
      t(
        'voiceConsole.no_tools',
        'Each tool call the agent makes shows here, with its arguments, result and time.',
      )
    "
  />
  <ol
    v-else
    class="max-h-[60vh] overflow-y-auto text-sm"
    data-testid="testVoiceToolLog"
  >
    <li
      v-for="(tool, index) in tools"
      :key="index"
      class="border-b border-crisiscleanup-grey-100"
    >
      <details>
        <summary class="flex cursor-pointer items-baseline gap-2 py-1.5">
          <span class="w-6 shrink-0 text-crisiscleanup-dark-300">{{
            index + 1
          }}</span>
          <span class="min-w-0 flex-1">
            <span
              class="font-semibold"
              :class="{ 'text-crisiscleanup-red-700': isError(tool) }"
              >{{ tool.name }}</span
            >
            <span class="block truncate text-xs text-crisiscleanup-dark-300">
              {{ tool.output }}
            </span>
          </span>
          <span
            class="shrink-0 text-xs tabular-nums text-crisiscleanup-dark-300"
          >
            {{ tool.ms === null ? tool.at : `${tool.ms} ms` }}
          </span>
        </summary>
        <pre
          class="mb-2 ml-8 whitespace-pre-wrap break-words rounded bg-crisiscleanup-grey-100/40 p-2 text-xs"
          >{{ prettyArguments(tool.arguments) }}</pre
        >
        <pre
          class="mb-2 ml-8 whitespace-pre-wrap break-words rounded bg-crisiscleanup-grey-100/40 p-2 text-xs"
          >{{ tool.output }}</pre
        >
      </details>
    </li>
  </ol>
</template>

<script setup lang="ts">
import PaneEmpty from '@/components/phone/foundation/PaneEmpty.vue';
import type { ToolCall } from '@/hooks/voice/voiceConsoleState';

defineProps<{ tools: ToolCall[] }>();

const { t } = useI18n();

function isError(tool: ToolCall) {
  return tool.is_error || /^error/i.test(tool.output);
}

function prettyArguments(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
</script>
