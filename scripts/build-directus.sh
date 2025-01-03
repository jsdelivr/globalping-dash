#!/bin/bash

current_branch=$(git rev-parse --abbrev-ref HEAD)

echo "Current branch: $current_branch."

# Remove the directory if it exists
if [ -d "test/e2e/globalping-dash-directus" ]; then
  rm -rf test/e2e/globalping-dash-directus
fi

# Clone the repository using the current branch, fallback to default branch if it fails
git clone -b $current_branch https://github.com/jsdelivr/globalping-dash-directus.git test/e2e/globalping-dash-directus || git clone https://github.com/jsdelivr/globalping-dash-directus.git test/e2e/globalping-dash-directus

cd test/e2e/globalping-dash-directus

# Install dependencies and build
pnpm i
pnpm exec playwright install --with-deps chromium
cp .env.e2e.example .env.e2e
cp .env.example .env
perl -pi -e 's/DASH_INDEX_FILE_PATH=.*/DASH_INDEX_FILE_PATH=..\/..\/..\/.output\/server\/index.mjs/' .env

docker compose -f docker-compose.e2e.yml up --build -d
pnpm run init:e2e
docker compose -f docker-compose.e2e.yml stop

cd ../../../
