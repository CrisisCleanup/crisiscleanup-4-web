<template>
  <section
    class="flex min-h-full flex-col gap-4 bg-[#f4f4f2] p-4 text-crisiscleanup-dark-500"
    data-testid="testOutreachConsole"
  >
    <p class="text-sm text-crisiscleanup-grey-700">
      {{
        $t(
          '~~Try every outreach feature here before turning it on. Demo data lives in its own [DEMO] incident, and test emails can go to any address.',
        )
      }}
    </p>

    <!-- Switches -->
    <div class="rounded-lg border border-crisiscleanup-grey-100 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold">{{ $t('~~Switches') }}</h2>
      <p
        v-if="flags && !flags.environment"
        class="mb-3 rounded bg-[#fdf3e3] p-2 text-sm"
        data-testid="testOutreachEnvOff"
      >
        {{
          $t(
            '~~OUTREACH_ENABLED is off on the server, so every feature stays off whatever you choose here. The console and its previews still work.',
          )
        }}
      </p>
      <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
        <label
          v-for="item in switchItems"
          :key="item.key"
          class="flex items-start gap-2 rounded border border-crisiscleanup-grey-100 p-2"
        >
          <input
            type="checkbox"
            class="mt-1"
            :checked="flags?.[item.key]"
            :disabled="!flags || busy"
            :data-testid="`testOutreachSwitch_${item.key}`"
            @change="
              toggle(item.key, ($event.target as HTMLInputElement).checked)
            "
          />
          <span>
            <span class="font-semibold">{{ item.label }}</span>
            <span class="block text-xs text-crisiscleanup-grey-700">
              {{ item.help }}
            </span>
          </span>
        </label>
      </div>
    </div>

    <!-- Demo data -->
    <div class="rounded-lg border border-crisiscleanup-grey-100 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold">{{ $t('~~Demo data') }}</h2>
      <div class="flex flex-wrap items-end gap-3">
        <label class="text-sm">
          {{ $t('~~Latitude') }}
          <input
            v-model.number="demo.lat"
            type="number"
            step="0.01"
            class="block w-28 rounded border p-1"
          />
        </label>
        <label class="text-sm">
          {{ $t('~~Longitude') }}
          <input
            v-model.number="demo.lng"
            type="number"
            step="0.01"
            class="block w-28 rounded border p-1"
          />
        </label>
        <label class="text-sm">
          {{ $t('~~Cases') }}
          <input
            v-model.number="demo.cases"
            type="number"
            min="0"
            max="1000"
            class="block w-24 rounded border p-1"
          />
        </label>
        <BaseButton
          variant="solid"
          size="medium"
          :action="makeDemo"
          :disabled="busy"
          :text="$t('~~Create demo data')"
          :alt="$t('~~Create demo data')"
          data-testid="testOutreachCreateDemo"
        />
        <BaseButton
          variant="outline"
          size="medium"
          :action="removeDemo"
          :disabled="busy"
          :text="$t('~~Clear demo data')"
          :alt="$t('~~Clear demo data')"
          data-testid="testOutreachClearDemo"
        />
      </div>
    </div>

    <!-- Try it -->
    <div class="rounded-lg border border-crisiscleanup-grey-100 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold">{{ $t('~~Try a report') }}</h2>
      <div class="flex flex-wrap items-end gap-3">
        <label class="text-sm">
          {{ $t('~~Contact') }}
          <select
            v-model.number="contactId"
            class="block min-w-64 rounded border p-1"
            data-testid="testOutreachContact"
          >
            <option :value="undefined" disabled>{{ $t('~~Choose') }}</option>
            <option v-for="c in contacts" :key="c.id" :value="c.id">
              {{ c.name }}{{ c.is_demo ? ' (demo)' : '' }}
            </option>
          </select>
        </label>
        <label class="text-sm">
          {{ $t('~~Incident ID') }}
          <input
            v-model.number="incidentId"
            type="number"
            class="block w-28 rounded border p-1"
            data-testid="testOutreachIncident"
          />
        </label>
        <BaseButton
          variant="outline"
          size="medium"
          :action="preview"
          :disabled="!ready || busy"
          :text="$t('~~Preview numbers and map')"
          :alt="$t('~~Preview numbers and map')"
          data-testid="testOutreachPreview"
        />
        <BaseButton
          variant="outline"
          size="medium"
          :action="showEmail"
          :disabled="!ready || busy"
          :text="$t('~~Preview email')"
          :alt="$t('~~Preview email')"
          data-testid="testOutreachPreviewEmail"
        />
        <BaseButton
          variant="outline"
          size="medium"
          :action="showPdf"
          :disabled="!ready || busy"
          :text="$t('~~Open PDF')"
          :alt="$t('~~Open PDF')"
          data-testid="testOutreachPreviewPdf"
        />
      </div>
      <div class="mt-3 flex flex-wrap items-end gap-3">
        <label class="text-sm">
          {{ $t('~~Send a test email to') }}
          <input
            v-model="testTo"
            type="email"
            placeholder="anyone@example.org"
            class="block w-72 rounded border p-1"
            data-testid="testOutreachTestTo"
          />
        </label>
        <BaseButton
          variant="solid"
          size="medium"
          :action="sendTest"
          :disabled="!ready || busy"
          :text="$t('~~Send test')"
          :alt="$t('~~Send test')"
          data-testid="testOutreachSendTest"
        />
        <BaseButton
          variant="outline"
          size="medium"
          :action="startCampaign"
          :disabled="!ready || busy"
          :text="$t('~~Start campaign for this contact')"
          :alt="$t('~~Start campaign for this contact')"
        />
      </div>

      <div v-if="report" class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p class="font-semibold" data-testid="testOutreachSubject">
            {{ report.subject }}
          </p>
          <table class="mt-2 w-full text-center text-sm">
            <thead>
              <tr class="bg-[#f8f9fa]">
                <th class="p-1 text-left"></th>
                <th>{{ $t('~~New') }}</th>
                <th>{{ $t('~~Open') }}</th>
                <th>{{ $t('~~Claimed') }}</th>
                <th>{{ $t('~~Closed') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ring in report.stats.rings"
                :key="ring.miles"
                class="border-t"
              >
                <td class="p-1 text-left font-semibold">{{ ring.miles }} mi</td>
                <td>{{ ring.new }}</td>
                <td>{{ ring.open }}</td>
                <td>{{ ring.claimed }}</td>
                <td>{{ ring.closed }}</td>
              </tr>
            </tbody>
          </table>
          <p class="mt-2 text-xs text-crisiscleanup-grey-700">
            {{ report.case_points }} {{ $t('~~approximate case locations') }}
          </p>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="max-w-lg"
          data-testid="testOutreachMap"
          v-html="report.map_svg"
        />
      </div>

      <iframe
        v-if="emailHtml"
        class="mt-4 h-[720px] w-full rounded border"
        :srcdoc="emailHtml"
        sandbox=""
        :title="$t('~~Email preview')"
        data-testid="testOutreachEmailFrame"
      />
    </div>

    <!-- Discovery -->
    <div class="rounded-lg border border-crisiscleanup-grey-100 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold">{{ $t('~~Find organizations') }}</h2>
      <p class="mb-3 text-sm text-crisiscleanup-grey-700">
        {{
          $t(
            '~~Searches Google Places around the incident, then reads each organization’s own website for a public email. Preview saves nothing.',
          )
        }}
      </p>
      <div class="flex flex-wrap items-end gap-3">
        <label class="text-sm">
          {{ $t('~~Incident id') }}
          <input
            v-model.number="incidentId"
            type="number"
            class="ml-1 w-28 rounded border p-1"
            data-testid="testOutreachDiscoverIncident"
          />
        </label>
        <label class="text-sm">
          {{ $t('~~Miles') }}
          <input
            v-model.number="discover.radius"
            type="number"
            min="1"
            max="31"
            class="ml-1 w-20 rounded border p-1"
          />
        </label>
        <label class="text-sm">
          <input v-model="discover.findEmails" type="checkbox" />
          {{ $t('~~Look for emails') }}
        </label>
        <BaseButton
          variant="outline"
          size="medium"
          :action="() => findOrganizations(false)"
          :disabled="busy || !incidentId"
          :text="$t('~~Preview')"
          :alt="$t('~~Preview')"
          data-testid="testOutreachDiscoverPreview"
        />
        <BaseButton
          variant="solid"
          size="medium"
          :action="() => findOrganizations(true)"
          :disabled="busy || !incidentId"
          :text="$t('~~Find and save')"
          :alt="$t('~~Find and save')"
          data-testid="testOutreachDiscoverSave"
        />
      </div>
      <table
        v-if="found"
        class="mt-3 w-full text-left text-sm"
        data-testid="testOutreachFound"
      >
        <thead>
          <tr class="bg-[#f8f9fa]">
            <th class="p-2">{{ $t('~~Name') }}</th>
            <th class="p-2">{{ $t('~~Miles') }}</th>
            <th class="p-2">{{ $t('~~Email') }}</th>
            <th class="p-2">{{ $t('~~Website') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="found.length === 0">
            <td class="p-2" colspan="4">{{ $t('~~Nothing found.') }}</td>
          </tr>
          <tr v-for="row in found" :key="row.source_ref" class="border-t">
            <td class="p-2">{{ row.name }}</td>
            <td class="p-2">{{ row.miles }}</td>
            <td class="p-2">{{ row.email || '—' }}</td>
            <td class="p-2">{{ row.url }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dispatcher -->
    <div class="rounded-lg border border-crisiscleanup-grey-100 bg-white p-4">
      <h2 class="mb-3 text-lg font-bold">{{ $t('~~Dispatcher') }}</h2>
      <div class="flex flex-wrap items-center gap-3">
        <BaseButton
          variant="outline"
          size="medium"
          :action="loadDue"
          :disabled="busy"
          :text="$t('~~Who is due now?')"
          :alt="$t('~~Who is due now?')"
          data-testid="testOutreachDuePreview"
        />
        <BaseButton
          variant="solid"
          size="medium"
          :action="runNow"
          :disabled="busy"
          :text="$t('~~Run dispatcher now')"
          :alt="$t('~~Run dispatcher now')"
          data-testid="testOutreachRunDispatcher"
        />
        <span class="text-sm text-crisiscleanup-grey-700">
          {{
            $t(
              '~~Needs the Sending switch. With Dry run on, it only logs what it would send.',
            )
          }}
        </span>
      </div>
      <ul v-if="due" class="mt-3 list-disc pl-6 text-sm">
        <li v-if="due.length === 0">{{ $t('~~Nobody is due.') }}</li>
        <li v-for="d in due" :key="d.campaign">
          {{ d.contact }} — {{ d.incident }}
          <span v-if="!d.has_email" class="text-[#a8691b]">
            ({{ $t('~~no email') }})
          </span>
        </li>
      </ul>
    </div>

    <!-- Log -->
    <div class="rounded-lg border border-crisiscleanup-grey-100 bg-white p-4">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-bold">{{ $t('~~Send log') }}</h2>
        <BaseButton
          variant="outline"
          size="small"
          :action="refreshLog"
          :text="$t('actions.refresh')"
          :alt="$t('actions.refresh')"
        />
      </div>
      <table class="w-full text-left text-sm" data-testid="testOutreachLog">
        <thead>
          <tr class="bg-[#f8f9fa]">
            <th class="p-2">{{ $t('~~When') }}</th>
            <th class="p-2">{{ $t('~~Contact') }}</th>
            <th class="p-2">{{ $t('~~Result') }}</th>
            <th class="p-2">{{ $t('~~Detail') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in log" :key="row.id" class="border-t">
            <td class="whitespace-nowrap p-2">
              {{ new Date(row.created_at).toLocaleString() }}
            </td>
            <td class="p-2">{{ row.contact }}</td>
            <td class="p-2 font-semibold">{{ row.result }}</td>
            <td class="p-2">{{ row.detail || row.subject }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import {
  clearDemo,
  createDemo,
  discoverOrganizations,
  dispatchPreview,
  enroll,
  getSwitches,
  listContacts,
  previewEmailHtml,
  previewPdf,
  previewReport,
  runDispatcher,
  sendLog,
  sendTestEmail,
  setSwitches,
  type DueCampaign,
  type FoundOrganization,
  type OutreachContact,
  type OutreachFlags,
  type OutreachLogRow,
  type OutreachPreview,
} from '@/hooks/useOutreachConsole';
import { getErrorMessage } from '@/utils/errors';

const { t } = useI18n();
const $toasted = useToast();

const flags = ref<OutreachFlags>();
const contacts = ref<OutreachContact[]>([]);
const log = ref<OutreachLogRow[]>([]);
const due = ref<DueCampaign[]>();
const report = ref<OutreachPreview>();
const emailHtml = ref('');
const busy = ref(false);
const contactId = ref<number>();
const incidentId = ref<number>();
const testTo = ref('');
const demo = reactive({ lat: 35, lng: -90, cases: 150 });
const discover = reactive({ radius: 25, findEmails: true });
const found = ref<FoundOrganization[]>();

type SwitchKey = Exclude<keyof OutreachFlags, 'environment'>;
const switchItems: { key: SwitchKey; label: string; help: string }[] = [
  {
    key: 'master',
    label: t('~~Master'),
    help: t('~~Nothing runs while this is off.'),
  },
  {
    key: 'dry_run',
    label: t('~~Dry run'),
    help: t('~~Dispatcher logs and sends nothing.'),
  },
  {
    key: 'discovery',
    label: t('~~Discovery'),
    help: t('~~Find organizations for new incidents.'),
  },
  {
    key: 'sending',
    label: t('~~Sending'),
    help: t('~~Dispatcher emails contacts.'),
  },
  {
    key: 'report_pdf',
    label: t('~~PDF briefing'),
    help: t('~~Attach the PDF to report emails.'),
  },
  {
    key: 'social_monitoring',
    label: t('~~Social monitoring'),
    help: t('~~Not built yet.'),
  },
  {
    key: 'subscriptions',
    label: t('~~Subscriptions'),
    help: t('~~Not built yet.'),
  },
  { key: 'media', label: t('~~News media'), help: t('~~Not built yet.') },
  {
    key: 'work_admin',
    label: t('~~Work Admin tab'),
    help: t('~~Show the tab in the app.'),
  },
];

const ready = computed(() => Boolean(contactId.value && incidentId.value));

watch(contactId, (id) => {
  const contact = contacts.value.find((c) => c.id === id);
  if (contact?.incident) incidentId.value = contact.incident;
  report.value = undefined;
  emailHtml.value = '';
});

/** Run one action with the buttons locked and any error shown. */
async function guard<T>(work: () => Promise<T>): Promise<T | undefined> {
  busy.value = true;
  try {
    return await work();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    busy.value = false;
  }
}

async function toggle(key: SwitchKey, value: boolean) {
  const next = await guard(() => setSwitches({ [key]: value }));
  flags.value = next ?? (await getSwitches());
}

async function refreshContacts() {
  contacts.value = await listContacts();
}

async function refreshLog() {
  log.value = await sendLog();
}

async function makeDemo() {
  const made = await guard(() => createDemo({ ...demo }));
  if (!made) return;
  await refreshContacts();
  incidentId.value = made.incident_id;
  contactId.value = made.contact_ids[0];
  $toasted.success(
    t('~~Made demo incident {id} with {count} cases.', {
      id: made.incident_id,
      count: made.cases,
    }),
  );
}

async function removeDemo() {
  const cleared = await guard(clearDemo);
  if (!cleared) return;
  contactId.value = undefined;
  report.value = undefined;
  emailHtml.value = '';
  await refreshContacts();
  $toasted.success(
    t('~~Removed {count} demo incident(s).', { count: cleared.incidents }),
  );
}

async function preview() {
  emailHtml.value = '';
  report.value = await guard(() =>
    previewReport(contactId.value, incidentId.value),
  );
}

async function showEmail() {
  report.value = undefined;
  emailHtml.value =
    (await guard(() => previewEmailHtml(contactId.value, incidentId.value))) ??
    '';
}

async function showPdf() {
  const blob = await guard(() => previewPdf(contactId.value, incidentId.value));
  if (blob) window.open(URL.createObjectURL(blob), '_blank');
}

async function sendTest() {
  const sent = await guard(() =>
    sendTestEmail(contactId.value, incidentId.value, testTo.value.trim()),
  );
  if (!sent) return;
  $toasted.success(t('~~Test email sent to {to}.', { to: sent.sent_to }));
  await refreshLog();
}

async function startCampaign() {
  const result = await guard(() =>
    enroll(incidentId.value, [contactId.value!]),
  );
  if (result) {
    $toasted.success(
      t('~~Started {count} campaign(s).', { count: result.enrolled }),
    );
  }
}

async function findOrganizations(save: boolean) {
  const result = await guard(() =>
    discoverOrganizations({
      incident_id: incidentId.value!,
      radius_miles: discover.radius,
      find_emails: discover.findEmails,
      save,
    }),
  );
  if (!result) return;
  found.value = result.results;
  if (save) {
    await refreshContacts();
    $toasted.success(
      t('~~Saved {count} organization(s) as contacts.', {
        count: result.results.length,
      }),
    );
  }
}

async function loadDue() {
  due.value = await guard(dispatchPreview);
}

async function runNow() {
  const results = await guard(runDispatcher);
  if (!results) return;
  $toasted.success(
    t('~~Dispatcher handled {count} contact(s).', { count: results.length }),
  );
  await refreshLog();
}

onMounted(async () => {
  await guard(async () => {
    flags.value = await getSwitches();
    await Promise.all([refreshContacts(), refreshLog()]);
  });
});
</script>
