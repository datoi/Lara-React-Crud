#!/usr/bin/env bash
set -e

# Postgres PHP driver (the one extension most likely missing)
if ! php -m | grep -qi pdo_pgsql; then
  sudo apt-get update -y && sudo apt-get install -y php8.3-pgsql || true
fi

composer install --no-interaction
npm install

[ -f .env ] || cp .env.example .env

# Point Laravel at the Codespaces Postgres (your pgsql block reads DATABASE_URL)
sed -i '/^DB_CONNECTION=/d;/^DATABASE_URL=/d' .env
echo "DB_CONNECTION=pgsql" >> .env
echo "DATABASE_URL=postgresql://kere:secret@localhost:5432/kere" >> .env

php artisan key:generate
php artisan migrate:fresh --seed   # seeds Classic Shirt + clothing data so the site isn't empty
php artisan storage:link           # serves the customizer SVG layers from /storage
