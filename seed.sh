#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@postgres:5432/medusa-store}"
export REDIS_URL="${REDIS_URL:-redis://redis:6379}"
export JWT_SECRET="${JWT_SECRET:-supersecret}"
export COOKIE_SECRET="${COOKIE_SECRET:-supersecret}"
export NODE_ENV="development"

echo "=========================================================="
echo "🌱 Pokretanje Seed skripte za MedusaJS Backend..."
echo "🔌 Povezivanje na bazu: $DATABASE_URL"
echo "=========================================================="

echo "1/5 🌍 Inicijalizacija regija (Europe, DK, BA), valuta (EUR, BAM) i skladišta..."
pnpm exec medusa exec ./src/migration-scripts/initial-data-seed.ts || true

echo "2/5 🏪 Postavljanje prodajnih kanala (Alati & Šminka), Publishable ključeva i artikala..."
pnpm exec medusa exec ./src/scripts/setup-multichannel.ts

echo "3/5 📂 Postavljanje strukture kategorija (Alati & Šminka)..."
pnpm exec medusa exec ./src/scripts/setup-categories.ts

echo "4/5 ✨ Postavljanje Lucide ikonica za kategorije..."
pnpm exec medusa exec ./src/scripts/seed-category-icons.ts

echo "5/5 📦 Postavljanje skladišta i zaliha (Inventory)..."
pnpm exec medusa exec ./src/scripts/setup-inventory-and-groups.ts

echo "=========================================================="
echo "🎉 SEED USPEŠNO ZAVRŠEN!"
echo "=========================================================="
