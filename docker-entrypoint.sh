#!/bin/sh
set -eu

if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data /app/public/avatars
  chown -R nextjs:nodejs /app/data /app/public/avatars
  exec gosu nextjs "$0" "$@"
fi

if [ "${PRISMA_DB_PUSH:-true}" = "true" ]; then
  echo "[entrypoint] syncing prisma schema"
  ./node_modules/.bin/prisma db push --skip-generate
fi

exec "$@"
