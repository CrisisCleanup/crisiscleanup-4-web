import _ from 'lodash';
import type { TagInputData } from '@sipec/vue3-tags-input';
import { createTags } from '@sipec/vue3-tags-input';
import User from '@/models/User';
import { EMAIL_REGEX } from '@/utils/form';
import { useToast } from 'vue-toastification';
import { i18n } from '@/modules/i18n';
import { generateUUID } from '@/utils/helpers';

interface InviteUsersProps {
  usersToInvite: TagInputData[];
  emails: string;
  selectedOrganization: any;
  organizationDoesNotExist: boolean;
  onSuccess: () => void;
  onError: (error: unknown) => void;
}

const useInviteUsers = () => {
  const $toasted = useToast();

  const inviteUsers = async ({
    usersToInvite,
    emails,
    selectedOrganization,
    organizationDoesNotExist,
    onSuccess,
    onError,
  }: InviteUsersProps) => {
    let tags = _.defaultTo([...usersToInvite], []);
    try {
      if (emails) {
        const emailList = emails.match(EMAIL_REGEX);
        let extTags = _.attempt(createTags, emailList);
        if (_.isError(extTags)) {
          extTags = [];
        }

        tags = _.uniqBy([...tags, ...extTags], 'text');
      }

      if (_.isEmpty(tags)) {
        $toasted.error(i18n.global.t('inviteTeammates.provide_valid_email'));
        return;
      }

      const emailsGroup = tags.map((value) => value.text);
      const invitationUniqueKey = generateUUID();
      await Promise.all(
        emailsGroup.map((email) =>
          User.api().inviteUser(
            email,
            selectedOrganization,
            organizationDoesNotExist,
            invitationUniqueKey,
          ),
        ),
      );

      await User.api().sendInvitationReport(invitationUniqueKey);
      onSuccess();
    } catch (error) {
      onError(error);
    }
  };

  return {
    inviteUsers,
  };
};

export default useInviteUsers;
