<template>
  <v-popover placement="bottom-end" :auto-hide="false">
    <base-button
      data-testid="testRefineButton"
      variant="text"
      class="text-base font-thin mx-1 flex items-center gap-1"
      ccu-icon="filters"
      icon-size="medium"
      icon-classes="w-4"
      :alt="$t('casesVue.refine', 'Refine')"
    >
      {{ $t('casesVue.refine', 'Refine') }}
    </base-button>
    <template #popper>
      <div class="w-72 p-4 flex flex-col gap-5">
        <section v-if="showSvi">
          <div
            class="text-[12px] font-bold uppercase tracking-[0.08em] text-crisiscleanup-grey-900 mb-2"
          >
            {{ $t('svi.vulnerability', 'Vulnerability') }}
          </div>
          <Slider
            primary-color="#dadada"
            data-testid="testSviSliderInput"
            secondary-color="white"
            :value="sviValue"
            :from="$t('svi.most_vulnerable')"
            :to="$t('svi.everyone')"
            :from-tooltip="$t('svi.svi_more_info_link')"
            handle-size="12px"
            track-size="8px"
            slider-class="w-full"
            @input="(v: number) => $emit('svi', v)"
          />
        </section>
        <section>
          <div
            class="text-[12px] font-bold uppercase tracking-[0.08em] text-crisiscleanup-grey-900 mb-2"
          >
            {{ $t('casesVue.updated', 'Updated') }}
          </div>
          <Slider
            track-size="8px"
            data-testid="testUpdatedSliderInput"
            handle-size="12px"
            primary-color="#dadada"
            secondary-color="white"
            slider-class="w-full"
            :value="dateValue"
            :min="0"
            :max="100"
            :from="dateFrom"
            :to="dateTo"
            @input="(v: number) => $emit('date', v)"
          />
        </section>
      </div>
    </template>
  </v-popover>
</template>

<script setup lang="ts">
import Slider from '@/components/Slider.vue';

interface Props {
  sviValue: number;
  dateValue: number;
  dateFrom: string;
  dateTo: string;
  showSvi: boolean;
}

defineProps<Props>();

defineEmits<{
  (e: 'svi', value: number): void;
  (e: 'date', value: number): void;
}>();
</script>
