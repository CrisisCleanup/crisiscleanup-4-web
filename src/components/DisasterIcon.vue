<template>
  <div
    class="disaster-icon select-none cursor-pointer"
    @dblclick="toggleEasterEgg"
  >
    <component
      :is="randomEasterEgg"
      v-if="randomEasterEgg"
      ref="disaster-icon"
      :alt="randomEasterEgg.name"
      :title="randomEasterEgg.name"
      class="easter-egg"
      data-testid="testRandomEasterEggIcon"
    ></component>
    <component
      :is="incidentIconComp"
      v-else
      ref="disaster-icon"
      class="standard-icon"
      data-testid="testIncidentImageIcon"
    ></component>
  </div>
</template>

<script lang="ts" setup>
import _ from 'lodash';
import type Incident from '@/models/Incident';
import type { DisasterIcons } from '@/icons';
import { DISASTER_ICONS, EASTER_EGG_DISASTER_ICONS } from '@/icons';
import { extractIconNameFromPath } from '@/utils/helpers';

export interface DisasterIconProps {
  currentIncident: Incident;
}

const props = defineProps<DisasterIconProps>();

const randomEasterEgg = ref();
const iconRef = templateRef('disaster-icon');

const incidentIconComp = computed(() => {
  const incidentType = props.currentIncident.incident_type as DisasterIcons;
  if (!incidentType) return;
  return DISASTER_ICONS[incidentType];
});

const svgDocument = computed(() => iconRef?.value?.$el);
watch(svgDocument, () => {
  if (isDefined(svgDocument) && !isDefined(randomEasterEgg)) {
    svgDocument.value.querySelectorAll('path')[0].style.fill =
      props.currentIncident.color;
  }
});

function toggleEasterEgg() {
  randomEasterEgg.value = randomEasterEgg.value
    ? undefined
    : _.sample(EASTER_EGG_DISASTER_ICONS);
}
</script>

<style scoped lang="postcss">
.standard-icon,
.easter-egg {
  @apply w-10 h-10 block;
}
</style>
