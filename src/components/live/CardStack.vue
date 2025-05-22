<template>
  <div
    class="card-stack-container"
    :class="{ empty: displayedCards.length === 0 }"
  >
    <transition-group
      ref="stackedCards"
      name="list"
      tag="div"
      class="stacked-cards overflow-hidden"
    >
      <EventCard
        v-for="card in displayedCards"
        :key="card.event.id"
        :current-event="card.event"
        class="stacked-card bg-opacity-25 border w-full h-auto rounded my-2 p-2"
        :style="{
          backgroundColor: card.color
            ? hexToRgba(card.color, 0.25)
            : 'rgba(97, 213, 248, 0.25)',
          borderColor: card.strokeColor || '#61D5F8',
        }"
      ></EventCard>
    </transition-group>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import hexToRgba from 'hex-to-rgba';
import EventCard from '@/components/live/EventCard.vue';
import { useMq } from 'vue3-mq';

interface Event {
  id: string;
  past_tense_t: string;
  attr: Record<any, any>;
}

interface EventCardType {
  event: Event;
  color: string;
  strokeColor: string;
}

export default defineComponent({
  name: 'CardStack',
  components: { EventCard },
  setup() {
    const { t } = useI18n();
    const mq = useMq();
    const $t = (text: string, attrs: Record<string, any>) => {
      return text ? t(text, attrs) : null;
    };

    const cards = ref<EventCardType[]>([]);

    // Computed property to determine which cards to display based on screen size
    const displayedCards = computed(() => {
      if (mq.sm) {
        // On mobile, show only the most recent card
        return cards.value.slice(0, 1);
      }
      // On desktop, show all cards up to the limit
      return cards.value.slice(0, 10);
    });

    function clearCards() {
      cards.value = [];
    }

    function getTranslation(tag: string, attr: Record<string, any>) {
      const translated_attrs = Object.fromEntries(
        Object.entries(attr).map(([key, value]): [any, any] => [
          key,
          key.endsWith('_t') ? $t(value, {}) : value,
        ]),
      );
      return $t(tag, translated_attrs);
    }

    function addCardComponent(card: EventCardType) {
      if (cards.value.length > 0) {
        const currentCardText = getTranslation(
          card.event.past_tense_t,
          card.event.attr,
        );
        const previousCardText = getTranslation(
          cards.value[0].event.past_tense_t,
          cards.value[0].event.attr,
        );

        if (currentCardText === previousCardText) return;
      }

      cards.value.unshift(card);
    }

    watch(
      () => cards.value.length,
      (value: number) => {
        if (value > 10) {
          cards.value = cards.value.slice(0, 10);
        }
      },
    );
    return {
      cards,
      displayedCards,
      addCardComponent,
      clearCards,
      hexToRgba,
    };
  },
});
</script>

<style scoped lang="scss">
.card-stack-container {
  width: 100%;
  height: 100%;
  transition: height 0.3s ease;

  &.empty {
    height: 0;
  }
}

.stacked-cards {
  width: 100%;
  height: 100%;
}

.list-move {
  transition: transform 1s;
}

@media (max-width: 640px) {
  .card-stack-container {
    height: 80px; // Fixed height for one card in mobile view
  }

  .stacked-cards {
    .stacked-card {
      margin: 0;
      border-radius: 0.5rem;
      height: 100%;
    }
  }
}
</style>
