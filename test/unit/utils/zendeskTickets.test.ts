import { describe, expect, test } from 'vitest';
import {
  REQUESTER_LOCATION_FIELD_ID,
  REQUESTER_PHONE_FIELD_ID,
  getRequesterPhone,
  getTicketFieldValue,
  getTicketStatusPillVariant,
  isImageAttachment,
} from '@/utils/zendeskTickets';

describe('zendeskTickets >> getTicketStatusPillVariant', () => {
  test('gives each Zendesk status its own pill color', () => {
    expect(getTicketStatusPillVariant('new')).toBe('claimed');
    expect(getTicketStatusPillVariant('open')).toBe('open');
    expect(getTicketStatusPillVariant('pending')).toBe('completed');
    expect(getTicketStatusPillVariant('hold')).toBe('completed');
    expect(getTicketStatusPillVariant('solved')).toBe('in-progress');
    expect(getTicketStatusPillVariant('closed')).toBe('in-progress');
  });

  test('uses the dark pill for an unknown status', () => {
    expect(getTicketStatusPillVariant('archived')).toBe('dark');
    expect(getTicketStatusPillVariant()).toBe('dark');
  });
});

describe('zendeskTickets >> isImageAttachment', () => {
  test('is true only for image content types', () => {
    expect(isImageAttachment({ content_type: 'image/png' })).toBe(true);
    expect(isImageAttachment({ content_type: 'application/pdf' })).toBe(false);
    expect(isImageAttachment({})).toBe(false);
  });
});

describe('zendeskTickets >> getTicketFieldValue', () => {
  test('returns the value of the matching custom field', () => {
    const fields = [{ id: REQUESTER_LOCATION_FIELD_ID, value: 'Dane, WI' }];
    expect(getTicketFieldValue(fields, REQUESTER_LOCATION_FIELD_ID)).toBe(
      'Dane, WI',
    );
  });

  test('returns undefined for a missing, null or blank field', () => {
    expect(getTicketFieldValue(undefined, REQUESTER_PHONE_FIELD_ID)).toBe(
      undefined,
    );
    expect(
      getTicketFieldValue(
        [{ id: REQUESTER_PHONE_FIELD_ID, value: null }],
        REQUESTER_PHONE_FIELD_ID,
      ),
    ).toBe(undefined);
    expect(
      getTicketFieldValue(
        [{ id: REQUESTER_PHONE_FIELD_ID, value: '  ' }],
        REQUESTER_PHONE_FIELD_ID,
      ),
    ).toBe(undefined);
  });
});

describe('zendeskTickets >> getRequesterPhone', () => {
  const ticketWithPhone = {
    custom_fields: [{ id: REQUESTER_PHONE_FIELD_ID, value: '2025550123' }],
  };
  const zendeskUser = {
    phone: '3035550123',
    ccu_user: { mobile: '4045550123' },
  };

  test('uses the phone from the ticket form first', () => {
    expect(getRequesterPhone(ticketWithPhone, zendeskUser)).toBe('2025550123');
  });

  test('falls back to the Zendesk profile phone', () => {
    expect(getRequesterPhone({ custom_fields: [] }, zendeskUser)).toBe(
      '3035550123',
    );
  });

  test('falls back to the Crisis Cleanup account mobile', () => {
    expect(
      getRequesterPhone(
        { custom_fields: [] },
        { phone: null, ccu_user: { mobile: '4045550123' } },
      ),
    ).toBe('4045550123');
  });

  test('returns undefined when no phone is known', () => {
    expect(getRequesterPhone({ custom_fields: [] })).toBeUndefined();
  });
});
