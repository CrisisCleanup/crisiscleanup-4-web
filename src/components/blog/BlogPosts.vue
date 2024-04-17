<template>
  <ul class="overflow-auto">
    <li
      v-for="cmsItem in cmsItems"
      :key="cmsItem.id"
      class="py-3 cursor-pointer border-b-2 hover:bg-crisiscleanup-light-grey"
      @click="emit('onClick', cmsItem)"
    >
      <div class="flex gap-5">
        <div
          class="px-5 h-16 bg-blue-400 text-white font-bold flex items-center justify-center"
        >
          <div class="text-center">
            {{ moment(cmsItem.publish_at).format('MMM') }}
            <br />
            <div class="text-2xl">
              {{ moment(cmsItem.publish_at).format('D') }}
            </div>
          </div>
        </div>
        <div class="h-44 overflow-y-hidden flex-grow">
          <div
            class="text-xl font-bold truncate"
            v-html="$t(formatCmsItem(cmsItem.title))"
          ></div>
          <p
            class="text-base line-clamp-8"
            v-html="$t(formatCmsItem(cmsItem.content))"
          ></p>
        </div>
        <img
          v-if="cmsItem.thumbnail_file"
          :src="cmsItem.thumbnail_file.blog_url"
          class="w-32 h-32 self-center"
          :alt="cmsItem.thumbnail_file"
        />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { formatCmsItem } from '@/utils/helpers';
import moment from 'moment';
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  cmsItems: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['onClick']);
</script>
