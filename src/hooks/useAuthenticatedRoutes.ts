import { computed } from 'vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import { useCurrentIncident } from '@/hooks/incident';
import useAcl from '@/hooks/useAcl';
import { i18n } from '@/modules/i18n';

export const useAuthenticatedRoutes = () => {
  const { currentUser } = useCurrentUser();
  const { currentIncidentId } = useCurrentIncident();
  const { $can } = useAcl();

  const routes = computed(() => [
    {
      name: 'nav.dashboard',
      key: 'dashboard',
      text: i18n.global.t('nav.dashboard'),
      to: `/incident/${currentIncidentId.value}/dashboard`,
    },
    {
      name: 'nav.work',
      key: 'work',
      to: `/incident/${currentIncidentId.value}/work`,
      icon: 'cases',
      text: i18n.global.t('nav.work'),
    },
    {
      name: 'nav.phone',
      key: 'phone',
      icon: 'phone',
      text: i18n.global.t('nav.phone'),
      to: `/incident/${currentIncidentId.value}/phone`,
      disabled: !$can || !$can('phone_agent'),
    },
    {
      name: 'nav.organization',
      key: 'my_organization',
      icon: 'organization',
      iconSize: 'large',
      to: '/organization/invitations',
    },
    {
      name: 'nav.other_organizations',
      key: 'other_organizations',
      icon: 'otherorg',
      iconSize: 'xl',
      to: `/incident/${currentIncidentId.value}/other_organizations`,
    },

    // {
    //   name: 'nav.reports',
    //   key: 'reports',
    //   icon: 'reports',
    //   text: i18n.global.t('nav.reports'),
    //   to: `/incident/${currentIncidentId.value}/reports`,
    //   newBadge: Report.query()
    //       .where('created_at', (created_at: string) => {
    //         const reportsAccessed =
    //             currentUser?.value?.states &&
    //             currentUser.value.states.reports_last_accessed;
    //         return reportsAccessed
    //             ? moment(created_at).isAfter(moment(reportsAccessed))
    //             : true;
    //       })
    //       .exists(),
    // },
    {
      name: 'nav.disasters',
      key: 'disasters',
      icon: 'current-disasters',
      text: i18n.global.t('nav.disasters'),
      to: '/disasters',
    },
    {
      name: 'nav.training',
      key: 'training',
      text: i18n.global.t('nav.training'),
      icon: {
        type: 'info',
        invertColor: true,
      },
      to: '/training',
    },
    // {
    //   name: 'nav.blog',
    //   key: 'blog',
    //   icon: 'blog',
    //   text: i18n.global.t('nav.blog'),
    //   to: '/blog',
    // },
    {
      name: 'nav.admin',
      key: 'admin',
      icon: 'admin',
      text: i18n.global.t('nav.admin'),
      to: '/admin',
      disabled: !(currentUser.value && currentUser.value.isAdmin),
    },
    {
      name: 'nav.more',
      key: 'more',
      icon: {
        type: 'ellipsissolid',
        invertColor: true,
      },
      text: i18n.global.t('nav.more'),
      to: '/more',
    },
  ]);

  return { routes };
};
