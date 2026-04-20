<template>
  <div class="overflow-auto">
    <JsonViewer :value="jsonData" copyable sort></JsonViewer>
  </div>
</template>

<script lang="ts">
const JsonViewer = defineAsyncComponent(async () => {
  const mod = await import('vue-json-viewer');
  return mod.default;
});

export default defineComponent({
  name: 'JsonWrapper',
  components: { JsonViewer },
  props: {
    jsonData: {
      type: Object,
      required: true,
    },
  },
});
</script>

<style scoped></style>
