#!/bin/bash
set -e

echo "==> Creating SQLite database file..."
touch /tmp/database.sqlite

echo "==> Clearing config cache..."
php artisan config:clear

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Seeding categories and products..."
php artisan db:seed --force --class=ClothingSeeder

echo "==> Starting Laravel server on port $PORT..."
exec php artisan serve --host=0.0.0.0 --port=$PORT
