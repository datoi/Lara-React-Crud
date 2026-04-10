#!/bin/bash
set -e

echo "==> Setting up persistent storage directories..."
mkdir -p /var/data/database
mkdir -p /var/data/storage/app/public
mkdir -p /var/data/storage/logs
mkdir -p /var/data/storage/framework/cache/data
mkdir -p /var/data/storage/framework/sessions
mkdir -p /var/data/storage/framework/views

echo "==> Linking storage to persistent disk..."
rm -rf /app/storage/app/public
ln -sf /var/data/storage/app/public /app/storage/app/public

rm -f /app/storage/logs/laravel.log
ln -sf /var/data/storage/logs /app/storage/logs

echo "==> Setting up SQLite database..."
export DB_DATABASE=/var/data/database/database.sqlite
touch $DB_DATABASE

echo "==> Clearing config cache..."
php artisan config:clear

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Seeding categories and products..."
php artisan db:seed --force --class=ClothingSeeder

echo "==> Creating storage symlink..."
php artisan storage:link --force

echo "==> Starting server on port ${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
