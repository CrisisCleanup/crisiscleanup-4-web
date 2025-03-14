import { parsePhoneNumber } from 'libphonenumber-js';
import { RRule } from 'rrule';
import _ from 'lodash';
import moment from 'moment';
import enums from '../store/modules/enums';
import { colors as iconColors, templates } from '../icons/icons_templates';
import Organization from '../models/Organization';
import type { WorkType } from '@/models/types';
import { SVG_STROKE_WIDTH } from '@/constants';
import { i18n } from '@/modules/i18n';
import type Incident from '@/models/Incident';

export function snakeToTitleCase(value: string) {
  if (!value) return '';
  // Ref: https://gist.github.com/kkiernan/91298079d34f0f832054
  return value
    .split('_')
    .map(function (item) {
      return item.charAt(0).toUpperCase() + item.slice(1);
    })
    .join(' ');
}

export function getWorkTypeName(workType: string) {
  const wType = enums.state.workTypes.find((type) => type.key === workType);
  return wType && wType.name_t ? i18n.global.t(wType.name_t) : '';
}

export function getStatusName(statusKey: string) {
  const status = enums.state.statuses.find((type) => type.status === statusKey);
  return status ? i18n.global.t(status.status_name_t) : '';
}

export function getRecurrenceString(rule: string) {
  return RRule.fromString(rule).toText();
}

export function formatDateString(date: string, format: string) {
  return moment(date).format(format);
}

export function formatRecurrence(date: string) {
  return formatDateString(date, 'ddd MMMM Do YYYY [at] h:mm A');
}

export function momentFromNow(date: string | moment.Moment) {
  return moment(date).fromNow();
}

export function getOrganizationName(id: string) {
  const organization = Organization.find(id);
  return organization ? organization.name : '';
}

export function getStatusBadge(status: string) {
  const statusDict: Record<string, string> = {
    open_unassigned: 'error',
    open_assigned: 'processing',
    'open_partially-completed': 'processing',
    'open_needs-follow-up': 'processing',
    open_unresponsive: 'default',
    closed_completed: 'success',
    'closed_partially-completed': 'success',
    closed_incomplete: 'default',
    'closed_out-of-scope': 'default',
    'closed_done-by-others': 'success',
    'closed_no-help-wanted': 'default',
    closed_rejected: 'default',
    closed_duplicate: 'default',
    'closed_marked-for-deletion': 'default',
  };
  return statusDict[status];
}

export const getColorForWorkType = (workType: WorkType) => {
  if (!workType) {
    return '';
  }

  const colorsKey = `${workType.status}_${
    workType.claimed_by ? 'claimed' : 'unclaimed'
  }`;
  const colors = iconColors[colorsKey];
  return colors.fillColor;
};

export const getColorForStatus = (status: string, claimed = true) => {
  let colorsKey = `${status}_${claimed ? 'claimed' : 'unclaimed'}`;
  let colors = iconColors[colorsKey];

  if (!colors) {
    colorsKey = `open_unassigned_${claimed ? 'claimed' : 'unclaimed'}`;
    colors = iconColors[colorsKey];
  }

  return colors.fillColor;
};

export const getWorkTypeImage = (workType: WorkType) => {
  const colorsKey = `${workType.status}_${
    workType.claimed_by ? 'claimed' : 'unclaimed'
  }`;
  const worksiteTemplate = templates[workType.work_type] || templates.unknown;
  const svgColors = iconColors[colorsKey];

  if (svgColors) {
    return worksiteTemplate
      .replaceAll('{{fillColor}}', svgColors.fillColor)
      .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
      .replaceAll('{{strokeColor}}', svgColors.strokeColor)
      .replaceAll('{{multiple}}', '');
  }

  return '';
};

export const secondsToHm = (seconds: number) => {
  const d = Number(seconds);
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);

  const hDisplay = `${h}h `;
  const mDisplay = `${m}m`;
  return hDisplay + mDisplay;
};

export const formatSeconds = (seconds: number) => {
  return moment
    .utc(moment.duration(seconds, 's').asMilliseconds())
    .format('hh:mm:ss');
};

export const capitalize = (value: string) => {
  // "two words" -> "Two Words"
  if (!value) return '';
  const casted = value.toString().toLowerCase();
  const words = casted.split(' ');
  const cappedWords = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  const final = cappedWords.join(' ');
  return final;
};

export const toUpper = (value: string) => {
  if (!value) return '';
  return value.toUpperCase();
};

export const truncateFilter = (value: string, length: number, ...args: any) =>
  _.truncate(value, { length, ...args });

export const startCase = (value: string) => _.startCase(value);

export const snakeCase = (value: string) => _.snakeCase(value);

export const formatNationalNumber = (mobile: string) => {
  const _number = parsePhoneNumber(mobile, 'US');
  if (_number) {
    return _number.formatNational();
  }

  return mobile;
};

/**
 * Filter function for incidents with active phone numbers.
 * @param phone
 */
export function isValidActiveHotline(phone: unknown) {
  return Array.isArray(phone) ? phone.length > 0 : Boolean(phone);
}

export function formatIncidentPhoneNumbers<
  T extends { active_phone_number: Incident['active_phone_number'] },
>(incident: T): string[] {
  if (Array.isArray(incident.active_phone_number)) {
    return incident.active_phone_number.map((number) =>
      formatNationalNumber(String(number)),
    );
  }
  return [formatNationalNumber(String(incident.active_phone_number))];
}

/**
 * Get phone number from incident object
 * @param incident
 */
export function getIncidentPhoneNumbers<
  T extends { active_phone_number: Incident['active_phone_number'] },
>(incident: T): string {
  const formattedNumbers = formatIncidentPhoneNumbers(incident);
  return formattedNumbers.join(', ');
}
