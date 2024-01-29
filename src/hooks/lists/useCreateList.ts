import useDialogs from '@/hooks/useDialogs';
import axios from 'axios';
import { i18n } from '@/modules/i18n';
import NewListForm from '@/pages/lists/NewListForm.vue';

export default function useCreateList(onComplete: () => void, model: string) {
  const { component } = useDialogs();

  const createList = async () => {
    let newList = {};
    const response = await component({
      title: i18n.global.t('lists.create_new_list'),
      component: NewListForm, // This should be your New List Form component
      classes: 'w-full overflow-auto p-3',
      modalClasses: 'bg-white max-w-3xl shadow',
      props: {
        model,
      },
      listeners: {
        onNewList(payload: Record<string, any>) {
          newList = payload;
        },
      },
    });

    if (response === 'ok' && newList) {
      try {
        await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/lists`,
          newList,
        );
        i18n.global.t('lists.list_created_successfully');
      } catch (error) {
        console.error('Error creating list:', error);
      }
    }

    onComplete();
  };

  return {
    createList,
  };
}
