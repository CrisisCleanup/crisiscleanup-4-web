<template>
  <div class="event-stream" data-testid="testEventStreamDiv">
    <transition-group
      name="event-stream-row"
      tag="div"
      class="event-stream__rows"
    >
      <div
        v-for="(card, index) in displayedCards"
        :key="card.event.id"
        class="event-stream__row"
        :class="{ 'event-stream__row--newest': index === 0 }"
        :data-status-family="statusFamily(card)"
      >
        <span class="event-stream__newmark" aria-hidden="true">
          <span v-if="index === 0" class="event-stream__newmark-bar"></span>
        </span>
        <span class="event-stream__time">{{
          momentFromNow(card.event.created_at)
        }}</span>
        <span class="event-stream__kind">{{
          getEventTitle(card.event.event_key)
        }}</span>
        <span class="event-stream__detail">
          <span class="event-stream__actor"
            >{{ card.event.attr.actor_first_name }}
            {{ card.event.attr.actor_last_name }}</span
          >
          <span class="event-stream__from">{{ $t('~~from') }}</span>
          <span class="event-stream__org">{{
            card.event.attr.actor_organization_name
          }}</span>
          <span class="event-stream__verb">{{
            getTranslation(card.event.past_tense_t, card.event.attr)
          }}</span>
        </span>
      </div>
    </transition-group>
    <div v-if="displayedCards.length === 0" class="event-stream__empty">
      {{ $t('~~No live activity yet — events appear here as they happen.') }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { momentFromNow } from '@/filters';
import { useMq } from 'vue3-mq';

interface Event {
  id: string;
  event_key?: string;
  past_tense_t: string;
  created_at: string;
  attr: Record<string, any>;
}

interface EventCard {
  event: Event;
  color?: string;
  strokeColor?: string;
}

export default defineComponent({
  name: 'LiveEventStream',
  setup() {
    const { t, te } = useI18n();
    const mq = useMq();

    const cards = ref<EventCard[]>([]);

    const displayedCards = computed(() => {
      // Civic-bulletin aesthetic — visible activity at every viewport.
      // The pre-redesign default of "1 row on mobile" made the feed look
      // dead on a phone even when the back-end was busy.
      const limit = mq.sm ? 5 : mq.lgPlus ? 8 : 6;
      return cards.value.slice(0, limit);
    });

    const $t = (text: string, attrs: Record<string, any>) => {
      if (!text) return '';
      return te(text) ? t(text, attrs) : text;
    };

    const getEventTitle = (event_key?: string) => {
      if (!event_key) return '';
      const key = `events.${event_key.replace(':', '_')}`;
      return te(key) ? t(key) : event_key;
    };

    const getTranslation = (tag: string, attr: Record<string, any>) => {
      const translated_attrs = Object.fromEntries(
        Object.entries(attr).map(([key, value]): [string, unknown] => [
          key,
          key.endsWith('_t') ? $t(String(value), {}) : value,
        ]),
      );
      return $t(tag, translated_attrs);
    };

    const statusFamily = (card: EventCard) => {
      // Prefer the worksite's patient_status when present (it's a precise
      // status string like "open-unassigned-unclaimed"). Fall back to the
      // event key — most live events on the public dashboard are user_*
      // actions that don't carry patient_status, and we still want them
      // tinted by the kind of action they represent.
      const ps = (card.event.attr.patient_status as string) || '';
      if (ps) {
        if (
          ps.includes('open-unassigned-unclaimed') ||
          ps.includes('overdue')
        ) {
          return 'negative';
        }
        if (ps.includes('claimed') || ps.includes('progress')) return 'mid';
        if (ps.includes('closed') || ps.includes('completed'))
          return 'positive';
      }

      const key = (card.event.event_key || '').toLowerCase();
      if (key.includes('close') || key.includes('complete')) return 'positive';
      if (
        key.includes('claim') ||
        key.includes('update') ||
        key.includes('assign')
      ) {
        return 'mid';
      }
      if (
        key.includes('create') ||
        key.includes('unclaim') ||
        key.includes('reject') ||
        key.includes('delete')
      ) {
        return 'negative';
      }
      // Reads, logins, and other passive events are neutral.
      return 'neutral';
    };

    function clearCards() {
      cards.value = [];
    }

    function addCardComponent(card: EventCard) {
      // Suppress duplicates: the previous card's translated copy.
      if (cards.value.length > 0) {
        const cur = getTranslation(card.event.past_tense_t, card.event.attr);
        const prev = getTranslation(
          cards.value[0].event.past_tense_t,
          cards.value[0].event.attr,
        );
        if (cur === prev) return;
      }
      cards.value.unshift(card);
      if (cards.value.length > 12) {
        cards.value = cards.value.slice(0, 12);
      }
    }

    return {
      cards,
      displayedCards,
      addCardComponent,
      clearCards,
      momentFromNow,
      getEventTitle,
      getTranslation,
      statusFamily,
    };
  },
});
</script>

<style scoped lang="postcss">
.event-stream {
  width: 100%;
  height: 100%;
  font-family: var(--ff-body);
  color: var(--cc-type-2);
  font-size: var(--ts-meta);
  overflow: hidden;
  /*
   * Container query parent: the rail is narrow even on a 1280-wide
   * laptop (~360px). Layout decisions should follow the rail width,
   * not the viewport — viewport-based media queries kept the 4-col
   * cramped layout active on small desktops where it doesn't fit.
   */
  container-type: inline-size;
  container-name: stream;
}

.event-stream__rows {
  width: 100%;
  display: block;
}

/*
 * Two-line wire-feed row at every width. Line 1 is the headline
 * (time · KIND in status color); line 2 holds the detail (actor +
 * from + org + verb) on its own row so it can breathe even at the
 * widest kiosk rail. This was originally a single-line 4-col grid
 * — the headline/detail split reads as "newscast under-banner" and
 * keeps the kind word's status hue from competing with the verb.
 */
.event-stream__row {
  position: relative;
  display: grid;
  grid-template-columns: 4px auto 1fr;
  grid-template-areas:
    'newmark time kind'
    '.       detail detail';
  align-items: baseline;
  column-gap: 12px;
  row-gap: 2px;
  padding: 8px 0 8px 8px;
  border-bottom: 1px solid var(--cc-ink-3);
  line-height: 1.35;
}

.event-stream__newmark {
  grid-area: newmark;
}

.event-stream__time {
  grid-area: time;
}

.event-stream__kind {
  grid-area: kind;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.event-stream__newmark {
  position: relative;
  width: 4px;
  height: 100%;
  align-self: stretch;
}

.event-stream__row--newest .event-stream__newmark-bar {
  position: absolute;
  inset: 0;
  background-color: var(--cc-signal);
  animation: newmark-fade 6s ease-out forwards;
}

@keyframes newmark-fade {
  0%,
  60% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .event-stream__row--newest .event-stream__newmark-bar {
    animation: none;
  }
}

.event-stream__time {
  font-family: var(--ff-mono);
  font-feature-settings: var(--num-features);
  font-weight: 500;
  color: var(--cc-type-3);
  font-size: var(--ts-meta);
  white-space: nowrap;
}

.event-stream__kind {
  font-family: var(--ff-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: calc(var(--ts-meta) * 0.95);
  color: var(--cc-type-1);
  white-space: nowrap;
}

.event-stream__row[data-status-family='negative'] .event-stream__kind {
  color: var(--cc-stat-neg);
}

.event-stream__row[data-status-family='mid'] .event-stream__kind {
  color: var(--cc-stat-mid);
}

.event-stream__row[data-status-family='positive'] .event-stream__kind {
  color: var(--cc-stat-pos);
}

.event-stream__row[data-status-family='neutral'] .event-stream__kind {
  color: var(--cc-stat-neu);
}

.event-stream__detail {
  grid-area: detail;
  font-size: var(--ts-meta);
  color: var(--cc-type-2);
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.event-stream__actor,
.event-stream__org {
  color: var(--cc-type-1);
  font-weight: 600;
}

.event-stream__from {
  color: var(--cc-type-3);
  margin: 0 0.4ch;
}

.event-stream__verb {
  margin-left: 0.4ch;
  color: var(--cc-type-2);
}

.event-stream__empty {
  padding: 24px 8px;
  color: var(--cc-type-3);
  font-style: italic;
  font-size: var(--ts-meta);
}

/* Entry from above; existing rows shift down via translate3d (not layout). */
.event-stream-row-enter-active {
  transition:
    opacity 200ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.event-stream-row-leave-active {
  transition:
    opacity 160ms ease-out,
    transform 160ms ease-out;
}

.event-stream-row-enter-from {
  opacity: 0;
  transform: translate3d(0, -12px, 0);
}

.event-stream-row-leave-to {
  opacity: 0;
  transform: translate3d(0, 8px, 0);
}

.event-stream-row-move {
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .event-stream-row-enter-active,
  .event-stream-row-leave-active,
  .event-stream-row-move {
    transition: none;
  }
}
</style>
