<script lang="ts" setup>
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import _ from 'lodash';
import { computed, nextTick, ref } from 'vue';
import { useToast } from 'vue-toastification';
import Table from '../Table.vue';
import LanguageTag from '../tags/LanguageTag.vue';
import Modal from '@/components/Modal.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BasePill from '@/components/BasePill.vue';
import Avatar from '@/components/Avatar.vue';
import CopyText from '@/components/CopyText.vue';
import AdminEventStream from '@/components/admin/AdminEventStream.vue';
import JsonWrapper from '@/components/JsonWrapper.vue';
import PaneDisclosure from '@/components/phone/foundation/PaneDisclosure.vue';
import PaneEmpty from '@/components/phone/foundation/PaneEmpty.vue';
import Language from '@/models/Language';
import Role from '@/models/Role';
import { momentFromNow, capitalize } from '@/filters';
import useEmitter from '@/hooks/useEmitter';
import { getErrorMessage } from '@/utils/errors';
import InvitationTable from '@/components/admin/InvitationTable.vue';
import InvitationRequestTable from '@/components/admin/InvitationRequestTable.vue';
import { useAuthStore } from '@/hooks';
import { getUserAvatarLink } from '@/utils/urls';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';
import {
  APP_PLATFORM_FIELD_ID,
  REQUESTER_LOCATION_FIELD_ID,
  getAppTypeIcons,
  getRequesterPhone,
  getTicketFieldValue,
  getTicketStatusPillVariant,
  isImageAttachment,
  type TicketCustomField,
} from '@/utils/zendeskTickets';

const ccuApi = useApi();

const commentsContainer = ref<HTMLDivElement | null>(null);
const { emitter } = useEmitter();
const { t } = useI18n();
const toast = useToast();

export interface TicketCardsProps {
  ticketData?: Record<string, unknown>;
  agents: Record<string, unknown>[];
  currentUser?: Record<string, unknown>;
}

interface Thumbnail {
  content_type: string;
  content_url: string;
  file_name: string;
  id: number;
  size: number;
}

interface Comment {
  attachments: {
    content_type: string;
    content_url: string;
    file_name: string;
    id: number;
    size: number;
    thumbnails: {
      [key: string]: Thumbnail;
    }[];
  }[];
  author_id: number;
  body: string;
  created_at: string;
  id: number;
  metadata: {
    system: {
      client: string;
      ip_address: string;
      latitude: number;
      location: string;
      longitude: number;
    };
    via: {
      channel: string;
      source: {
        from: unknown;
        rel: string;
        to: unknown;
      };
    };
  };
  public: boolean;
  type: string;
}

const StatusEnum = {
  NEW: 'new',
  OPEN: 'open',
  PENDING: 'pending',
  SOLVED: 'solved',
};
const REPLY_STATUSES = [StatusEnum.OPEN, StatusEnum.PENDING, StatusEnum.SOLVED];

const props = withDefaults(defineProps<TicketCardsProps>(), {
  ticketData: undefined,
  agents: () => [],
  currentUser: undefined,
});
const ticketTestData = toRef(props, 'ticketData');
const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_APP_API_BASE_URL}/zendesk`,
});
const { loginWithMagicLinkToken } = useAuthStore();
const languages = Language.all();
const currentUserID = ref<number>();
const comments = ref<Comment[]>([]);
const firstComment = ref<Comment>();
const ticketReply = ref<string>('');
const selectedAgent = ref<string>('');
// A reply keeps the ticket status by default. A new ticket becomes open.
const replyStatus = ref<string>(
  REPLY_STATUSES.includes(props.ticketData?.status as string)
    ? (props.ticketData?.status as string)
    : StatusEnum.OPEN,
);
const workSiteColumns = [
  {
    key: 'id',
    title: 'Worksite ID',
    sortable: true,
    searchable: false,
    width: '20%',
  },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    searchable: false,
    width: '20%',
  },
  {
    key: 'incident',
    title: 'Incident',
    sortable: true,
    searchable: false,
    width: '60%',
  },
];
const macroColumns = [
  {
    key: 'title',
    title: 'Name',
    sortable: true,
    searchable: false,
    width: '20%',
  },
  {
    key: 'description',
    title: 'Description',
    sortable: true,
    searchable: false,
    width: '20%',
  },
  {
    key: 'template',
    title: 'Template',
    sortable: true,
    searchable: false,
    width: '60%',
  },
];
const macroModalVisibility = ref(false);
const eventsModal = ref(false);
const ccUser = ref(props.ticketData.user.ccu_user);
const zendeskUser = ref(props.ticketData.user);
const ticketCustomFields = computed(
  () => props.ticketData?.custom_fields as TicketCustomField[] | undefined,
);
const requesterLocation = computed(() =>
  getTicketFieldValue(ticketCustomFields.value, REQUESTER_LOCATION_FIELD_ID),
);
const requesterPhone = computed(() =>
  getRequesterPhone(
    { custom_fields: ticketCustomFields.value },
    props.ticketData?.user as Parameters<typeof getRequesterPhone>[1],
  ),
);
const appPlatform = computed(() =>
  getTicketFieldValue(ticketCustomFields.value, APP_PLATFORM_FIELD_ID),
);
const appTypeIcon = computed(() =>
  getAppTypeIcons(
    appPlatform.value,
    (props.ticketData?.description as string | undefined) ?? '',
  ),
);
const statusPillVariant = computed(() =>
  getTicketStatusPillVariant(ticketTestData.value?.status as string),
);
const zendeskTicketUrl = computed(
  () =>
    `https://crisiscleanup.zendesk.com/agent/tickets/${props.ticketData?.id}`,
);
const requesterName = computed<string>(() =>
  ccUser.value
    ? `${ccUser.value.first_name} ${ccUser.value.last_name}`
    : zendeskUser.value?.name,
);

const profilePictureUrl = computed(() => {
  if (ccUser.value?.files && ccUser.value.files.length > 0) {
    const profilePictures = ccUser.value.files.filter(
      (file: Record<string, unknown>) =>
        file.file_type_t === 'fileTypes.user_profile_picture',
    );
    if (profilePictures.length > 0) {
      return profilePictures[0].small_thumbnail_url;
    }
  }

  return getUserAvatarLink(requesterName.value);
});
const submittedFrom = computed(() => {
  const _separator = 'Submitted from:';
  const parsed = (props.ticketData?.description as string | undefined)
    ?.split(_separator)[1]
    ?.trim();
  return parsed || '';
});
const assignedUser = computed(() => {
  return _.find(props.agents, { id: props.ticketData?.assignee_id }) as Record<
    string,
    unknown
  >;
});
const ticketAssigneeName = computed(() => {
  return assignedUser.value ? assignedUser.value.name : t('~~Unassigned');
});

// Crisis Cleanup account rows. Only rows with a value show.
const accountDetails = computed(() => {
  if (!ccUser.value) return [];
  const rows = [
    {
      label: t('~~Organization'),
      value: ccUser.value.organization?.name,
    },
    {
      label: t('~~Account email'),
      value:
        ccUser.value.email?.toLowerCase() ===
        zendeskUser.value?.email?.toLowerCase()
          ? undefined
          : ccUser.value.email,
    },
    {
      label: t('~~Joined'),
      value: ccUser.value.accepted_terms_timestamp
        ? momentFromNow(ccUser.value.accepted_terms_timestamp)
        : undefined,
    },
    {
      label: t('~~Last sign-in'),
      value: ccUser.value.last_sign_in_at
        ? momentFromNow(ccUser.value.last_sign_in_at)
        : undefined,
    },
    { label: t('~~Sign-ins'), value: ccUser.value.sign_in_count },
  ];
  return rows.filter(
    (row) => row.value !== undefined && row.value !== null && row.value !== '',
  );
});
const accountMobile = computed(() =>
  ccUser.value?.mobile && ccUser.value.mobile !== requesterPhone.value
    ? ccUser.value.mobile
    : undefined,
);
const userLanguages = computed(() =>
  ccUser.value
    ? languages.filter(
        (item) =>
          item.id === ccUser.value.primary_language ||
          item.id === ccUser.value.secondary_language,
      )
    : [],
);
const roleNames = computed<string[]>(() =>
  ((ccUser.value?.active_roles ?? []) as number[]).flatMap((roleId) => {
    const role = Role.find(roleId);
    return role ? [t(role.name_t)] : [];
  }),
);

const createIssue = () => {
  getAllPictures();

  const formattedComments = comments.value
    .map(
      (comment) =>
        `**Comment ${
          getAgentById(comment.author_id) ?? zendeskUser.value.name
        }:**\n\n${removeSubmittedFromFooter(comment.body)}`,
    )
    .join('\n\n---\n\n');

  const queryParams = new URLSearchParams({ title: '', body: '' });
  if (ccUser.value) {
    queryParams.set(
      'body',
      `



**Additional Information:**
- Environment:
- Version:
- Ticket Submitted From: **${submittedFrom.value}**
- Zendesk Username: **${zendeskUser.value.name}**
- Crisis Cleanup Username: **${
        ccUser.value.first_name + ' ' + ccUser.value.last_name
      }**
- Organization: **${ccUser.value.organization?.name}**
- Email: **${ccUser.value.email}**
- Phone: **${ccUser.value.mobile}**
- CC Age: **${momentFromNow(ccUser.value.accepted_terms_timestamp)}**

**Pictures:**
${attachmentsArray.value.join('\n')}

**Comments:**
\`\`\`
  ${formattedComments}
\`\`\`
`,
    );
  } else {
    queryParams.set(
      'body',
      `


**Additional Information:**
- Environment:
- Version:
- Ticket Submitted From: **${submittedFrom.value}**
- Zendesk Username: **${zendeskUser.value.name}**

**Pictures:**
${attachmentsArray.value.join('\n')}

**Comments:**
\`\`\`
  ${formattedComments}
\`\`\`
`,
    );
  }

  const url = `https://github.com/CrisisCleanup/${
    selectedRepo.value
  }/issues/new?${queryParams.toString()}`;

  // Perform any other actions or navigate to the URL
  window.open(url, '_blank');
};

const openInZendesk = () => {
  window.open(zendeskTicketUrl.value, '_blank', 'noopener');
};

const fetchActiveTicket = () => {
  axiosInstance
    .get(`/tickets/${ticketTestData.value.id}`, {})
    .then((response) => {
      ticketTestData.value.status = response.data.ticket.status;
      ticketTestData.value.assignee_id = response.data.ticket.assignee_id;
    })
    .catch((error: Error) => {
      console.error('Error fetching Tickets:', error);
    });
};

const replyToTicket = (replyStatus: string) => {
  if (replyStatus === StatusEnum.SOLVED && !assignedUser.value) {
    return axiosInstance
      .put(`/tickets/${props.ticketData.id}`, {
        ticket: {
          assignee_id: currentUserID.value!,
        },
      })
      .then((response: AxiosResponse<unknown>) => {
        if (response.status === 200) {
          toast.success(t('helpdesk.reassign_success'));
          setTimeout(() => {
            fetchActiveTicket();
          }, 1000); // Timeout to account for zendesk db update
        }

        selectedAgent.value = '';
      })
      .catch((error: Error) => {
        toast.error(
          `${t('helpdesk.reassign_failure')} ${getErrorMessage(error)}`,
        );
      })
      .then(() => {
        // Ticket has been successfully reassigned, now proceed with the ticket reply
        return axiosInstance.put(`/tickets/${props.ticketData.id}`, {
          ticket: {
            status: replyStatus,
            comment: {
              body: ticketReply.value,
              author_id: currentUserID.value,
            },
          },
        });
      })
      .then((response) => {
        if (response.status === 200) {
          toast.success(t('helpdesk.reply_success'));
          emitter.emit('closeTicketModal');
        }
      })
      .then(() => {
        emitter.emit('reFetchActiveTicket');
      })
      .catch((error: Error) => {
        toast.error(
          `${t('helpdesk.reply_unsuccessful')} ${getErrorMessage(error)}`,
        );
      });
  }

  return axiosInstance
    .put(`/tickets/${props.ticketData.id}`, {
      ticket: {
        status: replyStatus,
        comment: {
          body: ticketReply.value,
          author_id: currentUserID.value,
        },
      },
    })
    .then((response) => {
      if (response.status === 200) {
        toast.success(t('helpdesk.reply_success'));
      }

      if (replyStatus === StatusEnum.OPEN) {
        getComments();
      } else {
        emitter.emit('closeTicketModal');
      }

      if (props.ticketData?.assignee_id) {
        fetchActiveTicket();
        ticketReply.value = '';
      } else {
        reAssignTicket(currentUserID.value);
      }
    })
    .then(() => {
      emitter.emit('reFetchActiveTicket');
    })
    .catch((error: Error) => {
      toast.error(
        `${t('helpdesk.reply_unsuccessful')} ${getErrorMessage(error)}`,
      );
    });
};

const reAssignTicket = (agentId?: number) => {
  const _assigneeId = agentId || selectedAgent.value;

  return axiosInstance
    .put(`/tickets/${props.ticketData.id}`, {
      ticket: {
        assignee_id: _assigneeId,
      },
    })
    .then((response: AxiosResponse<unknown>) => {
      if (response.status === 200) {
        toast.success(t('helpdesk.reassign_success'));
        setTimeout(() => {
          fetchActiveTicket();
        }, 1000); // Timeout to account for zendesk db update
      }

      selectedAgent.value = '';
    })
    .catch((error: Error) => {
      toast.error(
        `${t('helpdesk.reassign_failure')} ${getErrorMessage(error)}`,
      );
    });
};

const getAgentIdForCurrentUser = () => {
  const agent = props.agents.find(
    (agent) => agent.name === props.currentUser?.full_name,
  );
  const generalAgent = props.agents.find(
    (agent) => agent.name === 'Crisis Cleanup Helpdesk',
  );
  // The agents can still be loading: leave the id unset instead of throwing.
  currentUserID.value = (agent ?? generalAgent)?.id as number | undefined;
};

const getComments = () => {
  axiosInstance
    .get(`/tickets/${props.ticketData.id}/comments`, {})
    .then(async (response: AxiosResponse<unknown>) => {
      comments.value = response.data.comments;
      firstComment.value = comments.value[0];
      await nextTick();
      if (commentsContainer.value) {
        commentsContainer.value.scrollTop =
          commentsContainer.value.scrollHeight;
      }
    })
    .catch(getErrorMessage);
};

const isAgentComment = (comment: Comment) =>
  props.agents.some((agent) => agent.id === comment.author_id);

const commentAuthor = (comment: Comment) =>
  getAgentById(comment.author_id) ?? zendeskUser.value.name;

const showEventsModal = () => {
  eventsModal.value = !eventsModal.value;
};

const showMacroModal = () => {
  macroModalVisibility.value = !macroModalVisibility.value;
};

const executeMacro = (macro) => {
  showMacroModal();
  let appendedReply = [ticketReply.value, macro.template]
    .filter(Boolean)
    .join('\n');

  for (const [zendeskVariable, myVariable] of Object.entries(
    zendeskVariables,
  )) {
    appendedReply = appendedReply.replaceAll(
      zendeskVariable,
      String(myVariable ?? ''),
    );
  }

  ticketReply.value = appendedReply;

  toast.success(`${t('helpdesk.macro_success')} ${macro.title}`);
};

async function loginAs(userId: string) {
  const response = await axios.post(
    `${import.meta.env.VITE_APP_API_BASE_URL}/magic_link`,
    {
      user: userId,
    },
  );
  await loginWithMagicLinkToken(response.data.token, true);
  window.location.reload();
}

const removeSubmittedFromFooter = (body?: string) => {
  const delimiter = '------------------';
  const parts = (body ?? '').split(delimiter);
  return parts[0].trim();
};

const getAgentById = (id: number) =>
  props.agents?.find((agent) => agent.id === id)?.name as string | undefined;

const onMacroSearch = computed(() => {
  const lowerCasedSearchValue = macroSearch.value.toLowerCase().trim();

  // If there is no search term, return the original mappedMacros.value without filtering
  if (!lowerCasedSearchValue) {
    return mappedMacros.value;
  }

  return mappedMacros.value.filter((macro) => {
    const macroTitleLower = macro.title ? macro.title.toLowerCase() : '';
    const macroDescriptionLower = macro.description
      ? macro.description.toLowerCase()
      : '';
    const macroTemplateLower =
      typeof macro.template === 'string' ? macro.template.toLowerCase() : '';

    return (
      macroTitleLower.includes(lowerCasedSearchValue) ||
      macroDescriptionLower.includes(lowerCasedSearchValue) ||
      macroTemplateLower.includes(lowerCasedSearchValue)
    );
  });
});

const mappedMacros = ref([]);

const getMacros = () => {
  axiosInstance
    .get<Record<string, unknown>>(`/macros`, {})
    .then((response: AxiosResponse<unknown>) => {
      const mappedData = response.data?.macros.map((macro) => {
        const templateAction = macro.actions.find(
          (action: Record<string, unknown>) => action.field === 'comment_value',
        );
        const templateValue = templateAction?.value ?? '';
        return {
          title: macro.title,
          description: macro.description,
          template: templateValue,
        };
      });
      mappedMacros.value = mappedData;
    });
};

const zendeskVariables = {
  '{{current_user.details}}': 'unknownCurrentUserDetails',
  '{{current_user.email}}': props.currentUser?.email,
  '{{current_user.external_id}}': props.currentUser?.id,
  '{{current_user.first_name}}': props.currentUser?.first_name,
  '{{current_user.language}}': props.currentUser?.primary_language,
  '{{current_user.name}}': props.currentUser?.full_name,
  '{{current_user.notes}}': 'unknownCurrentUserNotes',
  '{{current_user.organization.details}}':
    'unknownCurrentUserOrganizationDetails',
  '{{current_user.organization.name}}': props.currentUser?.organization?.name,
  '{{current_user.organization.notes}}': 'unknownCurrentUserOrganizationNotes',
  '{{current_user.phone}}': props.currentUser?.mobile,
  '{{satisfaction.current_comment}}': 'unknownSatisfactionCurrentComment',
  '{{satisfaction.current_rating}}': 'unknownSatisfactionCurrentRating',
  '{{ticket.account}}': 'unknownTicketAccount',
  '{{ticket.assignee.email}}': 'unknownTicketAssigneeEmail',
  '{{ticket.assignee.first_name}}': 'unknownTicketAssigneeFirstName',
  '{{ticket.assignee.last_name}}': 'unknownTicketAssigneeLastName',
  '{{ticket.assignee.name}}': 'unknownTicketAssigneeName',
  '{{ticket.brand.name}}': 'unknownTicketBrandName',
  '{{ticket.cc_names}}': 'unknownTicketCCNames',
  '{{ticket.ccs}}': 'unknownTicketCCs',
  '{{ticket.current_holiday_name}}': 'unknownTicketCurrentHolidayName',
  '{{ticket.description}}': 'unknownTicketDescription',
  '{{ticket.due_date}}': 'unknownTicketDueDate',
  '{{ticket.external_id}}': 'unknownTicketExternalId',
  '{{ticket.latest_comment_html}}': 'unknownTicketLatestCommentHTML',
  '{{ticket.latest_public_comment_html}}':
    'unknownTicketLatestPublicCommentHTML',
  '{{ticket.organization.details}}': 'unknownTicketOrganizationDetails',
  '{{ticket.organization.external_id}}': 'unknownTicketOrganizationExternalId',
  '{{ticket.organization.name}}': 'unknownTicketOrganizationName',
  '{{ticket.organization.notes}}': 'unknownTicketOrganizationNotes',
  '{{ticket.priority}}': 'unknownTicketPriority',
  '{{ticket.requester.details}}': 'unknownTicketRequesterDetails',
  '{{ticket.requester.email}}': zendeskUser.value.email,
  '{{ticket.requester.external_id}}': 'unknownTicketRequesterExternalId',
  '{{ticket.requester.first_name}}': zendeskUser.value.name.split(' ')[0],
  '{{ticket.requester.language}}': 'unknownTicketRequesterLanguage',
  '{{ticket.requester.last_name}}': zendeskUser.value.name.split(' ')[1],
  '{{ticket.requester.name}}': zendeskUser.value.name,
  '{{ticket.requester.phone}}': zendeskUser.value.phone,
  '{{ticket.requester_field}}': 'unknownTicketRequesterField',
  '{{ticket.status}}': props.ticketData?.status,
  '{{ticket.tags}}': 'unknownTicketTags',
  '{{ticket.ticket_field_ID}}': 'unknownTicketFieldID',
  '{{ticket.ticket_field_option_title_ID}}': 'unknownTicketFieldOptionTitleID',
  '{{ticket.ticket_type}}': props.ticketData?.type,
  '{{ticket.title}}': props.ticketData?.subject,
  '{{ticket.url}}': props.ticketData?.url,
  // Add more Zendesk variables as needed
};
const ghostUser = ref([]);

async function getGhostUser() {
  const response = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/ghost_users?search=${
      zendeskUser.value.email
    }`,
  );
  ghostUser.value = response.data.results;
}

const worksites = ref([]);

async function getWorksiteForUser() {
  const response = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/worksites?search=${
      zendeskUser.value.email
    }`,
  );
  worksites.value = response.data.results;
}

const openWorkSitePage = (incidentId: number, worksiteId: number) => {
  const url = `https://crisiscleanup.org/incident/${incidentId}/work/${worksiteId}?showOnMap=true`;
  window.open(url, '_blank');
};

const worksiteModal = ref(false);
const showWorksiteModal = () => {
  worksiteModal.value = !worksiteModal.value;
};

const crisisCleanupRepos = ref([
  'crisiscleanup-4-web',
  'crisiscleanup-android',
  'crisiscleanup-ios',
]);

const repoSelection = ref(false);

const showRepoSelection = () => {
  repoSelection.value = !repoSelection.value;
};

const selectedRepo = ref(crisisCleanupRepos.value[0]);

const attachmentsArray = ref([]);

const getAllPictures = () => {
  // Assuming comments.value is an array of comments, each with an attachments array
  attachmentsArray.value = _.flatMap(comments.value, (comment) =>
    comment.attachments.map((attachment) => attachment.content_url),
  );
};

const macroSearch = ref('');

const invitations = ref([]);
const invitationRequests = ref([]);

const { isFinished: isInvitationFinished, data: _invitations } = ccuApi(
  `/admins/invitations?search=${zendeskUser.value.email}`,
  {
    method: 'GET',
  },
);
whenever(isInvitationFinished, () => {
  invitations.value = _invitations.value?.results ?? [];
});

const { isFinished: isInvitationRequestsFinished, data: _invitationRequests } =
  ccuApi(
    `/admins/invitation_requests?search=${zendeskUser.value.email}&approved_by__isnull=true&rejected_by__isnull=true&sort=-requested_at`,
    {
      method: 'GET',
    },
  );
whenever(isInvitationRequestsFinished, () => {
  invitationRequests.value = _invitationRequests.value?.results ?? [];
});

const invitationRequestsModalVisibility = ref(false);
const showInvitationRequestsModal = () => {
  invitationRequestsModalVisibility.value =
    !invitationRequestsModalVisibility.value;
};

const invitationsModalVisibility = ref(false);
const showInvitationsModal = () => {
  invitationsModalVisibility.value = !invitationsModalVisibility.value;
};

// A requester with no account, case, ghost user, or invitation.
const hasNoAccount = computed(
  () =>
    !ccUser.value &&
    worksites.value.length === 0 &&
    ghostUser.value.length === 0 &&
    invitations.value.length === 0 &&
    invitationRequests.value.length === 0,
);

const tableWidthMQ = computed(() => {
  return {
    height: '670px',
    width: '100%',
  };
});
onMounted(async () => {
  getAgentIdForCurrentUser();
  getComments();
  getMacros();
  await getWorksiteForUser();
  await getGhostUser();
});
</script>

<template>
  <div class="ticket" data-testid="testTicketCards">
    <div class="flex flex-col gap-4 min-w-0">
      <!-- Summary -->
      <section class="ticket-card p-4 flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <BasePill
            :variant="statusPillVariant"
            show-dot
            data-testid="testTicketStatusPill"
          >
            {{ capitalize(ticketTestData.status) }}
          </BasePill>
          <span class="text-[13px] text-crisiscleanup-grey-900">
            {{ t('helpdesk.ticket_created_at') }}
            {{ momentFromNow(ticketData.created_at) }}
          </span>
          <img
            :src="appTypeIcon"
            :alt="t('helpdesk.app_platform')"
            :title="appPlatform ?? t('helpdesk.app_platform')"
            class="h-5 w-5"
          />
          <div class="ml-auto flex flex-wrap gap-2">
            <BaseButton
              variant="outline"
              size="small"
              data-testid="testCreateGithubIssueButton"
              :text="t('helpdesk.create_github_issue')"
              :action="showRepoSelection"
            />
            <BaseButton
              variant="outline"
              size="small"
              data-testid="testOpenInZendeskButton"
              :text="t('~~Open in Zendesk')"
              :action="openInZendesk"
            />
          </div>
        </div>
        <h2 class="text-[16px] font-bold text-black break-words">
          {{ ticketData.raw_subject || ticketData.subject }}
        </h2>
        <dl v-if="firstComment || submittedFrom" class="ticket-details">
          <template v-if="submittedFrom">
            <dt>{{ t('helpdesk.submitting_page') }}</dt>
            <dd>{{ submittedFrom }}</dd>
          </template>
          <template v-if="firstComment?.metadata?.system?.ip_address">
            <dt>{{ t('helpdesk.ip_address') }}</dt>
            <dd>
              <CopyText
                :text="firstComment.metadata.system.ip_address"
                icon-class="ml-1"
              >
                {{ firstComment.metadata.system.ip_address }}
              </CopyText>
            </dd>
          </template>
          <template v-if="firstComment?.metadata?.system?.location">
            <dt>{{ t('~~Network location') }}</dt>
            <dd>
              <a
                class="ticket-link"
                :href="`https://www.google.com/maps/search/?api=1&query=${firstComment.metadata.system.latitude},${firstComment.metadata.system.longitude}`"
                target="_blank"
                rel="noopener"
                :title="firstComment.metadata.system.location"
                >{{ firstComment.metadata.system.location }}</a
              >
            </dd>
          </template>
        </dl>
      </section>

      <!-- Conversation -->
      <section class="ticket-card flex flex-col min-h-0">
        <header class="ticket-card__header">
          <h3 class="ticket-eyebrow">{{ t('helpdesk.comments') }}</h3>
          <BasePill v-if="comments.length > 0" variant="dark" class="ml-auto">
            {{ comments.length }}
          </BasePill>
        </header>
        <div
          ref="commentsContainer"
          class="px-4 py-2 scroll-smooth lg:max-h-[32rem] lg:overflow-y-auto"
        >
          <PaneEmpty
            v-if="comments.length === 0"
            :title="t('~~No comments yet')"
          />
          <article
            v-for="comment in comments"
            :key="comment.id"
            class="ticket-comment"
            :class="{ 'ticket-comment--requester': !isAgentComment(comment) }"
            data-testid="testTicketComment"
          >
            <Avatar
              :initials="commentAuthor(comment)"
              :url="getUserAvatarLink(commentAuthor(comment))"
              :custom-size="{ width: '32px', height: '32px' }"
            />
            <div class="min-w-0 flex-1 flex flex-col gap-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[13px] font-semibold text-black">
                  {{ commentAuthor(comment) }}
                </span>
                <BasePill v-if="isAgentComment(comment)" variant="dark">
                  {{ t('~~Agent') }}
                </BasePill>
                <BasePill v-if="comment.public === false" variant="claimed">
                  {{ t('~~Internal note') }}
                </BasePill>
                <span
                  class="ml-auto text-[12px] text-crisiscleanup-grey-900"
                  :title="comment.created_at"
                >
                  {{ momentFromNow(comment.created_at) }}
                </span>
              </div>
              <p
                class="text-[15px] leading-snug text-black whitespace-pre-line break-words"
              >
                {{ removeSubmittedFromFooter(comment.body) }}
              </p>
              <div
                v-if="comment.attachments?.length"
                class="flex flex-wrap gap-2 pt-1"
              >
                <a
                  v-for="attachment in comment.attachments"
                  :key="attachment.id"
                  :href="attachment.content_url"
                  target="_blank"
                  rel="noopener"
                  :title="attachment.file_name"
                >
                  <img
                    v-if="isImageAttachment(attachment)"
                    :src="attachment.content_url"
                    :alt="attachment.file_name"
                    class="h-16 w-16 object-cover rounded border border-crisiscleanup-grey-100"
                  />
                  <span v-else class="ticket-file">
                    {{ attachment.file_name }}
                  </span>
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Reply -->
      <section class="ticket-card p-4 flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <h3 class="ticket-eyebrow">{{ t('~~Reply') }}</h3>
          <BaseButton
            class="ml-auto"
            variant="outline"
            size="small"
            data-testid="testApplyMacroButton"
            :text="t('actions.apply_macro')"
            :action="showMacroModal"
          />
        </div>
        <textarea
          v-model="ticketReply"
          class="ticket-textarea"
          rows="6"
          data-testid="testTicketReplyTextarea"
          :aria-label="t('~~Reply')"
          :placeholder="t('~~Write a reply to the requester')"
        />
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-[13px] text-crisiscleanup-grey-900">
            {{ t('~~Submit as') }}
          </span>
          <div role="radiogroup" class="flex gap-1">
            <button
              v-for="status in REPLY_STATUSES"
              :key="status"
              type="button"
              role="radio"
              class="ticket-status-option"
              :class="{
                'ticket-status-option--active': replyStatus === status,
              }"
              :aria-checked="replyStatus === status"
              :data-testid="`testReplyStatus-${status}`"
              @click="replyStatus = status"
            >
              {{ capitalize(status) }}
            </button>
          </div>
          <BaseButton
            class="ml-auto"
            variant="solid"
            size="medium"
            data-testid="testSubmitReplyButton"
            :text="
              t('~~Submit as {status}', { status: capitalize(replyStatus) })
            "
            :action="() => replyToTicket(replyStatus)"
          />
        </div>
      </section>
    </div>

    <aside class="flex flex-col gap-4 min-w-0">
      <!-- Requester -->
      <section class="ticket-card p-4 flex flex-col gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <Avatar
            :initials="requesterName"
            :url="profilePictureUrl"
            :custom-size="{ width: '48px', height: '48px' }"
          />
          <div class="min-w-0">
            <p class="text-[15px] font-semibold text-black truncate">
              {{ requesterName }}
            </p>
            <CopyText
              v-if="zendeskUser.email"
              :text="zendeskUser.email"
              icon-class="ml-1"
            >
              <span class="text-[13px] text-crisiscleanup-grey-900 break-all">
                {{ zendeskUser.email }}
              </span>
            </CopyText>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5" data-testid="testAccountTypePills">
          <BasePill v-if="ccUser" variant="open">
            {{ t('helpdesk.user_account') }}
          </BasePill>
          <button
            v-if="worksites.length > 0"
            type="button"
            class="ticket-pill-button"
            @click="showWorksiteModal"
          >
            <BasePill variant="in-progress">
              {{ t('helpdesk.survivor_account') }}
            </BasePill>
          </button>
          <BasePill v-if="ghostUser.length > 0" variant="claimed">
            {{ t('helpdesk.ghost_user') }}
          </BasePill>
          <button
            v-if="invitations.length > 0"
            type="button"
            class="ticket-pill-button"
            @click="showInvitationsModal"
          >
            <BasePill variant="urgent">
              {{ t('helpdesk.invitation') }}
            </BasePill>
          </button>
          <button
            v-if="invitationRequests.length > 0"
            type="button"
            class="ticket-pill-button"
            @click="showInvitationRequestsModal"
          >
            <BasePill variant="dark">
              {{ t('helpdesk.invitation_request') }}
            </BasePill>
          </button>
          <BasePill v-if="hasNoAccount" variant="completed">
            {{ t('helpdesk.no_role') }}
          </BasePill>
        </div>

        <dl class="ticket-details">
          <template v-if="requesterPhone">
            <dt>{{ t('~~Phone') }}</dt>
            <dd>
              <PhoneNumberDisplay :phone-number="requesterPhone" type="plain" />
            </dd>
          </template>
          <template v-if="accountMobile">
            <dt>{{ t('~~Account mobile') }}</dt>
            <dd>
              <PhoneNumberDisplay :phone-number="accountMobile" type="plain" />
            </dd>
          </template>
          <template v-if="requesterLocation">
            <dt>{{ t('~~Location') }}</dt>
            <dd>{{ requesterLocation }}</dd>
          </template>
          <template v-for="row in accountDetails" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </template>
          <template v-if="userLanguages.length > 0">
            <dt>{{ t('helpdesk.languages') }}</dt>
            <dd class="flex flex-wrap gap-1">
              <LanguageTag
                v-for="language in userLanguages"
                :key="language.id"
                :language-id="language.id"
              />
            </dd>
          </template>
          <template v-if="roleNames.length > 0">
            <dt>{{ t('helpdesk.roles') }}</dt>
            <dd class="flex flex-wrap gap-1">
              <BasePill v-for="role in roleNames" :key="role" variant="dark">
                {{ role }}
              </BasePill>
            </dd>
          </template>
        </dl>

        <BaseButton
          v-if="ccUser"
          class="w-full"
          variant="solid"
          size="medium"
          data-testid="testLoginAsButton"
          :text="t('actions.login_as')"
          :action="() => loginAs(ccUser.id)"
        />
      </section>

      <!-- Assignment -->
      <section class="ticket-card p-4 flex flex-col gap-3">
        <h3 class="ticket-eyebrow">{{ t('helpdesk.assigned_to') }}</h3>
        <p class="text-[15px] font-semibold text-black">
          {{ ticketAssigneeName }}
        </p>
        <div class="flex items-start gap-2">
          <BaseSelect
            class="flex-1 min-w-0"
            :model-value="selectedAgent"
            label="name"
            item-key="id"
            :options="agents"
            :placeholder="t('helpdesk.select_agent')"
            @update:model-value="(v) => (selectedAgent = v)"
          />
          <BaseButton
            variant="outline"
            size="medium"
            data-testid="testAssignTicketButton"
            :disabled="!selectedAgent"
            :text="t('actions.assign')"
            :action="() => reAssignTicket()"
          />
        </div>
      </section>

      <!-- Account activity -->
      <section v-if="ccUser" class="ticket-card flex flex-col min-h-0">
        <header class="ticket-card__header">
          <h3 class="ticket-eyebrow">{{ t('~~Recent activity') }}</h3>
          <BaseButton
            class="ml-auto"
            variant="text"
            size="small"
            :text="t('actions.show_more')"
            :action="showEventsModal"
          />
        </header>
        <div class="px-4 py-3 text-xs max-h-80 overflow-auto">
          <AdminEventStream :user="ccUser.id" :limit="5" />
        </div>
      </section>

      <section v-if="ccUser" class="ticket-card overflow-hidden">
        <PaneDisclosure
          name="ticket-account-json"
          :title="t('helpdesk.more_user_details')"
        >
          <JsonWrapper :json-data="ccUser" />
        </PaneDisclosure>
      </section>
    </aside>

    <modal
      v-if="invitationsModalVisibility"
      closeable
      :title="t('helpdesk.invitation')"
      modal-classes="bg-white w-full max-w-5xl"
      @close="showInvitationsModal()"
    >
      <InvitationTable :invitations="invitations" />
      <template #footer><span></span></template>
    </modal>

    <modal
      v-if="invitationRequestsModalVisibility"
      closeable
      :title="t('helpdesk.invitation_request')"
      modal-classes="bg-white w-full max-w-5xl"
      @close="showInvitationRequestsModal()"
    >
      <InvitationRequestTable :requests="invitationRequests" />
      <template #footer><span></span></template>
    </modal>

    <modal
      v-if="worksiteModal"
      closeable
      :title="t('helpdesk.worksite')"
      modal-classes="bg-white w-full max-w-3xl"
      @close="showWorksiteModal()"
    >
      <Table
        :columns="workSiteColumns"
        :data="worksites"
        :body-style="{ height: '400px' }"
        @row-click="(v) => openWorkSitePage(v.incident, v.id)"
      />
      <template #footer><span></span></template>
    </modal>

    <modal
      v-if="eventsModal && ccUser"
      closeable
      :title="t('~~Recent activity')"
      modal-classes="bg-white w-full max-w-4xl"
      modal-body-classes="p-4 max-h-[75vh] overflow-auto"
      @close="showEventsModal()"
    >
      <AdminEventStream :user="ccUser.id" />
      <template #footer><span></span></template>
    </modal>

    <modal
      v-if="repoSelection"
      closeable
      :title="t('helpdesk.create_github_issue')"
      modal-classes="bg-white w-full max-w-md"
      @close="showRepoSelection()"
      @ok="createIssue()"
    >
      <div class="p-4">
        <BaseSelect
          :model-value="selectedRepo"
          :placeholder="t('helpdesk.select_a_repo')"
          :options="crisisCleanupRepos"
          :clearable="false"
          @update:model-value="(v) => (selectedRepo = v)"
        />
      </div>
    </modal>

    <modal
      v-if="macroModalVisibility"
      closeable
      :title="t('helpdesk.macros')"
      modal-classes="bg-white w-full max-w-5xl h-[85vh] flex flex-col"
      modal-body-classes="flex flex-col gap-3 p-4 h-full min-h-0"
      @close="showMacroModal()"
    >
      <input
        v-model="macroSearch"
        type="search"
        class="ticket-search"
        data-testid="testMacroSearchInput"
        :aria-label="t('helpdesk.search_macros')"
        :placeholder="t('helpdesk.search_macros')"
      />
      <Table
        :columns="macroColumns"
        :data="onMacroSearch"
        :body-style="tableWidthMQ"
        @row-click="(v) => executeMacro(v)"
      >
        <template #template="slotProps">
          <p class="whitespace-pre-line text-[13px] leading-snug">
            {{ slotProps.item.template }}
          </p>
        </template>
      </Table>
      <template #footer><span></span></template>
    </modal>
  </div>
</template>

<style scoped>
.ticket {
  @apply grid grid-cols-1 gap-4 p-4 bg-crisiscleanup-smoke text-left lg:grid-cols-[minmax(0,1fr)_22rem];
}

.ticket-card {
  @apply bg-white rounded border border-crisiscleanup-grey-100 min-w-0;
}

.ticket-card__header {
  @apply flex items-center gap-2 px-4 pt-4 pb-3 border-b border-crisiscleanup-grey-100;
}

.ticket-eyebrow {
  @apply text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900;
}

.ticket-details {
  @apply grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[13px];

  dt {
    @apply text-crisiscleanup-grey-900;
  }

  dd {
    @apply text-black min-w-0 break-words;
  }
}

.ticket-link {
  @apply text-primary-dark underline underline-offset-2;
}

.ticket-comment {
  @apply flex gap-3 py-3 border-b border-crisiscleanup-grey-100 last:border-b-0;

  &--requester {
    @apply bg-crisiscleanup-smoke -mx-4 px-4;
  }
}

.ticket-file {
  @apply inline-flex items-center h-8 px-3 rounded border border-crisiscleanup-grey-100 bg-white text-[13px] text-black;
}

.ticket-textarea,
.ticket-search {
  @apply w-full border border-crisiscleanup-grey-100 rounded px-3 py-2 text-[15px] leading-snug focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light;
  transition: all 300ms ease;
}

.ticket-textarea {
  @apply resize-y min-h-[96px];
}

.ticket-status-option {
  @apply h-9 px-3 text-[13px] rounded border border-crisiscleanup-grey-100 bg-white hover:bg-crisiscleanup-smoke;
  transition: all 300ms ease;

  &--active {
    @apply border-primary-light bg-primary-light font-semibold text-black hover:bg-primary-light;
  }
}

.ticket-pill-button {
  @apply rounded-full focus:outline-none focus:ring-2 focus:ring-primary-light;
}
</style>
