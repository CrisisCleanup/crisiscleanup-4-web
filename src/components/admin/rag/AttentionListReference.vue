<script setup lang="ts">
// Plain-language reference for the attention-list form. Lives in the side
// column next to the editor.
</script>

<template>
  <section
    class="bg-white border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-600 space-y-4"
  >
    <header
      class="flex items-center gap-2 text-sm font-semibold text-slate-700"
    >
      <ccu-icon type="info" size="sm" class="text-slate-400" />
      {{ $t('~~Configuration reference') }}
    </header>

    <p>
      {{
        $t(
          '~~What you set here decides which content beyond uploaded files gets indexed for chat, how much of it, and how far back it reaches. Saves apply on the next sync — click "Sync now" on the stats card to run one immediately, otherwise the daily 04:00 UTC cron picks it up.',
        )
      }}
    </p>

    <div>
      <h4
        class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
      >
        {{ $t('~~Watched users') }}
      </h4>
      <p>
        {{
          $t(
            '~~People whose chat, blog posts, and CMS contributions get indexed each sync and ranked a little higher when retrieval runs. Use trusted signal carriers — usually incident commanders or outreach leads. Editing replaces the list, so re-add anyone you want to keep.',
          )
        }}
      </p>
    </div>

    <div>
      <h4
        class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
      >
        {{ $t('~~Sources') }}
      </h4>
      <p class="mb-1">
        {{
          $t(
            '~~Switches for what types of content to pull in beyond uploaded files.',
          )
        }}
      </p>
      <ul class="space-y-1 list-disc pl-5">
        <li>
          <strong class="text-slate-700">{{
            $t('~~Include public blog')
          }}</strong>
          —
          {{
            $t(
              '~~Public-facing blog posts. On by default. Turn off if you only want internal voices and uploaded docs.',
            )
          }}
        </li>
        <li>
          <strong class="text-slate-700">{{
            $t('~~Include CMS items')
          }}</strong>
          —
          {{
            $t(
              '~~Anything in the CMS tagged with the tags below. Off by default. Turn on to bring FAQs and runbooks into chat answers.',
            )
          }}
        </li>
        <li>
          <strong class="text-slate-700">{{
            $t('~~Include magazines')
          }}</strong>
          —
          {{
            $t(
              '~~PDFs from the magazine library. On by default. Each file produces many chunks, so keep the magazine limit modest if the library is large.',
            )
          }}
        </li>
      </ul>
      <p class="mt-2">
        {{
          $t(
            '~~CMS tags is a comma-separated list. Only CMS items carrying at least one of these tags get indexed. Defaults to "blog, faq". Case is normalised on save.',
          )
        }}
      </p>
    </div>

    <div>
      <h4
        class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
      >
        {{ $t('~~Limits') }}
      </h4>
      <p class="mb-1">
        {{
          $t(
            '~~How many records each source contributes per sync. These count records (a blog post, a chat message, a magazine PDF), not chunks — a single PDF may produce dozens of chunks. Lower the numbers if the index feels bloated or retrieval is slow. Raise them if answers miss content you know exists.',
          )
        }}
      </p>
      <ul class="space-y-0.5 list-disc pl-5">
        <li>
          <strong class="text-slate-700">{{
            $t('~~Chat per watched user')
          }}</strong>
          —
          {{ $t('~~default 100. Multiplied by the number of watched users.') }}
        </li>
        <li>
          <strong class="text-slate-700">{{
            $t('~~Blog per watched user')
          }}</strong>
          — {{ $t('~~default 25. Per watched user.') }}
        </li>
        <li>
          <strong class="text-slate-700">{{ $t('~~Public blog') }}</strong> —
          {{ $t('~~default 50. Total across the public site, not per user.') }}
        </li>
        <li>
          <strong class="text-slate-700">{{ $t('~~Magazines') }}</strong> —
          {{
            $t(
              '~~default 10. Total across the library. To skip magazines, use the toggle above; sending 0 here is rejected.',
            )
          }}
        </li>
        <li>
          <strong class="text-slate-700">{{
            $t('~~CMS per watched user')
          }}</strong>
          —
          {{ $t('~~default 25. Used only when "Include CMS items" is on.') }}
        </li>
        <li>
          <strong class="text-slate-700">{{ $t('~~Public CMS') }}</strong> —
          {{ $t('~~default 50. Used only when "Include CMS items" is on.') }}
        </li>
      </ul>
      <p class="mt-2 italic text-slate-500">
        {{ $t('~~All limits are whole numbers, 1 or higher.') }}
      </p>
    </div>

    <div>
      <h4
        class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
      >
        {{ $t('~~Watched user boost') }}
      </h4>
      <p>
        {{
          $t(
            '~~A score multiplier applied to watched-user content during retrieval. Default 1.25 means watched material ranks ~25% higher than equivalent public content. Range: 1.0 (no boost) to 2.0 (double weight). Push it higher if watched voices keep losing to long-tail public content; pull it toward 1.0 if their content drowns out everything else.',
          )
        }}
      </p>
    </div>

    <div>
      <h4
        class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
      >
        {{ $t('~~Recency') }}
      </h4>
      <p class="mb-1">
        {{
          $t(
            '~~How far back each source reaches, in days. Records older than the cutoff are dropped at sync time. Lower numbers keep the index fresher and smaller; higher numbers preserve historical context. Whole numbers, 1 or higher.',
          )
        }}
      </p>
      <ul class="space-y-0.5 list-disc pl-5">
        <li>
          <strong class="text-slate-700">{{
            $t('~~Watched chat recency')
          }}</strong>
          — {{ $t('~~default 365 days.') }}
        </li>
        <li>
          <strong class="text-slate-700">{{
            $t('~~Watched blog recency')
          }}</strong>
          — {{ $t('~~default 730 days.') }}
        </li>
        <li>
          <strong class="text-slate-700">{{
            $t('~~Public blog recency')
          }}</strong>
          — {{ $t('~~default 730 days.') }}
        </li>
        <li>
          <strong class="text-slate-700">{{ $t('~~Magazine recency') }}</strong>
          —
          {{
            $t(
              '~~no cutoff by default. Magazines tend to be evergreen, so most teams leave this alone. Set a number to enforce a window.',
            )
          }}
        </li>
        <li>
          <strong class="text-slate-700">{{
            $t('~~Watched CMS recency')
          }}</strong>
          —
          {{
            $t('~~default 730 days. Used only when "Include CMS items" is on.')
          }}
        </li>
        <li>
          <strong class="text-slate-700">{{
            $t('~~Public CMS recency')
          }}</strong>
          —
          {{
            $t('~~default 730 days. Used only when "Include CMS items" is on.')
          }}
        </li>
      </ul>
    </div>

    <div>
      <h4
        class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
      >
        {{ $t('~~Stats card') }}
      </h4>
      <p>
        {{
          $t(
            '~~The card up top shows what currently lives in the index: total chunks, per-source breakdown, and last sync time. Those numbers are read-only. "Sync now" triggers an immediate fetch and re-embed; otherwise the daily cron handles it.',
          )
        }}
      </p>
    </div>
  </section>
</template>
