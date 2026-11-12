#!/bin/bash

# Strict mode
set -euo pipefail
IFS=$'\n\t'

CURRENT_BRANCH=${CURRENT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}
REPO=https://github.com/jsdelivr/globalping-dash-directus.git

# Use the branch with the same name, then the base branch of the pull request, then master.
for BRANCH in "$CURRENT_BRANCH" ${BASE_BRANCH:-} master; do
	git ls-remote --exit-code --heads "$REPO" "refs/heads/$BRANCH" > /dev/null && break
done

echo "globalping-dash-directus branch: $BRANCH."

# Checkout and sync the branch if the directory exists; otherwise, clone the repository
if [ -d "test/e2e/globalping-dash-directus" ]; then
	cd test/e2e/globalping-dash-directus || exit
	git add .
	git reset --hard "@{u}"
	git fetch
	git checkout "$BRANCH"
	git reset --hard "@{u}"
else
	git clone -b "$BRANCH" "$REPO" test/e2e/globalping-dash-directus
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
