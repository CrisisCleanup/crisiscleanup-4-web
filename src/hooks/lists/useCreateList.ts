import useDialogs from '@/hooks/useDialogs';
import axios from 'axios';
import { i18n } from '@/modules/i18n';
import NewListForm from '@/pages/lists/NewListForm.vue';

export default function useCreateList(onComplete: () => void, model: string) {
  const { component } = useDialogs();

  const modelOptions = {
    worksite_worksites: i18n.global.t('list.worksite_lists'),
    user_users: i18n.global.t('list.user_lists'),
    organization_organizations: i18n.global.t('list.organization_lists'),
    incident_incidents: i18n.global.t('list.incident_lists'),
    file_files: i18n.global.t('list.file_lists'),
    organization_organizations_incidents_teams: i18n.global.t('list.team_lists'),
    list_lists: i18n.global.t('list.list_lists'),
  };

  const createList = async () => {
    let newList = {};
    const response = await component({
      title: model
        ? `${i18n.global.t('actions.create')} ${modelOptions[model]}`
        : i18n.global.t('actions.create_new'),
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
        i18n.global.t('info.list_created_successfully');
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
