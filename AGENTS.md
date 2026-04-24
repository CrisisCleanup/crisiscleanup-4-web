# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Toolchain

- Node `20.18.0` and pnpm `10.2.1` are pinned in [.tool-versions](.tool-versions); the `engines` field also enforces `node >=18 <21` and `pnpm ^10.2.1`.
- Runtime env is loaded by `direnv` from [.envrc](.envrc) plus an optional `.envrc.local`, which sources `.env`, `.env.staging`, etc. Vite also auto-loads `.env.<mode>`; see [.env.sample](.env.sample) for required `VITE_APP_*` keys.
- Always invoke scripts through `pnpm` so the lockfile is respected.

## Common commands

```bash
pnpm install                 # install deps (husky hooks install via postinstall)
pnpm dev                     # vite dev server on :8080
pnpm build                   # typecheck + production build (NODE_OPTIONS=--max-old-space-size=8192)
pnpm build:app:maintenance   # build the maintenance-mode entry (VITE_APP_ENTRY=maintenance)
pnpm typecheck               # vue-tsc --noEmit
pnpm preview                 # vite preview (used by playwright's webServer)
```

### Lint & format

```bash
pnpm lint                    # eslint on src/**/*.{vue,ts,tsx,js,jsx}
pnpm lint:errors             # lint with --quiet (errors only)
pnpm lint:fix                # lint --fix
pnpm format                  # prettier --write over vue/ts/js/json/md/yaml
pnpm lint:format             # lint:fix + format
pnpm lint:show               # interactive eslint-nibble triage
```

### Unit tests (Vitest)

```bash
pnpm test                    # serial vitest run without coverage
pnpm test:run                # serial vitest run without coverage
pnpm test:unit               # vitest watch mode
pnpm test:cov                # serial vitest coverage run (memory-optimized)
pnpm exec vitest run test/unit/path/to/file.test.ts        # single file
pnpm exec vitest run -t "test name substring"              # filter by name
```

Vitest config lives in [vite.config.ts](vite.config.ts): `happy-dom` env, globals enabled, `test/setupTests.ts` + `fake-indexeddb/auto` as setup files, `test/globalSetup.ts` for teardown, and tests are discovered from `test/**/*.{test,spec}.ts` (excluding `test/e2e/**`).

### E2E tests (Playwright)

```bash
pnpm e2e:install             # playwright install --with-deps
pnpm test:e2e                # all projects (chromium/firefox/webkit), headless
pnpm test:e2e:ui             # playwright UI mode
pnpm test:e2e:list           # enumerate tests without running
pnpm test:e2e:primary        # --grep '@primary'
pnpm test:e2e:development    # --grep '@development' --timeout 150000 --retries 4
pnpm test:e2e:staging        # --grep '@staging'
pnpm test:e2e:production     # --grep '@production'
pnpm test:e2e --project=firefox --workers=4 --headed       # ad-hoc flags
PW_SKIP_WEBSERVER=1 pnpm test:e2e                          # skip auto-`pnpm preview`
pnpm e2e:report              # open last HTML report
pnpm e2e:gen                 # codegen against running app
```

Playwright config is [playwright.config.ts](playwright.config.ts). By default it auto-starts `pnpm preview --port 8080` against `VITE_APP_BASE_URL`, runs three browser projects each dependent on a `*-setup` project that executes `test/e2e/auth.setup.ts`. E2E creds come from `TEST_APP_EMAIL* / TEST_APP_PASSWORD*` in [.envrc](.envrc). Tag tests with `@primary`, `@development`, `@staging`, `@production`, or `@slow` to match the grep scripts above.

### Dependency graph

```bash
pnpm depcruise:errors        # fail on rule violations defined in .dependency-cruiser.cjs
pnpm depcruise:gen:svg       # write ccu-dependency-graph.svg
pnpm depcruise:gen:html
pnpm depcruise:gen:mermaid
```

### Cleanup

```bash
pnpm clean                   # rm dist, coverage, playwright output
pnpm repair:prune-pnpm       # clean + nuke node_modules + prune pnpm store
```

## Architecture

Vue 3 + TypeScript SPA built with Vite. Entry is [src/main.ts](src/main.ts); the root component is swapped to `src/maintenance/App.vue` when `VITE_APP_ENTRY=maintenance`. The `@/*` import alias maps to `./src/*` (see [tsconfig.json](tsconfig.json) and [vite.config.ts](vite.config.ts)).

### App bootstrap (src/main.ts)

`buildApp` wires: axios (with `withCredentials` and a response interceptor that toasts 4xx/5xx warnings via `@/utils/errors`), Vuex store, vue-router, vue-i18n, `vue3-mq`, `vue3-apexcharts`, `vue-toastification`, `floating-vue`, FontAwesome, and globally-registered base components (`BaseButton`, `BaseInput`, `CcuIcon`, `Modal`, `Tabs`, etc.). Sentry is initialized only in `import.meta.env.PROD` and silently drops chunk-load errors (which trigger a one-shot reload via `sessionStorage['ccu:chunk-reload']`).

### Routing (src/router.ts)

Top-level routes are defined in `src/router.ts`; each page area (`home`, `phone`, `admin`, `organization`, `unauthenticated`) owns its own `src/pages/<area>/routes.ts` and exports a `RouteRecordRaw[]` that the root router spreads in. Route `meta` supports `layout`, `noAuth`, `noscroll`, `id`. The router installs a `chunkLoadError` handler that reloads once when a dynamic import fails (common after deploys).

### State (src/store/)

Vuex 4 + `@vuex-orm/core` with `@vuex-orm/plugin-axios` (baseURL = `VITE_APP_API_BASE_URL`). [src/store/index.ts](src/store/index.ts) registers modules under `src/store/modules/` (`acl`, `events`, `incident`, `worksite`, `loading`, `locale`, `enums`, `phone`, `map`) and mounts the Vuex-ORM `database` from [src/store/database.ts](src/store/database.ts). Strict mode is on in non-production builds.

Persistent entities live under [src/models/](src/models/) and extend `CCUModel` in [src/models/base.ts](src/models/base.ts), which provides shared helpers like `fetchById`, `fetchOrFindId`, and `invalidated_at`/`created_at`/`updated_at` fields. Add new entities by subclassing `CCUModel`, then registering in `src/store/database.ts`.

### Services & hooks

- [src/services/](src/services/) — singletons for cross-cutting concerns (`db.service`, `geocoder.service`, `i18n.service`, `phone.service`, `storage.service`).
- [src/hooks/](src/hooks/) — Composition-API hooks. Grouped subfolders (`worksite/`, `incident/`, `phone/`, `live/`, `lists/`) bundle domain logic; top-level hooks (`useApi`, `useAcl`, `useAuth`, `useCurrentUser`, `useDialogs`, `useWebSockets`, `useTranslation`, …) handle app-wide concerns. Prefer `useApi` (a typed wrapper around `@vueuse/integrations/useAxios`) over bare axios calls in new code.

### Maps & phone (heavy, version-sensitive deps)

- Maps: Leaflet + `@geoman-io/leaflet-geoman-free` + `leaflet.markercluster` + `leaflet.heat` + PixiJS 6 (`@pixi/*` are pinned) via `leaflet-pixi-overlay`. Map logic is split across `src/hooks/worksite/useMap*.ts`, `src/components/WorkTypeMap.vue`, `src/components/WorksitePhotoMap.vue`, and `src/utils/map.ts`.
- Phone: Amazon Connect CCP + RingCentral integration via `cf-agent-library` (git dep) and `src/services/phone.service.ts`; UI in `src/pages/phone/`.

### i18n & icons

- Locales loaded at runtime through [src/modules/i18n.ts](src/modules/i18n.ts) / `src/services/i18n.service.ts`.
- **New translations use `~~`-prefixed English text as the key** — e.g. `$t('~~Play recording')`, `$t('~~{n} prior voicemails', { n: count })`. vue-i18n is configured with `formatFallbackMessages: true`, so named placeholders are interpolated against the key itself when no translation exists. The `~~` prefix is a sentinel that makes "not yet translated" keys trivial to grep for and lets the backend locale sync replace them later without the UI ever showing a raw `phoneDashboard.xxx.yyy`-style key literal. Don't invent new dotted keys (`phoneDashboard.*`, `info.*`, etc.) — reuse existing dotted keys only if they already exist in the backend bundle.
- `unplugin-icons` with `FileSystemIconLoader` serves disaster glyphs from `src/assets/disaster_icons` as the `ccu-disaster-icons:*` collection.
- `unplugin-auto-import` auto-imports `vue`, `vue-router`, `vue-i18n`, `vuex`, `@vueuse/core`, `vitest`, and `useApi` — these appear unimported in source but are real. Generated types land in `src/types/auto-imports.d.ts` and globals in `.eslintrc-auto-import.json` (both regenerated on build; do not hand-edit).

### Styling

Tailwind 3 ([tailwind.config.cjs](tailwind.config.cjs)) + PostCSS ([postcss.config.ts](postcss.config.ts)) with `postcss-pxtorem` and `autoprefixer`. `prettier-plugin-tailwindcss` sorts classes on save.

### Build specifics (vite.config.ts)

- Sentry vite plugin only runs on `command === 'build'`; source maps are emitted in production and require `SENTRY_AUTH_TOKEN`.
- A manual chunk `group-downloads` bundles `src/pages/Downloads.vue` with `IncidentAssetBuilder.vue` — beware of static imports pulling this into other bundles.
- `src/external/**` is excluded from tsconfig/eslint/coverage and contains vendored code — do not lint-fix or refactor it.

### Tests layout

- [test/unit/](test/unit/) mirrors `src/` (`components/`, `hooks/`, `models/`, `services/`, `utils/`, `workers/`, `filters/`, `fixtures/`). `test/setupTests.ts` is the shared bootstrap; `test/helpers.ts` contains common render/mount helpers.
- [test/e2e/](test/e2e/) holds Playwright specs, `fixtures/`, `pages/` (page objects), and `auth.setup.ts`. Reuse existing page objects instead of writing raw selectors.

## Conventions

- ESLint flat config in [eslint.config.js](eslint.config.js) extends `vue/vue3-recommended`, typescript-eslint recommended + type-checked, unicorn, import, promise, and prettier. Many typescript-eslint rules are intentionally downgraded from `error` to `warn` during an incremental cleanup (see the TODO block at the bottom of the file) — do **not** silence warnings wholesale; fix what you touch.
- `@typescript-eslint/consistent-type-imports` is on (`warn`) and `consistent-type-definitions` enforces `interface` over `type` for object shapes.
- `import/no-cycle` is `error` — watch for circular deps when adding barrel files.
- `unicorn/no-null` is `error` outside JSON; prefer `undefined`.
- `husky` + `lint-staged` runs `eslint --fix` + `prettier --write` on staged `*.{vue,json,ts,tsx}` and prettier on `*.{yml,yaml,js,mjs}`.

## Notes for future agents

- If `node`/`pnpm` resolve to the wrong version, load the repo's toolchain via `direnv` (asdf/mise/rtx per [.envrc](.envrc)) or `nvm use 20` — the repo requires Node 20.x.
- `.envrc.local` is gitignored and typically points direnv at `.env.staging` or `.env.dev`; the dev server needs `VITE_APP_API_BASE_URL`, `VITE_APP_STAGE`, and `VITE_APP_PORTAL_KEY` at minimum to boot usefully.
- Playwright's `webServer` runs `pnpm preview`, so build the app (`pnpm build`) before `pnpm test:e2e` unless you set `PW_SKIP_WEBSERVER=1` and start your own server.
- The README and this file are the source of truth for commands; `.cursorrules`, `.cursor/rules/`, and `.github/copilot-instructions.md` do not exist in this repo.
