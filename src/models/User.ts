import type { Config } from '@vuex-orm/plugin-axios';
import createDebug from 'debug';
import Language from './Language';
import Role from './Role';
import CCUModel from '@/models/base';
import { getUserAvatarLink } from '@/utils/urls';
import { i18n } from '@/modules/i18n';

export default class User extends CCUModel {
  static entity = 'users';

  id!: string;

  primary_language!: string;

  secondary_language!: string;

  organization!: any;

  active_roles!: any[];

  referring_user!: number;

  preferences!: Record<string, any>;

  first_name!: string;

  last_name!: string;

  email!: string;

  mobile!: string;

  accepted_terms!: boolean;
  accepted_terms_timestamp!: string;

  states!: Record<string, any>;

  social!: Record<string, any>;

  files!: any[];
  approved_incidents!: any[];

  lineage!: any[];

  permissions!: Record<string, boolean>;

  beta_features!: string[];

  sign_in_count!: number;

  current_sign_in_at!: string;

  static fields() {
    return {
      id: this.attr(''),
      first_name: this.string(''),
      last_name: this.string(''),
      email: this.string(''),
      mobile: this.string(''),
      roles: this.attr(null),
      active_roles: this.attr(null),
      files: this.attr(null),
      organization: this.attr(null),
      states: this.attr({}),
      preferences: this.attr({}),
      permissions: this.attr({}),
      beta_features: this.attr({}),
      sign_in_count: this.attr({}),
      current_sign_in_at: this.attr({}),
      primary_language: this.attr(null),
      secondary_language: this.attr(null),
      accepted_terms_timestamp: this.attr(null),
      accepted_terms: this.attr(null),
      social: this.attr({}),
      referring_user: this.attr({}),
      lineage: this.attr([]),
    };
  }

  get hasProfilePicture() {
    if (this.files && this.files.length > 0) {
      const profilePictures = this.files.filter(
        (file) => file.file_type_t === 'fileTypes.user_profile_picture',
      );
      return profilePictures.length;
    }

    return false;
  }

  get profilePictureUrl() {
    if (this.files && this.files.length > 0) {
      const profilePictures = this.files.filter(
        (file) => file.file_type_t === 'fileTypes.user_profile_picture',
      );
      if (profilePictures.length > 0) {
        return profilePictures[0].large_thumbnail_url;
      }
    }
    return getUserAvatarLink(this.first_name);
  }

  get currentRole() {
    return Role.query().whereIdIn(this.active_roles).get()[0];
  }

  get highestRole() {
    return Role.query()
      .whereIdIn(this.active_roles)
      .orderBy('level', 'desc')
      .get()[0];
  }

  get allRoles() {
    return Role.query()
      .whereIdIn(this.active_roles)
      .orderBy('level', 'asc')
      .get();
  }

  get allRolesNames() {
    return this.allRoles
      .map((language) => i18n.global.t(language.name_t))
      .join(', ');
  }

  get referringUser() {
    return User.find(this.referring_user);
  }

  get languages() {
    const languageList: any[] = [];
    if (this.primary_language) {
      languageList.push(Language.find(this.primary_language));
    }

    if (this.secondary_language) {
      languageList.push(Language.find(this.secondary_language));
    }

    return languageList;
  }

  get languageIds() {
    const languageList: any[] = [];
    if (this.primary_language) {
      languageList.push(this.primary_language);
    }

    if (this.secondary_language) {
      languageList.push(this.secondary_language);
    }

    return languageList;
  }

  get languageNames() {
    return this.languages
      .map((language) => i18n.global.t(language.name_t))
      .join(', ');
  }

  get notificationSettings() {
    const settings = {
      has_notifications: false,
    };
    if (this.preferences && this.preferences.notification_settings) {
      return this.preferences.notification_settings;
    }

    return settings;
  }

  get full_name() {
    return `${this.first_name} ${this.last_name}`;
  }

  get facebook() {
    return this.social && this.social.facebook;
  }

  get twitter() {
    return this.social && this.social.twitter;
  }

  get isAdmin() {
    return this.active_roles.includes(1);
  }

  get isPrimaryContact() {
    return this.active_roles.includes(3);
  }

  getStatesForIncident(incidentId: string, fallback = true) {
    if (
      this.states &&
      this.states.incidents &&
      this.states.incidents[incidentId]
    ) {
      return this.states.incidents[incidentId];
    }

    if (fallback) {
      return this.states;
    }

    return null;
  }

  static apiConfig: Config = {
    actions: {
      inviteUser(
        email: string,
        organization = null,
        organizationDoesNotExist = false,
        invitationUniqueKey = '',
      ) {
        const data: Record<string, any> = {
          invitee_email: email,
        };
        if (organization) {
          data.organization = organization;
        }

        if (organizationDoesNotExist) {
          data.organization_does_not_exist = true;
        }

        if (invitationUniqueKey) {
          data.invitation_unique_key = invitationUniqueKey;
        }

        return this.post(`/invitations`, data, { save: false });
      },
      acceptInvite({
        token,
        first_name,
        last_name,
        password,
        mobile,
        title,
      }: Record<string, any>) {
        return this.post(
          `/invitations/accept`,
          {
            invitation_token: token,
            first_name,
            last_name,
            password,
            mobile,
            title,
          },
          { save: false },
        );
      },
      sendInvitationReport(key: string) {
        return this.post(
          `/invitations/send_invitation_report`,
          { invitation_unique_key: key },
          { save: false },
        );
      },
      orphan(id: string) {
        return this.patch(`/users/${id}/orphan`);
      },
      addFile(id: string, file: string, type: string) {
        return this.post(
          `/users/${id}/files`,
          {
            file,
            type_t: type,
          },
          { save: false },
        );
      },
      deleteFile(id: string, file: string) {
        return this.delete(
          `/users/${id}/files`,
          {
            data: { file },
          },
          { save: false },
        );
      },
    },
  };
}
