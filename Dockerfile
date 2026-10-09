# syntax=docker/dockerfile:1.22@sha256:4a43a54dd1fedceb30ba47e76cfcf2b47304f4161c0caeac2db1c61804ea3c91
# check=error=true

##
# ONETIME SECRET - DOCKER IMAGE (SELF-CONTAINED)
#
# This Dockerfile merges docker/base.dockerfile into the main build
# so it can be built with a single `docker build` command (no Bake needed).
#

ARG APP_DIR=/app
ARG PUBLIC_DIR=/app/public
ARG VERSION
ARG RUBY_IMAGE_TAG=3.4-slim-trixie@sha256:d8fd978ffc10f0eddee04aa03eb82e5d247079471392ae655de5ae04bdaad914
ARG NODE_IMAGE_TAG=22@sha256:5647be709086c696ff32edaaf1c70cd26d1da6ab2b39c32f3c7b4c4a31957e37

##
# NODE: Node.js source for copying binaries
#
FROM docker.io/library/node:${NODE_IMAGE_TAG} AS node

##
# BASE: System dependencies and tools (merged from docker/base.dockerfile)
#
FROM docker.io/library/ruby:${RUBY_IMAGE_TAG} AS base
ARG APP_DIR

RUN set -eux && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libssl-dev \
        libffi-dev \
        libyaml-dev \
        libsqlite3-dev \
        libpq-dev \
        pkg-config \
        git \
        curl \
        python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

ARG YQ_VERSION=v4.52.4
RUN set -eux && \
    ARCH=$(dpkg --print-architecture) && \
    case "$ARCH" in \
        amd64) YQ_ARCH="amd64" ;; \
        arm64) YQ_ARCH="arm64" ;; \
        *) YQ_ARCH="amd64" ;; \
    esac && \
    curl -fsSL "https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_${YQ_ARCH}" \
        -o /usr/local/bin/yq && \
    chmod +x /usr/local/bin/yq && \
    yq --version

COPY --from=node \
    /usr/local/bin/node \
    /usr/local/bin/

COPY --from=node \
    /usr/local/lib/node_modules/npm \
    /usr/local/lib/node_modules/npm

RUN set -eux && \
    ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx && \
    node --version && npm --version && \
    npm install -g pnpm@11.10.0 && \
    pnpm --version

RUN groupadd -g 1001 appuser && \
    useradd -r -u 1001 -g appuser -d ${APP_DIR} -s /sbin/nologin appuser

WORKDIR ${APP_DIR}

##
# DEPENDENCIES: Install application dependencies
#
FROM base AS dependencies
ARG APP_DIR

WORKDIR ${APP_DIR}
ENV NODE_PATH=${APP_DIR}/node_modules

COPY .ruby-version Gemfile Gemfile.lock package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ENV BUNDLE_WITHOUT="development:test:optional"

RUN set -eux && \
    bundle install --jobs "$(nproc)" --retry=3 && \
    bundle binstubs puma --force && \
    bundle clean --force

RUN set -eux && \
    pnpm install --frozen-lockfile --prod=false

##
# BUILD: Compile and prepare application assets
#
FROM dependencies AS build
ARG APP_DIR
ARG VERSION
ARG COMMIT_HASH

WORKDIR ${APP_DIR}

COPY public ./public
COPY src ./src
COPY locales ./locales
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json vite.config.ts \
     eslint.config.ts ./

ARG ALLOW_DEV_VERSION=true
RUN set -eux && \
    PKG_VERSION=$(node -p "require('./package.json').version") && \
    if [ "${PKG_VERSION}" = "0.0.0-rc0" ] && [ -n "${VERSION:-}" ] && \
       [ "${VERSION:-}" != "dev" ] && [ "${VERSION:-}" != "0.0.0-rc0" ]; then \
      yq -i -o json ".version = \"${VERSION:-}\"" package.json && \
      echo "NOTICE: package.json had placeholder; updated to ${VERSION:-} via build arg" >&2 && \
      PKG_VERSION="${VERSION:-}" ; \
    fi && \
    if [ "${PKG_VERSION}" = "0.0.0-rc0" ]; then \
      if [ "${ALLOW_DEV_VERSION}" = "true" ]; then \
        echo "WARNING: Building with archetype version (${PKG_VERSION})" >&2 ; \
      else \
        echo "ERROR: package.json still has archetype placeholder version (${PKG_VERSION})." >&2 && \
        exit 1 ; \
      fi ; \
    fi

RUN set -eux && \
    mkdir -p /tmp/build-meta && \
    echo "${COMMIT_HASH:-dev}" > .commit_hash.txt && \
    echo "${COMMIT_HASH:-dev}" > /tmp/build-meta/commit_hash.txt

RUN set -eux && \
    pnpm run build && \
    chmod -R a+rX public/ && \
    pnpm prune --prod && \
    rm -rf node_modules ~/.npm ~/.pnpm-store && \
    npm uninstall -g pnpm

# GoDatalize fork: bake the godatalize brand pack by default (override with
# --build-arg BRAND_PACK=default for the neutral pack).
ARG BRAND_PACK=godatalize
RUN set -eux && \
    if [ -n "${BRAND_PACK}" ] && [ "${BRAND_PACK}" != "default" ]; then \
      case "${BRAND_PACK}" in \
        *..*|*/*|*\\*) \
          echo "ERROR: BRAND_PACK must be a simple pack name" >&2 && exit 1 ;; \
      esac && \
      if [ -d "public/branding/${BRAND_PACK}" ] && \
         [ -n "$(find "public/branding/${BRAND_PACK}" -type f 2>/dev/null)" ]; then \
        cp -R "public/branding/${BRAND_PACK}/." public/branding/default/ && \
        chmod -R a+rX public/branding/default && \
        echo "NOTICE: baked brand pack over default: ${BRAND_PACK}" >&2 ; \
      else \
        echo "ERROR: BRAND_PACK=${BRAND_PACK} set but public/branding/${BRAND_PACK} is missing." >&2 && \
        exit 1 ; \
      fi ; \
    else \
      echo "NOTICE: no BRAND_PACK build arg; using neutral default pack" >&2 ; \
    fi

##
# FINAL: Production-ready application image
#
FROM docker.io/library/ruby:${RUBY_IMAGE_TAG} AS final
ARG APP_DIR
ARG PUBLIC_DIR
ARG VERSION

LABEL org.opencontainers.image.version=${VERSION} \
      org.opencontainers.image.title="OneTime Secret" \
      org.opencontainers.image.description="Keep passwords out of your inboxes and chat logs with links that work only one time." \
      org.opencontainers.image.source="https://github.com/onetimesecret/onetimesecret"

RUN set -eux && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        libsqlite3-0 \
        libpq5 \
        libsodium23 \
        curl \
        procps \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

WORKDIR ${APP_DIR}

RUN groupadd -g 1001 appuser && \
    useradd -r -u 1001 -g appuser -d ${APP_DIR} -s /sbin/nologin appuser

COPY --from=dependencies /usr/local/bin/yq /usr/local/bin/yq
COPY --from=dependencies /usr/local/bundle /usr/local/bundle

COPY --chown=appuser:appuser --from=build ${APP_DIR}/public ./public
COPY --chown=appuser:appuser --from=build ${APP_DIR}/src ./src
COPY --chown=appuser:appuser --from=build ${APP_DIR}/generated ./generated
COPY --chown=appuser:appuser --from=build /tmp/build-meta/commit_hash.txt ./.commit_hash.txt

COPY --chown=appuser:appuser bin ./bin
COPY --chown=appuser:appuser apps ./apps
COPY --chown=appuser:appuser etc/ ./etc/
COPY --chown=appuser:appuser lib ./lib
COPY --chown=appuser:appuser migrations ./migrations
COPY --chown=appuser:appuser docker/entrypoints/entrypoint.sh ./bin/
COPY --chown=appuser:appuser docker/entrypoints/healthcheck.sh ./bin/
COPY --chown=appuser:appuser scripts/setup ./scripts/setup
COPY --chown=appuser:appuser --from=dependencies ${APP_DIR}/bin/puma ./bin/puma
COPY --chown=appuser:appuser --from=build ${APP_DIR}/package.json ./
COPY --chown=appuser:appuser config.ru .ruby-version Gemfile Gemfile.lock ./

ENV RACK_ENV=production \
    ONETIME_HOME=${APP_DIR} \
    PUBLIC_DIR=${PUBLIC_DIR} \
    RUBY_YJIT_ENABLE=1 \
    SERVER_TYPE=puma \
    BUNDLE_WITHOUT="development:test:optional" \
    PATH=${APP_DIR}/bin:$PATH

RUN set -eux && \
    for file in etc/defaults/*.defaults.*; do \
        if [ -f "$file" ]; then \
            target="etc/$(basename "$file" | sed 's/\.defaults//')"; \
            cp --preserve --update=none "$file" "$target"; \
        fi; \
    done && \
    cp --preserve --update=none etc/examples/puma.example.rb etc/puma.rb && \
    chmod +x bin/entrypoint.sh bin/healthcheck.sh && \
    install -d -o appuser -g appuser data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD bin/healthcheck.sh

USER appuser

CMD ["bin/entrypoint.sh"]
