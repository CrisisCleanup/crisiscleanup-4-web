<script setup lang="ts">
import WorksiteCalendar from '@/components/scheduling/WorksiteCalendar.vue';
import useAcl from '@/hooks/useAcl';

onMounted(() => {
  const { $can } = useAcl();
  const router = useRouter();
  if (!$can('beta_feature.calendar_view')) {
    router.replace('/');
  }
});
</script>

<template>
  <WorksiteCalendar />
</template>

<style scoped></style>
