FROM node:24-slim AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm exec nuxt prepare \
	&& pnpm build

FROM node:24-slim

WORKDIR /app

RUN corepack enable

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN pnpm install --prod --frozen-lockfile --ignore-scripts \
	&& pnpm store prune

COPY --from=build --chown=node:node /app/elastic-apm-node.cjs /app/elastic-apm-utils.cjs ./
COPY --from=build --chown=node:node /app/.output ./.output

ENV NODE_ENV=production \
	ELASTIC_APM_CONFIG_FILE=elastic-apm-node.cjs

USER node

EXPOSE 13010

CMD [ "node", "--experimental-loader", "elastic-apm-node/loader.mjs", "-r", "./elastic-apm-utils.cjs", "-r", "elastic-apm-node/start.js", ".output/server/index.mjs" ]
