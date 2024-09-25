<img src=".github/img/ccu-ballons.png" align="right" width="20%"  />

# Crisis Cleanup

<!-- Badges -->
<p>
  <a href="https://github.com/CrisisCleanup/crisiscleanup-4-web/actions/workflows/main.yml" >
    <img src="https://github.com/CrisisCleanup/crisiscleanup-4-web/actions/workflows/main.yml/badge.svg"/>
  </a>
  <a href="https://github.com/CrisisCleanup/crisiscleanup-4-web/actions/workflows/deploy.yml" >
    <img src="https://github.com/CrisisCleanup/crisiscleanup-4-web/actions/workflows/deploy.yml/badge.svg"/>
  </a>
  <a href="https://codecov.io/gh/CrisisCleanup/crisiscleanup-4-web" >
    <img src="https://codecov.io/gh/CrisisCleanup/crisiscleanup-4-web/branch/master/graph/badge.svg?token=O8D9FKSJJR"/>
  </a>
  <a href="https://github.com/CrisisCleanup/crisiscleanup-4-web/issues/">
    <img src="https://img.shields.io/github/issues/CrisisCleanup/crisiscleanup-4-web" alt="open issues" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/last-commit/CrisisCleanup/crisiscleanup-4-web" alt="last update" />
  </a>
  <a href="https://github.com/CrisisCleanup/crisiscleanup-4-web/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/CrisisCleanup/crisiscleanup-4-web" alt="contributors" />
  </a>
  <a href="https://github.com/CrisisCleanup/crisiscleanup-4-web/stargazers">
    <img src="https://img.shields.io/github/stars/CrisisCleanup/crisiscleanup-4-web" alt="stars" />
  </a>
  <a href="https://github.com/CrisisCleanup/crisiscleanup-4-web/network/members">
    <img src="https://img.shields.io/github/forks/CrisisCleanup/crisiscleanup-4-web" alt="forks" />
  </a>
</p>

Crisis Cleanup is a collaboratative disaster relief platform that connects relief organization volunteers with people who need help. The Crisis Cleanup platform has been used to connected 600,000+ volunteers from 2,500+ organizations with 140,000+ households in 55 states/provinces and 207 disasters in 7 countries; a new disaster every two weeks.

Crisis Cleanup works best in a collaborative environment where multiple voluntary organizations and agencies work together and coordinate efforts. Because these organizations do not take orders from one another, Crisis Cleanup is designed to facilitate Collaborative Accountability models of inter-agency interaction, rather than command-and-control operations, or or heirarchical accountability models of interaction.

## Other Project Stats (As of 2024-09-25)

- 25%: Increase in volunteer efficiency through re-engagement and elimination of time spent on travel, coordination, collaboration, and management.
- 35,000+: Households that could not have been helped without Crisis Cleanup.
- 6.2 Million: Number of volunteer hours facilitated.
- 1.6 Million: Volunteer hours that would have otherwise been wasted in management, travel, and overhead without Crisis Cleanup.
- $1.862 Billion: Minimum total market value of services to survivors.
- $1,581: Value of each cleanup volunteer to his/her community.
- $183.3 Million: Market value of services to survivors that would have otherwise been wasted in travel, management, overhead, and standing in lines.
- $60,839: Money Crisis Cleanup has saved survivors every single day since July 18, 2012.
- $9,052: Average commercial value of service to each homeowner.
  How we calculate these statistics: https://www.crisiscleanup.org/blog/post/how-we-calculate-value-of-services

# Contributing

To preserve our ability to provide open source humanitarian disaster software, all contributions are subject to the terms of the relevant [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) downloadable at [crisiscleanup.org/contributions](https://www.crisiscleanup.org/contributions).

Please read [CONTRIBUTING.md](https://github.com/CrisisCleanup/crisiscleanup-3-web/blob/master/CONTRIBUTING.md) for important details.

# Getting Started

## Project Setup

### Tools

#### ASDF VM

Install [asdf](https://asdf-vm.com/#/) version manager.

After installing `asdf`, add all the plugins found in
the [.tool-versions](.tool-versions) file.

```bash
# Add all the plugins to asdf.
cat .tool-versions | awk '{print $1}' | xargs -I _ asdf plugin add _

# Install all according to .tool-versions.
asdf install
```

**OR**

#### RTX

_Note: You can also use [`asdf`](https://github.com/asdf-vm/asdf) if you already have it installed and working_

- Install [rtx](https://github.com/jdxcode/rtx) (asdf clone in rust).

- Follow instructions on hooking rtx into your shell [here](https://github.com/jdxcode/rtx#quickstart)

- After installing `rtx`, add all the plugins found in the [.tool-versions](.tool-versions) file.

  ```bash
  # Add all the plugins.
  cat .tool-versions | awk '{print $1}' | xargs -I _ rtx plugin add _

  # Install all according to .tool-versions.
  rtx install
  ```

- You should now have all the tools required (defined in [.tool-versions](.tool-versions)) to run this project.

Performing this step should install all tools required to run this project.

#### Direnv

[`direnv`](https://direnv.net/) is an extension for your shell. It augments existing shells with a new feature that can load and unload environment variables depending on the current directory.

- Install: https://direnv.net/docs/installation.html
- Hook with your shell: https://direnv.net/docs/hook.html
- Install [asdf-plugin](https://github.com/asdf-community/asdf-direnv) for direnv

> For more detailed instructions on asdf + direnv setup, please refer to [this guide](https://docs.arroyodev.com/setups/setup-asdf-direnv/)

##### Environment

See [`.envrc`](.envrc) file for list of environment varibles needed for this project. Create `.envrc.local` file
with the required env vars from `.envrc` file.

Here are some `.envrc.local` file examples:

Example 1:

You may use `.env` file to load variables with `dotenv`. See [`.env.sample`](.env.sample) for an example.

```bash
#!/usr/bin/env bash

# dotenv .env

# Staging
dotenv .env.staging

# Dev
#dotenv .env.dev

# Proxy
# dotenv .env.proxy

# Prod
# dotenv .env.prod
```

Example 2:

```bash
#!/usr/bin/env bash

# Options: staging | dev | proxy | prod | test | sample
export CCU_ENV="${CCU_ENV:-staging}"
env_file=".env"

# check if env variable is set
if [ -n "$CCU_ENV" ]; then
  env_file=".env.$CCU_ENV"
fi

if [ ! -f "$env_file" ]; then
  log_error "Environment file $env_file not found"
  exit 1
fi

log_status "----------------------------------------------------------"
log_status "Loading environment variables from $env_file"
log_status "----------------------------------------------------------"
dotenv "$env_file"

# Env Vars
export VUE_EDITOR=webstorm

# More Env Vars ...
```

#### Dependencies

Clone the repository and install dependencies via:

```bash
$ pnpm install
```

Run dev server:

```bash
$ pnpm dev
```

#### Build

```bash
pnpm run build
```

#### Testing

In this section, we will guide you through the process of running unit tests and end-to-end (E2E) tests for our application.

##### Running Unit Tests

To ensure the functionality of individual components of our application, we use unit tests. You can run these tests using the following commands:

```bash
pnpm run test
```

To view the coverage of these tests, use the following command:

```bash
pnpm run test:cov
```

This command will provide you with a detailed report of the test coverage, showing you which parts of the code have been tested and which parts have not.

##### Running E2E Tests

E2E tests are designed to test the flow of the application from start to finish. They ensure that the integrated components of the application work as expected. We use Playwright for our E2E tests. You can find more information about Playwright [here](https://playwright.dev).

1. **Installing Playwright Browsers**

Before running the E2E tests, you need to install the Playwright browsers. You can do this using the following commands:

```sh
# Install playwright browsers.
playwright install
# Alternatively, you can use pnpm pw to install browsers as it's a shorthand to run playwright with pnpm exec
pnpm pw install
```

If you are using Ubuntu, you can install the browser dependencies using the following commands:

```sh
# Install browser dependencies
playwright install-deps
# Install with a single command:
playwright install --with-deps chromium
```

For more information on installing browsers with Playwright, you can refer to the [official Playwright documentation](https://playwright.dev/docs/browsers#install-browsers). You may also find it helpful to refer to our E2E continuous integration (CI) workflow for additional information. 2. **Running the E2E Tests**
Once the Playwright browsers are installed, you can run the E2E tests using the following commands:

2. **Executing the E2E Tests**

Once the Playwright browsers are installed, you can proceed to run the E2E tests.

This command will execute all the E2E tests in the all browsers (firefox, chromium, webkit) in headless mode.

```sh
# Run e2e tests
pnpm run test:e2e
```

This command will run the E2E tests in Firefox, with 4 worker threads, and in headed mode. The headed mode allows you to visually observe the tests as they run in the browser.
This can be particularly useful for debugging or understanding the flow of the tests.

```sh
# E2e tests with 4 workers in headed mode only in firefox
pnpm test:e2e --project=firefox --workers=4 --headed
```

This command is similar to the previous one, but it only runs the E2E tests that are specifically marked for development.
This can be useful when you want to run a subset of tests that are relevant to the features or fixes you are currently developing.

```sh
pnpm test:e2e:development --project=firefox --workers=4 --headed
```

This command runs the E2E tests that are tagged as 'slow'. These tests typically take longer to run due to their complexity or the need for extensive data processing.
The command also increases the number of retries to 2, meaning that if a test fails, it will be re-run up to two more times before being marked as a failed test.
This can help to avoid false negatives caused by temporary issues such as network instability.
The timeout is also increased to 120000 milliseconds (or 2 minutes), which gives these slower tests more time to complete.

```sh
pnpm test:e2e --project=firefox --headed --workers=4 --grep '@slow' --retries 2 --timeout 120000
```

Remember, these commands are flexible and can be adjusted based on your specific testing needs.

#### Useful Commands

Update dependencies with pnpm:

```
pnpm update --interactive --latest
```
