#!/bin/bash

# Strict mode
set -euo pipefail
IFS=$'\n\t'

CURRENT_BRANCH=${CURRENT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}

# Checkout and sync the branch if the directory exists; otherwise, clone the repository
if [ -d "test/e2e/globalping-dash-directus" ]; then
	cd test/e2e/globalping-dash-directus || exit
	git add .
	git reset --hard "@{u}"
	git fetch
	git checkout "$CURRENT_BRANCH" || git checkout master
	git reset --hard "@{u}"
else
	git clone -b "$CURRENT_BRANCH" https://github.com/jsdelivr/globalping-dash-directus.git test/e2e/globalping-dash-directus || git clone https://github.com/jsdelivr/globalping-dash-directus.git test/e2e/globalping-dash-directus
	cd test/e2e/globalping-dash-directus || exit
fi

# Install globalping-dash-directus dependencies
pnpm i
pnpm exec playwright install --with-deps chromium

# Prepare .env files
cp .env.docker.e2e.example .env.docker.e2e
cp .env.scripts.e2e.example .env.scripts.e2e
perl -pi -e 's/DASH_INDEX_FILE_PATH=.*/DASH_INDEX_FILE_PATH=..\/..\/..\/.output\/server\/index.mjs/' .env.scripts.e2e

# Build globalping-dash-directus
docker compose -f docker-compose.e2e.yml up --build -d
pnpm run init:e2e
docker compose -f docker-compose.e2e.yml stop

cd ../../../ || exit
