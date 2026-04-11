#!/bin/bash
set -e

echo "==> Setting database connection to pgsql..."
export DB_CONNECTION=pgsql

# Parse DATABASE_URL into individual Laravel env vars if set
if [ -n "$DATABASE_URL" ]; then
    # e.g. postgresql://user:pass@host:5432/dbname
    export DB_HOST=$(echo "$DATABASE_URL" | sed -e 's|.*@||' -e 's|:.*||' -e 's|/.*||')
    export DB_PORT=$(echo "$DATABASE_URL" | sed -e 's|.*:||' -e 's|/.*||' | grep -oP '^\d+' || echo "5432")
    export DB_DATABASE=$(echo "$DATABASE_URL" | sed -e 's|.*/||' -e 's|?.*||')
    export DB_USERNAME=$(echo "$DATABASE_URL" | sed -e 's|.*://||' -e 's|:.*||')
    export DB_PASSWORD=$(echo "$DATABASE_URL" | sed -e 's|.*://[^:]*:||' -e 's|@.*||')
fi

echo "==> Clearing config cache..."
php artisan config:clear

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Seeding categories and products..."
php artisan db:seed --force --class=ClothingSeeder

echo "==> Creating storage symlink..."
php artisan storage:link --force

echo "==> Starting Laravel server on port $PORT..."
exec php artisan serve --host=0.0.0.0 --port=$PORT
