import { RRule } from 'rrule';

export function getRecurrenceString(rule: string): string {
  return RRule.fromString(rule).toText();
}
