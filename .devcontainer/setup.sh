#!/usr/bin/env bash
echo "== Postgres PHP driver =="
if ! php -m | grep -qi pdo_pgsql; then
  sudo apt-get update -y
  sudo apt-get install -y libpq-dev
  sudo docker-php-ext-install pdo_pgsql pgsql \
    || sudo apt-get install -y php-pgsql \
    || echo "WARN: pdo_pgsql failed"
fi

echo "== composer + npm =="
composer install --no-interaction || echo "WARN: composer failed"
npm install || echo "WARN: npm failed"

echo "== .env =="
[ -f .env ] || cp .env.example .env
sed -i '/^DB_CONNECTION=/d;/^DATABASE_URL=/d' .env
echo "DB_CONNECTION=pgsql" >> .env
echo "DATABASE_URL=postgresql://kere:secret@localhost:5432/kere" >> .env
php artisan key:generate || true

echo "== waiting for Postgres =="
for i in $(seq 1 30); do
  (echo > /dev/tcp/localhost/5432) >/dev/null 2>&1 && break
  sleep 2
done

echo "== migrate + seed =="
php artisan migrate:fresh --seed || echo "WARN: migrate failed — run manually"
php artisan storage:link || true
echo "== done =="
