import useDialogs from '@/hooks/useDialogs';
import axios from 'axios';
import { i18n } from '@/modules/i18n';
import NewListForm from '@/pages/lists/NewListForm.vue';

export default function useCreateList(onComplete: () => void, model: string) {
  const { component } = useDialogs();

  const modelOptions = {
    worksite_worksites: i18n.global.t('~~Work List'),
    user_users: i18n.global.t('~~User List'),
    organization_organizations: i18n.global.t('~~Organization List'),
    incident_incidents: i18n.global.t('~~Incident List'),
    file_files: i18n.global.t('~~Files List'),
    organization_organizations_incidents_teams: i18n.global.t('~~Teams List'),
    list_lists: i18n.global.t('~~List Lists'),
  };

  const createList = async () => {
    let newList = {};
    const response = await component({
      title: model
        ? `${i18n.global.t('~~Create')} ${modelOptions[model]}`
        : i18n.global.t('~~Create New List'),
      component: NewListForm,
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
