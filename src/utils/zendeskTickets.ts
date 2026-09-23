import webIcon from '@/assets/icons/web.svg';
import iosIcon from '@/assets/icons/ios.svg';
import androidIcon from '@/assets/icons/android.svg';
import type { BasePillVariant } from '@/components/BasePill.vue';

const TICKET_STATUS_PILLS: Record<string, BasePillVariant> = {
  new: 'claimed',
  open: 'open',
  pending: 'completed',
  hold: 'completed',
  solved: 'in-progress',
  closed: 'in-progress',
};

/** The BasePill variant for a Zendesk ticket status. */
export function getTicketStatusPillVariant(status?: string): BasePillVariant {
  return (status && TICKET_STATUS_PILLS[status]) || 'dark';
}

/** True when a Zendesk attachment can show as an image thumbnail. */
export function isImageAttachment(attachment: {
  content_type?: string;
}): boolean {
  return attachment.content_type?.startsWith('image/') ?? false;
}

// Zendesk custom ticket field IDs.
export const APP_PLATFORM_FIELD_ID = 17_295_140_815_757;
// "Phone number" and "County, State" from the Zendesk contact form.
export const REQUESTER_PHONE_FIELD_ID = 32_308_414_471_565;
export const REQUESTER_LOCATION_FIELD_ID = 32_308_472_678_669;

export interface TicketCustomField {
  id: number;
  value: unknown;
}

export function getTicketFieldValue(
  customFields: TicketCustomField[] | undefined,
  fieldId: number,
): string | undefined {
  const value = customFields?.find((field) => field.id === fieldId)?.value;
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

/**
 * The phone the requester typed on the ticket form, else the phone on their
 * Zendesk profile, else the mobile on their Crisis Cleanup account.
 */
export function getRequesterPhone(
  ticket: { custom_fields?: TicketCustomField[] },
  zendeskUser?: {
    phone?: string | null;
    ccu_user?: { mobile?: string | null } | null;
  },
): string | undefined {
  return (
    getTicketFieldValue(ticket.custom_fields, REQUESTER_PHONE_FIELD_ID) ||
    zendeskUser?.phone ||
    zendeskUser?.ccu_user?.mobile ||
    undefined
  );
}

export function getAppTypeIcons(
  appPlatform: string | undefined,
  ticketSubject: string,
): string {
  if (appPlatform === 'web') {
    return webIcon;
  }

  if (ticketSubject.includes('file:///var/containers/Bundle/Application')) {
    return iosIcon;
  }

  if (ticketSubject.includes('android_res')) {
    return androidIcon;
  }

  return webIcon;
}
