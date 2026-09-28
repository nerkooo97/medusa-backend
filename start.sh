#!/bin/sh
set -e

export NODE_ENV=production

echo "Waiting for PostgreSQL at ${DATABASE_HOST:-postgres}:${DATABASE_PORT:-5432}..."
until nc -z -w 3 ${DATABASE_HOST:-postgres} ${DATABASE_PORT:-5432}; do
  echo "PostgreSQL is not ready yet - waiting 2 seconds..."
  sleep 2
done
echo "PostgreSQL connection confirmed!"

echo "Running database migrations..."
pnpm exec medusa db:migrate

echo "Creating default admin user if not exists..."
pnpm exec medusa user -e admin@test.com -p supersecret || true

echo "Building Medusa production bundle (admin & server)..."
pnpm exec medusa build

echo "Starting Medusa server on 0.0.0.0:9000..."
exec pnpm exec medusa start -H 0.0.0.0 -p 9000
