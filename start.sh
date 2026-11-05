#!/bin/bash
set -e

echo "==> Setting database connection to pgsql..."
export DB_CONNECTION=pgsql

# Parse DATABASE_URL into individual Laravel env vars if set
if [ -n "$DATABASE_URL" ]; then
    export DB_HOST=$(echo "$DATABASE_URL" | sed -e 's|.*@||' -e 's|:.*||' -e 's|/.*||')
    export DB_PORT=$(echo "$DATABASE_URL" | sed -e 's|.*@[^:]*:||' -e 's|/.*||')
    export DB_DATABASE=$(echo "$DATABASE_URL" | sed -e 's|.*/||' -e 's|?.*||')
    export DB_USERNAME=$(echo "$DATABASE_URL" | sed -e 's|.*://||' -e 's|:.*||')
    export DB_PASSWORD=$(echo "$DATABASE_URL" | sed -e 's|.*://[^:]*:||' -e 's|@.*||')
fi

echo "==> Clearing config cache..."
php artisan config:clear

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Ensuring admin user credentials..."
# ADMIN_EMAIL and ADMIN_PASSWORD come from Railway's variables only.
php artisan admin:sync

echo "==> Seeding categories and products..."
php artisan db:seed --force --class=ClothingSeeder

echo "==> Seeding men's customiser garments..."
php artisan db:seed --force --class=MensGarmentsSeeder

echo "==> Seeding women's Tops garments..."
php artisan db:seed --force --class=WomensTopsSeeder

echo "==> Creating storage symlink..."
php artisan storage:link --force

echo "==> Starting queue worker in background..."
php artisan queue:work --daemon --sleep=3 --tries=3 --max-time=3600 &

# Runs routes/console.php's schedule: privacy:purge every night, which keeps
# the privacy policy's 90-day deletion promise.
echo "==> Starting scheduler in background..."
php artisan schedule:work &

echo "==> Starting Laravel server on port ${PORT} with 8 workers..."
export PHP_CLI_SERVER_WORKERS=8
exec php artisan serve --host=0.0.0.0 --port=${PORT}
