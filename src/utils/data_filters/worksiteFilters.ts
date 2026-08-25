import type Filter from './Filter';
import FormDataFilter from './FormDataFilter';
import SurvivorFilter from './SurvivorFilter';
import WorksiteDatesFilter from './WorksiteDatesFilter';
import WorksiteFieldsFilter from './WorksiteFieldsFilter';
import WorksiteFlagsFilter from './WorksiteFlagsFilter';
import WorksiteListsFilter from './WorksiteListsFilter';
import WorksiteLocationsFilter from './WorksiteLocationsFilter';
import WorksiteMissingWorkTypeFilter from './WorksiteMissingWorkTypeFilter';
import WorksiteMyTeamFilter from './WorksiteMyTeamFilter';
import WorksiteStatusFilter from './WorksiteStatusFilter';
import WorksiteStatusGroupFilter from './WorksiteStatusGroupFilter';
import WorksiteTeamsFilter from './WorksiteTeamsFilter';

/**
 * Build worksite filter instances from raw (deserialized) filter data,
 * e.g. the `filters` blob persisted in user states.
 */
export function makeWorksiteFilters(
  raw: Record<string, any> = {},
): Record<string, Filter> {
  return {
    fields: new WorksiteFieldsFilter('fields', raw.fields?.data || {}),
    statusGroups: new WorksiteStatusGroupFilter(
      'statusGroups',
      raw.statusGroups?.data || {},
    ),
    flags: new WorksiteFlagsFilter('flags', raw.flags?.data || {}),
    form_data: new FormDataFilter('form_data', raw.form_data?.data || {}),
    locations: new WorksiteLocationsFilter(
      'locations',
      raw.locations?.data || {},
    ),
    statuses: new WorksiteStatusFilter('statuses', raw.statuses?.data || {}),
    my_team: new WorksiteMyTeamFilter('my_team', raw.my_team?.data || {}),
    dates: new WorksiteDatesFilter('dates', raw.dates?.data || {}),
    survivors: new SurvivorFilter('survivors', raw.survivors?.data || {}),
    teams: new WorksiteTeamsFilter('teams', raw.teams?.data || {}),
    lists: new WorksiteListsFilter(
      'lists',
      raw.lists?.data || { include_lists: [], exclude_lists: [] },
    ),
    missingWorkType: new WorksiteMissingWorkTypeFilter(
      'missingWorkType',
      raw.missingWorkType?.data || {},
    ),
  };
}

/**
 * Pack raw filter data into worksite query parameters.
 *
 * The persisted `filters` blob is the single source of truth: the applied
 * query is always derived from it, so a stale `appliedFilters` blob can
 * never restrict the query while the filters UI shows nothing.
 */
export function packWorksiteFilters(
  raw: Record<string, any> | null | undefined,
): Record<string, any> {
  let packed: Record<string, any> = {};
  for (const filter of Object.values(makeWorksiteFilters(raw ?? {}))) {
    packed = { ...packed, ...(filter.packFunction() as Record<string, any>) };
  }

  return packed;
}
