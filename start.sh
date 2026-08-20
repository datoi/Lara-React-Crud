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
php artisan tinker --execute="
\$password = env('ADMIN_PASSWORD', 'KERE123');
\$exists = \DB::table('users')->where('email', 'admin@kere.ge')->exists();
if (\$exists) {
    \DB::table('users')->where('email', 'admin@kere.ge')->update([
        'password'          => Hash::make(\$password),
        'role'              => 'admin',
        'email_verified_at' => now(),
        'updated_at'        => now(),
    ]);
    echo 'Admin password synced.' . PHP_EOL;
} else {
    \DB::table('users')->insert([
        'name'              => 'Admin',
        'email'             => 'admin@kere.ge',
        'password'          => Hash::make(\$password),
        'role'              => 'admin',
        'email_verified_at' => now(),
        'created_at'        => now(),
        'updated_at'        => now(),
    ]);
    echo 'Admin user created.' . PHP_EOL;
}
"

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

echo "==> Starting Laravel server on port ${PORT} with 8 workers..."
export PHP_CLI_SERVER_WORKERS=8
exec php artisan serve --host=0.0.0.0 --port=${PORT}
