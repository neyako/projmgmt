#!/bin/sh
set -eu

if [ "${PRISMA_DB_PUSH:-true}" = "true" ]; then
  echo "[entrypoint] syncing prisma schema"
  ./node_modules/.bin/prisma db push --skip-generate
fi

exec "$@"
