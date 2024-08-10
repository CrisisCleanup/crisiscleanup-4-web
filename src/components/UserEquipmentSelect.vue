<template>
  <base-select
    :key="user.id"
    v-model="selectedEquipmentIds"
    data-testid="testUserEquipmentSelect"
    multiple
    searchable
    :clearable="false"
    mode="tags"
    :options="equipment"
    item-key="id"
    label="name_t"
    size="large"
    :loading="selectInputLoading"
    select-classes="bg-white border text-xs equipment-select p-1"
    @changed="updateUserEquipment"
  />
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Collection } from '@vuex-orm/core';
import Equipment from '@/models/Equipment';
import UserEquipment from '@/models/UserEquipment';
import type User from '@/models/User';

export default defineComponent({
  name: 'UserEquipmentSelect',
  props: {
    user: {
      type: Object as PropType<User>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const selectInputLoading = ref(false);
    const userEquipment = ref<Collection<UserEquipment>>([]);
    const selectedEquipmentIds = ref<number[]>([]);
    const equipment = ref<Collection<Equipment>>([]);

    const getEquipment = async () => {
      const results = await Equipment.api().get(`/equipment`, {
        dataKey: 'results',
      });
      return (results.entities?.equipment || []) as Collection<Equipment>;
    };

    onMounted(async () => {
      await updateUserEquipmentData();
      equipment.value = await getEquipment();
    });

    async function updateUserEquipmentData() {
      userEquipment.value = await getUserEquipment();
      selectedEquipmentIds.value = userEquipment.value.map(
        (userEquipment) => userEquipment.equipment,
      );
    }

    async function getUserEquipment() {
      const results = await UserEquipment.api().get(`/user_equipment`, {
        dataKey: 'results',
      });
      console.log('results', results);
      return (results.entities?.user_equipment ||
        []) as Collection<UserEquipment>;
    }

    async function updateUserEquipment(equipmentIds: number[]) {
      const currentEquipment = userEquipment.value;
      const equipmentToAdd = equipmentIds.filter(
        (id) => id && !currentEquipment.map((ur) => ur.equipment).includes(id),
      );
      const equipmentToRemove = currentEquipment
        .map((ur) => ur.equipment)
        .filter((id) => id && !equipmentIds.includes(id));
      const payload: {
        method: 'post' | 'delete';
        url: string;
        data: Record<string, unknown>;
      }[] = [];
      for (const equipmentId of equipmentToAdd) {
        payload.push({
          method: 'post',
          url: '/user_equipment',
          data: {
            equipment: equipmentId,
            user: props.user.id,
            quantity: 1,
          },
        });
      }

      for (const equipmentId of equipmentToRemove) {
        payload.push({
          method: 'delete',
          url: `/user_equipment/${
            currentEquipment.find((ur) => ur.equipment === equipmentId)?.id
          }`,
          data: {},
        });
      }

      console.log('payload', payload);
      selectInputLoading.value = true;
      await Promise.all(
        payload.map((p) => UserEquipment.api()[p.method](p.url, p.data)),
      );
      await updateUserEquipmentData();
      selectInputLoading.value = false;
    }

    return {
      selectInputLoading,
      userEquipment,
      equipment,
      selectedEquipmentIds,
      updateUserEquipment,
    };
  },
});
</script>

<style lang="postcss" scoped></style>
