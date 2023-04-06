<template>
  <div class="text-xs">
    <div class="flex items-center justify-between">
      <div v-html="getHeader()"></div>
      <span style="font-size: 10px">{{
        momentFromNow(currentEvent.created_at)
      }}</span>
    </div>
    <div>
      <span
        >{{ currentEvent.attr.actor_first_name }}
        {{ currentEvent.attr.actor_last_name }}</span
      >
      from
      <span>{{ currentEvent.attr.actor_organization_name }}</span>
      {{ getTranslation(currentEvent.past_tense_t, currentEvent.attr) }}
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { momentFromNow } from '@/filters';
import useWorktypeImages from '@/hooks/worksite/useWorktypeImages';

export default defineComponent({
  name: 'EventCard',
  props: {
    currentEvent: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  setup(props) {
    const { t } = useI18n();
    const { getWorktypeSVG } = useWorktypeImages();
    const $t = (text: string, attrs: Record<string, any>) => {
      return text ? t(text, attrs) : null;
    };

    function getEventTitle(event_key: string) {
      if (event_key) {
        return $t(`events.${event_key.replace(':', '_')}`, {});
      }

      return event_key;
    }

    function getTranslation(tag: string, attr: Record<string, any>) {
      const translated_attrs = Object.fromEntries(
        Object.entries(attr).map(([key, value]) => [
          key,
          key.endsWith('_t') ? $t(value, {}) : value,
        ]),
      );
      return $t(tag, translated_attrs);
    }
    const getHeader = () => {
      if (props.currentEvent.attr.patient_wwtsp) {
        const svg = getWorktypeSVG(
          {
            work_type: props.currentEvent.attr.patient_wwtsp[0].work_type_key,
            status: props.currentEvent.attr.patient_wwtsp[0].status,
          },
          25,
        );
        return svg;
      }
    };

    return {
      getEventTitle,
      getTranslation,
      momentFromNow,
      getHeader,
    };
  },
});
</script>
