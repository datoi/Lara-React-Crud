FROM php:8.2-apache

# Enable mod_rewrite for Laravel routing
RUN a2enmod rewrite headers

# System dependencies (libpq-dev for pdo_pgsql)
RUN apt-get update && apt-get install -y \
    git libpq-dev nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP deps
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Install Node deps + build frontend
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN composer dump-autoload --optimize

# Storage permissions
RUN chown -R www-data:www-data storage bootstrap/cache

CMD ["bash", "start.sh"]
