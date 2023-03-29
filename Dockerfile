# syntax=docker/dockerfile:1
ARG NODE_VERSION=16.14.2
FROM node:${NODE_VERSION}-alpine as base

# Build Config.
ARG APP_PATH=/app \
    PNPM_STORE_DIR="/data/pnpm-store"

ENV APP_PATH=${APP_PATH} \
    PNPM_STORE_DIR=${PNPM_STORE_DIR}

# App Config.
ARG CI=1 \
  VITE_APP_API_BASE_URL \
  VITE_APP_BASE_URL \
  VITE_APP_WS_URL \
  VITE_APP_STAGE=production \
  VITE_APP_AWS_CCP_URL \
  VITE_APP_CCP_INSTANCE \
  VITE_APP_PORTAL_KEY=crisiscleanup_us

ENV CI=${CI} \
  VITE_APP_API_BASE_URL=${VITE_APP_API_BASE_URL} \
  VITE_APP_BASE_URL=${VITE_APP_BASE_URL} \
  VITE_APP_WS_URL=${VITE_APP_WS_URL} \
  VITE_APP_STAGE=${VITE_APP_STAGE} \
  VITE_APP_AWS_CCP_URL=${VITE_APP_AWS_CCP_URL} \
  VITE_APP_CCP_INSTANCE=${VITE_APP_CCP_INSTANCE} \
  VITE_APP_PORTAL_KEY=${VITE_APP_PORTAL_KEY} \
  CYPRESS_INSTALL_BINARY=0

# Common deps.
RUN apk add --no-cache \
     git \
     curl


# Builder
FROM base as builder
ARG TARGETPLATFORM
ARG PNPM_VERSION=7.30.5
RUN corepack enable pnpm \
  && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR ${APP_PATH}
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store-${TARGETPLATFORM},target=${PNPM_STORE_DIR} \
    pnpm config -g set store-dir ${PNPM_STORE_DIR}
RUN --mount=type=cache,id=pnpm-store-${TARGETPLATFORM},target=${PNPM_STORE_DIR} \
    pnpm fetch


# Build dist.
FROM builder as dist
WORKDIR ${APP_PATH}
ARG VITE_APP_WHAT_3_WORDS_API_KEY \
   VITE_APP_GOOGLE_MAPS_API_KEY \
   VITE_APP_PITNEYBOWES_API_KEY \
   VITE_APP_PITNEYBOWES_BASIC_AUTH_TOKEN \
   VITE_APP_PHONE_DEFAULT_USERNAME \
   VITE_APP_PHONE_DEFAULT_PASSWORD \
   VITE_APP_ENGLISH_PHONE_GATEWAY \
   VITE_APP_SPANISH_PHONE_GATEWAY \
   VITE_APP_DEFAULT_CALLER_ID \
   SENTRY_DSN \
   SENTRY_AUTH_TOKEN \
   SENTRY_PROPERTIES="sentry.properties"
COPY --link package.json ./
RUN --mount=type=cache,id=pnpm-store-${TARGETPLATFORM},target=${PNPM_STORE_DIR} \
    pnpm install --offline
COPY --link . ./
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN --mount=type=cache,id=pnpm-store-${TARGETPLATFORM},target=${PNPM_STORE_DIR} \
       VITE_APP_GOOGLE_MAPS_API_KEY=${VITE_APP_WHAT_3_WORDS_API_KEY} \
       VITE_APP_GOOGLE_MAPS_API_KEY=${VITE_APP_GOOGLE_MAPS_API_KEY} \
       VITE_APP_PITNEYBOWES_API_KEY=${VITE_APP_PITNEYBOWES_API_KEY} \
       VITE_APP_PITNEYBOWES_BASIC_AUTH_TOKEN=${VITE_APP_PITNEYBOWES_BASIC_AUTH_TOKEN} \
       VITE_APP_PHONE_DEFAULT_USERNAME=${VITE_APP_PHONE_DEFAULT_USERNAME} \
       VITE_APP_PHONE_DEFAULT_PASSWORD=${VITE_APP_PHONE_DEFAULT_PASSWORD} \
       VITE_APP_ENGLISH_PHONE_GATEWAY=${VITE_APP_ENGLISH_PHONE_GATEWAY} \
       VITE_APP_SPANISH_PHONE_GATEWAY=${VITE_APP_SPANISH_PHONE_GATEWAY} \
       VITE_APP_DEFAULT_CALLER_ID=${VITE_APP_DEFAULT_CALLER_ID} \
       SENTRY_DSN=${SENTRY_DSN} \
       SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} \
       SENTRY_PROPERTIES=${SENTRY_PROPERTIES} \
    pnpm build:app --mode=${VITE_APP_STAGE}


# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=dist /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
