<template>
  <tag
    :style="[styles]"
    :data-testid="`test${language?.shortName}Icon`"
    class="tag-item tag--language"
    v-bind="$attrs"
  >
    {{ language && language.shortName }}
  </tag>
</template>

<script lang="ts">
// TODO: Fix in eslint config
// eslint-disable-next-line import/no-unresolved
import * as config from 'tailwind.config';
import { computed, onMounted, ref } from 'vue';
import Language from '../../models/Language';

export default defineComponent({
  name: 'LanguageTag',
  props: {
    languageId: {
      type: Number,
      default: null,
    },
    languageSubtag: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const { theme } = config;
    const language = ref(null);
    const styles = computed(() => {
      if (!language.value) {
        return {
          color: theme.extend.colors['crisiscleanup-grey']['500'],
          borderColor: theme.extend.colors['crisiscleanup-grey']['500'],
        };
      }

      const colorMap = {
        7: {
          color: theme.extend.colors['crisiscleanup-red']['300'],
          borderColor: theme.extend.colors['crisiscleanup-red']['300'],
        },
        2: {
          color: theme.extend.colors['crisiscleanup-lightblue']['400'],
          borderColor: theme.extend.colors['crisiscleanup-lightblue']['400'],
        },
        91: {
          color: theme.extend.colors['crisiscleanup-yellow']['600'],
          borderColor: theme.extend.colors['crisiscleanup-yellow']['600'],
        },
        11: {
          color: theme.extend.colors['crisiscleanup-green']['300'],
          borderColor: theme.extend.colors['crisiscleanup-green']['300'],
        },
        165: {
          color: theme.extend.colors['crisiscleanup-green']['300'],
          borderColor: theme.extend.colors['crisiscleanup-green']['300'],
        },
        166: {
          color: theme.extend.colors['crisiscleanup-green']['300'],
          borderColor: theme.extend.colors['crisiscleanup-green']['300'],
        },
      };
      return colorMap[language.value.id];
    });

    onMounted(async () => {
      if (props.languageSubtag) {
        language.value = await Language.query()
          .where('subtag', props.languageSubtag)
          .first();
      }

      if (!language.value && props.languageId) {
        language.value = await Language.fetchOrFindId(props.languageId);
      }
    });

    return {
      language,
      styles,
    };
  },
});
</script>

<style scoped>
.tag--language {
  line-height: 14px;
}
</style>
