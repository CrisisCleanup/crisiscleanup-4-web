<template>
  <div class="leaderboard" data-testid="testLeaderboardDiv">
    <div
      v-if="!isOrgActivityModalHidden"
      :class="isOrgActivityModalHidden ? 'translate-x-full' : 'translate-x-0'"
      class="w-full absolute top-0 right-0 flex justify-center transform transition duration-300 z-modal"
    >
      <OrganizationActivityModal
        :is-loading="isOrgActivityModalLoading"
        :general-info="orgInfo.generalInfo"
        :styles="overlayStyles"
        data-testid="testOrganizationActivityModalDiv"
        @close="isOrgActivityModalHidden = true"
      />
    </div>

    <div
      class="leaderboard__head"
      :class="{ 'leaderboard__head--empty': displayed.length === 0 }"
    >
      <span class="section-label">{{ $t('~~Leaderboard') }}</span>
      <span class="leaderboard__rule" aria-hidden="true"></span>
      <span class="leaderboard__count">
        <span
          v-if="loading"
          class="leaderboard__loading-pulse"
          aria-hidden="true"
        ></span>
        {{
          loading
            ? $t('~~Loading…')
            : displayed.length > 0
              ? $t('~~Top {shown} of {total}', {
                  shown: displayed.length,
                  total: organizations.length,
                })
              : $t('~~No data')
        }}
      </span>
    </div>

    <ol
      v-if="loading && displayed.length === 0"
      class="leaderboard__list leaderboard__list--skeleton"
      aria-label="Loading"
      data-testid="testLeaderboardSkeleton"
    >
      <li
        v-for="i in 6"
        :key="`skeleton-${i}`"
        class="leaderboard__row leaderboard__row--skeleton"
      >
        <span class="leaderboard__rank">{{ rank(i - 1) }}</span>
        <span class="leaderboard__skel leaderboard__skel--name"></span>
        <span class="leaderboard__skel leaderboard__skel--bar"></span>
        <span class="leaderboard__skel leaderboard__skel--cases"></span>
        <span class="leaderboard__skel leaderboard__skel--value"></span>
      </li>
    </ol>

    <ol v-else class="leaderboard__list">
      <li
        v-for="(org, idx) in displayed"
        :key="org.id"
        class="leaderboard__row"
        :data-testid="`testLeaderboardRow${org.id}`"
        :tabindex="0"
        role="button"
        @click="onRowClick(org)"
        @keyup.enter="onRowClick(org)"
        @keyup.space.prevent="onRowClick(org)"
      >
        <span class="leaderboard__rank">{{ rank(idx) }}</span>
        <span class="leaderboard__name" :title="org.name">{{ org.name }}</span>
        <span
          class="leaderboard__bar"
          :aria-label="`${completionPct(org)}% complete`"
        >
          <span
            class="leaderboard__bar-fill"
            :style="{ transform: `scaleX(${completionRatio(org)})` }"
          ></span>
        </span>
        <span class="leaderboard__cases">
          <span class="leaderboard__num">{{ formatNum(totalCases(org)) }}</span>
          <span class="leaderboard__cases-label">{{ $t('~~cases') }}</span>
        </span>
        <span class="leaderboard__value">
          <span class="leaderboard__value-currency">$</span>
          <span class="leaderboard__num">{{
            formatCompact(org.commercial_value)
          }}</span>
        </span>
      </li>
    </ol>

    <div
      v-if="!isExpanded && organizations.length > visibleCount"
      class="leaderboard__more"
    >
      <button
        type="button"
        class="leaderboard__more-btn"
        data-testid="testLeaderboardViewAllBtn"
        @click="isExpanded = true"
      >
        {{ $t('~~View all {n} →', { n: organizations.length }) }}
      </button>
    </div>
    <div v-else-if="isExpanded" class="leaderboard__more">
      <button
        type="button"
        class="leaderboard__more-btn"
        data-testid="testLeaderboardCollapseBtn"
        @click="isExpanded = false"
      >
        {{ $t('~~← Show top {n}', { n: visibleCount }) }}
      </button>
    </div>

    <p
      class="leaderboard__disclaimer"
      data-testid="testPewPewOrgDisclaimerContent"
    >
      {{ $t('pewPew.org_disclaimer') }}
    </p>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import { defineComponent, ref, reactive, computed, type PropType } from 'vue';
import OrganizationActivityModal from '@/components/live/OrganizationActivityModal.vue';
import earthGlobe from '@/assets/icons/earth-globe.svg';
import moment from '@/utils/dates';
import { getQueryString } from '@/utils/urls';

interface OrgRow {
  id: string | number;
  name: string;
  reported_count?: number;
  claimed_count?: number;
  closed_count?: number;
  calls_count?: number;
  commercial_value?: number;
  files?: Array<{
    file_type_t?: string;
    created_at?: string;
    small_thumbnail_url?: string;
  }>;
}

export default defineComponent({
  name: 'LiveLeaderboard',
  components: { OrganizationActivityModal },
  props: {
    organizations: {
      type: Array as PropType<OrgRow[]>,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    queryFilter: {
      type: Object,
      default: () => ({}),
    },
    overlayStyles: {
      type: Object,
      default: () => ({}),
    },
    visibleCount: {
      type: Number,
      default: 8,
    },
  },
  setup(props) {
    const isExpanded = ref(false);
    const isOrgActivityModalHidden = ref(true);
    const isOrgActivityModalLoading = ref(false);

    const orgInfo = reactive({
      generalInfo: {} as Record<string, any>,
    });

    const ranked = computed(() => {
      const list = [...props.organizations];
      list.sort(
        (a, b) =>
          Number(b.commercial_value || 0) - Number(a.commercial_value || 0),
      );
      return list;
    });

    const displayed = computed(() =>
      isExpanded.value
        ? ranked.value.slice(0, 50)
        : ranked.value.slice(0, props.visibleCount),
    );

    const rank = (i: number) => String(i + 1).padStart(2, '0');

    const totalCases = (o: OrgRow) =>
      Number(o.reported_count || 0) +
      Number(o.claimed_count || 0) +
      Number(o.closed_count || 0);

    const completionRatio = (o: OrgRow) => {
      const total = totalCases(o);
      if (!total) return 0;
      return Math.min(1, Number(o.closed_count || 0) / total);
    };

    const completionPct = (o: OrgRow) => Math.round(completionRatio(o) * 100);

    const formatNum = (v: number | string) => {
      const n = Number(v);
      if (Number.isNaN(n)) return String(v);
      return n.toLocaleString('en-US');
    };

    /** Compact monetary formatting: 12.4M, 980K, 1.2B */
    const formatCompact = (v: number | string | undefined) => {
      const n = Number(v) || 0;
      const abs = Math.abs(n);
      if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
      if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
      if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
      return n.toFixed(0);
    };

    function getLogoUrl(org: OrgRow) {
      if (org.files && org.files.length > 0) {
        const logos = org.files.filter(
          (f) => f.file_type_t === 'fileTypes.logo',
        );
        logos.sort((a, b) => moment(b.created_at).diff(moment(a.created_at)));
        if (logos.length > 0 && logos[0].small_thumbnail_url) {
          return logos[0].small_thumbnail_url;
        }
      }
      return earthGlobe;
    }

    async function getOrganization(id: string) {
      const resp = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/organizations/${id}`,
        { headers: { Authorization: null } },
      );
      return resp.data;
    }

    async function getOrganizationCapabilities(id: string) {
      const resp = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/organization_organizations_capabilities?organization=${id}&limit=200`,
      );
      return resp.data.results;
    }

    async function getOrganizationStatisticsByIncident(id: string) {
      const { start_date, end_date } = props.queryFilter;
      const params = {
        start_date: start_date.format('YYYY-MM-DD'),
        end_date: end_date.format('YYYY-MM-DD'),
        organization: id,
      };
      const queryString = getQueryString(params);
      const resp = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/reports_data/organization_incident_statistics?${queryString}`,
      );
      return resp.data;
    }

    async function onRowClick(item: OrgRow) {
      isOrgActivityModalLoading.value = true;
      orgInfo.generalInfo = { ...item, avatar: getLogoUrl(item) };
      isOrgActivityModalHidden.value = false;

      const orgId = String(item.id);
      const [organization, capabilities, statistics] = await Promise.all([
        getOrganization(orgId),
        getOrganizationCapabilities(orgId),
        getOrganizationStatisticsByIncident(orgId),
      ]);

      orgInfo.generalInfo.organization = organization;
      orgInfo.generalInfo.capabilities = Object.values(capabilities);
      orgInfo.generalInfo.statistics = Object.values(statistics);
      isOrgActivityModalLoading.value = false;
    }

    return {
      isExpanded,
      isOrgActivityModalHidden,
      isOrgActivityModalLoading,
      orgInfo,
      displayed,
      rank,
      totalCases,
      completionRatio,
      completionPct,
      formatNum,
      formatCompact,
      onRowClick,
    };
  },
});
</script>

<style scoped lang="postcss">
.leaderboard {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background-color: var(--cc-ink-0);
  font-family: var(--ff-body);
  color: var(--cc-type-2);
}

@media (max-width: 767px) {
  /*
   * Below md the right rail is content-driven, so a populated leaderboard
   * (especially expanded "View all 50") would push the page extremely
   * long. Cap the list at ~50vh and let it scroll internally; head and
   * disclaimer stay anchored top/bottom. With ≤8 rows the list collapses
   * to its content height and there's no internal scrollbar.
   */
  .leaderboard {
    height: auto;
    max-height: calc(100vh - 240px);
  }
  .leaderboard__list {
    flex: 1 1 auto;
    max-height: 50vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }
  .leaderboard__list::-webkit-scrollbar {
    width: 4px;
  }
  .leaderboard__list::-webkit-scrollbar-thumb {
    background-color: var(--cc-ink-3);
    border-radius: 2px;
  }
}

.leaderboard__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 8px;
  white-space: nowrap;
}

.leaderboard__head .section-label {
  flex: none;
}

.leaderboard__rule {
  flex: 1;
  height: 1px;
  background-color: var(--cc-ink-3);
}

.leaderboard__count {
  font-size: var(--ts-meta);
  color: var(--cc-type-3);
  font-feature-settings: var(--num-features);
  flex: none;
}

.leaderboard__list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  overflow-y: auto;
}

.leaderboard__row {
  display: grid;
  grid-template-columns: 32px 1fr 60px auto auto;
  align-items: center;
  column-gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--cc-ink-3);
  cursor: pointer;
  transition: background-color 200ms ease;
}

@media (max-width: 640px) {
  /*
   * At phone widths the 5-column row crushes the org name to an unreadable
   * 60-ish px. Reflow as two rows: rank+name+value on top, bar+cases below.
   */
  .leaderboard__row {
    grid-template-columns: 32px 1fr auto;
    grid-template-areas:
      'rank name value'
      '.    bar  cases';
    row-gap: 6px;
    column-gap: 10px;
  }

  .leaderboard__rank {
    grid-area: rank;
  }

  .leaderboard__name {
    grid-area: name;
  }

  .leaderboard__value {
    grid-area: value;
  }

  .leaderboard__bar {
    grid-area: bar;
    height: 4px;
    align-self: center;
  }

  .leaderboard__cases {
    grid-area: cases;
    align-self: center;
  }
}

.leaderboard__row:hover,
.leaderboard__row:focus-visible {
  background-color: var(--cc-ink-1);
  outline: none;
}

.leaderboard__rank {
  font-family: var(--ff-display);
  font-feature-settings: var(--num-features);
  font-weight: 800;
  font-size: var(--ts-row);
  color: var(--cc-type-3);
  letter-spacing: 0;
}

.leaderboard__name {
  font-family: var(--ff-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: var(--ts-meta);
  color: var(--cc-type-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leaderboard__bar {
  position: relative;
  display: block;
  width: 100%;
  height: 6px;
  background-color: var(--cc-ink-3);
  overflow: hidden;
}

.leaderboard__bar-fill {
  position: absolute;
  inset: 0;
  background-color: var(--cc-stat-pos);
  transform-origin: left center;
  transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.leaderboard__cases,
.leaderboard__value {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
  font-feature-settings: var(--num-features);
}

.leaderboard__cases-label,
.leaderboard__value-currency {
  font-size: calc(var(--ts-meta) * 0.9);
  color: var(--cc-type-3);
  text-transform: lowercase;
  letter-spacing: 0;
}

.leaderboard__num {
  font-family: var(--ff-body);
  font-weight: 600;
  font-size: var(--ts-meta);
  color: var(--cc-type-1);
}

.leaderboard__more {
  flex: none;
  padding: 6px 16px 4px;
  text-align: right;
}

.leaderboard__more-btn {
  background: none;
  border: 0;
  font-family: var(--ff-body);
  font-size: var(--ts-meta);
  font-weight: 600;
  color: var(--cc-type-2);
  cursor: pointer;
  padding: 4px 0;
  transition: color 200ms ease;
}

.leaderboard__more-btn:hover {
  color: var(--cc-signal);
}

.leaderboard__disclaimer {
  flex: none;
  margin: 0;
  padding: 8px 16px 12px;
  font-size: var(--ts-meta);
  font-style: italic;
  color: var(--cc-type-3);
  text-align: center;
  border-top: 1px solid var(--cc-ink-3);
  line-height: 1.4;
}

/*
 * Loading state — shimmering skeleton rows so the leaderboard slot
 * never blinks empty during a refetch (incident swap / cold load).
 * The skeleton blocks reuse the leaderboard__row grid so the layout
 * doesn't shift when real rows arrive.
 */
.leaderboard__loading-pulse {
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: var(--cc-signal);
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
  animation: leaderboard-pulse 1200ms cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.leaderboard__row--skeleton {
  cursor: default;
}

.leaderboard__skel {
  display: block;
  height: 12px;
  background-color: var(--cc-ink-2);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.leaderboard__skel::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
    90deg,
    transparent 0,
    var(--cc-ink-3) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: leaderboard-shimmer 1400ms ease-in-out infinite;
}

.leaderboard__skel--name {
  width: min(80%, 200px);
}

.leaderboard__skel--bar {
  width: 100%;
  height: 6px;
  align-self: center;
}

.leaderboard__skel--cases {
  width: 56px;
}

.leaderboard__skel--value {
  width: 40px;
}

@keyframes leaderboard-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.85);
  }
}

@keyframes leaderboard-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .leaderboard__bar-fill {
    transition: none;
  }
  .leaderboard__loading-pulse,
  .leaderboard__skel::after {
    animation: none;
  }
}
</style>
