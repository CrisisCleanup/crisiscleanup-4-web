<template>
  <div
    class="disaster-icon select-none cursor-pointer"
    @dblclick="toggleEasterEgg"
  >
    <component
      :is="randomEasterEgg"
      v-if="randomEasterEgg"
      ref="disaster-icon"
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

<script lang="ts">
import _ from 'lodash';
import Incident from '@/models/Incident';
import type { DisasterIcons } from '@/icons';
import { DISASTER_ICONS, EASTER_EGG_DISASTER_ICONS } from '@/icons';
import { extractIconNameFromPath } from '@/utils/helpers';

export default defineComponent({
  name: 'DisasterIcon',
  props: {
    currentIncident: {
      type: Object,
      default() {
        return {};
      },
    },
  },

  setup(props) {
    const randomEasterEgg = ref();
    const iconRef = templateRef('disaster-icon');

    const incidentImage = computed(() => {
      if (props.currentIncident && props.currentIncident.incidentImage) {
        return props.currentIncident.incidentImage;
      }

      return Incident.getIncidentImage(props.currentIncident.incident_type);
    });

    const incidentIconComp = computed(() => {
      const iconPath = incidentImage.value;
      if (!iconPath) return;
      const iconKey = extractIconNameFromPath(iconPath) as DisasterIcons;
      return DISASTER_ICONS[iconKey];
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

    return {
      incidentImage,
      svgDocument,
      toggleEasterEgg,
      randomEasterEgg,
      incidentIconComp,
    };
  },
});
</script>

<style scoped lang="postcss">
.standard-icon,
.easter-egg {
  @apply w-10 h-10 block;
}
</style>
